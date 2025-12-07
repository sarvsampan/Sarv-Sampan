import express from 'express';
import { ReturnController } from '../../controllers/admin/return.controller.js';

const router = express.Router();

// Get return stats
router.get('/stats', ReturnController.getReturnStats);

// Get all returns
router.get('/', ReturnController.getAllReturns);

// Get return by ID
router.get('/:id', ReturnController.getReturnById);

// Create return request
router.post('/', ReturnController.createReturn);

// Update return status
router.put('/:id/status', ReturnController.updateReturnStatus);

export default router;
