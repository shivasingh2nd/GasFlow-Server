import { Router } from "express";
import { StaffController } from "../controllers/staff.controller";
import { validate } from "../middleware/validation.middleware";
import { authenticate, isUser } from "../middleware/auth.middleware";
import {
  createStaffSchema,
  updateStaffSchema,
} from "../validators/staff.validator";

const router = Router();

// All routes require authentication
router.use(authenticate);

// ============================================
// STAFF CRUD ROUTES (User only)
// ============================================

// Create new staff member
router.post("/", isUser, validate(createStaffSchema), StaffController.create);

// Get all staff members (query param: ?active=true for active only)
router.get("/", StaffController.getAll);

// Get top performing staff
router.get("/top-performers", isUser, StaffController.getTopPerformers);

// Get staff by ID
router.get("/:staffId", StaffController.getById);

// Update staff
router.put(
  "/:staffId",
  isUser,
  validate(updateStaffSchema),
  StaffController.update
);

// Deactivate staff
router.patch("/:staffId/deactivate", isUser, StaffController.deactivate);

// Activate staff
router.patch("/:staffId/activate", isUser, StaffController.activate);

// ============================================
// PERFORMANCE ROUTES (User only)
// ============================================

// Get staff performance statistics
router.get("/:staffId/performance", isUser, StaffController.getPerformance);

// Get complete staff summary
router.get("/:staffId/summary", isUser, StaffController.getSummary);

export default router;
