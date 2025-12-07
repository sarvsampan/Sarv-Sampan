import supabase from '../../config/supabase.js';
import { success } from '../../utils/response.js';

export class UserCouponController {
  /**
   * POST /api/user/coupons/validate
   * Validate a coupon code
   */
  static async validateCoupon(req, res, next) {
    try {
      const { code, cart_total } = req.body;

      if (!code) {
        return res.status(400).json({
          success: false,
          message: 'Coupon code is required'
        });
      }

      if (!cart_total || cart_total <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Cart total is required'
        });
      }

      // Fetch coupon from database
      const { data: coupon, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', code.toUpperCase())
        .eq('is_active', true)
        .single();

      if (error || !coupon) {
        return res.status(404).json({
          success: false,
          message: 'Invalid coupon code'
        });
      }

      // Check if coupon is expired
      const now = new Date();
      const startDate = new Date(coupon.valid_from);
      const endDate = new Date(coupon.valid_until);

      if (now < startDate) {
        return res.status(400).json({
          success: false,
          message: 'This coupon is not yet active'
        });
      }

      if (now > endDate) {
        return res.status(400).json({
          success: false,
          message: 'This coupon has expired'
        });
      }

      // Check usage limit
      if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
        return res.status(400).json({
          success: false,
          message: 'This coupon has reached its usage limit'
        });
      }

      // Check minimum order value
      const minOrderValue = Number(coupon.min_purchase_amount);
      if (coupon.min_purchase_amount && cart_total < minOrderValue) {
        return res.status(400).json({
          success: false,
          message: `Minimum order value of ₹${minOrderValue} required to use this coupon`
        });
      }

      // Check maximum discount
      let discount = 0;
      const discountValue = Number(coupon.discount_value);
      if (coupon.discount_type === 'percentage') {
        discount = (cart_total * discountValue) / 100;
        if (coupon.max_discount_amount) {
          const maxDiscount = Number(coupon.max_discount_amount);
          if (discount > maxDiscount) {
            discount = maxDiscount;
          }
        }
      } else {
        // Fixed amount discount
        discount = discountValue;
      }

      res.status(200).json(success({
        valid: true,
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: discountValue,
        discount_amount: Math.round(discount * 100) / 100,
        description: coupon.description
      }, 'Coupon is valid'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/user/coupons/active
   * Get all active coupons
   */
  static async getActiveCoupons(req, res, next) {
    try {
      const now = new Date().toISOString();

      const { data: coupons, error } = await supabase
        .from('coupons')
        .select('code, description, discount_type, discount_value, min_purchase_amount, max_discount_amount, valid_until')
        .eq('is_active', true)
        .lte('valid_from', now)
        .gte('valid_until', now)
        .order('created_at', { ascending: false });

      if (error) throw error;

      res.status(200).json(success(coupons || [], 'Active coupons retrieved successfully'));
    } catch (err) {
      next(err);
    }
  }
}
