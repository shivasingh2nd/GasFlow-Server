import { Request, Response, NextFunction } from "express";
import { SalesService } from "../services/sales.service";
import { ResponseHandler } from "../utils/response";

export class SalesController {
  // Create daily sales
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id!;
      const salesData = req.body;

      const sales = await SalesService.create(userId, salesData);

      return ResponseHandler.created(
        res,
        sales,
        "Daily sales recorded successfully"
      );
    } catch (error) {
      next(error);
    }
  }

  // Get all sales (with filters)
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id!;
      const { staffId, startDate, endDate, page, limit } = req.query;

      const filters = {
        staffId: staffId ? parseInt(staffId as string) : undefined,
        startDate: startDate as string,
        endDate: endDate as string,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      };

      const result = await SalesService.getAllForUser(userId, filters);

      return ResponseHandler.success(res, result, "Sales fetched successfully");
    } catch (error) {
      next(error);
    }
  }

  // Get sales by ID
  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { salesId } = req.params;
      const userId = req.user!.id!;

      const sales = await SalesService.getById(parseInt(salesId), userId);

      return ResponseHandler.success(res, sales, "Sales fetched successfully");
    } catch (error) {
      next(error);
    }
  }

  // Get sales by staff
  static async getByStaff(req: Request, res: Response, next: NextFunction) {
    try {
      const { staffId } = req.params;
      const userId = req.user!.id!;
      const { page, limit } = req.query;

      const result = await SalesService.getByStaff(
        parseInt(staffId),
        userId,
        page ? parseInt(page as string) : undefined,
        limit ? parseInt(limit as string) : undefined
      );

      return ResponseHandler.success(res, result, "Sales fetched successfully");
    } catch (error) {
      next(error);
    }
  }

  // Get sales by date
  static async getByDate(req: Request, res: Response, next: NextFunction) {
    try {
      const { date } = req.params;
      const userId = req.user!.id!;

      const result = await SalesService.getByDate(date, userId);

      return ResponseHandler.success(res, result, "Sales fetched successfully");
    } catch (error) {
      next(error);
    }
  }

  // Get complete sale details
  static async getDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const { salesId } = req.params;
      const userId = req.user!.id!;

      const details = await SalesService.getDetails(parseInt(salesId), userId);

      return ResponseHandler.success(
        res,
        details,
        "Sale details fetched successfully"
      );
    } catch (error) {
      next(error);
    }
  }

  // Get sales summary
  static async getSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id!;
      const { startDate, endDate } = req.query;

      const summary = await SalesService.getSummary(userId, {
        startDate: startDate as string,
        endDate: endDate as string,
      });

      return ResponseHandler.success(
        res,
        summary,
        "Sales summary fetched successfully"
      );
    } catch (error) {
      next(error);
    }
  }

  // Get sales analytics
  static async getAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id!;
      const { startDate, endDate } = req.query;

      const analytics = await SalesService.getAnalytics(userId, {
        startDate: startDate as string,
        endDate: endDate as string,
      });

      return ResponseHandler.success(
        res,
        analytics,
        "Sales analytics fetched successfully"
      );
    } catch (error) {
      next(error);
    }
  }
}
