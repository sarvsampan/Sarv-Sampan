import { supabase } from '../../config/database.js';
import { success } from '../../utils/response.js';
import { uploadToSupabase, generateFileName } from '../../utils/upload.util.js';

export class AdminDealController {
  /**
   * GET /api/admin/deals
   * Get all deals with product count
   */
  static async getAllDeals(req, res, next) {
    try {
      const { data: deals, error } = await supabase
        .from('deals')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch deals',
          error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
      }

      // Get product count for each deal
      const dealsWithCount = await Promise.all(
        (deals || []).map(async (deal) => {
          const { count } = await supabase
            .from('deal_products')
            .select('*', { count: 'exact', head: true })
            .eq('deal_id', deal.id);

          return {
            ...deal,
            product_count: count || 0
          };
        })
      );

      res.status(200).json(success(dealsWithCount, 'Deals retrieved successfully'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/admin/deals/:id
   * Get deal by ID
   */
  static async getDealById(req, res, next) {
    try {
      const { id } = req.params;

      const { data: deal, error } = await supabase
        .from('deals')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !deal) {
        return res.status(404).json({ success: false, message: 'Deal not found' });
      }

      res.status(200).json(success(deal, 'Deal retrieved successfully'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/admin/deals
   * Create new deal
   */
  static async createDeal(req, res, next) {
    try {
      const {
        title,
        description,
        discount_percentage,
        start_date,
        end_date,
        is_active
      } = req.body;

      // Validation
      if (!title || !discount_percentage || !start_date || !end_date) {
        return res.status(400).json({
          success: false,
          message: 'Title, discount percentage, start date, and end date are required'
        });
      }

      const dealData = {
        title,
        description: description || '',
        discount_percentage: parseInt(discount_percentage),
        start_date,
        end_date,
        is_active: is_active !== undefined ? is_active : true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: deal, error } = await supabase
        .from('deals')
        .insert([dealData])
        .select()
        .single();

      if (error) {
        return res.status(500).json({
          success: false,
          message: 'Failed to create deal',
          error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
      }

      res.status(201).json(success(deal, 'Deal created successfully'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/admin/deals/:id
   * Update deal
   */
  static async updateDeal(req, res, next) {
    try {
      const { id } = req.params;
      const {
        title,
        description,
        discount_percentage,
        start_date,
        end_date,
        is_active
      } = req.body;

      const dealData = {
        title,
        description,
        discount_percentage: parseInt(discount_percentage),
        start_date,
        end_date,
        is_active,
        updated_at: new Date().toISOString()
      };

      const { data: deal, error } = await supabase
        .from('deals')
        .update(dealData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return res.status(500).json({
          success: false,
          message: 'Failed to update deal',
          error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
      }

      if (!deal) {
        return res.status(404).json({ success: false, message: 'Deal not found' });
      }

      res.status(200).json(success(deal, 'Deal updated successfully'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/admin/deals/:id
   * Delete deal
   */
  static async deleteDeal(req, res, next) {
    try {
      const { id } = req.params;

      const { error } = await supabase
        .from('deals')
        .delete()
        .eq('id', id);

      if (error) {
        return res.status(500).json({
          success: false,
          message: 'Failed to delete deal',
          error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
      }

      res.status(200).json(success(null, 'Deal deleted successfully'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/admin/deals/:id/toggle-status
   * Toggle deal active status
   */
  static async toggleDealStatus(req, res, next) {
    try {
      const { id } = req.params;

      // First get the current deal
      const { data: currentDeal, error: fetchError } = await supabase
        .from('deals')
        .select('is_active')
        .eq('id', id)
        .single();

      if (fetchError || !currentDeal) {
        return res.status(404).json({ success: false, message: 'Deal not found' });
      }

      // Toggle the status
      const { data: deal, error } = await supabase
        .from('deals')
        .update({
          is_active: !currentDeal.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return res.status(500).json({
          success: false,
          message: 'Failed to toggle deal status',
          error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
      }

      res.status(200).json(success(deal, 'Deal status toggled successfully'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/admin/deals/:id/products
   * Assign products to a deal
   */
  static async assignProducts(req, res, next) {
    try {
      const { id } = req.params;
      const { product_ids } = req.body;

      if (!product_ids || !Array.isArray(product_ids) || product_ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'product_ids array is required'
        });
      }

      // Check if deal exists
      const { data: deal, error: dealError } = await supabase
        .from('deals')
        .select('id')
        .eq('id', id)
        .single();

      if (dealError || !deal) {
        return res.status(404).json({ success: false, message: 'Deal not found' });
      }

      // Create deal_products records
      const dealProducts = product_ids.map(product_id => ({
        deal_id: id,
        product_id,
        created_at: new Date().toISOString()
      }));

      const { data, error } = await supabase
        .from('deal_products')
        .upsert(dealProducts, { onConflict: 'deal_id,product_id' })
        .select();

      if (error) {
        return res.status(500).json({
          success: false,
          message: 'Failed to assign products to deal',
          error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
      }

      res.status(200).json(success(data, `${product_ids.length} product(s) assigned to deal successfully`));
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/admin/deals/:id/products
   * Remove products from a deal
   */
  static async removeProducts(req, res, next) {
    try {
      const { id } = req.params;
      const { product_ids } = req.body;

      if (!product_ids || !Array.isArray(product_ids) || product_ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'product_ids array is required'
        });
      }

      const { error } = await supabase
        .from('deal_products')
        .delete()
        .eq('deal_id', id)
        .in('product_id', product_ids);

      if (error) {
        return res.status(500).json({
          success: false,
          message: 'Failed to remove products from deal',
          error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
      }

      res.status(200).json(success(null, `${product_ids.length} product(s) removed from deal successfully`));
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/admin/deals/:id/image
   * Upload banner image for deal
   */
  static async uploadImage(req, res, next) {
    try {
      const { id } = req.params;

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No image file provided'
        });
      }

      // Check if deal exists
      const { data: deal, error: dealError } = await supabase
        .from('deals')
        .select('id')
        .eq('id', id)
        .single();

      if (dealError || !deal) {
        return res.status(404).json({ success: false, message: 'Deal not found' });
      }

      // Upload image to Supabase Storage (using product-images bucket)
      const fileName = `deals/${generateFileName(req.file.originalname)}`;
      const imageUrl = await uploadToSupabase(req.file.buffer, fileName, 'product-images');

      // Update deal with image URL
      const { data: updatedDeal, error } = await supabase
        .from('deals')
        .update({
          banner_image: imageUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return res.status(500).json({
          success: false,
          message: 'Failed to update deal with image',
          error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
      }

      res.status(200).json(success(updatedDeal, 'Deal image uploaded successfully'));
    } catch (err) {
      next(err);
    }
  }
}
