import express from 'express';
import { UserDealController } from '../../controllers/user/deal.controller.js';

const router = express.Router();

// Get featured deals (for homepage)
router.get('/featured', UserDealController.getFeaturedDeals);

// Get all active deals
router.get('/', UserDealController.getActiveDeals);

// Get deal by ID
router.get('/:id', UserDealController.getDealById);

export default router;
