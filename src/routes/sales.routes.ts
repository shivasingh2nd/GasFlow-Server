import { Router } from "express";
import { SalesController } from "../controllers/sales.controller";
import { validate } from "../middleware/validation.middleware";
import { authenticate, isUser } from "../middleware/auth.middleware";
import { createDailySalesSchema } from "../validators/sales.validator";

const router = Router();

// All routes require authentication
router.use(authenticate);

// All sales routes are user-only (not admin)
router.use(isUser);

// ============================================
// SALES CRUD ROUTES
// ============================================

// Create daily sales
router.post("/", validate(createDailySalesSchema), SalesController.create);

// Get all sales (with filters: ?staffId=1&startDate=2025-01-01&endDate=2025-12-31)
router.get("/", SalesController.getAll);

// Get sales summary
router.get("/summary", SalesController.getSummary);

// Get sales analytics
router.get("/analytics", SalesController.getAnalytics);

// Get sales by ID
router.get("/:salesId", SalesController.getById);

// Get complete sale details (includes customer loans)
router.get("/:salesId/details", SalesController.getDetails);

// ============================================
// STAFF-SPECIFIC ROUTES
// ============================================

// Get sales by staff
router.get("/staff/:staffId", SalesController.getByStaff);

// ============================================
// DATE-SPECIFIC ROUTES
// ============================================

// Get sales by date
router.get("/date/:date", SalesController.getByDate);

export default router;
