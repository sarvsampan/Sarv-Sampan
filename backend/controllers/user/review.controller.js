import { success } from '../../utils/response.js';
import supabase from '../../config/supabase.js';

export class UserReviewController {
  /**
   * POST /api/user/reviews
   * Create a new review
   */
  static async createReview(req, res, next) {
    try {
      const {
        product_id,
        order_id,
        rating,
        title,
        comment,
        images = []
      } = req.body;

      const user_id = req.user?.id;

      if (!user_id) {
        return res.status(401).json({
          success: false,
          message: 'Please login to write a review'
        });
      }

      // Validation
      if (!product_id || !rating) {
        return res.status(400).json({
          success: false,
          message: 'Product ID and rating are required'
        });
      }

      if (rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: 'Rating must be between 1 and 5'
        });
      }

      // Check if product exists
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('id')
        .eq('id', product_id)
        .single();

      if (productError || !product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      // Check if user has already reviewed this product (for this order)
      let checkQuery = supabase
        .from('review')
        .select('id')
        .eq('product_id', product_id)
        .eq('user_id', user_id);

      if (order_id) {
        checkQuery = checkQuery.eq('order_id', order_id);
      } else {
        checkQuery = checkQuery.is('order_id', null);
      }

      const { data: existingReview } = await checkQuery.single();

      if (existingReview) {
        return res.status(400).json({
          success: false,
          message: 'You have already reviewed this product'
        });
      }

      // Check if it's a verified purchase
      let verified_purchase = false;
      if (order_id) {
        const { data: order } = await supabase
          .from('orders')
          .select('id, user_id')
          .eq('id', order_id)
          .eq('user_id', user_id)
          .single();

        if (order) {
          // Check if this order contains this product
          const { data: orderItem } = await supabase
            .from('order_items')
            .select('id')
            .eq('order_id', order_id)
            .eq('product_id', product_id)
            .single();

          verified_purchase = !!orderItem;
        }
      }

      // Create review
      const { data: review, error: reviewError } = await supabase
        .from('review')
        .insert({
          product_id,
          user_id,
          order_id: order_id || null,
          rating: parseInt(rating),
          title: title || null,
          comment: comment || null,
          verified_purchase
        })
        .select()
        .single();

      if (reviewError) throw reviewError;

      // Add images if provided
      if (images && images.length > 0) {
        const imageData = images.map((imageUrl, index) => ({
          review_id: review.id,
          image_url: imageUrl,
          display_order: index
        }));

        const { error: imagesError } = await supabase
          .from('review_images')
          .insert(imageData);

        if (imagesError) {
          console.error('Error adding review images:', imagesError);
        }
      }

      res.status(201).json(success(review, 'Review submitted successfully'));
    } catch (err) {
      console.error('❌ Create review error:', err);
      next(err);
    }
  }

  /**
   * GET /api/user/reviews/product/:productId
   * Get all reviews for a product
   */
  static async getProductReviews(req, res, next) {
    try {
      const { productId } = req.params;
      const { page = 1, limit = 10, sort = 'recent' } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);

      let query = supabase
        .from('review')
        .select(`
          *,
          user:users!review_user_id_fkey (
            id,
            first_name,
            last_name,
            email
          ),
          review_images (
            id,
            image_url,
            display_order
          )
        `)
        .eq('product_id', productId);

      // Sorting
      switch (sort) {
        case 'recent':
          query = query.order('created_at', { ascending: false });
          break;
        case 'oldest':
          query = query.order('created_at', { ascending: true });
          break;
        case 'highest':
          query = query.order('rating', { ascending: false });
          break;
        case 'lowest':
          query = query.order('rating', { ascending: true });
          break;
        case 'helpful':
          query = query.order('helpful_count', { ascending: false });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }

      const { data: reviews, error } = await query
        .range(offset, offset + parseInt(limit) - 1);

      if (error) throw error;

      // Get total count
      const { count } = await supabase
        .from('review')
        .select('*', { count: 'exact', head: true })
        .eq('product_id', productId);

      res.status(200).json(success({
        reviews: reviews || [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count || 0,
          pages: Math.ceil((count || 0) / parseInt(limit))
        }
      }, 'Reviews retrieved successfully'));
    } catch (err) {
      console.error('❌ Get product reviews error:', err);
      next(err);
    }
  }

  /**
   * GET /api/user/reviews/my-reviews
   * Get current user's reviews
   */
  static async getMyReviews(req, res, next) {
    try {
      const user_id = req.user?.id;

      if (!user_id) {
        return res.status(401).json({
          success: false,
          message: 'Please login to view your reviews'
        });
      }

      const { data: reviews, error } = await supabase
        .from('review')
        .select(`
          *,
          product:products!reviews_product_id_fkey (
            id,
            name,
            slug,
            product_images (image_url, is_primary)
          ),
          review_images (
            id,
            image_url,
            display_order
          )
        `)
        .eq('user_id', user_id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      res.status(200).json(success(reviews || [], 'Your reviews retrieved successfully'));
    } catch (err) {
      console.error('❌ Get my reviews error:', err);
      next(err);
    }
  }

  /**
   * PUT /api/user/reviews/:reviewId
   * Update a review
   */
  static async updateReview(req, res, next) {
    try {
      const { reviewId } = req.params;
      const { rating, title, comment, images } = req.body;
      const user_id = req.user?.id;

      if (!user_id) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      // Check if review exists and belongs to user
      const { data: existingReview, error: checkError } = await supabase
        .from('review')
        .select('*')
        .eq('id', reviewId)
        .eq('user_id', user_id)
        .single();

      if (checkError || !existingReview) {
        return res.status(404).json({
          success: false,
          message: 'Review not found or unauthorized'
        });
      }

      // Update review
      const updateData = {};
      if (rating !== undefined) updateData.rating = parseInt(rating);
      if (title !== undefined) updateData.title = title;
      if (comment !== undefined) updateData.comment = comment;

      const { data: review, error: updateError } = await supabase
        .from('review')
        .update(updateData)
        .eq('id', reviewId)
        .select()
        .single();

      if (updateError) throw updateError;

      // Update images if provided
      if (images !== undefined) {
        // Delete existing images
        await supabase
          .from('review_images')
          .delete()
          .eq('review_id', reviewId);

        // Add new images
        if (images && images.length > 0) {
          const imageData = images.map((imageUrl, index) => ({
            review_id: reviewId,
            image_url: imageUrl,
            display_order: index
          }));

          await supabase
            .from('review_images')
            .insert(imageData);
        }
      }

      res.status(200).json(success(review, 'Review updated successfully'));
    } catch (err) {
      console.error('❌ Update review error:', err);
      next(err);
    }
  }

  /**
   * DELETE /api/user/reviews/:reviewId
   * Delete a review
   */
  static async deleteReview(req, res, next) {
    try {
      const { reviewId } = req.params;
      const user_id = req.user?.id;

      if (!user_id) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      // Check if review exists and belongs to user
      const { data: existingReview, error: checkError } = await supabase
        .from('review')
        .select('*')
        .eq('id', reviewId)
        .eq('user_id', user_id)
        .single();

      if (checkError || !existingReview) {
        return res.status(404).json({
          success: false,
          message: 'Review not found or unauthorized'
        });
      }

      // Delete review (images will be cascaded)
      const { error: deleteError } = await supabase
        .from('review')
        .delete()
        .eq('id', reviewId);

      if (deleteError) throw deleteError;

      res.status(200).json(success(null, 'Review deleted successfully'));
    } catch (err) {
      console.error('❌ Delete review error:', err);
      next(err);
    }
  }

  /**
   * POST /api/user/reviews/:reviewId/helpful
   * Mark a review as helpful
   */
  static async markHelpful(req, res, next) {
    try {
      const { reviewId } = req.params;
      const user_id = req.user?.id;

      if (!user_id) {
        return res.status(401).json({
          success: false,
          message: 'Please login to mark reviews as helpful'
        });
      }

      // Check if already marked as helpful
      const { data: existing } = await supabase
        .from('helpful_reviews')
        .select('id')
        .eq('review_id', reviewId)
        .eq('user_id', user_id)
        .single();

      if (existing) {
        // Unmark as helpful (toggle)
        await supabase
          .from('helpful_reviews')
          .delete()
          .eq('review_id', reviewId)
          .eq('user_id', user_id);

        // Decrement helpful_count
        await supabase.rpc('decrement_helpful_count', { review_id: reviewId });

        return res.status(200).json(success(null, 'Removed helpful mark'));
      }

      // Mark as helpful
      await supabase
        .from('helpful_reviews')
        .insert({ review_id: reviewId, user_id });

      // Increment helpful_count
      await supabase.rpc('increment_helpful_count', { review_id: reviewId });

      res.status(200).json(success(null, 'Marked as helpful'));
    } catch (err) {
      console.error('❌ Mark helpful error:', err);
      next(err);
    }
  }

  /**
   * GET /api/user/reviews/stats/:productId
   * Get review statistics for a product
   */
  static async getReviewStats(req, res, next) {
    try {
      const { productId } = req.params;

      // Get product with review stats
      const { data: product, error } = await supabase
        .from('products')
        .select('average_rating, review_count')
        .eq('id', productId)
        .single();

      if (error) throw error;

      // Get rating distribution
      const { data: distribution } = await supabase
        .from('review')
        .select('rating')
        .eq('product_id', productId);

      const ratingCounts = {
        5: 0,
        4: 0,
        3: 0,
        2: 0,
        1: 0
      };

      distribution?.forEach(review => {
        ratingCounts[review.rating]++;
      });

      res.status(200).json(success({
        average_rating: product.average_rating || 0,
        total_reviews: product.review_count || 0,
        rating_distribution: ratingCounts
      }, 'Review stats retrieved successfully'));
    } catch (err) {
      console.error('❌ Get review stats error:', err);
      next(err);
    }
  }
}

export default UserReviewController;
