import express from 'express';
import { UserPaymentController } from '../../controllers/user/payment.controller.js';
import { optionalAuthenticateUser } from '../../middlewares/userAuth.middleware.js';

const router = express.Router();

// Create Razorpay order for payment
router.post('/create-order', optionalAuthenticateUser, UserPaymentController.createPaymentOrder);

// Verify payment after successful transaction
router.post('/verify', optionalAuthenticateUser, UserPaymentController.verifyPayment);

// Handle Razorpay webhooks
router.post('/webhook', UserPaymentController.handleWebhook);

// Initiate refund
router.post('/refund', optionalAuthenticateUser, UserPaymentController.initiateRefund);

export default router;
