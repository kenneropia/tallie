import { Request, Response, NextFunction } from "express";
import { ValidationError, NotFoundError, ConflictError, ServerError } from "../utils/errors";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error(err.stack);

  let statusCode = 500;
  let errorType = "Server error";
  let message = "Internal server error";
  let code = "INTERNAL_SERVER_ERROR";

  if (err instanceof ValidationError) {
    statusCode = 400;
    errorType = "Validation error";
    message = err.message;
    code = "VALIDATION_ERROR";
  } else if (err instanceof NotFoundError) {
    statusCode = 404;
    errorType = "Not found";
    message = err.message;
    code = "NOT_FOUND";
  } else if (err instanceof ConflictError) {
    statusCode = 409;
    errorType = "Conflict";
    message = err.message;
    code = "CONFLICT";
  } else if (err instanceof ServerError) {
    statusCode = 500;
    errorType = "Server error";
    message = err.message;
    code = "SERVER_ERROR";
  } else if (process.env.NODE_ENV === "development") {
    message = err.message;
  }

  res.status(statusCode).json({
    error: errorType,
    message,
    code,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};
