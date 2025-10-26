import { Response } from "express";
import { HTTP_STATUS } from "../config/constants";

interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  errors?: any;
}

export class ResponseHandler {
  static success<T>(
    res: Response,
    data: T,
    message?: string,
    statusCode: number = HTTP_STATUS.OK
  ): Response {
    const response: ApiResponse<T> = {
      success: true,
      message,
      data,
    };
    return res.status(statusCode).json(response);
  }

  static created<T>(res: Response, data: T, message?: string): Response {
    return this.success(res, data, message, HTTP_STATUS.CREATED);
  }

  static error(
    res: Response,
    message: string,
    statusCode: number = HTTP_STATUS.BAD_REQUEST,
    errors?: any
  ): Response {
    const response: ApiResponse = {
      success: false,
      message,
      error: message,
      errors,
    };
    return res.status(statusCode).json(response);
  }

  static badRequest(res: Response, message: string, errors?: any): Response {
    return this.error(res, message, HTTP_STATUS.BAD_REQUEST, errors);
  }

  static unauthorized(
    res: Response,
    message: string = "Unauthorized"
  ): Response {
    return this.error(res, message, HTTP_STATUS.UNAUTHORIZED);
  }

  static forbidden(res: Response, message: string = "Forbidden"): Response {
    return this.error(res, message, HTTP_STATUS.FORBIDDEN);
  }

  static notFound(res: Response, message: string = "Not found"): Response {
    return this.error(res, message, HTTP_STATUS.NOT_FOUND);
  }

  static conflict(res: Response, message: string): Response {
    return this.error(res, message, HTTP_STATUS.CONFLICT);
  }

  static internalError(
    res: Response,
    message: string = "Internal server error"
  ): Response {
    return this.error(res, message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}
