import supabase from '../../config/supabase.js';
import { AppError } from '../../middlewares/error.middleware.js';
import { generateSlug } from '../../utils/slug.util.js';
import { getPaginationMeta, getPaginationOffset } from '../../utils/pagination.util.js';

export class CategoryService {
  /**
   * Get all categories with pagination
   */
  static async getAllCategories(filters) {
    const { page = 1, limit = 20, search, status } = filters;
    const offset = getPaginationOffset(page, limit);

    let query = supabase
      .from('categories')
      .select('*, parent:parent_id(id, name)', { count: 'exact' });

    // Search filter
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    // Status filter
    if (status !== undefined) {
      query = query.eq('is_active', status === 'active');
    }

    query = query
      .order('display_order', { ascending: true })
      .range(offset, offset + parseInt(limit) - 1);

    const { data: categories, error, count } = await query;

    if (error) throw new AppError(error.message, 500);

    // Get product count for each category
    const categoriesWithCount = await Promise.all(
      (categories || []).map(async (cat) => {
        const { count: productCount } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('category_id', cat.id)
          .eq('is_deleted', false);

        return {
          ...cat,
          status: cat.is_active ? 'active' : 'inactive',
          product_count: productCount || 0
        };
      })
    );

    return {
      categories: categoriesWithCount,
      meta: getPaginationMeta(count || 0, page, limit)
    };
  }

  /**
   * Get category by ID
   */
  static async getCategoryById(id) {
    const { data: category, error } = await supabase
      .from('categories')
      .select('*, parent:parent_id(id, name)')
      .eq('id', id)
      .single();

    if (error || !category) {
      throw new AppError('Category not found', 404);
    }

    return {
      ...category,
      status: category.is_active ? 'active' : 'inactive',
    };
  }

  /**
   * Create new category
   */
  static async createCategory(categoryData) {
    const { name, description, parent_id, image_url, display_order, meta_title, meta_description, status } = categoryData;

    // Generate slug from name
    const slug = generateSlug(name);

    // Check if slug already exists
    const { data: existing } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existing) {
      throw new AppError('Category with this name already exists', 400);
    }

    const isActiveValue = status === 'active' ? true : (status === 'inactive' ? false : true);

    const { data: category, error } = await supabase
      .from('categories')
      .insert({
        name,
        slug,
        description,
        parent_id: parent_id || null,
        image_url,
        display_order: display_order || 0,
        meta_title,
        meta_description,
        is_active: isActiveValue,
      })
      .select()
      .single();

    if (error) throw new AppError(error.message, 500);

    return {
      ...category,
      status: category.is_active ? 'active' : 'inactive',
    };
  }

  /**
   * Update category
   */
  static async updateCategory(id, categoryData) {
    const { name, description, parent_id, image_url, display_order, meta_title, meta_description, status } = categoryData;

    // If name is being updated, generate new slug
    let slug;
    if (name) {
      slug = generateSlug(name);

      // Check if new slug already exists (except for current category)
      const { data: existing } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', slug)
        .neq('id', id)
        .single();

      if (existing) {
        throw new AppError('Category with this name already exists', 400);
      }
    }

    // Build update object
    const updateData = {
      updated_at: new Date().toISOString(),
    };

    if (name) {
      updateData.name = name;
      updateData.slug = slug;
    }
    if (description !== undefined) updateData.description = description;
    if (parent_id !== undefined) updateData.parent_id = parent_id || null;
    if (image_url !== undefined) updateData.image_url = image_url;
    if (display_order !== undefined) updateData.display_order = display_order;
    if (meta_title !== undefined) updateData.meta_title = meta_title;
    if (meta_description !== undefined) updateData.meta_description = meta_description;

    // Handle status field separately
    if (status !== undefined) {
      updateData.is_active = status === 'active' ? true : false;
    }

    const { data: category, error } = await supabase
      .from('categories')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new AppError(error.message, 500);

    return {
      ...category,
      status: category.is_active ? 'active' : 'inactive',
    };
  }

  /**
   * Delete category
   */
  static async deleteCategory(id) {
    // Check if category has subcategories
    const { count: subcategoriesCount } = await supabase
      .from('categories')
      .select('id', { count: 'exact', head: true })
      .eq('parent_id', id);

    if (subcategoriesCount > 0) {
      throw new AppError('Cannot delete category with subcategories', 400);
    }

    // Check if category has products
    const { count: productsCount } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', id)
      .eq('is_deleted', false);

    if (productsCount > 0) {
      throw new AppError('Cannot delete category with products', 400);
    }

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) {
      throw new AppError(error.message || 'Failed to delete category', 500);
    }

    return true;
  }

  /**
   * Toggle category status
   */
  static async toggleStatus(id) {
    const { data: category, error: fetchError } = await supabase
      .from('categories')
      .select('is_active')
      .eq('id', id)
      .single();

    if (fetchError || !category) {
      throw new AppError('Category not found', 404);
    }

    const newStatus = !category.is_active;

    const { data: updated, error } = await supabase
      .from('categories')
      .update({
        is_active: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new AppError(error.message, 500);

    return {
      ...updated,
      status: updated.is_active ? 'active' : 'inactive',
    };
  }
}
