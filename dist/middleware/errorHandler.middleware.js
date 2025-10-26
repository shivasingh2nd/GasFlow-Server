"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = exports.errorHandler = exports.AppError = void 0;
const response_1 = require("../utils/response");
const logger_1 = require("../utils/logger");
const env_1 = require("../config/env");
class AppError extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
const errorHandler = (err, req, res, next) => {
    logger_1.logger.error("Error occurred:", {
        message: err.message,
        stack: env_1.ENV.NODE_ENV === "development" ? err.stack : undefined,
        path: req.path,
        method: req.method,
    });
    if (err instanceof AppError) {
        return response_1.ResponseHandler.error(res, err.message, err.statusCode);
    }
    // Default to 500 server error
    return response_1.ResponseHandler.internalError(res, env_1.ENV.NODE_ENV === "development" ? err.message : "Internal server error");
};
exports.errorHandler = errorHandler;
const notFoundHandler = (req, res) => {
    return response_1.ResponseHandler.notFound(res, `Route ${req.path} not found`);
};
exports.notFoundHandler = notFoundHandler;
