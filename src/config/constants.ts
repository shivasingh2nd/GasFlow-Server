export const APP_NAME = "GasFlow";
export const APP_VERSION = "1.0.0";

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

export const ERROR_MESSAGES = {
  INTERNAL_ERROR: "Internal server error",
  UNAUTHORIZED: "Unauthorized access",
  INVALID_CREDENTIALS: "Invalid email or password",
  USER_EXISTS: "User already exists",
  USER_NOT_FOUND: "User not found",
  INVALID_TOKEN: "Invalid or expired token",
  VALIDATION_ERROR: "Validation error",
} as const;

export const SUCCESS_MESSAGES = {
  REGISTERED: "User registered successfully",
  LOGIN: "Login successful",
  LOGOUT: "Logout successful",
  CREATED: "Created successfully",
  UPDATED: "Updated successfully",
  DELETED: "Deleted successfully",
} as const;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;
