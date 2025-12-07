import { success } from '../../utils/response.js';
import supabase from '../../config/supabase.js';

export class UserReturnController {
  /**
   * POST /api/user/returns
   * Create a new return request
   */
  static async createReturnRequest(req, res, next) {
    try {
      const { order_id, order_number, reason, images } = req.body;
      const user_id = req.user?.id;

      if (!user_id) {
        return res.status(401).json({
          success: false,
          message: 'Please login to create a return request'
        });
      }

      // Validation
      if (!order_id || !order_number || !reason) {
        return res.status(400).json({
          success: false,
          message: 'Order ID, order number, and reason are required'
        });
      }

      // Verify order belongs to user
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('id, user_id, total_amount, status')
        .eq('id', order_id)
        .eq('order_number', order_number)
        .eq('user_id', user_id)
        .single();

      if (orderError || !order) {
        console.error('❌ Order fetch error:', orderError);
        return res.status(404).json({
          success: false,
          message: 'Order not found or does not belong to you'
        });
      }

      // Check if order is delivered
      if (order.status !== 'delivered') {
        return res.status(400).json({
          success: false,
          message: 'Return can only be requested for delivered orders'
        });
      }

      // Check if return request already exists
      const { data: existingReturn } = await supabase
        .from('return_requests')
        .select('id')
        .eq('order_id', order_id)
        .eq('user_id', user_id)
        .single();

      if (existingReturn) {
        return res.status(400).json({
          success: false,
          message: 'Return request already exists for this order'
        });
      }

      // Create return request
      const { data: returnRequest, error: createError } = await supabase
        .from('return_requests')
        .insert({
          order_id,
          order_number,
          user_id,
          reason: reason.trim(),
          status: 'pending',
          refund_amount: order.total_amount,
          images: images && images.length > 0 ? images : null
        })
        .select()
        .single();

      if (createError) throw createError;

      res.status(201).json(success(
        returnRequest,
        'Return request submitted successfully'
      ));
    } catch (err) {
      console.error('❌ Create return request error:', err);
      next(err);
    }
  }

  /**
   * GET /api/user/returns
   * Get user's return requests
   */
  static async getMyReturnRequests(req, res, next) {
    try {
      const user_id = req.user?.id;

      if (!user_id) {
        return res.status(401).json({
          success: false,
          message: 'Please login to view return requests'
        });
      }

      const { data: returnRequests, error } = await supabase
        .from('return_requests')
        .select(`
          *,
          order:orders!return_requests_order_id_fkey (
            order_number,
            total_amount,
            created_at
          )
        `)
        .eq('user_id', user_id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      res.status(200).json(success(
        returnRequests || [],
        'Return requests retrieved successfully'
      ));
    } catch (err) {
      console.error('❌ Get return requests error:', err);
      next(err);
    }
  }

  /**
   * GET /api/user/returns/:id
   * Get return request by ID
   */
  static async getReturnRequestById(req, res, next) {
    try {
      const { id } = req.params;
      const user_id = req.user?.id;

      if (!user_id) {
        return res.status(401).json({
          success: false,
          message: 'Please login to view return request'
        });
      }

      const { data: returnRequest, error } = await supabase
        .from('return_requests')
        .select(`
          *,
          order:orders!return_requests_order_id_fkey (
            order_number,
            total_amount,
            created_at,
            status
          )
        `)
        .eq('id', id)
        .eq('user_id', user_id)
        .single();

      if (error || !returnRequest) {
        return res.status(404).json({
          success: false,
          message: 'Return request not found'
        });
      }

      res.status(200).json(success(
        returnRequest,
        'Return request retrieved successfully'
      ));
    } catch (err) {
      console.error('❌ Get return request error:', err);
      next(err);
    }
  }

  /**
   * DELETE /api/user/returns/:id
   * Delete return request (only if pending)
   */
  static async deleteReturnRequest(req, res, next) {
    try {
      const { id } = req.params;
      const user_id = req.user?.id;

      if (!user_id) {
        return res.status(401).json({
          success: false,
          message: 'Please login to delete return request'
        });
      }

      // Get the return request
      const { data: returnRequest, error: fetchError } = await supabase
        .from('return_requests')
        .select('*')
        .eq('id', id)
        .eq('user_id', user_id)
        .single();

      if (fetchError || !returnRequest) {
        return res.status(404).json({
          success: false,
          message: 'Return request not found'
        });
      }

      // Only allow deletion if status is pending
      if (returnRequest.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Only pending return requests can be cancelled'
        });
      }

      // Delete the request
      const { error: deleteError } = await supabase
        .from('return_requests')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      res.status(200).json(success(
        null,
        'Return request cancelled successfully'
      ));
    } catch (err) {
      console.error('❌ Delete return request error:', err);
      next(err);
    }
  }
}
