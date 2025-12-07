import { PaymentService } from '../../services/admin/payment.service.js';
import { success, error } from '../../utils/response.js';

export class PaymentController {
  /**
   * GET /api/admin/payments
   * Get all payments
   */
  static async getAllPayments(req, res, next) {
    try {
      const filters = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        status: req.query.status,
        payment_method: req.query.payment_method,
        search: req.query.search
      };

      const result = await PaymentService.getAllPayments(filters);

      res.status(200).json(success(result, 'Payments fetched successfully'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/admin/payments/:id
   * Get payment by ID
   */
  static async getPaymentById(req, res, next) {
    try {
      const { id } = req.params;
      const payment = await PaymentService.getPaymentById(id);

      res.status(200).json(success(payment, 'Payment fetched successfully'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/admin/payments/stats
   * Get payment statistics
   */
  static async getPaymentStats(req, res, next) {
    try {
      const stats = await PaymentService.getPaymentStats();

      res.status(200).json(success(stats, 'Payment statistics fetched successfully'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/admin/payments/:id/status
   * Update payment status
   */
  static async updatePaymentStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;

      if (!status) {
        return res.status(400).json(error('Status is required', 400));
      }

      const payment = await PaymentService.updatePaymentStatus(id, status, notes);

      res.status(200).json(success(payment, 'Payment status updated successfully'));
    } catch (err) {
      next(err);
    }
  }
}
