"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponseHandler = void 0;
const constants_1 = require("../config/constants");
class ResponseHandler {
    static success(res, data, message, statusCode = constants_1.HTTP_STATUS.OK) {
        const response = {
            success: true,
            message,
            data,
        };
        return res.status(statusCode).json(response);
    }
    static created(res, data, message) {
        return this.success(res, data, message, constants_1.HTTP_STATUS.CREATED);
    }
    static error(res, message, statusCode = constants_1.HTTP_STATUS.BAD_REQUEST, errors) {
        const response = {
            success: false,
            message,
            error: message,
            errors,
        };
        return res.status(statusCode).json(response);
    }
    static badRequest(res, message, errors) {
        return this.error(res, message, constants_1.HTTP_STATUS.BAD_REQUEST, errors);
    }
    static unauthorized(res, message = "Unauthorized") {
        return this.error(res, message, constants_1.HTTP_STATUS.UNAUTHORIZED);
    }
    static forbidden(res, message = "Forbidden") {
        return this.error(res, message, constants_1.HTTP_STATUS.FORBIDDEN);
    }
    static notFound(res, message = "Not found") {
        return this.error(res, message, constants_1.HTTP_STATUS.NOT_FOUND);
    }
    static conflict(res, message) {
        return this.error(res, message, constants_1.HTTP_STATUS.CONFLICT);
    }
    static internalError(res, message = "Internal server error") {
        return this.error(res, message, constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
}
exports.ResponseHandler = ResponseHandler;
