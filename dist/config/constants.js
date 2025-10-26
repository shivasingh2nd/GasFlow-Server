"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PAGINATION = exports.SUCCESS_MESSAGES = exports.ERROR_MESSAGES = exports.HTTP_STATUS = exports.APP_VERSION = exports.APP_NAME = void 0;
exports.APP_NAME = "GasFlow";
exports.APP_VERSION = "1.0.0";
exports.HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503,
};
exports.ERROR_MESSAGES = {
    INTERNAL_ERROR: "Internal server error",
    UNAUTHORIZED: "Unauthorized access",
    INVALID_CREDENTIALS: "Invalid email or password",
    USER_EXISTS: "User already exists",
    USER_NOT_FOUND: "User not found",
    INVALID_TOKEN: "Invalid or expired token",
    VALIDATION_ERROR: "Validation error",
};
exports.SUCCESS_MESSAGES = {
    REGISTERED: "User registered successfully",
    LOGIN: "Login successful",
    LOGOUT: "Logout successful",
    CREATED: "Created successfully",
    UPDATED: "Updated successfully",
    DELETED: "Deleted successfully",
};
exports.PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100,
};
