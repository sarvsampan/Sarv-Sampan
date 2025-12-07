import { ReturnService } from '../../services/admin/return.service.js';
import { success, error } from '../../utils/response.js';

export class ReturnController {
  /**
   * GET /api/admin/returns
   * Get all return requests
   */
  static async getAllReturns(req, res, next) {
    try {
      const filters = {
        page: req.query.page,
        limit: req.query.limit,
        status: req.query.status,
        search: req.query.search
      };

      const result = await ReturnService.getAllReturns(filters);
      res.status(200).json(success(result, 'Returns retrieved successfully'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/admin/returns/:id
   * Get return by ID
   */
  static async getReturnById(req, res, next) {
    try {
      const { id } = req.params;
      const returnReq = await ReturnService.getReturnById(id);
      res.status(200).json(success(returnReq, 'Return retrieved successfully'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/admin/returns/:id/status
   * Update return status
   */
  static async updateReturnStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status, admin_notes } = req.body;
      const adminId = req.adminId;

      if (!status) {
        return res.status(400).json(error('Status is required', 400));
      }

      const returnReq = await ReturnService.updateReturnStatus(
        id,
        status,
        adminId,
        admin_notes
      );

      res.status(200).json(success(returnReq, 'Return status updated successfully'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/admin/returns
   * Create return request
   */
  static async createReturn(req, res, next) {
    try {
      const returnData = req.body;
      const returnReq = await ReturnService.createReturn(returnData);
      res.status(201).json(success(returnReq, 'Return request created successfully'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/admin/returns/stats
   * Get return statistics
   */
  static async getReturnStats(req, res, next) {
    try {
      const stats = await ReturnService.getReturnStats();
      res.status(200).json(success(stats, 'Return stats retrieved successfully'));
    } catch (err) {
      next(err);
    }
  }
}
