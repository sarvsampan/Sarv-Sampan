import { WishlistService } from '../../services/user/wishlist.service.js';
import { CartService } from '../../services/user/cart.service.js';
import { asyncHandler } from '../../middlewares/async.middleware.js';

export class WishlistController {
  /**
   * Get user wishlist
   * GET /api/user/wishlist
   */
  static getWishlist = asyncHandler(async (req, res) => {
    const userId = req.user?.id;

    const wishlist = await WishlistService.getWishlist(userId);

    res.json({
      success: true,
      data: wishlist
    });
  });

  /**
   * Add item to wishlist
   * POST /api/user/wishlist
   */
  static addToWishlist = asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    const { product_id } = req.body;

    const wishlistItem = await WishlistService.addToWishlist(userId, product_id);

    res.status(201).json({
      success: true,
      message: 'Item added to wishlist',
      data: wishlistItem
    });
  });

  /**
   * Remove item from wishlist
   * DELETE /api/user/wishlist/:id
   */
  static removeFromWishlist = asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    const { id } = req.params;

    await WishlistService.removeFromWishlist(id, userId);

    res.json({
      success: true,
      message: 'Item removed from wishlist'
    });
  });

  /**
   * Clear entire wishlist
   * DELETE /api/user/wishlist
   */
  static clearWishlist = asyncHandler(async (req, res) => {
    const userId = req.user?.id;

    await WishlistService.clearWishlist(userId);

    res.json({
      success: true,
      message: 'Wishlist cleared'
    });
  });

  /**
   * Check if product is in wishlist
   * GET /api/user/wishlist/check/:productId
   */
  static checkWishlist = asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    const { productId } = req.params;

    const isInWishlist = await WishlistService.isInWishlist(userId, productId);

    res.json({
      success: true,
      data: { isInWishlist }
    });
  });

  /**
   * Move item from wishlist to cart
   * POST /api/user/wishlist/:id/move-to-cart
   */
  static moveToCart = asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    const sessionId = req.headers['x-session-id'] || req.cookies?.sessionId;
    const { id } = req.params;

    // Get product_id from wishlist and remove from wishlist
    const productId = await WishlistService.moveToCart(id, userId);

    // Add to cart
    await CartService.addToCart(userId, sessionId, productId, 1);

    res.json({
      success: true,
      message: 'Item moved to cart'
    });
  });
}
