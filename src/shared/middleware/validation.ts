import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import {
  createRestaurantSchema,
  createTableSchema,
  createReservationSchema,
  createWaitlistSchema,
} from "../validation/schemas";
import { validateInput } from "../validation/validator";

// Helper to create Zod middleware
const zodMiddleware = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = validateInput(schema, req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
};

export const validateRestaurant = zodMiddleware(createRestaurantSchema);
export const validateTable = zodMiddleware(createTableSchema);
export const validateReservation = zodMiddleware(createReservationSchema);
export const validateWaitlist = zodMiddleware(createWaitlistSchema);
