import { CustomerService } from '../../services/admin/customer.service.js';
import { success, error } from '../../utils/response.js';
import { buildPaginatedResponse } from '../../utils/pagination.util.js';

export class CustomerController {
  /**
   * GET /api/admin/customers
   * Get all customers
   */
  static async getAllCustomers(req, res, next) {
    try {
      const { page, limit, search, status } = req.query;

      const result = await CustomerService.getAllCustomers({
        page,
        limit,
        search,
        status
      });

      res.status(200).json(buildPaginatedResponse(result.customers, result.meta));
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/admin/customers/:id
   * Get customer details
   */
  static async getCustomerById(req, res, next) {
    try {
      const { id } = req.params;
      const customer = await CustomerService.getCustomerById(id);

      res.status(200).json(success(customer, 'Customer retrieved'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/admin/customers/:id/status
   * Update customer status
   */
  static async updateCustomerStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json(error('Status is required', 400));
      }

      const customer = await CustomerService.updateCustomerStatus(id, status);

      res.status(200).json(success(customer, 'Customer status updated'));
    } catch (err) {
      next(err);
    }
  }
}
