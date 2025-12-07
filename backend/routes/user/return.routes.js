import express from 'express';
import { UserReturnController } from '../../controllers/user/return.controller.js';
import { authenticateUser } from '../../middlewares/userAuth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateUser);

// Create return request
router.post('/', UserReturnController.createReturnRequest);

// Get user's return requests
router.get('/', UserReturnController.getMyReturnRequests);

// Get return request by ID
router.get('/:id', UserReturnController.getReturnRequestById);

// Delete return request
router.delete('/:id', UserReturnController.deleteReturnRequest);

export default router;
