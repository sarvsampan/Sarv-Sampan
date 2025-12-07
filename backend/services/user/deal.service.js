import supabase from '../../config/supabase.js';
import { AppError } from '../../middlewares/error.middleware.js';

export class DealService {
  /**
   * Get all active deals
   */
  static async getActiveDeals() {
    const now = new Date().toISOString();

    const { data: deals, error } = await supabase
      .from('deals')
      .select('*')
      .eq('is_active', true)
      .gte('end_date', now)
      .lte('start_date', now)
      .order('created_at', { ascending: false });

    if (error) throw new AppError(error.message, 500);

    return deals || [];
  }

  /**
   * Get deal by ID with products
   */
  static async getDealById(dealId) {
    // Get deal details
    const { data: deal, error: dealError } = await supabase
      .from('deals')
      .select('*')
      .eq('id', dealId)
      .single();

    if (dealError || !deal) {
      throw new AppError('Deal not found', 404);
    }

    // Get deal products with product details
    const { data: dealProducts, error: dpError } = await supabase
      .from('deal_products')
      .select(`
        *,
        products:product_id (
          *,
          product_images (*)
        )
      `)
      .eq('deal_id', dealId);

    if (dpError) throw new AppError(dpError.message, 500);

    // Transform products to include deal_price as sale_price
    const products = (dealProducts || []).map(dp => {
      const product = dp.products;

      if (!product) return null;

      // Sort images (primary first, then by display order)
      const images = product.product_images || [];
      const sortedImages = [...images].sort((a, b) => {
        if (a.is_primary) return -1;
        if (b.is_primary) return 1;
        return (a.display_order || 0) - (b.display_order || 0);
      });

      return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        sku: product.sku,
        regular_price: Number(product.regular_price),
        sale_price: Number(dp.deal_price),
        original_price: Number(product.regular_price),
        stock_quantity: product.stock_quantity,
        stock_status: product.stock_status,
        manage_stock: product.manage_stock,
        average_rating: product.average_rating,
        review_count: product.review_count,
        deal_discount: Number(deal.discount_percentage),
        images: sortedImages.map(img => ({
          image_url: img.image_url,
          is_primary: img.is_primary,
          display_order: img.display_order,
        })),
      };
    }).filter(Boolean);

    return {
      id: deal.id,
      title: deal.title,
      description: deal.description,
      discount_percentage: Number(deal.discount_percentage),
      start_date: deal.start_date,
      end_date: deal.end_date,
      is_active: deal.is_active,
      created_at: deal.created_at,
      updated_at: deal.updated_at,
      products,
      product_count: products.length,
    };
  }

  /**
   * Get all deals with product count
   */
  static async getAllDealsWithCount() {
    const deals = await this.getActiveDeals();

    // Get product count for each deal
    const dealsWithCount = await Promise.all(
      deals.map(async (deal) => {
        const { count, error } = await supabase
          .from('deal_products')
          .select('*', { count: 'exact', head: true })
          .eq('deal_id', deal.id);

        return {
          ...deal,
          product_count: count || 0,
        };
      })
    );

    return dealsWithCount;
  }
}
