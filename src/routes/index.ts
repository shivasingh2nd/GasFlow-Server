import { Router } from "express";

import authRoutes from "./auth.routes";
import distributorRoutes from "./distributor.routes";

const router = Router();

// Mount auth routes
router.use("/auth", authRoutes);
router.use("/distributors", distributorRoutes);

// Future routes will be added here
// router.use('/orders', orderRoutes);
// router.use('/inventory', inventoryRoutes);
// router.use('/sales', salesRoutes);
// router.use('/payments', paymentRoutes);
// router.use('/staff', staffRoutes);
// router.use('/customers', customerRoutes);
// router.use('/reports', reportRoutes);

export default router;
