import supabase from '../../config/supabase.js';
import { AppError } from '../../middlewares/error.middleware.js';

export class WishlistService {
  /**
   * Get user wishlist items
   */
  static async getWishlist(userId) {
    if (!userId) {
      throw new AppError('User must be logged in to access wishlist', 401);
    }

    const { data, error } = await supabase
      .from('wishlist_items')
      .select(`
        id,
        created_at,
        products:product_id (
          id,
          name,
          slug,
          regular_price,
          sale_price,
          stock_quantity,
          product_images (image_url, is_primary)
        )
      `)
      .eq('user_id', userId);

    if (error) throw new AppError(error.message, 500);

    // Format wishlist items
    const items = (data || []).map(item => ({
      id: item.id,
      product: item.products,
      created_at: item.created_at
    }));

    return { items, count: items.length };
  }

  /**
   * Add item to wishlist
   */
  static async addToWishlist(userId, productId) {
    if (!userId) {
      throw new AppError('User must be logged in to add to wishlist', 401);
    }

    // Check if product exists
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id')
      .eq('id', productId)
      .single();

    if (productError || !product) {
      throw new AppError('Product not found', 404);
    }

    // Check if item already exists in wishlist
    const { data: existing } = await supabase
      .from('wishlist_items')
      .select('id')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .single();

    if (existing) {
      throw new AppError('Product already in wishlist', 400);
    }

    // Insert new item
    const { data, error } = await supabase
      .from('wishlist_items')
      .insert({
        user_id: userId,
        product_id: productId
      })
      .select()
      .single();

    if (error) throw new AppError(error.message, 500);
    return data;
  }

  /**
   * Remove item from wishlist
   */
  static async removeFromWishlist(wishlistItemId, userId) {
    if (!userId) {
      throw new AppError('User must be logged in', 401);
    }

    const { error } = await supabase
      .from('wishlist_items')
      .delete()
      .eq('id', wishlistItemId)
      .eq('user_id', userId);

    if (error) throw new AppError(error.message, 500);
    return true;
  }

  /**
   * Clear wishlist
   */
  static async clearWishlist(userId) {
    if (!userId) {
      throw new AppError('User must be logged in', 401);
    }

    const { error } = await supabase
      .from('wishlist_items')
      .delete()
      .eq('user_id', userId);

    if (error) throw new AppError(error.message, 500);
    return true;
  }

  /**
   * Check if product is in wishlist
   */
  static async isInWishlist(userId, productId) {
    if (!userId) return false;

    const { data } = await supabase
      .from('wishlist_items')
      .select('id')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .single();

    return !!data;
  }

  /**
   * Move item from wishlist to cart
   */
  static async moveToCart(wishlistItemId, userId) {
    if (!userId) {
      throw new AppError('User must be logged in', 401);
    }

    // Get wishlist item
    const { data: wishlistItem, error: fetchError } = await supabase
      .from('wishlist_items')
      .select('product_id')
      .eq('id', wishlistItemId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !wishlistItem) {
      throw new AppError('Wishlist item not found', 404);
    }

    // Remove from wishlist
    await this.removeFromWishlist(wishlistItemId, userId);

    // Return product_id so controller can add to cart
    return wishlistItem.product_id;
  }
}
