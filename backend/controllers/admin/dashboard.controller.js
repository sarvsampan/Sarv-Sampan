import { DashboardService } from '../../services/admin/dashboard.service.js';
import { success } from '../../utils/response.js';

export class DashboardController {
  /**
   * GET /api/admin/dashboard/stats
   * Get dashboard statistics
   */
  static async getStats(req, res, next) {
    try {
      const stats = await DashboardService.getStats();
      res.status(200).json(success(stats, 'Dashboard stats retrieved'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/admin/dashboard/recent-orders
   * Get recent orders
   */
  static async getRecentOrders(req, res, next) {
    try {
      const { limit = 10 } = req.query;
      const orders = await DashboardService.getRecentOrders(Number(limit));
      res.status(200).json(success(orders, 'Recent orders retrieved'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/admin/dashboard/top-products
   * Get top selling products
   */
  static async getTopProducts(req, res, next) {
    try {
      const { limit = 10 } = req.query;
      const products = await DashboardService.getTopProducts(Number(limit));
      res.status(200).json(success(products, 'Top products retrieved'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/admin/dashboard/sales-chart
   * Get sales chart data
   */
  static async getSalesChart(req, res, next) {
    try {
      const chartData = await DashboardService.getSalesChart();
      res.status(200).json(success(chartData, 'Sales chart data retrieved'));
    } catch (err) {
      next(err);
    }
  }
}
