import { Request, Response, NextFunction } from "express";
import { StaffService } from "../services/staff.service";
import { ResponseHandler } from "../utils/response";

export class StaffController {
  // Create staff member
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id!;
      const staffData = req.body;

      const staff = await StaffService.create(userId, staffData);

      return ResponseHandler.created(
        res,
        staff,
        "Staff member added successfully"
      );
    } catch (error) {
      next(error);
    }
  }

  // Get all staff members
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { active } = req.query;

      let staff;

      if (req.user?.role === "ADMIN") {
        // Admin can see all staff from all users
        staff = await StaffService.getAllForAdmin();
      } else {
        // User sees only their staff
        if (active === "true") {
          staff = await StaffService.getActiveStaff(req.user!.id!);
        } else {
          staff = await StaffService.getAllForUser(req.user!.id!);
        }
      }

      return ResponseHandler.success(
        res,
        staff,
        "Staff members fetched successfully"
      );
    } catch (error) {
      next(error);
    }
  }

  // Get staff by ID
  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { staffId } = req.params;
      const userId = req.user?.role === "USER" ? req.user.id : undefined;

      const staff = await StaffService.getById(parseInt(staffId), userId);

      return ResponseHandler.success(
        res,
        staff,
        "Staff member fetched successfully"
      );
    } catch (error) {
      next(error);
    }
  }

  // Update staff
  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { staffId } = req.params;
      const userId = req.user!.id!;
      const updateData = req.body;

      const staff = await StaffService.update(
        parseInt(staffId),
        userId,
        updateData
      );

      return ResponseHandler.success(
        res,
        staff,
        "Staff member updated successfully"
      );
    } catch (error) {
      next(error);
    }
  }

  // Deactivate staff
  static async deactivate(req: Request, res: Response, next: NextFunction) {
    try {
      const { staffId } = req.params;
      const userId = req.user!.id!;

      const result = await StaffService.deactivate(parseInt(staffId), userId);

      return ResponseHandler.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  // Activate staff
  static async activate(req: Request, res: Response, next: NextFunction) {
    try {
      const { staffId } = req.params;
      const userId = req.user!.id!;

      const result = await StaffService.activate(parseInt(staffId), userId);

      return ResponseHandler.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  // Get staff performance
  static async getPerformance(req: Request, res: Response, next: NextFunction) {
    try {
      const { staffId } = req.params;
      const userId = req.user!.id!;

      const performance = await StaffService.getPerformance(
        parseInt(staffId),
        userId
      );

      return ResponseHandler.success(
        res,
        performance,
        "Staff performance fetched successfully"
      );
    } catch (error) {
      next(error);
    }
  }

  // Get staff summary
  static async getSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const { staffId } = req.params;
      const userId = req.user!.id!;

      const summary = await StaffService.getSummary(parseInt(staffId), userId);

      return ResponseHandler.success(
        res,
        summary,
        "Staff summary fetched successfully"
      );
    } catch (error) {
      next(error);
    }
  }

  // Get top performers
  static async getTopPerformers(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = req.user!.id!;
      const limit = parseInt(req.query.limit as string) || 5;

      const topPerformers = await StaffService.getTopPerformers(userId, limit);

      return ResponseHandler.success(
        res,
        topPerformers,
        "Top performers fetched successfully"
      );
    } catch (error) {
      next(error);
    }
  }
}
