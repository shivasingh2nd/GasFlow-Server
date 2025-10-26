import { Request, Response, NextFunction } from "express";
import { OrderService } from "../services/order.service";
import { ResponseHandler } from "../utils/response";

export class OrderController {
  // Create order
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id!;
      const orderData = req.body;

      const order = await OrderService.create(userId, orderData);

      return ResponseHandler.created(res, order, "Order created successfully");
    } catch (error) {
      next(error);
    }
  }

  // Get all orders (with filters)
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id!;
      const { distributorId, startDate, endDate, page, limit } = req.query;

      const filters = {
        distributorId: distributorId
          ? parseInt(distributorId as string)
          : undefined,
        startDate: startDate as string,
        endDate: endDate as string,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      };

      const result = await OrderService.getAllForUser(userId, filters);

      return ResponseHandler.success(
        res,
        result,
        "Orders fetched successfully"
      );
    } catch (error) {
      next(error);
    }
  }

  // Get order by ID
  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { orderId } = req.params;
      const userId = req.user!.id!;

      const order = await OrderService.getById(parseInt(orderId), userId);

      return ResponseHandler.success(res, order, "Order fetched successfully");
    } catch (error) {
      next(error);
    }
  }

  // Get orders by distributor
  static async getByDistributor(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { distributorId } = req.params;
      const userId = req.user!.id!;
      const { page, limit } = req.query;

      const result = await OrderService.getByDistributor(
        parseInt(distributorId),
        userId,
        page ? parseInt(page as string) : undefined,
        limit ? parseInt(limit as string) : undefined
      );

      return ResponseHandler.success(
        res,
        result,
        "Orders fetched successfully"
      );
    } catch (error) {
      next(error);
    }
  }

  // Get order items
  static async getOrderItems(req: Request, res: Response, next: NextFunction) {
    try {
      const { orderId } = req.params;
      const userId = req.user!.id!;

      const items = await OrderService.getOrderItems(parseInt(orderId), userId);

      return ResponseHandler.success(
        res,
        items,
        "Order items fetched successfully"
      );
    } catch (error) {
      next(error);
    }
  }

  // Get order summary (order + returns)
  static async getOrderSummary(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { orderId } = req.params;
      const userId = req.user!.id!;

      const summary = await OrderService.getOrderSummary(
        parseInt(orderId),
        userId
      );

      return ResponseHandler.success(
        res,
        summary,
        "Order summary fetched successfully"
      );
    } catch (error) {
      next(error);
    }
  }
}
