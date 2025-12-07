import express from 'express';
import { UserCategoryController } from '../../controllers/user/category.controller.js';

const router = express.Router();

// Public routes - no authentication required
router.get('/', UserCategoryController.getActiveCategories);
router.get('/:slug', UserCategoryController.getCategoryBySlug);

export default router;
