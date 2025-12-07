import express from 'express';
import { CategoryController } from '../../controllers/admin/category.controller.js';
import { uploadSingle } from '../../middlewares/index.js';

const router = express.Router();

router.get('/', CategoryController.getAllCategories);
router.get('/:id', CategoryController.getCategoryById);
router.post('/', CategoryController.createCategory);
router.put('/:id', CategoryController.updateCategory);
router.delete('/:id', CategoryController.deleteCategory);
router.patch('/:id/status', CategoryController.toggleStatus);

// Image upload
router.post('/:id/image', uploadSingle, CategoryController.uploadImage);
router.delete('/:id/image', CategoryController.deleteImage);

export default router;
