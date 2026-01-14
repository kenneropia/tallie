import { z } from 'zod';
import { ValidationError } from '../utils/errors';

export function validateInput<T>(schema: z.ZodSchema, data: unknown): T {
  try {
    return schema.parse(data) as T;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors
        .map((err: any) => `${err.path.join('.')}: ${err.message}`)
        .join('; ');
      throw new ValidationError(messages);
    }
    throw error;
  }
}

export function validateInputAsync<T>(schema: z.ZodSchema, data: unknown): Promise<T> {
  return schema.parseAsync(data) as Promise<T>;
}
