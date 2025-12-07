import express from 'express';
import { CouponController } from '../../controllers/admin/coupon.controller.js';

const router = express.Router();

// Get coupon stats (must be before /:id route)
router.get('/stats', CouponController.getCouponStats);

// Validate coupon
router.post('/validate', CouponController.validateCoupon);

// Get all coupons with filters
router.get('/', CouponController.getAllCoupons);

// Get coupon by ID
router.get('/:id', CouponController.getCouponById);

// Create coupon
router.post('/', CouponController.createCoupon);

// Update coupon
router.put('/:id', CouponController.updateCoupon);

// Delete coupon
router.delete('/:id', CouponController.deleteCoupon);

// Toggle coupon status
router.patch('/:id/status', CouponController.toggleCouponStatus);

export default router;
