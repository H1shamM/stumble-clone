import type { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger.js";

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // Log error
  if (err instanceof AppError && err.isOperational) {
    logger.warn(
      { statusCode: err.statusCode, message: err.message, url: req.url },
      "Operational error",
    );
  } else {
    logger.error(
      { error: err, url: req.url, method: req.method },
      "Unhandled error",
    );
  }

  // Check if headers already sent
  if (res.headersSent) {
    return next(err);
  }

  // Send response
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.isOperational ? err.message : "Internal server error",
      statusCode: err.statusCode,
    });
  } else {
    // Don't leak internal errors unless in development
    const message =
      process.env.NODE_ENV === "development"
        ? err.message
        : "Internal server error";
    res.status(500).json({
      error: message,
      statusCode: 500,
    });
  }
};

// 404 handler
export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    error: `Cannot ${req.method} ${req.url}`,
    statusCode: 404,
  });
};
