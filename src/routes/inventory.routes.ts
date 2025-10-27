import { Router } from "express";
import { InventoryController } from "../controllers/inventory.controller";
import { validate } from "../middleware/validation.middleware";
import { authenticate, isUser } from "../middleware/auth.middleware";
import {
  openingStockSchema,
  inventoryAdjustmentSchema,
} from "../validators/inventory.validator";

const router = Router();

// All routes require authentication
router.use(authenticate);

// All inventory routes are user-only (not admin)
router.use(isUser);

// ============================================
// INVENTORY VIEW ROUTES
// ============================================

// Get all inventory (with optional filters: ?cylinderTypeId=1&company=HPCL&lowStock=true&threshold=10)
router.get("/", InventoryController.getAll);

// Get inventory summary
router.get("/summary", InventoryController.getSummary);

// Get low stock items (?threshold=10)
router.get("/low-stock", InventoryController.getLowStock);

// Get inventory movements/history
router.get("/movements", InventoryController.getMovements);

// Get inventory valuation
router.get("/valuation", InventoryController.getValuation);

// Get inventory by cylinder type
router.get(
  "/cylinder-type/:cylinderTypeId",
  InventoryController.getByCylinderType
);

// ============================================
// INVENTORY MANAGEMENT ROUTES
// ============================================

// Set opening stock (first time setup)
router.post(
  "/opening-stock",
  validate(openingStockSchema),
  InventoryController.setOpeningStock
);

// Create inventory adjustment
router.post(
  "/adjustment",
  validate(inventoryAdjustmentSchema),
  InventoryController.createAdjustment
);

// Get adjustment history
router.get("/adjustments", InventoryController.getAdjustments);

export default router;
