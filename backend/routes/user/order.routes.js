import express from 'express';
import { UserOrderController } from '../../controllers/user/order.controller.js';
import { authenticateUser, optionalAuthenticateUser } from '../../middlewares/userAuth.middleware.js';

const router = express.Router();

// Create order (can be used by both authenticated and guest users)
router.post('/', optionalAuthenticateUser, UserOrderController.createOrder);

// Get user's orders (protected)
router.get('/', authenticateUser, UserOrderController.getUserOrders);

// Get order by order number (for tracking)
router.get('/by-number/:orderNumber', UserOrderController.getOrderByNumber);

// Cancel order
router.patch('/:orderNumber/cancel', optionalAuthenticateUser, UserOrderController.cancelOrder);

// Get order by ID
router.get('/:id', optionalAuthenticateUser, UserOrderController.getOrderById);

export default router;
