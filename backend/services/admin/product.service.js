import supabase from '../../config/supabase.js';
import { AppError } from '../../middlewares/error.middleware.js';
import { generateSlug } from '../../utils/slug.util.js';
import { getPaginationMeta, getPaginationOffset } from '../../utils/pagination.util.js';
import { uploadToSupabase, deleteFromSupabase, generateFileName } from '../../utils/upload.util.js';

export class ProductService {
  /**
   * Get all products with filters
   */
  static async getAllProducts(filters) {
    const { page = 1, limit = 20, search, category, status, featured } = filters;
    const offset = getPaginationOffset(page, limit);

    let query = supabase
      .from('products')
      .select(`
        *,
        categories:category_id (id, name, slug),
        product_images (id, image_url, is_primary)
      `, { count: 'exact' })
      .eq('is_deleted', false);

    // Search filter
    if (search) {
      query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`);
    }

    // Category filter
    if (category) {
      query = query.eq('category_id', category);
    }

    // Status filter
    if (status !== undefined) {
      query = query.eq('is_active', status === 'active');
    }

    // Featured filter
    if (featured !== undefined) {
      query = query.eq('is_featured', featured === 'true');
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    const { data, error, count } = await query;

    if (error) throw new AppError(error.message, 500);

    // Format products with images
    const products = (data || []).map(item => {
      const { product_images, categories, ...product } = item;
      return {
        ...product,
        status: product.is_active ? 'active' : 'inactive',
        category: categories,
        images: product_images || []
      };
    });

    return {
      products,
      meta: getPaginationMeta(count || 0, page, limit)
    };
  }

  /**
   * Get product by ID
   */
  static async getProductById(id) {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        categories:category_id (id, name, slug),
        product_images (*)
      `)
      .eq('id', id)
      .eq('is_deleted', false);

    if (error || !data || data.length === 0) {
      throw new AppError('Product not found', 404);
    }

    // Format product data
    const productData = data[0];
    const { product_images, categories, ...product } = productData;

    return {
      ...product,
      status: product.is_active ? 'active' : 'inactive',
      category: categories,
      images: product_images || []
    };
  }

  /**
   * Create new product
   */
  static async createProduct(productData) {
    const {
      name,
      description,
      short_description,
      category_id,
      sku,
      regular_price,
      sale_price,
      cost_price,
      stock_quantity,
      low_stock_threshold,
      manage_stock,
      weight,
      dimensions,
      is_featured,
      status,
      meta_title,
      meta_description,
      meta_keywords
    } = productData;

    // Generate slug
    const slug = generateSlug(name);

    // Check if SKU or slug already exists
    const { data: existing } = await supabase
      .from('products')
      .select('id')
      .or(`sku.eq.${sku},slug.eq.${slug}`)
      .single();

    if (existing) {
      throw new AppError('Product with this SKU or name already exists', 400);
    }

    const isActiveValue = status === 'active' ? true : (status === 'inactive' ? false : true);
    const stockQty = stock_quantity || 0;

    const { data: product, error } = await supabase
      .from('products')
      .insert({
        name,
        slug,
        sku,
        description,
        short_description,
        category_id: category_id || null,
        regular_price,
        sale_price: sale_price || null,
        cost_price: cost_price || null,
        stock_quantity: stockQty,
        low_stock_threshold: low_stock_threshold || 10,
        manage_stock: manage_stock !== false,
        stock_status: stockQty > 0 ? 'in_stock' : 'out_of_stock',
        weight,
        dimensions,
        is_featured: is_featured || false,
        is_active: isActiveValue,
        meta_title,
        meta_description,
        meta_keywords,
      })
      .select()
      .single();

    if (error) throw new AppError(error.message, 500);

    return {
      ...product,
      status: product.is_active ? 'active' : 'inactive',
    };
  }

  /**
   * Update product
   */
  static async updateProduct(id, productData) {
    const {
      name,
      description,
      short_description,
      category_id,
      regular_price,
      sale_price,
      cost_price,
      stock_quantity,
      low_stock_threshold,
      manage_stock,
      weight,
      dimensions,
      is_featured,
      status,
      meta_title,
      meta_description,
      meta_keywords
    } = productData;

    // If name is being updated, generate new slug
    let slug;
    if (name) {
      slug = generateSlug(name);

      const { data: existing } = await supabase
        .from('products')
        .select('id')
        .eq('slug', slug)
        .neq('id', id)
        .single();

      if (existing) {
        throw new AppError('Product with this name already exists', 400);
      }
    }

    // Determine stock status
    let stock_status;
    if (stock_quantity !== undefined) {
      stock_status = stock_quantity > 0 ? 'in_stock' : 'out_of_stock';
    }

    const updateData = {
      updated_at: new Date().toISOString(),
    };

    if (name) {
      updateData.name = name;
      updateData.slug = slug;
    }
    if (description !== undefined) updateData.description = description;
    if (short_description !== undefined) updateData.short_description = short_description;
    if (category_id !== undefined) updateData.category_id = category_id || null;
    if (regular_price !== undefined) updateData.regular_price = regular_price;
    if (sale_price !== undefined) updateData.sale_price = sale_price;
    if (cost_price !== undefined) updateData.cost_price = cost_price;
    if (stock_quantity !== undefined) {
      updateData.stock_quantity = stock_quantity;
      updateData.stock_status = stock_status;
    }
    if (low_stock_threshold !== undefined) updateData.low_stock_threshold = low_stock_threshold;
    if (manage_stock !== undefined) updateData.manage_stock = manage_stock;
    if (weight !== undefined) updateData.weight = weight;
    if (dimensions !== undefined) updateData.dimensions = dimensions;
    if (is_featured !== undefined) updateData.is_featured = is_featured;
    if (status !== undefined) updateData.is_active = status === 'active';
    if (meta_title !== undefined) updateData.meta_title = meta_title;
    if (meta_description !== undefined) updateData.meta_description = meta_description;
    if (meta_keywords !== undefined) updateData.meta_keywords = meta_keywords;

    const { data: product, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new AppError(error.message, 500);

    return {
      ...product,
      status: product.is_active ? 'active' : 'inactive',
    };
  }

  /**
   * Delete product (soft delete)
   */
  static async deleteProduct(id) {
    const { error } = await supabase
      .from('products')
      .update({
        is_deleted: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw new AppError(error.message, 500);

    return true;
  }

  /**
   * Toggle product status
   */
  static async toggleStatus(id) {
    const { data: product, error: fetchError } = await supabase
      .from('products')
      .select('is_active')
      .eq('id', id)
      .eq('is_deleted', false)
      .single();

    if (fetchError || !product) {
      throw new AppError('Product not found', 404);
    }

    const { data: updated, error } = await supabase
      .from('products')
      .update({
        is_active: !product.is_active,
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

  /**
   * Upload product images
   */
  static async uploadProductImages(productId, files, isPrimary = false) {
    const uploadedImages = [];

    for (const file of files) {
      const fileName = `products/${productId}/${generateFileName(file.originalname)}`;

      try {
        const imageUrl = await uploadToSupabase(file.buffer, fileName);

        // Save to database
        const { data: image, error } = await supabase
          .from('product_images')
          .insert({
            product_id: productId,
            image_url: imageUrl,
            is_primary: isPrimary && uploadedImages.length === 0,
            display_order: uploadedImages.length,
          })
          .select()
          .single();

        if (error) throw error;

        uploadedImages.push(image);
      } catch (error) {
        throw new AppError(`Failed to upload image: ${error.message}`, 500);
      }
    }

    return uploadedImages;
  }

  /**
   * Delete product image
   */
  static async deleteProductImage(productId, imageId) {
    const { data: image, error: fetchError } = await supabase
      .from('product_images')
      .select('image_url')
      .eq('id', imageId)
      .eq('product_id', productId)
      .single();

    if (fetchError || !image) {
      throw new AppError('Image not found', 404);
    }

    // Delete from storage
    const filePath = image.image_url.split('/').slice(-3).join('/');
    await deleteFromSupabase(filePath);

    // Delete from database
    const { error } = await supabase
      .from('product_images')
      .delete()
      .eq('id', imageId);

    if (error) throw new AppError(error.message, 500);

    return true;
  }

  /**
   * Get low stock products
   */
  static async getLowStockProducts() {
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        id,
        name,
        sku,
        stock_quantity,
        low_stock_threshold,
        categories:category_id (id, name)
      `)
      .eq('is_deleted', false)
      .eq('is_active', true)
      .eq('manage_stock', true)
      .order('stock_quantity', { ascending: true });

    if (error) throw new AppError(error.message, 500);

    // Categorize products
    const lowStock = [];
    const outOfStock = [];
    const criticalStock = [];

    products.forEach(product => {
      const quantity = product.stock_quantity || 0;
      const threshold = product.low_stock_threshold || 10;

      const serialized = {
        ...product,
        category: product.categories,
      };

      if (quantity === 0) {
        outOfStock.push(serialized);
      } else if (quantity <= 5) {
        criticalStock.push(serialized);
      } else if (quantity <= threshold) {
        lowStock.push(serialized);
      }
    });

    return {
      lowStock,
      outOfStock,
      criticalStock
    };
  }
}
