import supabase from '../../config/supabase.js';
import { AppError } from '../../middlewares/error.middleware.js';
import { getPaginationMeta, getPaginationOffset } from '../../utils/pagination.util.js';

export class CustomerService {
  /**
   * Get all customers
   */
  static async getAllCustomers(filters) {
    const { page = 1, limit = 20, search, status } = filters;
    const offset = getPaginationOffset(page, limit);

    let query = supabase
      .from('users')
      .select('*', { count: 'exact' });

    // Status filter - disabled: is_active column doesn't exist
    // if (status) {
    //   query = query.eq('is_active', status === 'active');
    // }

    // Search filter
    if (search) {
      query = query.or(`email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`);
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    const { data: customers, error, count } = await query;

    if (error) throw new AppError(error.message, 500);

    // Transform customers - combine first_name and last_name
    const transformedCustomers = (customers || []).map(customer => ({
      ...customer,
      name: `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'N/A',
      status: customer.status || 'active', // Use actual status from database
    }));

    return {
      customers: transformedCustomers,
      meta: getPaginationMeta(count || 0, page, limit)
    };
  }

  /**
   * Get customer details with order history
   */
  static async getCustomerById(id) {
    const { data: customer, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !customer) {
      throw new AppError('Customer not found', 404);
    }

    // Get order history
    const { data: orders } = await supabase
      .from('orders')
      .select('id, order_number, status, payment_status, total_amount, created_at')
      .eq('user_id', id)
      .order('created_at', { ascending: false })
      .limit(10);

    // Calculate total spent
    const { data: paidOrders } = await supabase
      .from('orders')
      .select('total_amount')
      .eq('user_id', id)
      .eq('payment_status', 'paid');

    const totalSpent = (paidOrders || []).reduce((sum, order) => sum + Number(order.total_amount || 0), 0);

    return {
      ...customer,
      name: `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'N/A',
      status: customer.status || 'active', // Use actual status from database
      orders: orders || [],
      totalOrders: orders?.length || 0,
      totalSpent: totalSpent.toFixed(2),
      addresses: [] // Addresses table might not be in schema yet
    };
  }

  /**
   * Update customer status (block/unblock)
   */
  static async updateCustomerStatus(id, status) {
    const validStatuses = ['active', 'blocked', 'deleted'];

    if (!validStatuses.includes(status)) {
      throw new AppError('Invalid status', 400);
    }

    // Update status column in database
    const { data: customer, error } = await supabase
      .from('users')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error || !customer) throw new AppError(error?.message || 'Customer not found', 404);

    return {
      ...customer,
      name: `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'N/A',
    };
  }
}
