import supabase from '../../config/supabase.js';
import { AppError } from '../../middlewares/error.middleware.js';
import { getPaginationMeta, getPaginationOffset } from '../../utils/pagination.util.js';

class ReplacementService {
  /**
   * Get all replacements with filters
   */
  static async getAllReplacements(filters) {
    const { page = 1, limit = 20, status, search } = filters;
    const offset = getPaginationOffset(page, limit);

    let query = supabase
      .from('replacement_requests')
      .select(`
        *,
        order:orders!replacement_requests_order_id_fkey (
          order_number,
          total_amount,
          customer_email
        ),
        user:users!replacement_requests_user_id_fkey (
          id,
          first_name,
          last_name,
          email
        )
      `, { count: 'exact' });

    if (status) query = query.eq('status', status);
    if (search) query = query.ilike('order_number', `%${search}%`);

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    const { data: replacements, error, count } = await query;

    if (error) {
      console.error('❌ Get all replacements error:', error);
      throw new AppError(error.message, 500);
    }

    return {
      replacements: replacements || [],
      meta: getPaginationMeta(count || 0, page, limit)
    };
  }

  static async getReplacementById(id) {
    const { data: replacement, error } = await supabase
      .from('replacement_requests')
      .select(`
        *,
        order:orders!replacement_requests_order_id_fkey (
          order_number,
          total_amount,
          customer_email
        ),
        user:users!replacement_requests_user_id_fkey (
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq('id', id)
      .single();

    if (error || !replacement) {
      throw new AppError('Replacement not found', 404);
    }

    return replacement;
  }

  static async updateReplacementStatus(replacementId, status, adminId, additionalData = {}) {
    const validStatuses = ['pending', 'approved', 'rejected', 'shipped', 'completed'];

    if (!validStatuses.includes(status)) {
      throw new AppError('Invalid replacement status', 400);
    }

    const adminNotes = additionalData.admin_notes || null;
    const trackingNumber = additionalData.tracking_number || null;

    const updateData = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status !== 'pending') {
      updateData.processed_by = adminId;
      updateData.processed_at = new Date().toISOString();
    }

    if (adminNotes) {
      updateData.admin_notes = adminNotes;
    }

    if (trackingNumber) {
      updateData.tracking_number = trackingNumber;
    }

    if (status === 'shipped' && trackingNumber) {
      updateData.shipped_at = new Date().toISOString();
    }

    const { data: replacement, error } = await supabase
      .from('replacement_requests')
      .update(updateData)
      .eq('id', replacementId)
      .select()
      .single();

    if (error) throw new AppError(error.message, 500);

    return replacement;
  }

  static async createReplacement(replacementData) {
    const { order_id, user_id, reason, description, replacement_method, items } = replacementData;

    const replacement_number = `REP-${Date.now()}`;

    const { data: replacement, error } = await supabase
      .from('replacement_requests')
      .insert({
        replacement_number,
        order_id,
        user_id,
        reason,
        description,
        replacement_method,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw new AppError(error.message, 500);

    return replacement;
  }

  static async getReplacementStats() {
    const { data: replacements, error } = await supabase
      .from('replacement_requests')
      .select('status');

    if (error) throw new AppError(error.message, 500);

    const stats = {
      total: replacements.length,
      pending: replacements.filter(r => r.status === 'pending').length,
      approved: replacements.filter(r => r.status === 'approved').length,
      rejected: replacements.filter(r => r.status === 'rejected').length,
      shipped: replacements.filter(r => r.status === 'shipped').length,
      completed: replacements.filter(r => r.status === 'completed').length,
    };

    return stats;
  }
}

export default ReplacementService;
