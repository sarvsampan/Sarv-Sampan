import ReplacementService from '../../services/admin/replacement.service.js';
import { success, error } from '../../utils/response.js';

class ReplacementController {
  static async getAllReplacements(req, res, next) {
    try {
      const filters = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        status: req.query.status,
        search: req.query.search
      };

      const result = await ReplacementService.getAllReplacements(filters);

      res.status(200).json(success(result, 'Replacements fetched successfully'));
    } catch (err) {
      next(err);
    }
  }

  static async getReplacementById(req, res, next) {
    try {
      const { id } = req.params;
      const replacement = await ReplacementService.getReplacementById(id);

      res.status(200).json(success(replacement, 'Replacement fetched successfully'));
    } catch (err) {
      next(err);
    }
  }

  static async updateReplacementStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status, admin_notes, tracking_number } = req.body;
      const adminId = req.adminId;

      if (!status) {
        return res.status(400).json(error('Status is required', 400));
      }

      const replacement = await ReplacementService.updateReplacementStatus(
        id,
        status,
        adminId,
        { admin_notes, tracking_number }
      );

      res.status(200).json(success(replacement, 'Replacement status updated successfully'));
    } catch (err) {
      next(err);
    }
  }

  static async createReplacement(req, res, next) {
    try {
      const replacementData = req.body;

      if (!replacementData.order_id || !replacementData.user_id || !replacementData.reason) {
        return res.status(400).json(error('Missing required fields', 400));
      }

      const replacement = await ReplacementService.createReplacement(replacementData);

      res.status(201).json(success(replacement, 'Replacement created successfully'));
    } catch (err) {
      next(err);
    }
  }

  static async getReplacementStats(req, res, next) {
    try {
      const stats = await ReplacementService.getReplacementStats();

      res.status(200).json(success(stats, 'Replacement statistics fetched successfully'));
    } catch (err) {
      next(err);
    }
  }
}

export default ReplacementController;
