import supabase from '../../config/supabase.js';
import { success } from '../../utils/response.js';

export class UserCategoryController {
  /**
   * GET /api/user/categories
   * Get all active categories (public endpoint)
   */
  static async getActiveCategories(req, res, next) {
    try {
      const { data: categories, error } = await supabase
        .from('categories')
        .select('id, name, slug, description, image_url, display_order')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;

      res.status(200).json(success(categories || [], 'Categories retrieved successfully'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/user/categories/:slug
   * Get category by slug (public endpoint)
   */
  static async getCategoryBySlug(req, res, next) {
    try {
      const { slug } = req.params;

      const { data: category, error } = await supabase
        .from('categories')
        .select('id, name, slug, description, image_url, meta_title, meta_description')
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

      if (error || !category) {
        return res.status(404).json({ success: false, message: 'Category not found' });
      }

      res.status(200).json(success(category, 'Category retrieved successfully'));
    } catch (err) {
      next(err);
    }
  }
}
