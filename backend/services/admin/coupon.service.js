import supabase from '../../config/supabase.js';
import { AppError } from '../../middlewares/error.middleware.js';
import { getPaginationMeta, getPaginationOffset } from '../../utils/pagination.util.js';

export class CouponService {
  /**
   * Get all coupons with filters
   */
  static async getAllCoupons(filters) {
    const { page = 1, limit = 20, search, is_active } = filters;
    const offset = getPaginationOffset(page, limit);

    let query = supabase
      .from('coupons')
      .select('*', { count: 'exact' });

    // Active filter
    if (is_active !== undefined) {
      query = query.eq('is_active', is_active);
    }

    // Search filter
    if (search) {
      query = query.or(`code.ilike.%${search}%,description.ilike.%${search}%`);
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    const { data: coupons, error, count } = await query;

    if (error) throw new AppError(error.message, 500);

    return {
      coupons: coupons || [],
      meta: getPaginationMeta(count || 0, page, limit)
    };
  }

  /**
   * Get coupon by ID
   */
  static async getCouponById(id) {
    const { data: coupon, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !coupon) {
      throw new AppError('Coupon not found', 404);
    }

    return coupon;
  }

  /**
   * Create new coupon
   */
  static async createCoupon(couponData, adminId) {
    const {
      code,
      description,
      discount_type,
      discount_value,
      min_purchase_amount,
      max_discount_amount,
      usage_limit,
      valid_from,
      valid_until,
      is_active
    } = couponData;

    // Check if code already exists
    const { data: existing } = await supabase
      .from('coupons')
      .select('id')
      .eq('code', code.toUpperCase())
      .single();

    if (existing) {
      throw new AppError('Coupon code already exists', 400);
    }

    const { data: coupon, error } = await supabase
      .from('coupons')
      .insert({
        code: code.toUpperCase(),
        description,
        discount_type,
        discount_value: discount_value === '' ? null : discount_value,
        min_purchase_amount: min_purchase_amount === '' ? null : min_purchase_amount,
        max_discount_amount: max_discount_amount === '' ? null : max_discount_amount,
        usage_limit: usage_limit === '' ? null : usage_limit,
        valid_from: valid_from ? new Date(valid_from).toISOString() : new Date().toISOString(),
        valid_until: valid_until ? new Date(valid_until).toISOString() : null,
        is_active: is_active !== undefined ? is_active : true,
        created_by: adminId,
      })
      .select()
      .single();

    if (error) throw new AppError(error.message, 500);

    return coupon;
  }

  /**
   * Update coupon
   */
  static async updateCoupon(id, couponData) {
    const {
      code,
      description,
      discount_type,
      discount_value,
      min_purchase_amount,
      max_discount_amount,
      usage_limit,
      valid_from,
      valid_until,
      is_active
    } = couponData;

    // If updating code, check if it already exists
    if (code) {
      const { data: existing } = await supabase
        .from('coupons')
        .select('id')
        .eq('code', code.toUpperCase())
        .neq('id', id)
        .single();

      if (existing) {
        throw new AppError('Coupon code already exists', 400);
      }
    }

    const updateData = {
      updated_at: new Date().toISOString(),
    };

    if (code) updateData.code = code.toUpperCase();
    if (description !== undefined) updateData.description = description;
    if (discount_type) updateData.discount_type = discount_type;
    if (discount_value !== undefined) updateData.discount_value = discount_value === '' ? null : discount_value;
    if (min_purchase_amount !== undefined) updateData.min_purchase_amount = min_purchase_amount === '' ? null : min_purchase_amount;
    if (max_discount_amount !== undefined) updateData.max_discount_amount = max_discount_amount === '' ? null : max_discount_amount;
    if (usage_limit !== undefined) updateData.usage_limit = usage_limit === '' ? null : usage_limit;
    if (valid_from) updateData.valid_from = new Date(valid_from).toISOString();
    if (valid_until !== undefined) updateData.valid_until = valid_until ? new Date(valid_until).toISOString() : null;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data: coupon, error } = await supabase
      .from('coupons')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new AppError(error.message, 500);

    return coupon;
  }

  /**
   * Delete coupon
   */
  static async deleteCoupon(id) {
    const { error } = await supabase
      .from('coupons')
      .delete()
      .eq('id', id);

    if (error) throw new AppError(error.message, 500);

    return true;
  }

  /**
   * Toggle coupon status
   */
  static async toggleCouponStatus(id) {
    const { data: coupon, error: fetchError } = await supabase
      .from('coupons')
      .select('is_active')
      .eq('id', id)
      .single();

    if (fetchError || !coupon) {
      throw new AppError('Coupon not found', 404);
    }

    const { data: updated, error } = await supabase
      .from('coupons')
      .update({
        is_active: !coupon.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new AppError(error.message, 500);

    return updated;
  }

  /**
   * Validate and apply coupon
   */
  static async validateCoupon(code, userId, orderAmount) {
    const { data: coupon, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code.toUpperCase())
      .single();

    if (error || !coupon) {
      throw new AppError('Invalid coupon code', 400);
    }

    // Check if active
    if (!coupon.is_active) {
      throw new AppError('This coupon is not active', 400);
    }

    // Check validity dates
    const now = new Date();
    if (coupon.valid_from && new Date(coupon.valid_from) > now) {
      throw new AppError('This coupon is not yet valid', 400);
    }
    if (coupon.valid_until && new Date(coupon.valid_until) < now) {
      throw new AppError('This coupon has expired', 400);
    }

    // Check usage limit
    if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
      throw new AppError('This coupon has reached its usage limit', 400);
    }

    // Check minimum purchase amount
    const minOrderValue = Number(coupon.min_purchase_amount);
    if (coupon.min_purchase_amount && orderAmount < minOrderValue) {
      throw new AppError(`Minimum purchase amount is ₹${minOrderValue}`, 400);
    }

    // Calculate discount
    let discountAmount = 0;
    const discountValue = Number(coupon.discount_value);
    if (coupon.discount_type === 'percentage') {
      discountAmount = (orderAmount * discountValue) / 100;
      if (coupon.max_discount_amount) {
        const maxDiscount = Number(coupon.max_discount_amount);
        if (discountAmount > maxDiscount) {
          discountAmount = maxDiscount;
        }
      }
    } else {
      discountAmount = discountValue;
    }

    return {
      coupon_id: coupon.id,
      code: coupon.code,
      discount_amount: discountAmount,
      final_amount: orderAmount - discountAmount
    };
  }

  /**
   * Get coupon statistics
   */
  static async getCouponStats() {
    const { data: coupons, error } = await supabase
      .from('coupons')
      .select('is_active, used_count, usage_limit');

    if (error) throw new AppError(error.message, 500);

    const stats = {
      total: coupons.length,
      active: coupons.filter(c => c.is_active).length,
      inactive: coupons.filter(c => !c.is_active).length,
      totalUsage: coupons.reduce((sum, c) => sum + (c.used_count || 0), 0)
    };

    return stats;
  }
}
