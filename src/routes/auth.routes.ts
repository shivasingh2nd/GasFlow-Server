import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { validate } from "../middleware/validation.middleware";
import { authenticate, isAdmin } from "../middleware/auth.middleware";
import {
  adminLoginSchema,
  userLoginSchema,
  registerUserSchema,
  resetPasswordSchema,
} from "../validators/auth.validator";

const router = Router();

// ============================================
// PUBLIC ROUTES (No authentication required)
// ============================================

// Admin login
router.post(
  "/admin/login",
  validate(adminLoginSchema),
  AuthController.adminLogin
);

// User login
router.post("/user/login", validate(userLoginSchema), AuthController.userLogin);

// ============================================
// PROTECTED ROUTES (Authentication required)
// ============================================

// Get current user info
router.get("/me", authenticate, AuthController.getMe);

// ============================================
// ADMIN-ONLY ROUTES
// ============================================

// Register new user (admin only)
router.post(
  "/register",
  authenticate,
  isAdmin,
  validate(registerUserSchema),
  AuthController.registerUser
);

// Reset user password (admin only)
router.post(
  "/reset-password",
  authenticate,
  isAdmin,
  validate(resetPasswordSchema),
  AuthController.resetPassword
);

// Get all users (admin only)
router.get("/users", authenticate, isAdmin, AuthController.getAllUsers);

// Get user by ID (admin only)
router.get("/users/:userId", authenticate, isAdmin, AuthController.getUserById);

// Deactivate user (admin only)
router.patch(
  "/users/:userId/deactivate",
  authenticate,
  isAdmin,
  AuthController.deactivateUser
);

// Activate user (admin only)
router.patch(
  "/users/:userId/activate",
  authenticate,
  isAdmin,
  AuthController.activateUser
);

export default router;
