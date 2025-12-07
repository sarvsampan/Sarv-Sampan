import express from 'express';
import { CartController } from '../../controllers/user/cart.controller.js';
import { optionalAuth } from '../../middlewares/auth.middleware.js';

const router = express.Router();

// Apply optional auth - allows both authenticated and guest users
router.use(optionalAuth);

// Get cart
router.get('/', CartController.getCart);

// Add item to cart
router.post('/', CartController.addToCart);

// Update cart item quantity
router.put('/:id', CartController.updateQuantity);

// Remove item from cart
router.delete('/:id', CartController.removeFromCart);

// Clear entire cart
router.delete('/', CartController.clearCart);

// Merge guest cart to user cart (on login)
router.post('/merge', CartController.mergeCart);

export default router;
