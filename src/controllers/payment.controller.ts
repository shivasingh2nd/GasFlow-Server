import { Request, Response, NextFunction } from "express";
import { PaymentService } from "../services/payment.service";
import { ResponseHandler } from "../utils/response";

export class PaymentController {
  // Create payment
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id!;
      const paymentData = req.body;

      const payment = await PaymentService.create(userId, paymentData);

      return ResponseHandler.created(
        res,
        payment,
        "Payment recorded successfully"
      );
    } catch (error) {
      next(error);
    }
  }

  // Get all payments (with filters)
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id!;
      const { distributorId, paymentMethod, startDate, endDate, page, limit } =
        req.query;

      const filters = {
        distributorId: distributorId
          ? parseInt(distributorId as string)
          : undefined,
        paymentMethod: paymentMethod as string,
        startDate: startDate as string,
        endDate: endDate as string,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      };

      const result = await PaymentService.getAllForUser(userId, filters);

      return ResponseHandler.success(
        res,
        result,
        "Payments fetched successfully"
      );
    } catch (error) {
      next(error);
    }
  }

  // Get payment by ID
  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { paymentId } = req.params;
      const userId = req.user!.id!;

      const payment = await PaymentService.getById(parseInt(paymentId), userId);

      return ResponseHandler.success(
        res,
        payment,
        "Payment fetched successfully"
      );
    } catch (error) {
      next(error);
    }
  }

  // Update payment
  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { paymentId } = req.params;
      const userId = req.user!.id!;
      const updateData = req.body;

      const payment = await PaymentService.update(
        parseInt(paymentId),
        userId,
        updateData
      );

      return ResponseHandler.success(
        res,
        payment,
        "Payment updated successfully"
      );
    } catch (error) {
      next(error);
    }
  }

  // Delete payment
  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { paymentId } = req.params;
      const userId = req.user!.id!;

      const result = await PaymentService.delete(parseInt(paymentId), userId);

      return ResponseHandler.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  // Get payments by distributor
  static async getByDistributor(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { distributorId } = req.params;
      const userId = req.user!.id!;
      const { page, limit } = req.query;

      const result = await PaymentService.getByDistributor(
        parseInt(distributorId),
        userId,
        page ? parseInt(page as string) : undefined,
        limit ? parseInt(limit as string) : undefined
      );

      return ResponseHandler.success(
        res,
        result,
        "Payments fetched successfully"
      );
    } catch (error) {
      next(error);
    }
  }

  // Get payment summary
  static async getSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id!;
      const { startDate, endDate } = req.query;

      const summary = await PaymentService.getSummary(userId, {
        startDate: startDate as string,
        endDate: endDate as string,
      });

      return ResponseHandler.success(
        res,
        summary,
        "Payment summary fetched successfully"
      );
    } catch (error) {
      next(error);
    }
  }

  // Get distributor payment summary
  static async getDistributorSummary(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { distributorId } = req.params;
      const userId = req.user!.id!;

      const summary = await PaymentService.getDistributorSummary(
        parseInt(distributorId),
        userId
      );

      return ResponseHandler.success(
        res,
        summary,
        "Distributor payment summary fetched successfully"
      );
    } catch (error) {
      next(error);
    }
  }
}
