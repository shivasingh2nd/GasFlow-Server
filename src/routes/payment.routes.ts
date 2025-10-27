import { Router } from "express";
import { PaymentController } from "../controllers/payment.controller";
import { validate } from "../middleware/validation.middleware";
import { authenticate, isUser } from "../middleware/auth.middleware";
import {
  createPaymentSchema,
  updatePaymentSchema,
} from "../validators/payment.validator";

const router = Router();

// All routes require authentication
router.use(authenticate);

// All payment routes are user-only (not admin)
router.use(isUser);

// ============================================
// PAYMENT CRUD ROUTES
// ============================================

// Record new payment
router.post("/", validate(createPaymentSchema), PaymentController.create);

// Get all payments (with filters: ?distributorId=1&paymentMethod=UPI&startDate=2025-01-01&endDate=2025-12-31)
router.get("/", PaymentController.getAll);

// Get payment summary (all distributors)
router.get("/summary", PaymentController.getSummary);

// Get payment by ID
router.get("/:paymentId", PaymentController.getById);

// Update payment
router.put(
  "/:paymentId",
  validate(updatePaymentSchema),
  PaymentController.update
);

// Delete payment
router.delete("/:paymentId", PaymentController.delete);

// ============================================
// DISTRIBUTOR-SPECIFIC ROUTES
// ============================================

// Get payments to specific distributor
router.get("/distributor/:distributorId", PaymentController.getByDistributor);

// Get distributor payment summary
router.get(
  "/distributor/:distributorId/summary",
  PaymentController.getDistributorSummary
);

export default router;
