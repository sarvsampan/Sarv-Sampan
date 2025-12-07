import express from 'express';
import { OrderController } from '../../controllers/admin/order.controller.js';

const router = express.Router();

// Get order stats (must be before /:id route)
router.get('/stats', OrderController.getOrderStats);

// CRUD routes
router.get('/', OrderController.getAllOrders);
router.get('/:id', OrderController.getOrderById);

// Order management
router.put('/:id/status', OrderController.updateOrderStatus);
router.put('/:id/tracking', OrderController.updateTrackingNumber);
router.post('/:id/notes', OrderController.addOrderNotes);

export default router;
