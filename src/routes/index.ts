import { Router } from "express";

import authRoutes from "./auth.routes";
import distributorRoutes from "./distributor.routes";
import staffRoutes from "./staff.routes";
import orderRoutes from "./order.routes";

const router = Router();

// Mount auth routes
router.use("/auth", authRoutes);
router.use("/distributors", distributorRoutes);
router.use("/staff", staffRoutes);
router.use("/orders", orderRoutes);

// Future routes will be added here
// router.use('/inventory', inventoryRoutes);
// router.use('/sales', salesRoutes);
// router.use('/payments', paymentRoutes);
// router.use('/customers', customerRoutes);
// router.use('/reports', reportRoutes);

export default router;
