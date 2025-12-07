import { success } from '../../utils/response.js';
import supabase from '../../config/supabase.js';

export class UserReplacementController {
  /**
   * POST /api/user/replacements
   * Create a new replacement request
   */
  static async createReplacementRequest(req, res, next) {
    try {
      const { order_id, order_number, reason, images } = req.body;
      const user_id = req.user?.id;

      if (!user_id) {
        return res.status(401).json({
          success: false,
          message: 'Please login to create a replacement request'
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
        .select('id, user_id, status')
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
          message: 'Replacement can only be requested for delivered orders'
        });
      }

      // Check if replacement request already exists
      const { data: existingReplacement } = await supabase
        .from('replacement_requests')
        .select('id')
        .eq('order_id', order_id)
        .eq('user_id', user_id)
        .single();

      if (existingReplacement) {
        return res.status(400).json({
          success: false,
          message: 'Replacement request already exists for this order'
        });
      }

      // Create replacement request
      const { data: replacementRequest, error: createError } = await supabase
        .from('replacement_requests')
        .insert({
          order_id,
          order_number,
          user_id,
          reason: reason.trim(),
          status: 'pending',
          images: images && images.length > 0 ? images : null
        })
        .select()
        .single();

      if (createError) throw createError;

      res.status(201).json(success(
        replacementRequest,
        'Replacement request submitted successfully'
      ));
    } catch (err) {
      console.error('❌ Create replacement request error:', err);
      next(err);
    }
  }

  /**
   * GET /api/user/replacements
   * Get user's replacement requests
   */
  static async getMyReplacementRequests(req, res, next) {
    try {
      const user_id = req.user?.id;

      if (!user_id) {
        return res.status(401).json({
          success: false,
          message: 'Please login to view replacement requests'
        });
      }

      const { data: replacementRequests, error } = await supabase
        .from('replacement_requests')
        .select(`
          *,
          order:orders!replacement_requests_order_id_fkey (
            order_number,
            total_amount,
            created_at
          )
        `)
        .eq('user_id', user_id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      res.status(200).json(success(
        replacementRequests || [],
        'Replacement requests retrieved successfully'
      ));
    } catch (err) {
      console.error('❌ Get replacement requests error:', err);
      next(err);
    }
  }

  /**
   * GET /api/user/replacements/:id
   * Get replacement request by ID
   */
  static async getReplacementRequestById(req, res, next) {
    try {
      const { id } = req.params;
      const user_id = req.user?.id;

      if (!user_id) {
        return res.status(401).json({
          success: false,
          message: 'Please login to view replacement request'
        });
      }

      const { data: replacementRequest, error } = await supabase
        .from('replacement_requests')
        .select(`
          *,
          order:orders!replacement_requests_order_id_fkey (
            order_number,
            total_amount,
            created_at,
            status
          )
        `)
        .eq('id', id)
        .eq('user_id', user_id)
        .single();

      if (error || !replacementRequest) {
        return res.status(404).json({
          success: false,
          message: 'Replacement request not found'
        });
      }

      res.status(200).json(success(
        replacementRequest,
        'Replacement request retrieved successfully'
      ));
    } catch (err) {
      console.error('❌ Get replacement request error:', err);
      next(err);
    }
  }

  /**
   * DELETE /api/user/replacements/:id
   * Delete replacement request (only if pending)
   */
  static async deleteReplacementRequest(req, res, next) {
    try {
      const { id } = req.params;
      const user_id = req.user?.id;

      if (!user_id) {
        return res.status(401).json({
          success: false,
          message: 'Please login to delete replacement request'
        });
      }

      // Get the replacement request
      const { data: replacementRequest, error: fetchError } = await supabase
        .from('replacement_requests')
        .select('*')
        .eq('id', id)
        .eq('user_id', user_id)
        .single();

      if (fetchError || !replacementRequest) {
        return res.status(404).json({
          success: false,
          message: 'Replacement request not found'
        });
      }

      // Only allow deletion if status is pending
      if (replacementRequest.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Only pending replacement requests can be cancelled'
        });
      }

      // Delete the request
      const { error: deleteError } = await supabase
        .from('replacement_requests')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      res.status(200).json(success(
        null,
        'Replacement request cancelled successfully'
      ));
    } catch (err) {
      console.error('❌ Delete replacement request error:', err);
      next(err);
    }
  }
}
