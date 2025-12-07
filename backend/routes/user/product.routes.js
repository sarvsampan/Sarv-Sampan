import express from 'express';
import { UserProductController } from '../../controllers/user/product.controller.js';

const router = express.Router();

// Public product routes
router.get('/', UserProductController.getProducts);
router.get('/featured', UserProductController.getFeaturedProducts);
router.get('/new-arrivals', UserProductController.getNewArrivals);
router.get('/:slug', UserProductController.getProductBySlug);

export default router;
