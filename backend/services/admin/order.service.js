import supabase from '../../config/supabase.js';
import { AppError } from '../../middlewares/error.middleware.js';
import { getPaginationMeta, getPaginationOffset } from '../../utils/pagination.util.js';

export class OrderService {
  /**
   * Get all orders with filters
   */
  static async getAllOrders(filters) {
    const { page = 1, limit = 20, status, payment_status, search, startDate, endDate } = filters;
    const offset = getPaginationOffset(page, limit);

    let query = supabase
      .from('orders')
      .select(`
        *,
        order_items (*)
      `, { count: 'exact' });

    // Status filter
    if (status) {
      query = query.eq('status', status);
    }

    // Payment status filter
    if (payment_status) {
      query = query.eq('payment_status', payment_status);
    }

    // Search filter (order number, customer email)
    if (search) {
      query = query.or(`order_number.ilike.%${search}%,customer_email.ilike.%${search}%`);
    }

    // Date range filter
    if (startDate) {
      query = query.gte('created_at', new Date(startDate).toISOString());
    }
    if (endDate) {
      query = query.lte('created_at', new Date(endDate).toISOString());
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    const { data: orders, error, count } = await query;

    if (error) throw new AppError(error.message, 500);

    return {
      orders: orders || [],
      meta: getPaginationMeta(count || 0, page, limit)
    };
  }

  /**
   * Get order by ID with full details
   */
  static async getOrderById(id) {
    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (*)
      `)
      .eq('id', id)
      .single();

    if (error || !order) {
      throw new AppError('Order not found', 404);
    }

    return order;
  }

  /**
   * Update order status
   */
  static async updateOrderStatus(orderId, status, adminId, comment = null) {
    // Valid status values
    const validStatuses = [
      'pending',
      'confirmed',
      'processing',
      'packed',
      'shipped',
      'out_for_delivery',
      'delivered',
      'cancelled',
      'refunded'
    ];

    if (!validStatuses.includes(status)) {
      throw new AppError('Invalid order status', 400);
    }

    // Build update object
    const updateData = {
      status,
      updated_at: new Date().toISOString(),
    };

    // Set timestamps for specific statuses
    if (status === 'shipped') {
      updateData.shipped_at = new Date().toISOString();

      // Auto-generate tracking number if not already exists
      const { data: currentOrder } = await supabase
        .from('orders')
        .select('tracking_number')
        .eq('id', orderId)
        .single();

      if (!currentOrder?.tracking_number) {
        updateData.tracking_number = `TRK-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      }
    } else if (status === 'delivered') {
      updateData.delivered_at = new Date().toISOString();
    } else if (status === 'cancelled') {
      updateData.cancelled_at = new Date().toISOString();
    }

    const { data: order, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw new AppError(error.message, 500);

    // Add to order status history using raw SQL
    try {
      const { error: historyError } = await supabase.rpc('exec_sql', {
        sql: `INSERT INTO order_status_history (order_id, status, comment, created_by, notify_customer, created_at)
              VALUES (${orderId}, '${status}', ${comment ? `'${comment.replace(/'/g, "''")}'` : 'NULL'}, ${adminId}, true, NOW())`
      });

      if (historyError) {
        console.log('Status history not available:', historyError.message);
      }
    } catch (error) {
      console.log('Status history table not available');
    }

    return order;
  }

  /**
   * Update tracking number
   */
  static async updateTrackingNumber(orderId, trackingNumber, shippingMethod = null) {
    const updateData = {
      tracking_number: trackingNumber,
      updated_at: new Date().toISOString(),
    };

    if (shippingMethod) {
      updateData.shipping_method = shippingMethod;
    }

    const { data: order, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw new AppError(error.message, 500);

    return order;
  }

  /**
   * Add order notes
   */
  static async addOrderNotes(orderId, notes, adminId) {
    const { data: order, error } = await supabase
      .from('orders')
      .update({
        admin_notes: notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw new AppError(error.message, 500);

    // Try to add to history
    try {
      const { error: historyError } = await supabase.rpc('exec_sql', {
        sql: `INSERT INTO order_status_history (order_id, status, comment, created_by, notify_customer, created_at)
              VALUES (${orderId}, '${order.status}', 'Admin note: ${notes.replace(/'/g, "''")}', ${adminId}, false, NOW())`
      });

      if (historyError) {
        console.log('Status history not available:', historyError.message);
      }
    } catch (error) {
      console.log('Status history table not available');
    }

    return order;
  }

  /**
   * Get order statistics
   */
  static async getOrderStats() {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('status');

    if (error) throw new AppError(error.message, 500);

    const stats = {};
    orders.forEach(order => {
      stats[order.status] = (stats[order.status] || 0) + 1;
    });

    return stats;
  }
}
