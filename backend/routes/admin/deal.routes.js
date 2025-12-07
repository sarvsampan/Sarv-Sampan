import express from 'express';
import { AdminDealController } from '../../controllers/admin/deal.controller.js';
import { uploadSingle } from '../../middlewares/upload.middleware.js';

const router = express.Router();

// Get all deals
router.get('/', AdminDealController.getAllDeals);

// Get deal by ID
router.get('/:id', AdminDealController.getDealById);

// Create new deal
router.post('/', AdminDealController.createDeal);

// Update deal
router.put('/:id', AdminDealController.updateDeal);

// Delete deal
router.delete('/:id', AdminDealController.deleteDeal);

// Toggle deal status
router.patch('/:id/toggle-status', AdminDealController.toggleDealStatus);

// Assign products to deal
router.post('/:id/products', AdminDealController.assignProducts);

// Remove products from deal
router.delete('/:id/products', AdminDealController.removeProducts);

// Upload deal banner image
router.post('/:id/image', uploadSingle, AdminDealController.uploadImage);

export default router;
