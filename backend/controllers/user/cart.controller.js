import { CartService } from '../../services/user/cart.service.js';
import { asyncHandler } from '../../middlewares/async.middleware.js';

export class CartController {
  /**
   * Get user cart
   * GET /api/user/cart
   */
  static getCart = asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    const sessionId = req.headers['x-session-id'] || req.cookies?.sessionId;

    const cart = await CartService.getCart(userId, sessionId);

    res.json({
      success: true,
      data: cart
    });
  });

  /**
   * Add item to cart
   * POST /api/user/cart
   */
  static addToCart = asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    const sessionId = req.headers['x-session-id'] || req.cookies?.sessionId;
    const { product_id, quantity } = req.body;

    const cartItem = await CartService.addToCart(
      userId,
      sessionId,
      product_id,
      quantity || 1
    );

    res.status(201).json({
      success: true,
      message: 'Item added to cart',
      data: cartItem
    });
  });

  /**
   * Update cart item quantity
   * PUT /api/user/cart/:id
   */
  static updateQuantity = asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    const sessionId = req.headers['x-session-id'] || req.cookies?.sessionId;
    const { id } = req.params;
    const { quantity } = req.body;

    const cartItem = await CartService.updateQuantity(
      id,
      userId,
      sessionId,
      quantity
    );

    res.json({
      success: true,
      message: 'Cart item updated',
      data: cartItem
    });
  });

  /**
   * Remove item from cart
   * DELETE /api/user/cart/:id
   */
  static removeFromCart = asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    const sessionId = req.headers['x-session-id'] || req.cookies?.sessionId;
    const { id } = req.params;

    await CartService.removeFromCart(id, userId, sessionId);

    res.json({
      success: true,
      message: 'Item removed from cart'
    });
  });

  /**
   * Clear entire cart
   * DELETE /api/user/cart
   */
  static clearCart = asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    const sessionId = req.headers['x-session-id'] || req.cookies?.sessionId;

    await CartService.clearCart(userId, sessionId);

    res.json({
      success: true,
      message: 'Cart cleared'
    });
  });

  /**
   * Merge guest cart to user cart (called on login)
   * POST /api/user/cart/merge
   */
  static mergeCart = asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    const { session_id } = req.body;

    await CartService.mergeCart(userId, session_id);

    res.json({
      success: true,
      message: 'Cart merged successfully'
    });
  });
}
