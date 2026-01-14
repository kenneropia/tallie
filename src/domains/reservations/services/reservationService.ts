import { AppDataSource } from "../../../shared/database/dataSource";
import { Restaurant } from "../../../domains/restaurants/entities/Restaurant";
import { Table } from "../../../domains/tables/entities/Table";
import { Reservation, ReservationStatus } from "../entities/Reservation";
import {
  NotFoundError,
  ValidationError,
  ConflictError,
} from "../../../shared/utils/errors";
import {
  isWithinOperatingHours,
  calculateEndTime,
} from "../../../shared/utils/validators";
import { MIN_DURATION, MAX_DURATION } from "../../../shared/utils/constants";
import { findSuitableTable } from "./availabilityService";
import {
  sendConfirmationEmail,
  sendModificationEmail,
  sendCancellationEmail,
} from "../../../shared/emailService";
import { invalidateAvailabilityCache } from "../../../shared/cacheService";
import { notifyWaitlistOnCancellation } from "../../waitlist/services/waitlistService";
import { logger } from "../../../shared/utils/logger";
import { validateInput } from "../../../shared/validation/validator";
import {
  createReservationSchema,
  modifyReservationSchema,
  CreateReservationInput,
  ModifyReservationInput,
} from "../../../shared/validation/schemas";

const restaurantRepository = () => AppDataSource.getRepository(Restaurant);
const tableRepository = () => AppDataSource.getRepository(Table);
const reservationRepository = () => AppDataSource.getRepository(Reservation);

export interface CreateReservationDTO extends CreateReservationInput {
  restaurantId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  partySize: number;
  reservationDate: string;
  reservationStartTime: string;
  duration: number;
}

export interface ModifyReservationDTO extends ModifyReservationInput {
  reservationStartTime?: string;
  duration?: number;
  partySize?: number;
}

export const createReservation = async (
  data: CreateReservationDTO,
): Promise<Reservation> => {
  // Validate input using Zod schema
  const validatedData = validateInput<CreateReservationInput>(
    createReservationSchema,
    {
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      customerPhone: data.customerPhone,
      partySize: data.partySize,
      reservationDate: data.reservationDate,
      reservationStartTime: data.reservationStartTime,
      duration: data.duration,
    },
  );

  // Perform all validations before transaction
  const restaurant = await restaurantRepository().findOne({
    where: { id: data.restaurantId },
  });

  if (!restaurant) {
    throw new NotFoundError("Restaurant not found");
  }

  const reservationDate = new Date(validatedData.reservationDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (reservationDate < today) {
    throw new ValidationError("Reservation date cannot be in the past");
  }

  const duration = validatedData.duration;
  const endTime = calculateEndTime(
    validatedData.reservationStartTime,
    duration,
  );

  if (
    !isWithinOperatingHours(
      restaurant.openingTime,
      restaurant.closingTime,
      validatedData.reservationStartTime,
      endTime,
    )
  ) {
    throw new ValidationError(
      "Reservation time is outside restaurant operating hours",
    );
  }

  // Check if party size exceeds any available table capacity
  const availableTables = await tableRepository().find({
    where: { restaurantId: data.restaurantId },
  });

  const maxCapacity =
    availableTables.length > 0
      ? Math.max(...availableTables.map((t) => t.capacity))
      : 0;

  if (validatedData.partySize > maxCapacity) {
    throw new ValidationError("Party size exceeds available table capacity");
  }

  // Use transaction for atomic reservation creation
  const reservation = await AppDataSource.transaction(
    async (transactionalEntityManager) => {
      const trxRestaurantRepository = () =>
        transactionalEntityManager.getRepository(Restaurant);
      const trxReservationRepository = () =>
        transactionalEntityManager.getRepository(Reservation);

      // Check for duplicate reservation AFTER validating input
      const dateStr = validatedData.reservationDate;

      const existingReservation = await trxReservationRepository()
        .createQueryBuilder("reservation")
        .where("reservation.restaurantId = :restaurantId", {
          restaurantId: data.restaurantId,
        })
        .andWhere("reservation.customerEmail = :customerEmail", {
          customerEmail: validatedData.customerEmail,
        })
        .andWhere("date(reservation.reservationDate) = :reservationDate", {
          reservationDate: dateStr,
        })
        .andWhere("reservation.reservationStartTime = :startTime", {
          startTime: validatedData.reservationStartTime,
        })
        .andWhere("reservation.status = :status", {
          status: ReservationStatus.CONFIRMED,
        })
        .getOne();

      if (existingReservation) {
        throw new ConflictError(
          "You already have a confirmed reservation at this time",
        );
      }

      const table = await findSuitableTable(
        data.restaurantId,
        validatedData.partySize,
        validatedData.reservationDate,
        validatedData.reservationStartTime,
        duration,
      );

      if (!table) {
        throw new ConflictError("No available tables for this time slot");
      }

      const newReservation = trxReservationRepository().create({
        restaurantId: data.restaurantId,
        tableId: table.id,
        customerName: validatedData.customerName,
        customerPhone: validatedData.customerPhone,
        customerEmail: validatedData.customerEmail,
        partySize: validatedData.partySize,
        reservationDate: reservationDate,
        reservationStartTime: validatedData.reservationStartTime,
        reservationEndTime: endTime,
        duration,
        status: ReservationStatus.CONFIRMED,
      });

      return await trxReservationRepository().save(newReservation);
    },
  );

  // Reload reservation to get restaurant relation
  const fullReservation = await reservationRepository().findOne({
    where: { id: reservation.id },
    relations: ["restaurant"],
  });

  if (!fullReservation) {
    throw new NotFoundError("Reservation not found");
  }

  const restaurantForEmail =
    fullReservation.restaurant as unknown as Restaurant;

  logger.info("Reservation created", {
    reservationId: fullReservation.id,
    restaurantId: data.restaurantId,
    tableId: fullReservation.tableId,
    customerEmail: data.customerEmail,
    partySize: data.partySize,
  });

  // Send confirmation email
  try {
    const emailResult = await sendConfirmationEmail(
      fullReservation,
      restaurantForEmail.name,
    );
    if (emailResult.error) {
      logger.error("Error sending confirmation email", {
        reservationId: fullReservation.id,
        error: emailResult.error,
      });
    }
  } catch (error) {
    logger.error("Error sending confirmation email", {
      reservationId: fullReservation.id,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  // Invalidate availability cache
  await invalidateAvailabilityCache(
    data.restaurantId,
    data.reservationDate,
  ).catch((error) => {
    logger.warn("Error invalidating availability cache", {
      restaurantId: data.restaurantId,
      date: data.reservationDate,
      error: error instanceof Error ? error.message : String(error),
    });
  });

  return fullReservation;
};

export const getReservationsByDate = async (
  restaurantId: string,
  date: string,
  status?: string,
): Promise<Reservation[]> => {
  const restaurant = await restaurantRepository().findOne({
    where: { id: restaurantId },
  });

  if (!restaurant) {
    throw new NotFoundError("Restaurant not found");
  }

  // Normalize date to YYYY-MM-DD format for SQLite date comparison
  const dateStr = typeof date === "string" ? date : String(date);

  const query = reservationRepository()
    .createQueryBuilder("reservation")
    .leftJoinAndSelect("reservation.table", "table")
    .where("reservation.restaurantId = :restaurantId", { restaurantId })
    .andWhere("date(reservation.reservationDate) = :date", { date: dateStr })
    .orderBy("reservation.reservationStartTime", "ASC");

  if (status) {
    query.andWhere("reservation.status = :status", { status });
  }

  return query.getMany();
};

export const getReservation = async (
  restaurantId: string,
  reservationId: string,
): Promise<Reservation> => {
  const reservation = await reservationRepository().findOne({
    where: { id: reservationId, restaurantId },
    relations: ["table"],
  });

  if (!reservation) {
    throw new NotFoundError("Reservation not found");
  }

  return reservation;
};

export const modifyReservation = async (
  restaurantId: string,
  reservationId: string,
  updates: ModifyReservationDTO,
): Promise<Reservation> => {
  // Validate input using Zod schema
  const validatedUpdates = validateInput<ModifyReservationInput>(
    modifyReservationSchema,
    updates,
  );

  const reservation = await reservationRepository().findOne({
    where: { id: reservationId, restaurantId },
    relations: ["table", "restaurant"],
  });

  if (!reservation) {
    throw new NotFoundError("Reservation not found");
  }

  if (reservation.status === ReservationStatus.CANCELLED) {
    throw new ConflictError("Cannot modify a cancelled reservation");
  }

  const restaurant = reservation.restaurant as unknown as Restaurant;

  // Validate party size if being updated
  if (validatedUpdates.partySize) {
    const table = await tableRepository().findOne({
      where: { id: reservation.tableId },
    });
    if (table && validatedUpdates.partySize > table.capacity) {
      throw new ValidationError("Party size exceeds table capacity");
    }
  }

  if (validatedUpdates.reservationStartTime || validatedUpdates.duration) {
    const newStartTime =
      validatedUpdates.reservationStartTime || reservation.reservationStartTime;
    const newDuration = validatedUpdates.duration || reservation.duration;
    const newEndTime = calculateEndTime(newStartTime, newDuration);

    if (
      !isWithinOperatingHours(
        restaurant.openingTime,
        restaurant.closingTime,
        newStartTime,
        newEndTime,
      )
    ) {
      throw new ValidationError(
        "New reservation time is outside restaurant operating hours",
      );
    }

    if (newDuration < MIN_DURATION || newDuration > MAX_DURATION) {
      throw new ValidationError(
        `Duration must be between ${MIN_DURATION} and ${MAX_DURATION} minutes`,
      );
    }

    const dateStr =
      typeof reservation.reservationDate === "string"
        ? reservation.reservationDate
        : reservation.reservationDate.toISOString().split("T")[0];

    const table = await findSuitableTable(
      restaurantId,
      updates.partySize || reservation.partySize,
      dateStr,
      newStartTime,
      newDuration,
    );

    if (table && table.id !== reservation.tableId) {
      reservation.tableId = table.id;
    }

    reservation.reservationStartTime = newStartTime;
    reservation.reservationEndTime = newEndTime;
    reservation.duration = newDuration;
  }

  if (validatedUpdates.partySize) {
    reservation.partySize = validatedUpdates.partySize;
  }

  await reservationRepository().save(reservation);

  // Send modification email
  const changes = [];
  if (validatedUpdates.reservationStartTime) changes.push("time");
  if (validatedUpdates.duration) changes.push("duration");
  if (validatedUpdates.partySize) changes.push("party size");

  try {
    const emailResult = await sendModificationEmail(
      reservation,
      restaurant.name,
      changes.join(", "),
    );
    if (emailResult.error) {
      logger.error("Error sending modification email", {
        reservationId: reservation.id,
        error: emailResult.error,
      });
    }
  } catch (error) {
    logger.error("Error sending modification email", {
      reservationId: reservation.id,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  logger.info("Reservation modified", {
    reservationId: reservation.id,
    restaurantId,
    changes: changes.join(", "),
  });

  // Invalidate availability cache
  const dateStr =
    typeof reservation.reservationDate === "string"
      ? reservation.reservationDate
      : reservation.reservationDate.toISOString().split("T")[0];
  await invalidateAvailabilityCache(restaurantId, dateStr).catch((error) => {
    logger.warn("Error invalidating availability cache", {
      restaurantId,
      date: dateStr,
      error: error instanceof Error ? error.message : String(error),
    });
  });

  return reservation;
};

export const cancelReservation = async (
  restaurantId: string,
  reservationId: string,
): Promise<Reservation> => {
  const reservation = await reservationRepository().findOne({
    where: { id: reservationId, restaurantId },
    relations: ["restaurant"],
  });

  if (!reservation) {
    throw new NotFoundError("Reservation not found");
  }

  if (reservation.status === ReservationStatus.CANCELLED) {
    throw new ConflictError("Reservation is already cancelled");
  }

  reservation.status = ReservationStatus.CANCELLED;
  await reservationRepository().save(reservation);

  // Send cancellation email
  const restaurant = reservation.restaurant as unknown as Restaurant;
  try {
    const emailResult = await sendCancellationEmail(
      reservation,
      restaurant.name,
    );
    if (emailResult.error) {
      logger.error("Error sending cancellation email", {
        reservationId: reservation.id,
        error: emailResult.error,
      });
    }
  } catch (error) {
    logger.error("Error sending cancellation email", {
      reservationId: reservation.id,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  logger.info("Reservation cancelled", {
    reservationId: reservation.id,
    restaurantId,
  });

  // Invalidate availability cache
  const dateStr =
    typeof reservation.reservationDate === "string"
      ? reservation.reservationDate
      : reservation.reservationDate.toISOString().split("T")[0];
  await invalidateAvailabilityCache(restaurantId, dateStr).catch((error) => {
    logger.warn("Error invalidating availability cache", {
      restaurantId,
      date: dateStr,
      error: error instanceof Error ? error.message : String(error),
    });
  });

  // Notify waitlist of newly available slot
  await notifyWaitlistOnCancellation(
    restaurantId,
    dateStr,
    reservation.reservationStartTime,
    reservation.duration,
  ).catch((error) => {
    logger.warn("Error notifying waitlist", {
      restaurantId,
      date: dateStr,
      error: error instanceof Error ? error.message : String(error),
    });
  });

  return reservation;
};
