import { Request, Response, NextFunction } from "express";
import { InventoryService } from "../services/inventory.service";
import { ResponseHandler } from "../utils/response";

export class InventoryController {
  // Get all inventory
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id!;
      const { cylinderTypeId, company, lowStock, threshold } = req.query;

      const filters = {
        cylinderTypeId: cylinderTypeId
          ? parseInt(cylinderTypeId as string)
          : undefined,
        company: company as string,
        lowStock: lowStock === "true",
        threshold: threshold ? parseInt(threshold as string) : undefined,
      };

      const inventory = await InventoryService.getAllForUser(userId, filters);

      return ResponseHandler.success(
        res,
        inventory,
        "Inventory fetched successfully"
      );
    } catch (error) {
      next(error);
    }
  }

  // Get inventory summary
  static async getSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id!;

      const summary = await InventoryService.getSummary(userId);

      return ResponseHandler.success(
        res,
        summary,
        "Inventory summary fetched successfully"
      );
    } catch (error) {
      next(error);
    }
  }

  // Get inventory by cylinder type
  static async getByCylinderType(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = req.user!.id!;
      const { cylinderTypeId } = req.params;

      const inventory = await InventoryService.getByCylinderType(
        userId,
        parseInt(cylinderTypeId)
      );

      return ResponseHandler.success(
        res,
        inventory,
        "Inventory fetched successfully"
      );
    } catch (error) {
      next(error);
    }
  }

  // Set opening stock
  static async setOpeningStock(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = req.user!.id!;
      const openingStockData = req.body;

      const inventory = await InventoryService.setOpeningStock(
        userId,
        openingStockData
      );

      return ResponseHandler.created(
        res,
        inventory,
        "Opening stock set successfully"
      );
    } catch (error) {
      next(error);
    }
  }

  // Create adjustment
  static async createAdjustment(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = req.user!.id!;
      const adjustmentData = req.body;

      const adjustment = await InventoryService.createAdjustment(
        userId,
        adjustmentData
      );

      return ResponseHandler.created(
        res,
        adjustment,
        "Inventory adjustment created successfully"
      );
    } catch (error) {
      next(error);
    }
  }

  // Get adjustment history
  static async getAdjustments(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id!;
      const { cylinderTypeId, startDate, endDate, page, limit } = req.query;

      const filters = {
        cylinderTypeId: cylinderTypeId
          ? parseInt(cylinderTypeId as string)
          : undefined,
        startDate: startDate as string,
        endDate: endDate as string,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      };

      const result = await InventoryService.getAdjustments(userId, filters);

      return ResponseHandler.success(
        res,
        result,
        "Adjustment history fetched successfully"
      );
    } catch (error) {
      next(error);
    }
  }

  // Get low stock items
  static async getLowStock(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id!;
      const { threshold } = req.query;

      const lowStockItems = await InventoryService.getLowStock(
        userId,
        threshold ? parseInt(threshold as string) : undefined
      );

      return ResponseHandler.success(
        res,
        lowStockItems,
        "Low stock items fetched successfully"
      );
    } catch (error) {
      next(error);
    }
  }

  // Get inventory movements
  static async getMovements(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id!;
      const { cylinderTypeId, startDate, endDate, limit } = req.query;

      const filters = {
        cylinderTypeId: cylinderTypeId
          ? parseInt(cylinderTypeId as string)
          : undefined,
        startDate: startDate as string,
        endDate: endDate as string,
        limit: limit ? parseInt(limit as string) : undefined,
      };

      const movements = await InventoryService.getMovements(userId, filters);

      return ResponseHandler.success(
        res,
        movements,
        "Inventory movements fetched successfully"
      );
    } catch (error) {
      next(error);
    }
  }

  // Get inventory valuation
  static async getValuation(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id!;

      const valuation = await InventoryService.getValuation(userId);

      return ResponseHandler.success(
        res,
        valuation,
        "Inventory valuation fetched successfully"
      );
    } catch (error) {
      next(error);
    }
  }
}
