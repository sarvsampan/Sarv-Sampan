import { ProductService } from '../../services/admin/product.service.js';
import { success, error } from '../../utils/response.js';
import { buildPaginatedResponse } from '../../utils/pagination.util.js';

export class ProductController {
  /**
   * GET /api/admin/products
   * Get all products
   */
  static async getAllProducts(req, res, next) {
    try {
      const { page, limit, search, category, status, featured } = req.query;

      const result = await ProductService.getAllProducts({
        page,
        limit,
        search,
        category,
        status,
        featured
      });

      res.status(200).json(buildPaginatedResponse(result.products, result.meta));
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/admin/products/low-stock
   * Get low stock products
   */
  static async getLowStockProducts(req, res, next) {
    try {
      const products = await ProductService.getLowStockProducts();
      res.status(200).json(success(products, 'Low stock products retrieved'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/admin/products/:id
   * Get product by ID
   */
  static async getProductById(req, res, next) {
    try {
      const { id } = req.params;
      const product = await ProductService.getProductById(id);

      res.status(200).json(success(product, 'Product retrieved'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/admin/products
   * Create new product
   */
  static async createProduct(req, res, next) {
    try {
      const { name, sku, regular_price } = req.body;

      // Basic validation
      if (!name || !sku || !regular_price) {
        return res.status(400).json(error('Name, SKU and regular price are required', 400));
      }

      const product = await ProductService.createProduct(req.body);

      res.status(201).json(success(product, 'Product created successfully'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/admin/products/:id
   * Update product
   */
  static async updateProduct(req, res, next) {
    try {
      const { id } = req.params;
      const product = await ProductService.updateProduct(id, req.body);

      res.status(200).json(success(product, 'Product updated successfully'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/admin/products/:id
   * Delete product
   */
  static async deleteProduct(req, res, next) {
    try {
      const { id } = req.params;
      await ProductService.deleteProduct(id);

      res.status(200).json(success(null, 'Product deleted successfully'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/admin/products/:id/status
   * Toggle product status
   */
  static async toggleStatus(req, res, next) {
    try {
      const { id } = req.params;
      const product = await ProductService.toggleStatus(id);

      res.status(200).json(success(product, 'Product status updated'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/admin/products/:id/images
   * Upload product images
   */
  static async uploadImages(req, res, next) {
    try {
      const { id } = req.params;

      if (!req.files || req.files.length === 0) {
        return res.status(400).json(error('No images uploaded', 400));
      }

      const images = await ProductService.uploadProductImages(id, req.files);

      res.status(200).json(success(images, 'Images uploaded successfully'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/admin/products/:id/images/:imageId
   * Delete product image
   */
  static async deleteImage(req, res, next) {
    try {
      const { id, imageId } = req.params;
      await ProductService.deleteProductImage(id, imageId);

      res.status(200).json(success(null, 'Image deleted successfully'));
    } catch (err) {
      next(err);
    }
  }
}
