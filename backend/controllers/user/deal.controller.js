import { DealService } from '../../services/user/deal.service.js';
import { success } from '../../utils/response.js';

export class UserDealController {
  /**
   * GET /api/user/deals
   * Get all active deals with product count
   */
  static async getActiveDeals(req, res, next) {
    try {
      const deals = await DealService.getAllDealsWithCount();
      res.status(200).json(success(deals, 'Deals retrieved successfully'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/user/deals/featured
   * Get featured deals (for homepage)
   */
  static async getFeaturedDeals(req, res, next) {
    try {
      const deals = await DealService.getActiveDeals();
      // Return only first 3 deals for homepage
      const featuredDeals = deals.slice(0, 3);
      res.status(200).json(success(featuredDeals, 'Featured deals retrieved successfully'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/user/deals/:id
   * Get deal by ID with all products
   */
  static async getDealById(req, res, next) {
    try {
      const { id } = req.params;
      const deal = await DealService.getDealById(id);
      res.status(200).json(success(deal, 'Deal retrieved successfully'));
    } catch (err) {
      next(err);
    }
  }
}
