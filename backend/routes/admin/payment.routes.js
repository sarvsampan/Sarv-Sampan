import express from 'express';
import { PaymentController } from '../../controllers/admin/payment.controller.js';

const router = express.Router();

// Get payment stats (must be before /:id route)
router.get('/stats', PaymentController.getPaymentStats);

// Get all payments with filters
router.get('/', PaymentController.getAllPayments);

// Get payment by ID
router.get('/:id', PaymentController.getPaymentById);

// Update payment status
router.put('/:id/status', PaymentController.updatePaymentStatus);

export default router;
