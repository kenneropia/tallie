import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../../../shared/database/dataSource";
import { Restaurant } from "../entities/Restaurant";
import { NotFoundError, ValidationError } from "../../../shared/utils/errors";
import { isValidTimeFormat } from "../../../shared/utils/validators";

const restaurantRepository = () => AppDataSource.getRepository(Restaurant);

export const createRestaurant = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, openingTime, closingTime } = req.body;

    const restaurant = restaurantRepository().create({
      name,
      openingTime,
      closingTime,
    });

    await restaurantRepository().save(restaurant);

    res.status(201).json(restaurant);
  } catch (error) {
    next(error);
  }
};

export const getRestaurant = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id as string;

    const restaurant = await restaurantRepository().findOne({
      where: { id },
      relations: ["tables"],
    });

    if (!restaurant) {
      throw new NotFoundError("Restaurant not found");
    }

    const tables = restaurant.tables || [];

    res.json({
      ...restaurant,
      tables: tables.map((table) => ({
        id: table.id,
        tableNumber: table.tableNumber,
        capacity: table.capacity,
      })),
    });
  } catch (error) {
    next(error);
  }
};

export const getRestaurantDetails = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id as string;

    const restaurant = await restaurantRepository().findOne({
      where: { id },
      relations: ["tables", "reservations"],
    });

    if (!restaurant) {
      throw new NotFoundError("Restaurant not found");
    }

    const tables = restaurant.tables || [];
    const reservations = restaurant.reservations || [];

    const reservationStats = {
      total: reservations.length,
      pending: reservations.filter((r) => r.status === "pending").length,
      confirmed: reservations.filter((r) => r.status === "confirmed").length,
      completed: reservations.filter((r) => r.status === "completed").length,
      cancelled: reservations.filter((r) => r.status === "cancelled").length,
    };

    res.json({
      id: restaurant.id,
      name: restaurant.name,
      openingTime: restaurant.openingTime,
      closingTime: restaurant.closingTime,
      totalTables: tables.length,
      tables: tables.map((table) => ({
        id: table.id,
        tableNumber: table.tableNumber,
        capacity: table.capacity,
      })),
      reservationStats,
      createdAt: restaurant.createdAt,
    });
  } catch (error) {
    next(error);
  }
};

export const updateRestaurant = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id as string;
    const { openingTime, closingTime, name } = req.body;

    const restaurant = await restaurantRepository().findOne({
      where: { id },
    });

    if (!restaurant) {
      throw new NotFoundError("Restaurant not found");
    }

    if (openingTime && !isValidTimeFormat(openingTime)) {
      throw new ValidationError("Invalid opening time format. Use HH:MM");
    }

    if (closingTime && !isValidTimeFormat(closingTime)) {
      throw new ValidationError("Invalid closing time format. Use HH:MM");
    }

    if (openingTime && closingTime) {
      const openingMinutes = parseInt(openingTime.split(":").join(""));
      const closingMinutes = parseInt(closingTime.split(":").join(""));

      if (openingMinutes >= closingMinutes) {
        throw new ValidationError("Opening time must be before closing time");
      }
    }

    if (openingTime) restaurant.openingTime = openingTime;
    if (closingTime) restaurant.closingTime = closingTime;
    if (name) restaurant.name = name;

    await restaurantRepository().save(restaurant);

    res.json(restaurant);
  } catch (error) {
    next(error);
  }
};
