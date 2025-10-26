import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service";
import { ResponseHandler } from "../utils/response";
import { SUCCESS_MESSAGES } from "../config/constants";

export class AuthController {
  // Admin login
  static async adminLogin(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const result = await AuthService.adminLogin(email, password);
      return ResponseHandler.success(res, result, SUCCESS_MESSAGES.LOGIN);
    } catch (error) {
      next(error);
    }
  }

  // User login
  static async userLogin(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const result = await AuthService.userLogin(email, password);
      return ResponseHandler.success(res, result, SUCCESS_MESSAGES.LOGIN);
    } catch (error) {
      next(error);
    }
  }

  // Register user (admin only)
  static async registerUser(req: Request, res: Response, next: NextFunction) {
    try {
      const userData = req.body;
      const user = await AuthService.registerUser(userData);
      return ResponseHandler.created(res, user, SUCCESS_MESSAGES.REGISTERED);
    } catch (error) {
      next(error);
    }
  }

  // Reset user password (admin only)
  static async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, newPassword } = req.body;
      const result = await AuthService.resetUserPassword(userId, newPassword);
      return ResponseHandler.success(
        res,
        result,
        "Password reset successfully"
      );
    } catch (error) {
      next(error);
    }
  }

  // Get all users (admin only)
  static async getAllUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const users = await AuthService.getAllUsers();
      return ResponseHandler.success(res, users, "Users fetched successfully");
    } catch (error) {
      next(error);
    }
  }

  // Deactivate user (admin only)
  static async deactivateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const result = await AuthService.deactivateUser(parseInt(userId));
      return ResponseHandler.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  // Activate user (admin only)
  static async activateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const result = await AuthService.activateUser(parseInt(userId));
      return ResponseHandler.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  // Get user by ID (admin only)
  static async getUserById(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const user = await AuthService.getUserById(parseInt(userId));
      return ResponseHandler.success(res, user, "User fetched successfully");
    } catch (error) {
      next(error);
    }
  }

  // Get current user info
  static async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      if (req.user?.role === "ADMIN") {
        // Admin doesn't exist in DB, return from token
        return ResponseHandler.success(res, {
          email: req.user.email,
          role: "ADMIN",
          name: "Admin",
        });
      }

      // Regular user from database
      const user = await AuthService.getUserById(req.user!.id!);
      return ResponseHandler.success(res, {
        ...user,
        role: "USER",
      });
    } catch (error) {
      next(error);
    }
  }
}
