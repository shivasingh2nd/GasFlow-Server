import { Router } from "express";
import { CustomerController } from "../controllers/customer.controller";
import { validate } from "../middleware/validation.middleware";
import { authenticate, isUser } from "../middleware/auth.middleware";
import {
  createCustomerSchema,
  updateCustomerSchema,
} from "../validators/sales.validator";

const router = Router();

// All routes require authentication
router.use(authenticate);

// All customer routes are user-only (not admin)
router.use(isUser);

// ============================================
// CUSTOMER CRUD ROUTES
// ============================================

// Create customer
router.post("/", validate(createCustomerSchema), CustomerController.create);

// Get all customers (?active=true)
router.get("/", CustomerController.getAll);

// Get customer by ID
router.get("/:customerId", CustomerController.getById);

// Update customer
router.put(
  "/:customerId",
  validate(updateCustomerSchema),
  CustomerController.update
);

// ============================================
// CUSTOMER LOAN ROUTES
// ============================================

// Get customer loans
router.get("/:customerId/loans", CustomerController.getLoans);

// Get pending returns
router.get("/:customerId/pending", CustomerController.getPendingReturns);

export default router;
