import { CategoryService } from '../../services/admin/category.service.js';
import { success, error } from '../../utils/response.js';
import { buildPaginatedResponse } from '../../utils/pagination.util.js';
import { uploadToSupabase, generateFileName, deleteFromSupabase } from '../../utils/upload.util.js';

export class CategoryController {
  /**
   * GET /api/admin/categories
   * Get all categories
   */
  static async getAllCategories(req, res, next) {
    try {
      const { page, limit, search, status } = req.query;

      const result = await CategoryService.getAllCategories({
        page,
        limit,
        search,
        status
      });

      res.status(200).json(buildPaginatedResponse(result.categories, result.meta));
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/admin/categories/:id
   * Get category by ID
   */
  static async getCategoryById(req, res, next) {
    try {
      const { id } = req.params;
      const category = await CategoryService.getCategoryById(id);

      res.status(200).json(success(category, 'Category retrieved'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/admin/categories
   * Create new category
   */
  static async createCategory(req, res, next) {
    try {
      const { name, description, parent_id, image_url, display_order, meta_title, meta_description } = req.body;

      if (!name) {
        return res.status(400).json(error('Category name is required', 400));
      }

      const category = await CategoryService.createCategory({
        name,
        description,
        parent_id,
        image_url,
        display_order,
        meta_title,
        meta_description
      });

      res.status(201).json(success(category, 'Category created successfully'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/admin/categories/:id
   * Update category
   */
  static async updateCategory(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const category = await CategoryService.updateCategory(id, updateData);

      res.status(200).json(success(category, 'Category updated successfully'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/admin/categories/:id
   * Delete category
   */
  static async deleteCategory(req, res, next) {
    try {
      const { id } = req.params;
      await CategoryService.deleteCategory(id);

      res.status(200).json(success(null, 'Category deleted successfully'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/admin/categories/:id/status
   * Toggle category status
   */
  static async toggleStatus(req, res, next) {
    try {
      const { id } = req.params;
      const category = await CategoryService.toggleStatus(id);

      res.status(200).json(success(category, 'Category status updated'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/admin/categories/:id/image
   * Upload category image
   */
  static async uploadImage(req, res, next) {
    try {
      const { id } = req.params;

      if (!req.file) {
        return res.status(400).json(error('No image file provided', 400));
      }

      // Generate unique filename
      const fileName = `categories/${generateFileName(req.file.originalname)}`;

      // Upload to Supabase
      const imageUrl = await uploadToSupabase(req.file.buffer, fileName, 'product-images');

      // Update category with image URL
      const category = await CategoryService.updateCategory(id, { image_url: imageUrl });

      res.status(200).json(success(category, 'Image uploaded successfully'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/admin/categories/:id/image
   * Delete category image
   */
  static async deleteImage(req, res, next) {
    try {
      const { id } = req.params;

      // Get category to get image URL
      const category = await CategoryService.getCategoryById(id);

      if (category.image_url) {
        // Extract file path from URL
        const urlParts = category.image_url.split('/');
        const fileName = urlParts.slice(-2).join('/'); // Get 'categories/filename.jpg'

        // Delete from Supabase
        await deleteFromSupabase(fileName, 'product-images');
      }

      // Update category to remove image URL
      const updatedCategory = await CategoryService.updateCategory(id, { image_url: null });

      res.status(200).json(success(updatedCategory, 'Image deleted successfully'));
    } catch (err) {
      next(err);
    }
  }
}
