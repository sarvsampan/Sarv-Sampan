import express from 'express';
import authRoutes from './auth.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import categoryRoutes from './category.routes.js';
import productRoutes from './product.routes.js';
import orderRoutes from './order.routes.js';
import customerRoutes from './customer.routes.js';
import returnRoutes from './return.routes.js';
import replacementRoutes from './replacement.routes.js';
import paymentRoutes from './payment.routes.js';
import couponRoutes from './coupon.routes.js';
import dealRoutes from './deal.routes.js';
import { authenticate, adminOnly } from '../../middlewares/index.js';

const router = express.Router();

// Auth routes (public + protected)
router.use('/auth', authRoutes);

// Protected admin routes
router.use(authenticate);
router.use(adminOnly);

router.use('/dashboard', dashboardRoutes);
router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/orders', orderRoutes);
router.use('/customers', customerRoutes);
router.use('/returns', returnRoutes);
router.use('/replacements', replacementRoutes);
router.use('/payments', paymentRoutes);
router.use('/coupons', couponRoutes);
router.use('/deals', dealRoutes);

export default router;
