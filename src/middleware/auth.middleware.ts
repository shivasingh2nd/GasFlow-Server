import { Request, Response, NextFunction } from "express";
import { JWTUtil } from "../utils/jwt";
import { ResponseHandler } from "../utils/response";
import { ERROR_MESSAGES } from "../config/constants";

// Verify JWT token
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return ResponseHandler.unauthorized(res, ERROR_MESSAGES.UNAUTHORIZED);
    }

    const token = authHeader.substring(7); // Remove 'Bearer '

    const decoded = JWTUtil.verifyToken(token);

    // Attach user info to request
    if (JWTUtil.isAdminToken(decoded)) {
      // Admin token
      req.user = {
        role: "ADMIN",
        email: decoded.email,
        name: "Admin",
      };
    } else {
      // User token
      req.user = {
        id: decoded.userId,
        role: "USER",
        email: decoded.email,
      };
    }

    next();
  } catch (error) {
    return ResponseHandler.unauthorized(res, ERROR_MESSAGES.INVALID_TOKEN);
  }
};

// Check if user is admin
export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role !== "ADMIN") {
    return ResponseHandler.forbidden(res, "Admin access required");
  }
  next();
};

// Check if user is regular user (not admin)
export const isUser = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role !== "USER") {
    return ResponseHandler.forbidden(res, "User access required");
  }
  next();
};
