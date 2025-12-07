import supabase from '../../config/supabase.js';
import { AppError } from '../../middlewares/error.middleware.js';

export class CartService {
  /**
   * Get user cart items
   */
  static async getCart(userId, sessionId) {
    let query = supabase
      .from('cart_items')
      .select(`
        id,
        quantity,
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
      `);

    if (userId) {
      query = query.eq('user_id', userId);
    } else if (sessionId) {
      query = query.eq('session_id', sessionId);
    } else {
      return { items: [], total: 0 };
    }

    const { data, error } = await query;

    if (error) throw new AppError(error.message, 500);

    // Format cart items
    const items = (data || []).map(item => ({
      id: item.id,
      product: item.products,
      quantity: item.quantity,
      created_at: item.created_at
    }));

    // Calculate total
    const total = items.reduce((sum, item) => {
      const price = item.product.sale_price || item.product.regular_price;
      return sum + (price * item.quantity);
    }, 0);

    return { items, total, count: items.length };
  }

  /**
   * Add item to cart
   */
  static async addToCart(userId, sessionId, productId, quantity = 1) {
    // Check if product exists and has stock
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, stock_quantity')
      .eq('id', productId)
      .single();

    if (productError || !product) {
      throw new AppError('Product not found', 404);
    }

    if (product.stock_quantity < quantity) {
      throw new AppError('Insufficient stock', 400);
    }

    // Check if item already exists in cart
    let query = supabase
      .from('cart_items')
      .select('id, quantity')
      .eq('product_id', productId);

    if (userId) {
      query = query.eq('user_id', userId);
    } else if (sessionId) {
      query = query.eq('session_id', sessionId);
    } else {
      throw new AppError('User ID or Session ID required', 400);
    }

    const { data: existing } = await query.single();

    if (existing) {
      // Update quantity
      const newQuantity = existing.quantity + quantity;

      if (product.stock_quantity < newQuantity) {
        throw new AppError('Insufficient stock', 400);
      }

      const { data, error } = await supabase
        .from('cart_items')
        .update({
          quantity: newQuantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw new AppError(error.message, 500);
      return data;
    } else {
      // Insert new item
      const cartData = {
        product_id: productId,
        quantity,
        user_id: userId || null,
        session_id: sessionId || null
      };

      const { data, error } = await supabase
        .from('cart_items')
        .insert(cartData)
        .select()
        .single();

      if (error) throw new AppError(error.message, 500);
      return data;
    }
  }

  /**
   * Update cart item quantity
   */
  static async updateQuantity(cartItemId, userId, sessionId, quantity) {
    if (quantity < 1) {
      throw new AppError('Quantity must be at least 1', 400);
    }

    // Get cart item with product info
    let query = supabase
      .from('cart_items')
      .select('id, product_id, products:product_id(stock_quantity)')
      .eq('id', cartItemId);

    if (userId) {
      query = query.eq('user_id', userId);
    } else if (sessionId) {
      query = query.eq('session_id', sessionId);
    }

    const { data: cartItem, error: fetchError } = await query.single();

    if (fetchError || !cartItem) {
      throw new AppError('Cart item not found', 404);
    }

    // Check stock
    if (cartItem.products.stock_quantity < quantity) {
      throw new AppError('Insufficient stock', 400);
    }

    // Update quantity
    const { data, error } = await supabase
      .from('cart_items')
      .update({
        quantity,
        updated_at: new Date().toISOString()
      })
      .eq('id', cartItemId)
      .select()
      .single();

    if (error) throw new AppError(error.message, 500);
    return data;
  }

  /**
   * Remove item from cart
   */
  static async removeFromCart(cartItemId, userId, sessionId) {
    let query = supabase
      .from('cart_items')
      .delete()
      .eq('id', cartItemId);

    if (userId) {
      query = query.eq('user_id', userId);
    } else if (sessionId) {
      query = query.eq('session_id', sessionId);
    }

    const { error } = await query;

    if (error) throw new AppError(error.message, 500);
    return true;
  }

  /**
   * Clear cart
   */
  static async clearCart(userId, sessionId) {
    let query = supabase.from('cart_items').delete();

    if (userId) {
      query = query.eq('user_id', userId);
    } else if (sessionId) {
      query = query.eq('session_id', sessionId);
    }

    const { error } = await query;

    if (error) throw new AppError(error.message, 500);
    return true;
  }

  /**
   * Merge guest cart to user cart (on login)
   */
  static async mergeCart(userId, sessionId) {
    if (!userId || !sessionId) return;

    // Get guest cart items
    const { data: guestItems } = await supabase
      .from('cart_items')
      .select('product_id, quantity')
      .eq('session_id', sessionId);

    if (!guestItems || guestItems.length === 0) return;

    // For each guest item, add to user cart
    for (const item of guestItems) {
      await this.addToCart(userId, null, item.product_id, item.quantity);
    }

    // Delete guest cart items
    await supabase
      .from('cart_items')
      .delete()
      .eq('session_id', sessionId);

    return true;
  }
}
