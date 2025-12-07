import { CouponService } from '../../services/admin/coupon.service.js';
import { success, error } from '../../utils/response.js';

export class CouponController {
  static async getAllCoupons(req, res, next) {
    try {
      const filters = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        search: req.query.search,
        is_active: req.query.is_active
      };

      const result = await CouponService.getAllCoupons(filters);
      res.status(200).json(success(result, 'Coupons fetched successfully'));
    } catch (err) {
      next(err);
    }
  }

  static async getCouponById(req, res, next) {
    try {
      const { id } = req.params;
      const coupon = await CouponService.getCouponById(id);
      res.status(200).json(success(coupon, 'Coupon fetched successfully'));
    } catch (err) {
      next(err);
    }
  }

  static async createCoupon(req, res, next) {
    try {
      const adminId = req.adminId;
      const coupon = await CouponService.createCoupon(req.body, adminId);
      res.status(201).json(success(coupon, 'Coupon created successfully'));
    } catch (err) {
      next(err);
    }
  }

  static async updateCoupon(req, res, next) {
    try {
      const { id } = req.params;
      const coupon = await CouponService.updateCoupon(id, req.body);
      res.status(200).json(success(coupon, 'Coupon updated successfully'));
    } catch (err) {
      next(err);
    }
  }

  static async deleteCoupon(req, res, next) {
    try {
      const { id } = req.params;
      await CouponService.deleteCoupon(id);
      res.status(200).json(success(null, 'Coupon deleted successfully'));
    } catch (err) {
      next(err);
    }
  }

  static async toggleCouponStatus(req, res, next) {
    try {
      const { id } = req.params;
      const coupon = await CouponService.toggleCouponStatus(id);
      res.status(200).json(success(coupon, 'Coupon status updated successfully'));
    } catch (err) {
      next(err);
    }
  }

  static async validateCoupon(req, res, next) {
    try {
      const { code, order_amount } = req.body;
      const userId = req.adminId; // or req.userId for customer

      if (!code || !order_amount) {
        return res.status(400).json(error('Code and order amount are required', 400));
      }

      const result = await CouponService.validateCoupon(code, userId, order_amount);
      res.status(200).json(success(result, 'Coupon validated successfully'));
    } catch (err) {
      next(err);
    }
  }

  static async getCouponStats(req, res, next) {
    try {
      const stats = await CouponService.getCouponStats();
      res.status(200).json(success(stats, 'Coupon statistics fetched successfully'));
    } catch (err) {
      next(err);
    }
  }
}
