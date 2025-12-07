import supabase from '../../config/supabase.js';
import { success } from '../../utils/response.js';

export class UserProductController {
  /**
   * GET /api/user/products
   * Get all active products with filters (public endpoint)
   */
  static async getProducts(req, res, next) {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        category,
        featured,
        sort = 'newest',
        min_price,
        max_price
      } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);

      // Build query
      let query = supabase
        .from('products')
        .select(`
          *,
          categories:category_id (id, name, slug),
          product_images (id, image_url, is_primary, display_order)
        `, { count: 'exact' })
        .eq('is_active', true)
        .eq('is_deleted', false);

      // Apply filters
      if (search) {
        query = query.or(`name.ilike.%${search}%,short_description.ilike.%${search}%`);
      }

      if (category) {
        query = query.eq('category_id', category);
      }

      if (featured === 'true') {
        query = query.eq('is_featured', true);
      }

      if (min_price) {
        query = query.gte('regular_price', parseFloat(min_price));
      }

      if (max_price) {
        query = query.lte('regular_price', parseFloat(max_price));
      }

      // Apply sorting
      switch (sort) {
        case 'price_low':
          query = query.order('regular_price', { ascending: true });
          break;
        case 'price_high':
          query = query.order('regular_price', { ascending: false });
          break;
        case 'name':
          query = query.order('name', { ascending: true });
          break;
        default: // newest
          query = query.order('created_at', { ascending: false });
      }

      // Apply pagination
      query = query.range(offset, offset + parseInt(limit) - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      // Group images by product
      const productsMap = {};
      (data || []).forEach(item => {
        if (!productsMap[item.id]) {
          const { product_images, categories, ...product} = item;
          productsMap[item.id] = {
            ...product,
            category: categories,
            images: item.product_images || []
          };
        }
      });

      const products = Object.values(productsMap).map(product => ({
        ...product,
        images: product.images.sort((a, b) => {
          if (a.is_primary) return -1;
          if (b.is_primary) return 1;
          return a.display_order - b.display_order;
        })
      }));

      res.status(200).json(success({
        products,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count || 0,
          totalPages: Math.ceil((count || 0) / parseInt(limit))
        }
      }, 'Products retrieved successfully'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/user/products/featured
   * Get featured products (public endpoint)
   */
  static async getFeaturedProducts(req, res, next) {
    try {
      const { limit = 8 } = req.query;

      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories:category_id (id, name, slug),
          product_images (id, image_url, is_primary, display_order)
        `)
        .eq('is_active', true)
        .eq('is_deleted', false)
        .eq('is_featured', true)
        .order('created_at', { ascending: false })
        .limit(parseInt(limit));

      if (error) throw error;

      // Group images by product
      const productsMap = {};
      (data || []).forEach(item => {
        if (!productsMap[item.id]) {
          const { product_images, categories, ...product } = item;
          productsMap[item.id] = {
            ...product,
            category: categories,
            images: item.product_images || []
          };
        }
      });

      const products = Object.values(productsMap).map(product => ({
        ...product,
        images: product.images.sort((a, b) => {
          if (a.is_primary) return -1;
          if (b.is_primary) return 1;
          return a.display_order - b.display_order;
        })
      }));

      res.status(200).json(success(products, 'Featured products retrieved successfully'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/user/products/new-arrivals
   * Get new arrival products (public endpoint)
   */
  static async getNewArrivals(req, res, next) {
    try {
      const { limit = 8 } = req.query;

      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories:category_id (id, name, slug),
          product_images (id, image_url, is_primary, display_order)
        `)
        .eq('is_active', true)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(parseInt(limit));

      if (error) throw error;

      // Group images by product
      const productsMap = {};
      (data || []).forEach(item => {
        if (!productsMap[item.id]) {
          const { product_images, categories, ...product } = item;
          productsMap[item.id] = {
            ...product,
            category: categories,
            images: item.product_images || []
          };
        }
      });

      const products = Object.values(productsMap).map(product => ({
        ...product,
        images: product.images.sort((a, b) => {
          if (a.is_primary) return -1;
          if (b.is_primary) return 1;
          return a.display_order - b.display_order;
        })
      }));

      res.status(200).json(success(products, 'New arrivals retrieved successfully'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/user/products/:slug
   * Get product by slug (public endpoint)
   */
  static async getProductBySlug(req, res, next) {
    try {
      const { slug } = req.params;

      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories:category_id (id, name, slug),
          product_images (id, image_url, is_primary, display_order)
        `)
        .eq('slug', slug)
        .eq('is_active', true)
        .eq('is_deleted', false);

      if (error || !data || data.length === 0) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }

      // Get product data
      const productData = data[0];
      const { product_images, categories, ...product } = productData;

      // Sort images
      const images = (product_images || []).sort((a, b) => {
        if (a.is_primary) return -1;
        if (b.is_primary) return 1;
        return a.display_order - b.display_order;
      });

      const serializedProduct = {
        ...product,
        category: categories,
        images
      };

      res.status(200).json(success(serializedProduct, 'Product retrieved successfully'));
    } catch (err) {
      next(err);
    }
  }
}
