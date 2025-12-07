import express from 'express';
import { WishlistController } from '../../controllers/user/wishlist.controller.js';
import { optionalAuth } from '../../middlewares/auth.middleware.js';

const router = express.Router();

// Apply optional auth - wishlist requires authentication
router.use(optionalAuth);

// Get wishlist
router.get('/', WishlistController.getWishlist);

// Add item to wishlist
router.post('/', WishlistController.addToWishlist);

// Check if product is in wishlist
router.get('/check/:productId', WishlistController.checkWishlist);

// Remove item from wishlist
router.delete('/:id', WishlistController.removeFromWishlist);

// Clear entire wishlist
router.delete('/', WishlistController.clearWishlist);

// Move item to cart
router.post('/:id/move-to-cart', WishlistController.moveToCart);

export default router;
