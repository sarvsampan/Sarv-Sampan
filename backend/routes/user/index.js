import express from 'express';
import authRoutes from './auth.routes.js';
import categoryRoutes from './category.routes.js';
import productRoutes from './product.routes.js';
import dealRoutes from './deal.routes.js';
import orderRoutes from './order.routes.js';
import couponRoutes from './coupon.routes.js';

const router = express.Router();

// Public routes
router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/deals', dealRoutes);
router.use('/orders', orderRoutes);
router.use('/coupons', couponRoutes);

export default router;
