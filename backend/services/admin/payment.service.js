import supabase from '../../config/supabase.js';
import { AppError } from '../../middlewares/error.middleware.js';
import { getPaginationMeta, getPaginationOffset } from '../../utils/pagination.util.js';

export class PaymentService {
  /**
   * Get all payments with filters
   */
  static async getAllPayments(filters) {
    const { page = 1, limit = 20, status, payment_method, search } = filters;
    const offset = getPaginationOffset(page, limit);

    let query = supabase
      .from('payments')
      .select('*', { count: 'exact' });

    if (status) query = query.eq('status', status);
    if (payment_method) query = query.eq('payment_method', payment_method);
    if (search) {
      query = query.or(`payment_id.ilike.%${search}%,transaction_id.ilike.%${search}%`);
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    const { data: payments, error, count } = await query;

    if (error) throw new AppError(error.message, 500);

    return {
      payments: payments || [],
      meta: getPaginationMeta(count || 0, page, limit)
    };
  }

  /**
   * Get payment by ID
   */
  static async getPaymentById(id) {
    const { data: payment, error } = await supabase
      .from('payments')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !payment) {
      throw new AppError('Payment not found', 404);
    }

    return payment;
  }

  /**
   * Get payment statistics
   */
  static async getPaymentStats() {
    const { data: payments, error } = await supabase
      .from('payments')
      .select('status, amount, payment_method, payment_gateway');

    if (error) throw new AppError(error.message, 500);

    const stats = {
      total: payments.length,
      completed: payments.filter(p => p.status === 'completed').length,
      pending: payments.filter(p => p.status === 'pending').length,
      failed: payments.filter(p => p.status === 'failed').length,
      totalAmount: payments
        .filter(p => p.status === 'completed')
        .reduce((sum, p) => sum + Number(p.amount || 0), 0),

      // Payment method breakdown
      paymentMethods: {
        credit_card: payments.filter(p => p.payment_method === 'credit_card').length,
        debit_card: payments.filter(p => p.payment_method === 'debit_card').length,
        upi: payments.filter(p => p.payment_method === 'upi').length,
        net_banking: payments.filter(p => p.payment_method === 'net_banking').length,
        wallet: payments.filter(p => p.payment_method === 'wallet').length,
      },

      // Payment gateway breakdown
      paymentGateways: {
        razorpay: payments.filter(p => p.payment_gateway === 'razorpay').length,
        stripe: payments.filter(p => p.payment_gateway === 'stripe').length,
        paypal: payments.filter(p => p.payment_gateway === 'paypal').length,
      }
    };

    return stats;
  }

  /**
   * Update payment status
   */
  static async updatePaymentStatus(paymentId, status, notes = null) {
    const validStatuses = ['pending', 'processing', 'completed', 'failed', 'refunded'];

    if (!validStatuses.includes(status)) {
      throw new AppError('Invalid payment status', 400);
    }

    const updateData = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'completed') {
      updateData.payment_date = new Date().toISOString();
    }

    const { data: payment, error } = await supabase
      .from('payments')
      .update(updateData)
      .eq('id', paymentId)
      .select()
      .single();

    if (error) throw new AppError(error.message, 500);

    return payment;
  }
}
