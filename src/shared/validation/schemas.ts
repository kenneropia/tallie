import { z } from 'zod';
import { MIN_DURATION, MAX_DURATION } from '../utils/constants';

// Common patterns
const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^\+?[\d\s\-()]{10,}$/;

// Restaurant schemas
export const createRestaurantSchema = z.object({
  name: z.string().min(1, 'Restaurant name is required').max(255),
  openingTime: z.string().regex(timePattern, 'Invalid time format. Use HH:MM'),
  closingTime: z.string().regex(timePattern, 'Invalid time format. Use HH:MM'),
}).refine(
  (data) => {
    const openingMinutes = parseInt(data.openingTime.replace(':', ''));
    const closingMinutes = parseInt(data.closingTime.replace(':', ''));
    return openingMinutes < closingMinutes;
  },
  {
    message: 'Opening time must be before closing time',
    path: ['closingTime'],
  }
);

export const updateRestaurantSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  openingTime: z.string().regex(timePattern, 'Invalid time format. Use HH:MM').optional(),
  closingTime: z.string().regex(timePattern, 'Invalid time format. Use HH:MM').optional(),
});

// Table schemas
export const createTableSchema = z.object({
  tableNumber: z.number().int().positive('Table number must be positive'),
  capacity: z.number().int().min(1, 'Capacity must be at least 1').max(20, 'Capacity cannot exceed 20'),
});

export const updateTableSchema = z.object({
  tableNumber: z.number().int().positive().optional(),
  capacity: z.number().int().min(1).max(20).optional(),
});

// Reservation schemas
export const createReservationSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required').max(255),
  customerEmail: z.string().email('Invalid email format'),
  customerPhone: z.string().regex(phonePattern, 'Invalid phone number format'),
  partySize: z.number().int().min(1, 'Party size must be at least 1').max(50, 'Party size cannot exceed 50'),
  reservationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  reservationStartTime: z.string().regex(timePattern, 'Invalid time format. Use HH:MM'),
  duration: z.number().int().min(MIN_DURATION, `Duration must be at least ${MIN_DURATION} minutes`).max(MAX_DURATION, `Duration cannot exceed ${MAX_DURATION} minutes`).optional().default(90),
}).refine(
  (data) => {
    const reservationDate = new Date(data.reservationDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return reservationDate >= today;
  },
  {
    message: 'Reservation date cannot be in the past',
    path: ['reservationDate'],
  }
);

export const modifyReservationSchema = z.object({
  reservationStartTime: z.string().regex(timePattern, 'Invalid time format. Use HH:MM').optional(),
  duration: z.number().int().min(MIN_DURATION).max(MAX_DURATION).optional(),
  partySize: z.number().int().min(1).max(50).optional(),
}).refine(
  (data: any) => Object.values(data).some(v => v !== undefined),
  { message: 'At least one field must be provided for update' }
);

// Waitlist schemas
export const createWaitlistSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required').max(255),
  customerEmail: z.string().email('Invalid email format'),
  customerPhone: z.string().regex(phonePattern, 'Invalid phone number format'),
  partySize: z.number().int().min(1).max(50),
  preferredTime: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/, 'Invalid datetime format'),
});

export const updateWaitlistSchema = z.object({
  status: z.enum(['waiting', 'notified', 'seated', 'expired']),
});

// Availability query schema
export const availabilityQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  partySize: z.string().or(z.number()).pipe(z.coerce.number().int().positive()),
  durationMinutes: z.string().or(z.number()).pipe(z.coerce.number().int().min(MIN_DURATION).max(MAX_DURATION)).optional().default(120),
});

// Type exports
export type CreateRestaurantInput = z.infer<typeof createRestaurantSchema>;
export type UpdateRestaurantInput = z.infer<typeof updateRestaurantSchema>;
export type CreateTableInput = z.infer<typeof createTableSchema>;
export type UpdateTableInput = z.infer<typeof updateTableSchema>;
export type CreateReservationInput = z.infer<typeof createReservationSchema>;
export type ModifyReservationInput = z.infer<typeof modifyReservationSchema>;
export type CreateWaitlistInput = z.infer<typeof createWaitlistSchema>;
export type UpdateWaitlistInput = z.infer<typeof updateWaitlistSchema>;
export type AvailabilityQuery = z.infer<typeof availabilityQuerySchema>;
