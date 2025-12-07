import express from 'express';
import { DashboardController } from '../../controllers/admin/dashboard.controller.js';

const router = express.Router();

router.get('/stats', DashboardController.getStats);
router.get('/recent-orders', DashboardController.getRecentOrders);
router.get('/top-products', DashboardController.getTopProducts);
router.get('/sales-chart', DashboardController.getSalesChart);

export default router;
