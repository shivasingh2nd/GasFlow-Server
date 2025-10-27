import { Request, Response, NextFunction } from "express";
import { CustomerService } from "../services/customer.service";
import { ResponseHandler } from "../utils/response";

export class CustomerController {
  // Create customer
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id!;
      const customerData = req.body;

      const customer = await CustomerService.create(userId, customerData);

      return ResponseHandler.created(
        res,
        customer,
        "Customer created successfully"
      );
    } catch (error) {
      next(error);
    }
  }

  // Get all customers
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id!;
      const { active, page, limit } = req.query;

      const filters = {
        active:
          active === "true" ? true : active === "false" ? false : undefined,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      };

      const result = await CustomerService.getAllForUser(userId, filters);

      return ResponseHandler.success(
        res,
        result,
        "Customers fetched successfully"
      );
    } catch (error) {
      next(error);
    }
  }

  // Get customer by ID
  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { customerId } = req.params;
      const userId = req.user!.id!;

      const customer = await CustomerService.getById(
        parseInt(customerId),
        userId
      );

      return ResponseHandler.success(
        res,
        customer,
        "Customer fetched successfully"
      );
    } catch (error) {
      next(error);
    }
  }

  // Update customer
  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { customerId } = req.params;
      const userId = req.user!.id!;
      const updateData = req.body;

      const customer = await CustomerService.update(
        parseInt(customerId),
        userId,
        updateData
      );

      return ResponseHandler.success(
        res,
        customer,
        "Customer updated successfully"
      );
    } catch (error) {
      next(error);
    }
  }

  // Get customer loans
  static async getLoans(req: Request, res: Response, next: NextFunction) {
    try {
      const { customerId } = req.params;
      const userId = req.user!.id!;

      const loans = await CustomerService.getLoans(
        parseInt(customerId),
        userId
      );

      return ResponseHandler.success(
        res,
        loans,
        "Customer loans fetched successfully"
      );
    } catch (error) {
      next(error);
    }
  }

  // Get pending returns
  static async getPendingReturns(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { customerId } = req.params;
      const userId = req.user!.id!;

      const pending = await CustomerService.getPendingReturns(
        parseInt(customerId),
        userId
      );

      return ResponseHandler.success(
        res,
        pending,
        "Pending returns fetched successfully"
      );
    } catch (error) {
      next(error);
    }
  }
}
