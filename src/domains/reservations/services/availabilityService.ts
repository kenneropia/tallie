import { AppDataSource } from "../../../shared/database/dataSource";
import { Restaurant } from "../../../domains/restaurants/entities/Restaurant";
import { Table } from "../../../domains/tables/entities/Table";
import { Reservation, ReservationStatus } from "../entities/Reservation";
import {
  timeToMinutes,
  minutesToTime,
  hasTimeOverlap,
} from "../../../shared/utils/validators";
import {
  DEFAULT_DURATION,
  TIME_INCREMENT,
} from "../../../shared/utils/constants";
import * as cacheService from "../../../shared/cacheService";

const restaurantRepository = () => AppDataSource.getRepository(Restaurant);
const tableRepository = () => AppDataSource.getRepository(Table);
const reservationRepository = () => AppDataSource.getRepository(Reservation);

export interface AvailableSlot {
  startTime: string;
  endTime: string;
  tableNumber: number;
  capacity: number;
}

export interface AvailabilityResult {
  date: string;
  partySize: number;
  duration: number;
  availableSlots: AvailableSlot[];
}

export const getAvailableSlots = async (
  restaurantId: string,
  date: string,
  partySize: number,
  duration: number = DEFAULT_DURATION,
): Promise<AvailabilityResult> => {
  const cached = await cacheService.getAvailabilityCache(
    restaurantId,
    date,
    partySize,
    duration,
  );

  if (cached) {
    return cached as unknown as AvailabilityResult;
  }

  const restaurant = await restaurantRepository().findOne({
    where: { id: restaurantId },
  });

  if (!restaurant) {
    throw new Error("Restaurant not found");
  }

  const tables = await tableRepository().find({
    where: { restaurantId },
    order: { capacity: "ASC" },
  });

  const suitableTables = tables.filter((table) => table.capacity >= partySize);

  const dateStr = typeof date === "string" ? date : String(date);

  const reservations = await reservationRepository()
    .createQueryBuilder("reservation")
    .where("reservation.restaurantId = :restaurantId", { restaurantId })
    .andWhere("date(reservation.reservationDate) = :date", { date: dateStr })
    .andWhere("reservation.status = :status", {
      status: ReservationStatus.CONFIRMED,
    })
    .getMany();

  // Build a map tracking which tables are available at each time
  const availabilityByTime = new Map<string, AvailableSlot[]>();

  for (const table of suitableTables) {
    const tableReservations = reservations.filter(
      (r) => r.tableId === table.id,
    );

    const slots = generateSlotsForTable(
      restaurant,
      date,
      table,
      tableReservations,
      duration,
    );

    // Track available tables for each time slot
    for (const slot of slots) {
      if (!availabilityByTime.has(slot.startTime)) {
        availabilityByTime.set(slot.startTime, []);
      }
      availabilityByTime.get(slot.startTime)!.push(slot);
    }
  }

  // Only include times where ALL suitable tables are available
  const availableSlots: AvailableSlot[] = [];
  const timeArray = Array.from(availabilityByTime.keys()).sort((a, b) => {
    return timeToMinutes(a) - timeToMinutes(b);
  });

  for (const time of timeArray) {
    const tablesAtTime = availabilityByTime.get(time)!;
    // Only include this time if all suitable tables are available
    if (tablesAtTime.length === suitableTables.length) {
      // Return the smallest suitable table for this time
      const smallestTable = tablesAtTime.reduce((smallest, current) =>
        current.capacity < smallest.capacity ? current : smallest
      );
      availableSlots.push(smallestTable);
    }
  }

  const result = {
    date,
    partySize,
    duration,
    availableSlots,
  };

  await cacheService.setAvailabilityCache(
    restaurantId,
    date,
    partySize,
    duration,
    result,
  );

  return result;
};

function generateSlotsForTable(
  restaurant: Restaurant,
  date: string,
  table: Table,
  tableReservations: Reservation[],
  duration: number,
): AvailableSlot[] {
  const slots: AvailableSlot[] = [];

  const opening = timeToMinutes(restaurant.openingTime);
  const closing = timeToMinutes(restaurant.closingTime);

  let current = opening;

  while (current + duration <= closing) {
    const startTime = minutesToTime(current);
    const endTime = minutesToTime(current + duration);

    const isAvailable = !tableReservations.some((res) =>
      hasTimeOverlap(
        res.reservationStartTime,
        res.reservationEndTime,
        startTime,
        endTime,
      ),
    );

    if (isAvailable) {
      slots.push({
        startTime,
        endTime,
        tableNumber: table.tableNumber,
        capacity: table.capacity,
      });
    }

    current += TIME_INCREMENT;
  }

  return slots;
}

export const isTableAvailable = async (
  tableId: string,
  date: string,
  startTime: string,
  endTime: string,
): Promise<boolean> => {
  const dateStr = typeof date === "string" ? date : String(date);

  const reservations = await reservationRepository()
    .createQueryBuilder("reservation")
    .where("reservation.tableId = :tableId", { tableId })
    .andWhere("date(reservation.reservationDate) = :date", { date: dateStr })
    .andWhere("reservation.status = :status", {
      status: ReservationStatus.CONFIRMED,
    })
    .getMany();

  return !reservations.some((res) =>
    hasTimeOverlap(
      res.reservationStartTime,
      res.reservationEndTime,
      startTime,
      endTime,
    ),
  );
};

export const findSuitableTable = async (
  restaurantId: string,
  partySize: number,
  date: string,
  startTime: string,
  duration: number,
): Promise<Table | null> => {
  const restaurant = await restaurantRepository().findOne({
    where: { id: restaurantId },
  });

  if (!restaurant) {
    return null;
  }

  const endTime = minutesToTime(timeToMinutes(startTime) + duration);
  const closingTime = restaurant.closingTime;

  // Check if end time exceeds closing time
  if (timeToMinutes(endTime) > timeToMinutes(closingTime)) {
    return null;
  }

  const tables = await tableRepository().find({
    where: { restaurantId },
    order: { capacity: "ASC" },
  });

  const suitableTables = tables.filter((table) => table.capacity >= partySize);

  for (const table of suitableTables) {
    const available = await isTableAvailable(
      table.id,
      date,
      startTime,
      endTime,
    );
    if (available) {
      return table;
    }
  }

  return null;
};
