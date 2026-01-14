import { Request, Response, NextFunction } from "express";
import { getAvailableSlots } from "../services/availabilityService";
import {
  createReservation,
  getReservationsByDate,
  getReservation,
  modifyReservation,
  cancelReservation,
} from "../services/reservationService";
import { NotFoundError, ValidationError } from "../../../shared/utils/errors";
import { isValidDateFormat } from "../../../shared/utils/validators";

export const getAvailability = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const restaurantId = req.params.id as string;
    const { date, partySize, duration } = req.query;

    if (!date || typeof date !== "string") {
      throw new ValidationError("Date is required");
    }

    if (!isValidDateFormat(date)) {
      throw new ValidationError("Invalid date format. Use YYYY-MM-DD");
    }

    if (!partySize || isNaN(Number(partySize))) {
      throw new ValidationError("Party size is required and must be a number");
    }

    const size = Number(partySize);
    if (size < 1) {
      throw new ValidationError("Party size must be greater than 0");
    }

    const dur = duration ? Number(duration) : 120;

    const availability = await getAvailableSlots(restaurantId, date, size, dur);

    if (availability.availableSlots.length === 0) {
      throw new NotFoundError("No available tables for the requested criteria");
    }

    res.json(availability);
  } catch (error) {
    next(error);
  }
};

export const createReservationHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const restaurantId = req.params.id as string;
    const {
      customerName,
      customerPhone,
      customerEmail,
      partySize,
      reservationDate,
      reservationStartTime,
      duration,
    } = req.body;

    const reservation = await createReservation({
      restaurantId,
      customerName,
      customerPhone,
      customerEmail,
      partySize,
      reservationDate,
      reservationStartTime,
      duration,
    });

    res.status(201).json(reservation);
  } catch (error) {
    next(error);
  }
};

export const listReservations = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const restaurantId = req.params.id as string;
    const { date, status } = req.query;

    if (!date || typeof date !== "string") {
      throw new ValidationError("Date is required");
    }

    if (!isValidDateFormat(date)) {
      throw new ValidationError("Invalid date format. Use YYYY-MM-DD");
    }

    const reservations = await getReservationsByDate(
      restaurantId,
      date,
      status as string
    );

    const formattedReservations = reservations.map((res) => ({
      id: res.id,
      tableNumber: (res as unknown as { table?: { tableNumber: unknown } }).table?.tableNumber,
      customerName: res.customerName,
      partySize: res.partySize,
      reservationDate: res.reservationDate,
      reservationStartTime: res.reservationStartTime,
      reservationEndTime: res.reservationEndTime,
      status: res.status,
      createdAt: res.createdAt,
    }));

    res.json({
      reservations: formattedReservations,
      total: reservations.length,
      date,
    });
  } catch (error) {
    next(error);
  }
};

export const getReservationHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id, reservationId } = req.params as { id: string; reservationId: string };

    const reservation = await getReservation(id, reservationId);

    res.json({
      id: reservation.id,
      restaurantId: reservation.restaurantId,
      tableId: reservation.tableId,
      tableNumber: (reservation as unknown as { table?: { tableNumber: unknown } }).table?.tableNumber,
      customerName: reservation.customerName,
      customerPhone: reservation.customerPhone,
      partySize: reservation.partySize,
      reservationDate: reservation.reservationDate,
      reservationStartTime: reservation.reservationStartTime,
      reservationEndTime: reservation.reservationEndTime,
      duration: reservation.duration,
      status: reservation.status,
      createdAt: reservation.createdAt,
    });
  } catch (error) {
    next(error);
  }
};

export const modifyReservationHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id, reservationId } = req.params as { id: string; reservationId: string };
    const { reservationStartTime, duration, partySize } = req.body;

    const reservation = await modifyReservation(id, reservationId, {
      reservationStartTime,
      duration,
      partySize,
    });

    res.json(reservation);
  } catch (error) {
    next(error);
  }
};

export const cancelReservationHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id, reservationId } = req.params as { id: string; reservationId: string };

    const reservation = await cancelReservation(id, reservationId);

    res.json({
      id: reservation.id,
      status: reservation.status,
      message: "Reservation cancelled successfully",
      updatedAt: reservation.updatedAt,
    });
  } catch (error) {
    next(error);
  }
};
