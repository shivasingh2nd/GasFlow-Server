import { Router } from "express";
import { DistributorController } from "../controllers/distributor.controller";
import { validate } from "../middleware/validation.middleware";
import { authenticate, isUser } from "../middleware/auth.middleware";
import {
  createDistributorSchema,
  updateDistributorSchema,
} from "../validators/distributor.validator";

const router = Router();

// All routes require authentication
router.use(authenticate);

// ============================================
// DISTRIBUTOR CRUD ROUTES (User only)
// ============================================

// Create new distributor
router.post(
  "/",
  isUser,
  validate(createDistributorSchema),
  DistributorController.create
);

// Get all distributors (user sees their own, admin sees all)
router.get("/", DistributorController.getAll);

// Get distributor by ID
router.get("/:distributorId", DistributorController.getById);

// Update distributor
router.put(
  "/:distributorId",
  isUser,
  validate(updateDistributorSchema),
  DistributorController.update
);

// Deactivate distributor
router.patch(
  "/:distributorId/deactivate",
  isUser,
  DistributorController.deactivate
);

// Activate distributor
router.patch(
  "/:distributorId/activate",
  isUser,
  DistributorController.activate
);

// ============================================
// BALANCE ROUTES (User only)
// ============================================

// Get financial balance (money owed)
router.get(
  "/:distributorId/balance/financial",
  isUser,
  DistributorController.getFinancialBalance
);

// Get cylinder balance (empty cylinders owed)
router.get(
  "/:distributorId/balance/cylinders",
  isUser,
  DistributorController.getCylinderBalance
);

// Get complete summary
router.get("/:distributorId/summary", isUser, DistributorController.getSummary);

export default router;
