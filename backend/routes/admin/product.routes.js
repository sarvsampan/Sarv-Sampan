import express from 'express';
import { ProductController } from '../../controllers/admin/product.controller.js';
import { uploadMultiple } from '../../middlewares/index.js';

const router = express.Router();

// Get low stock products (must be before /:id route)
router.get('/low-stock', ProductController.getLowStockProducts);

// CRUD routes
router.get('/', ProductController.getAllProducts);
router.get('/:id', ProductController.getProductById);
router.post('/', ProductController.createProduct);
router.put('/:id', ProductController.updateProduct);
router.delete('/:id', ProductController.deleteProduct);

// Status toggle
router.patch('/:id/status', ProductController.toggleStatus);

// Image management
router.post('/:id/images', uploadMultiple, ProductController.uploadImages);
router.delete('/:id/images/:imageId', ProductController.deleteImage);

export default router;
