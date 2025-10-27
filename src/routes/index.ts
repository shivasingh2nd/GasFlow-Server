import { Router } from "express";
import authRoutes from "./auth.routes";
import distributorRoutes from "./distributor.routes";
import staffRoutes from "./staff.routes";
import orderRoutes from "./order.routes";
import paymentRoutes from "./payment.routes";
import inventoryRoutes from "./inventory.routes";
import salesRoutes from "./sales.routes";
import customerRoutes from "./customer.routes";
import reportRoutes from "./report.routes";

const router = Router();

// Mount routes
router.use("/auth", authRoutes);
router.use("/distributors", distributorRoutes);
router.use("/staff", staffRoutes);
router.use("/orders", orderRoutes);
router.use("/payments", paymentRoutes);
router.use("/inventory", inventoryRoutes);
router.use("/sales", salesRoutes);
router.use("/customers", customerRoutes);
router.use("/reports", reportRoutes);

// Future routes

export default router;
