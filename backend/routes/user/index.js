import express from 'express';
import authRoutes from './auth.routes.js';
import categoryRoutes from './category.routes.js';
import productRoutes from './product.routes.js';
import dealRoutes from './deal.routes.js';
import orderRoutes from './order.routes.js';
import couponRoutes from './coupon.routes.js';
import cartRoutes from './cart.routes.js';
import wishlistRoutes from './wishlist.routes.js';
import reviewRoutes from './review.routes.js';
import returnRoutes from './return.routes.js';
import replacementRoutes from './replacement.routes.js';

const router = express.Router();

// Public routes
router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/deals', dealRoutes);
router.use('/orders', orderRoutes);
router.use('/coupons', couponRoutes);
router.use('/cart', cartRoutes);
router.use('/wishlist', wishlistRoutes);
router.use('/reviews', reviewRoutes);
router.use('/returns', returnRoutes);
router.use('/replacements', replacementRoutes);

export default router;
