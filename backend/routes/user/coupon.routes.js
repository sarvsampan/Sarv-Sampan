import express from 'express';
import { UserCouponController } from '../../controllers/user/coupon.controller.js';

const router = express.Router();

// Validate coupon
router.post('/validate', UserCouponController.validateCoupon);

// Get active coupons
router.get('/active', UserCouponController.getActiveCoupons);

export default router;
