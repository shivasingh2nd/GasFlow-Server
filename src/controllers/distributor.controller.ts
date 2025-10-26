import { Request, Response, NextFunction } from "express";
import { DistributorService } from "../services/distributor.service";
import { ResponseHandler } from "../utils/response";

export class DistributorController {
  // Create distributor
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id!;
      const distributorData = req.body;

      const distributor = await DistributorService.create(
        userId,
        distributorData
      );

      return ResponseHandler.created(
        res,
        distributor,
        "Distributor created successfully"
      );
    } catch (error) {
      next(error);
    }
  }

  // Get all distributors
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      let distributors;

      if (req.user?.role === "ADMIN") {
        // Admin can see all distributors
        distributors = await DistributorService.getAllForAdmin();
      } else {
        // User can only see their distributors
        distributors = await DistributorService.getAllForUser(req.user!.id!);
      }

      return ResponseHandler.success(
        res,
        distributors,
        "Distributors fetched successfully"
      );
    } catch (error) {
      next(error);
    }
  }

  // Get distributor by ID
  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { distributorId } = req.params;
      const userId = req.user?.role === "USER" ? req.user.id : undefined;

      const distributor = await DistributorService.getById(
        parseInt(distributorId),
        userId
      );

      return ResponseHandler.success(
        res,
        distributor,
        "Distributor fetched successfully"
      );
    } catch (error) {
      next(error);
    }
  }

  // Update distributor
  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { distributorId } = req.params;
      const userId = req.user!.id!;
      const updateData = req.body;

      const distributor = await DistributorService.update(
        parseInt(distributorId),
        userId,
        updateData
      );

      return ResponseHandler.success(
        res,
        distributor,
        "Distributor updated successfully"
      );
    } catch (error) {
      next(error);
    }
  }

  // Deactivate distributor
  static async deactivate(req: Request, res: Response, next: NextFunction) {
    try {
      const { distributorId } = req.params;
      const userId = req.user!.id!;

      const result = await DistributorService.deactivate(
        parseInt(distributorId),
        userId
      );

      return ResponseHandler.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  // Activate distributor
  static async activate(req: Request, res: Response, next: NextFunction) {
    try {
      const { distributorId } = req.params;
      const userId = req.user!.id!;

      const result = await DistributorService.activate(
        parseInt(distributorId),
        userId
      );

      return ResponseHandler.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  // Get financial balance
  static async getFinancialBalance(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { distributorId } = req.params;
      const userId = req.user!.id!;

      const balance = await DistributorService.getFinancialBalance(
        parseInt(distributorId),
        userId
      );

      return ResponseHandler.success(
        res,
        balance,
        "Financial balance fetched successfully"
      );
    } catch (error) {
      next(error);
    }
  }

  // Get cylinder balance
  static async getCylinderBalance(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { distributorId } = req.params;
      const userId = req.user!.id!;

      const balance = await DistributorService.getCylinderBalance(
        parseInt(distributorId),
        userId
      );

      return ResponseHandler.success(
        res,
        balance,
        "Cylinder balance fetched successfully"
      );
    } catch (error) {
      next(error);
    }
  }

  // Get distributor summary
  static async getSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const { distributorId } = req.params;
      const userId = req.user!.id!;

      const summary = await DistributorService.getSummary(
        parseInt(distributorId),
        userId
      );

      return ResponseHandler.success(
        res,
        summary,
        "Distributor summary fetched successfully"
      );
    } catch (error) {
      next(error);
    }
  }
}
