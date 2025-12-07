import { OrderService } from '../../services/admin/order.service.js';
import { success, error } from '../../utils/response.js';
import { buildPaginatedResponse } from '../../utils/pagination.util.js';

export class OrderController {
  /**
   * GET /api/admin/orders
   * Get all orders
   */
  static async getAllOrders(req, res, next) {
    try {
      const { page, limit, status, payment_status, search, startDate, endDate } = req.query;

      const result = await OrderService.getAllOrders({
        page,
        limit,
        status,
        payment_status,
        search,
        startDate,
        endDate
      });

      res.status(200).json(buildPaginatedResponse(result.orders, result.meta));
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/admin/orders/stats
   * Get order statistics
   */
  static async getOrderStats(req, res, next) {
    try {
      const stats = await OrderService.getOrderStats();
      res.status(200).json(success(stats, 'Order stats retrieved'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/admin/orders/:id
   * Get order by ID
   */
  static async getOrderById(req, res, next) {
    try {
      const { id } = req.params;
      const order = await OrderService.getOrderById(id);

      res.status(200).json(success(order, 'Order retrieved'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/admin/orders/:id/status
   * Update order status
   */
  static async updateOrderStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status, comment } = req.body;
      const adminId = req.adminId;

      if (!status) {
        return res.status(400).json(error('Status is required', 400));
      }

      const order = await OrderService.updateOrderStatus(id, status, adminId, comment);

      res.status(200).json(success(order, 'Order status updated'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/admin/orders/:id/tracking
   * Update tracking number
   */
  static async updateTrackingNumber(req, res, next) {
    try {
      const { id } = req.params;
      const { tracking_number, shipping_method } = req.body;

      if (!tracking_number) {
        return res.status(400).json(error('Tracking number is required', 400));
      }

      const order = await OrderService.updateTrackingNumber(id, tracking_number, shipping_method);

      res.status(200).json(success(order, 'Tracking number updated'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/admin/orders/:id/notes
   * Add order notes
   */
  static async addOrderNotes(req, res, next) {
    try {
      const { id } = req.params;
      const { notes } = req.body;
      const adminId = req.adminId;

      if (!notes) {
        return res.status(400).json(error('Notes are required', 400));
      }

      const order = await OrderService.addOrderNotes(id, notes, adminId);

      res.status(200).json(success(order, 'Order notes added'));
    } catch (err) {
      next(err);
    }
  }
}
