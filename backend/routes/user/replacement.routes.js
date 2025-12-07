import express from 'express';
import { UserReplacementController } from '../../controllers/user/replacement.controller.js';
import { authenticateUser } from '../../middlewares/userAuth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateUser);

// Create replacement request
router.post('/', UserReplacementController.createReplacementRequest);

// Get user's replacement requests
router.get('/', UserReplacementController.getMyReplacementRequests);

// Get replacement request by ID
router.get('/:id', UserReplacementController.getReplacementRequestById);

// Delete replacement request
router.delete('/:id', UserReplacementController.deleteReplacementRequest);

export default router;
