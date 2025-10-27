import { Request, Response, NextFunction } from "express";
import { ReportService } from "../services/report.service";
import { ResponseHandler } from "../utils/response";

export class ReportController {
  // Dashboard statistics
  static async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id!;

      const dashboard = await ReportService.getDashboard(userId);

      return ResponseHandler.success(
        res,
        dashboard,
        "Dashboard statistics fetched successfully"
      );
    } catch (error) {
      next(error);
    }
  }

  // Profit/Loss report
  static async getProfitLoss(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id!;
      const { startDate, endDate } = req.query;

      const report = await ReportService.getProfitLoss(
        userId,
        startDate as string,
        endDate as string
      );

      return ResponseHandler.success(
        res,
        report,
        "Profit/Loss report fetched successfully"
      );
    } catch (error) {
      next(error);
    }
  }

  // Revenue analysis
  static async getRevenueAnalysis(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = req.user!.id!;
      const { startDate, endDate } = req.query;

      const analysis = await ReportService.getRevenueAnalysis(
        userId,
        startDate as string,
        endDate as string
      );

      return ResponseHandler.success(
        res,
        analysis,
        "Revenue analysis fetched successfully"
      );
    } catch (error) {
      next(error);
    }
  }

  // Sales overview
  static async getSalesOverview(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = req.user!.id!;
      const { startDate, endDate } = req.query;

      const overview = await ReportService.getSalesOverview(
        userId,
        startDate as string,
        endDate as string
      );

      return ResponseHandler.success(
        res,
        overview,
        "Sales overview fetched successfully"
      );
    } catch (error) {
      next(error);
    }
  }

  // Sales trends
  static async getSalesTrends(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id!;
      const { period, startDate, endDate } = req.query;

      const trends = await ReportService.getSalesTrends(
        userId,
        period as "daily" | "weekly" | "monthly" | "yearly",
        startDate as string,
        endDate as string
      );

      return ResponseHandler.success(
        res,
        trends,
        "Sales trends fetched successfully"
      );
    } catch (error) {
      next(error);
    }
  }

  // Inventory movement
  static async getInventoryMovement(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = req.user!.id!;
      const { startDate, endDate } = req.query;

      const movement = await ReportService.getInventoryMovement(
        userId,
        startDate as string,
        endDate as string
      );

      return ResponseHandler.success(
        res,
        movement,
        "Inventory movement fetched successfully"
      );
    } catch (error) {
      next(error);
    }
  }

  // Monthly comparison
  static async getMonthlyComparison(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = req.user!.id!;
      const { year } = req.query;

      const comparison = await ReportService.getMonthlyComparison(
        userId,
        parseInt(year as string)
      );

      return ResponseHandler.success(
        res,
        comparison,
        "Monthly comparison fetched successfully"
      );
    } catch (error) {
      next(error);
    }
  }
}
