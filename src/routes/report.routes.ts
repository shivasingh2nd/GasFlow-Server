import { Router } from "express";
import { ReportController } from "../controllers/report.controller";
import { authenticate, isUser } from "../middleware/auth.middleware";

const router = Router();

// All routes require authentication and user role
router.use(authenticate);
router.use(isUser);

// ============================================
// DASHBOARD
// ============================================

// Get dashboard statistics
router.get("/dashboard", ReportController.getDashboard);

// ============================================
// FINANCIAL REPORTS
// ============================================

// Get profit/loss report (?startDate=2025-01-01&endDate=2025-12-31)
router.get("/financial/profit-loss", ReportController.getProfitLoss);

// Get revenue analysis (?startDate=2025-01-01&endDate=2025-12-31
// Get revenue analysis (?startDate=2025-01-01&endDate=2025-12-31)
router.get("/financial/revenue", ReportController.getRevenueAnalysis);

// ============================================
// SALES REPORTS
// ============================================

// Get sales overview (?startDate=2025-01-01&endDate=2025-12-31)
router.get("/sales/overview", ReportController.getSalesOverview);

// Get sales trends (?period=monthly&startDate=2025-01-01&endDate=2025-12-31)
router.get("/sales/trends", ReportController.getSalesTrends);

// ============================================
// INVENTORY REPORTS
// ============================================

// Get inventory movement (?startDate=2025-01-01&endDate=2025-12-31)
router.get("/inventory/movement", ReportController.getInventoryMovement);

// ============================================
// ANALYTICS
// ============================================

// Get monthly comparison (?year=2025)
router.get("/analytics/monthly", ReportController.getMonthlyComparison);

export default router;
