import supabase from '../../config/supabase.js';
import { AppError } from '../../middlewares/error.middleware.js';
import { getPaginationMeta, getPaginationOffset } from '../../utils/pagination.util.js';

export class ReturnService {
  /**
   * Get all return requests with filters
   */
  static async getAllReturns(filters) {
    const { page = 1, limit = 20, status, search } = filters;
    const offset = getPaginationOffset(page, limit);

    let query = supabase
      .from('returns')
      .select('*', { count: 'exact' });

    if (status) query = query.eq('status', status);
    if (search) query = query.ilike('return_number', `%${search}%`);

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    const { data: returns, error, count } = await query;

    if (error) throw new AppError(error.message, 500);

    return {
      returns: returns || [],
      meta: getPaginationMeta(count || 0, page, limit)
    };
  }

  /**
   * Get return by ID with full details
   */
  static async getReturnById(id) {
    const { data: returnReq, error } = await supabase
      .from('returns')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !returnReq) {
      throw new AppError('Return not found', 404);
    }

    return returnReq;
  }

  /**
   * Update return status
   */
  static async updateReturnStatus(returnId, status, adminId, adminNotes = null) {
    const validStatuses = ['pending', 'approved', 'rejected', 'refunded'];

    if (!validStatuses.includes(status)) {
      throw new AppError('Invalid return status', 400);
    }

    const updateData = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status !== 'pending') {
      updateData.approved_by = adminId;
      updateData.processed_at = new Date().toISOString();
    }

    if (adminNotes) {
      updateData.admin_notes = adminNotes;
    }

    const { data: returnReq, error } = await supabase
      .from('returns')
      .update(updateData)
      .eq('id', returnId)
      .select()
      .single();

    if (error) throw new AppError(error.message, 500);

    return returnReq;
  }

  /**
   * Create return request
   */
  static async createReturn(returnData) {
    const {
      order_id,
      user_id,
      reason,
      description,
      refund_amount,
      refund_method = 'original_payment'
    } = returnData;

    const return_number = `RET-${Math.floor(100000 + Math.random() * 900000)}`;

    const { data: returnReq, error } = await supabase
      .from('returns')
      .insert({
        return_number,
        order_id,
        user_id,
        reason,
        description,
        status: 'pending',
        refund_amount,
        refund_method,
      })
      .select()
      .single();

    if (error) throw new AppError(error.message, 500);

    return returnReq;
  }

  /**
   * Get return statistics
   */
  static async getReturnStats() {
    const { data: returns, error } = await supabase
      .from('returns')
      .select('status, refund_amount');

    if (error) throw new AppError(error.message, 500);

    const stats = {
      total: returns.length,
      pending: returns.filter(r => r.status === 'pending').length,
      approved: returns.filter(r => r.status === 'approved').length,
      rejected: returns.filter(r => r.status === 'rejected').length,
      refunded: returns.filter(r => r.status === 'refunded').length,
      totalRefundAmount: returns
        .filter(r => r.status === 'refunded')
        .reduce((sum, r) => sum + Number(r.refund_amount || 0), 0)
    };

    return stats;
  }
}
