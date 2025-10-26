import { Router } from "express";
import { OrderController } from "../controllers/order.controller";
import { validate } from "../middleware/validation.middleware";
import { authenticate, isUser } from "../middleware/auth.middleware";
import { createOrderSchema } from "../validators/order.validator";

const router = Router();

// All routes require authentication and user role
router.use(authenticate, isUser);

// ============================================
// ORDER CRUD ROUTES
// ============================================

// Create new order
router.post("/", validate(createOrderSchema), OrderController.create);

// Get all orders (with filters: ?distributorId=1&startDate=2024-01-01&endDate=2024-12-31&page=1&limit=10)
router.get("/", OrderController.getAll);

// Get orders by distributor
router.get("/distributor/:distributorId", OrderController.getByDistributor);

// Get order by ID
router.get("/:orderId", OrderController.getById);

// Get order items
router.get("/:orderId/items", OrderController.getOrderItems);

// Get order summary (order + returns)
router.get("/:orderId/summary", OrderController.getOrderSummary);

export default router;
