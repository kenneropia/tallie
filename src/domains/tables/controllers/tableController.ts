import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../../../shared/database/dataSource";
import { Table } from "../entities/Table";
import { Reservation, ReservationStatus } from "../../reservations/entities/Reservation";
import { NotFoundError, ConflictError, ValidationError } from "../../../shared/utils/errors";

const tableRepository = () => AppDataSource.getRepository(Table);
const restaurantRepository = () => AppDataSource.getRepository("Restaurant");
const reservationRepository = () => AppDataSource.getRepository(Reservation);

export const addTable = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const restaurantId = req.params.id as string;
    const { tableNumber, capacity } = req.body;

    const restaurant = await restaurantRepository().findOne({
      where: { id: restaurantId },
    });

    if (!restaurant) {
      throw new NotFoundError("Restaurant not found");
    }

    const existingTable = await tableRepository().findOne({
      where: { restaurantId, tableNumber },
    });

    if (existingTable) {
      throw new ConflictError(`Table number ${tableNumber} already exists for this restaurant`);
    }

    if (capacity < 1) {
      throw new ValidationError("Capacity must be at least 1");
    }

    const table = tableRepository().create({
      restaurantId,
      tableNumber,
      capacity,
    });

    await tableRepository().save(table);

    res.status(201).json({
      id: table.id,
      restaurantId: table.restaurantId,
      tableNumber: table.tableNumber,
      capacity: table.capacity,
      createdAt: table.createdAt,
    });
  } catch (error) {
    next(error);
  }
};

export const getTables = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const restaurantId = req.params.id as string;

    const restaurant = await restaurantRepository().findOne({
      where: { id: restaurantId },
    });

    if (!restaurant) {
      throw new NotFoundError("Restaurant not found");
    }

    const tables = await tableRepository().find({
      where: { restaurantId },
      order: { tableNumber: "ASC" },
    });

    res.json({
      tables: tables.map((table) => ({
        id: table.id,
        tableNumber: table.tableNumber,
        capacity: table.capacity,
        createdAt: table.createdAt,
      })),
      total: tables.length,
    });
  } catch (error) {
    next(error);
  }
};

export const updateTable = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id, tableId } = req.params as { id: string; tableId: string };
    const { capacity } = req.body;

    const table = await tableRepository().findOne({
      where: { id: tableId, restaurantId: id },
    });

    if (!table) {
      throw new NotFoundError("Table not found");
    }

    if (capacity !== undefined) {
      if (capacity < 1) {
        throw new ValidationError("Capacity must be at least 1");
      }
      table.capacity = capacity;
    }

    await tableRepository().save(table);

    res.json({
      id: table.id,
      tableNumber: table.tableNumber,
      capacity: table.capacity,
      updatedAt: table.updatedAt,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTable = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id, tableId } = req.params as { id: string; tableId: string };

    const table = await tableRepository().findOne({
      where: { id: tableId, restaurantId: id },
    });

    if (!table) {
      throw new NotFoundError("Table not found");
    }

    const activeReservations = await reservationRepository().count({
      where: {
        tableId: tableId,
        status: ReservationStatus.CONFIRMED,
      },
    });

    if (activeReservations > 0) {
      throw new ConflictError("Cannot delete table with active reservations");
    }

    await tableRepository().remove(table);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
