import { success } from '../../utils/response.js';
import supabase from '../../config/supabase.js';

export class UserOrderController {
  /**
   * POST /api/user/orders
   * Create a new order
   */
  static async createOrder(req, res, next) {
    try {
      console.log('=== CREATE ORDER REQUEST ===');

      const {
        items,
        shipping_address,
        billing_address,
        payment_method,
        subtotal,
        shipping_cost,
        tax_amount,
        discount_amount,
        total_amount,
        coupon_code,
        notes
      } = req.body;

      // Validation
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Order must contain at least one item'
        });
      }

      if (!shipping_address || !shipping_address.fullName || !shipping_address.address ||
          !shipping_address.city || !shipping_address.state || !shipping_address.pincode ||
          !shipping_address.phone || !shipping_address.email) {
        return res.status(400).json({
          success: false,
          message: 'Please provide complete shipping address'
        });
      }

      if (!payment_method) {
        return res.status(400).json({
          success: false,
          message: 'Please select a payment method'
        });
      }

      const user_id = req.user?.id || null;

      // Create order
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id,
          order_number: orderNumber,
          status: 'pending',
          payment_method,
          payment_status: payment_method === 'cod' ? 'pending' : 'pending',
          customer_email: shipping_address.email,
          customer_phone: shipping_address.phone,
          subtotal: parseFloat(subtotal),
          shipping_amount: parseFloat(shipping_cost || 0),
          tax_amount: parseFloat(tax_amount || 0),
          discount_amount: parseFloat(discount_amount || 0),
          total_amount: parseFloat(total_amount),
          coupon_code: coupon_code || null,
          shipping_address,
          billing_address: billing_address || shipping_address,
          notes: notes || null,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItemsData = items.map(item => ({
        order_id: order.id,
        product_id: item.product_id || item.id,
        product_name: item.name,
        product_slug: item.slug,
        product_image: item.image || item.images?.[0]?.image_url,
        quantity: parseInt(item.quantity),
        price: parseFloat(item.price),
        total: parseFloat(item.price) * parseInt(item.quantity),
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItemsData);

      if (itemsError) throw itemsError;

      // Update product stock
      for (const item of items) {
        const { data: product } = await supabase
          .from('products')
          .select('stock_quantity, manage_stock')
          .eq('id', item.product_id || item.id)
          .single();

        if (product && product.manage_stock) {
          const newStock = Math.max(0, product.stock_quantity - parseInt(item.quantity));
          await supabase
            .from('products')
            .update({
              stock_quantity: newStock,
              stock_status: newStock > 0 ? 'in_stock' : 'out_of_stock',
            })
            .eq('id', item.product_id || item.id);
        }
      }

      console.log('✅ Order created:', order.order_number);

      res.status(201).json(success({
        order_id: order.id,
        order_number: order.order_number,
        total_amount: Number(order.total_amount),
        payment_method: order.payment_method,
        status: order.status
      }, 'Order placed successfully'));

    } catch (err) {
      console.error('❌ Order creation error:', err);
      next(err);
    }
  }

  /**
   * GET /api/user/orders
   * Get user's orders
   */
  static async getUserOrders(req, res, next) {
    try {
      const user_id = req.user?.id;

      if (!user_id) {
        return res.status(401).json({
          success: false,
          message: 'Please login to view your orders'
        });
      }

      const { page = 1, limit = 10, status } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);

      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products:product_id (
              id,
              name,
              slug,
              product_images (image_url, is_primary)
            )
          )
        `)
        .eq('user_id', user_id);

      if (status) {
        query = query.eq('status', status);
      }

      const { data: orders, error } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + parseInt(limit) - 1);

      if (error) throw error;

      res.status(200).json(success(orders || [], 'Orders retrieved successfully'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/user/orders/:orderNumber
   * Get single order
   */
  static async getOrderByNumber(req, res, next) {
    try {
      const { orderNumber } = req.params;
      const user_id = req.user?.id;

      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products:product_id (
              id,
              name,
              slug,
              product_images (image_url, is_primary)
            )
          )
        `)
        .eq('order_number', orderNumber)
        .single();

      if (error || !orders) {
        console.log('❌ Order fetch error:', error);
        console.log('Order data:', orders);
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      if (user_id && orders.user_id !== user_id) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      res.status(200).json(success(orders, 'Order retrieved'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/user/orders/:id
   * Get order by ID
   */
  static async getOrderById(req, res, next) {
    try {
      const { id } = req.params;
      const user_id = req.user?.id;

      const { data: order, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products:product_id (
              id,
              name,
              slug,
              product_images (image_url, is_primary)
            )
          )
        `)
        .eq('id', id)
        .single();

      if (error || !order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      if (user_id && order.user_id !== user_id) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      res.status(200).json(success(order, 'Order retrieved'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/user/orders/:orderNumber/cancel
   * Cancel order
   */
  static async cancelOrder(req, res, next) {
    try {
      const { orderNumber } = req.params;
      const user_id = req.user?.id;

      // Get order with items
      const { data: order, error: fetchError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .eq('order_number', orderNumber)
        .single();

      if (fetchError || !order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      // Authorization
      if (user_id && order.user_id !== user_id) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      // Check status
      if (!['pending', 'confirmed', 'processing'].includes(order.status)) {
        return res.status(400).json({
          success: false,
          message: `Cannot cancel order with status: ${order.status}`
        });
      }

      // Update order
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
        })
        .eq('order_number', orderNumber);

      if (updateError) throw updateError;

      // Restore stock
      for (const item of order.order_items) {
        if (!item.product_id) continue;

        const { data: product } = await supabase
          .from('products')
          .select('stock_quantity, manage_stock')
          .eq('id', item.product_id)
          .single();

        if (product && product.manage_stock) {
          const newStock = product.stock_quantity + item.quantity;
          await supabase
            .from('products')
            .update({
              stock_quantity: newStock,
              stock_status: newStock > 0 ? 'in_stock' : 'out_of_stock',
            })
            .eq('id', item.product_id);
        }
      }

      res.status(200).json(success(null, 'Order cancelled successfully'));
    } catch (err) {
      next(err);
    }
  }
}

export default UserOrderController;
