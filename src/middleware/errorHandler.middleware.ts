import { Request, Response, NextFunction } from "express";
import { ResponseHandler } from "../utils/response";
import { logger } from "../utils/logger";
import { ENV } from "../config/env";

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error("Error occurred:", {
    message: err.message,
    stack: ENV.NODE_ENV === "development" ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  if (err instanceof AppError) {
    return ResponseHandler.error(res, err.message, err.statusCode);
  }

  // Default to 500 server error
  return ResponseHandler.internalError(
    res,
    ENV.NODE_ENV === "development" ? err.message : "Internal server error"
  );
};

export const notFoundHandler = (req: Request, res: Response) => {
  return ResponseHandler.notFound(res, `Route ${req.path} not found`);
};
