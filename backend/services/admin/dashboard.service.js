import supabase from '../../config/supabase.js';
import { AppError } from '../../middlewares/error.middleware.js';

export class DashboardService {
  /**
   * Get Dashboard Statistics
   */
  static async getStats() {
    try {
      // Get total orders
      const { count: totalOrders } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });

      // Get pending orders
      const { count: pendingOrders } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Get revenue data from paid orders
      // Note: COD orders automatically get payment_status='paid' when delivered
      const { data: revenueData } = await supabase
        .from('orders')
        .select('total_amount, created_at')
        .eq('payment_status', 'paid');

      // Get total customers
      const { count: totalCustomers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      // Get total products
      const { count: totalProducts } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('is_deleted', false);

      // Total Revenue
      const totalRevenue = (revenueData || []).reduce((sum, order) => sum + Number(order.total_amount || 0), 0);

      // Today's Revenue
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayRevenue = (revenueData || [])
        .filter(order => new Date(order.created_at) >= today)
        .reduce((sum, order) => sum + Number(order.total_amount || 0), 0);

      // Monthly Revenue (Current Month)
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      const monthlyRevenue = (revenueData || [])
        .filter(order => new Date(order.created_at) >= firstDayOfMonth)
        .reduce((sum, order) => sum + Number(order.total_amount || 0), 0);

      // Yearly Revenue (Current Year)
      const firstDayOfYear = new Date(today.getFullYear(), 0, 1);

      const yearlyRevenue = (revenueData || [])
        .filter(order => new Date(order.created_at) >= firstDayOfYear)
        .reduce((sum, order) => sum + Number(order.total_amount || 0), 0);

      // Low Stock Products - use RPC or custom logic
      // For now, fetch all products with manage_stock and check manually
      const { data: allManagedProducts } = await supabase
        .from('products')
        .select('stock_quantity, low_stock_threshold')
        .eq('is_deleted', false)
        .eq('manage_stock', true);

      const lowStockProducts = (allManagedProducts || []).filter(p =>
        p.stock_quantity <= (p.low_stock_threshold || 10)
      ).length;

      return {
        totalOrders: totalOrders || 0,
        pendingOrders: pendingOrders || 0,
        totalRevenue: totalRevenue.toFixed(2),
        todayRevenue: todayRevenue.toFixed(2),
        monthlyRevenue: monthlyRevenue.toFixed(2),
        yearlyRevenue: yearlyRevenue.toFixed(2),
        totalCustomers: totalCustomers || 0,
        totalProducts: totalProducts || 0,
        lowStockProducts: lowStockProducts || 0
      };
    } catch (error) {
      console.error('Dashboard stats error:', error);
      throw new AppError('Failed to fetch dashboard stats', 500);
    }
  }

  /**
   * Get Recent Orders
   */
  static async getRecentOrders(limit = 10) {
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        status,
        payment_status,
        total_amount,
        created_at,
        customer_email,
        customer_phone
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw new AppError(error.message, 500);

    return orders || [];
  }

  /**
   * Get Top Selling Products
   */
  static async getTopProducts(limit = 10) {
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        id,
        name,
        sku,
        regular_price,
        product_images (image_url)
      `)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw new AppError(error.message, 500);

    return (products || []).map(product => ({
      ...product,
      images: product.product_images || [],
    }));
  }

  /**
   * Get Sales Chart Data (Last 7 days)
   */
  static async getSalesChart() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Get paid orders (includes delivered COD orders)
    const { data: orders, error } = await supabase
      .from('orders')
      .select('created_at, total_amount')
      .eq('payment_status', 'paid')
      .gte('created_at', sevenDaysAgo.toISOString());

    if (error) throw new AppError(error.message, 500);

    // Group by date
    const salesByDate = {};

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      salesByDate[dateStr] = 0;
    }

    (orders || []).forEach(order => {
      const dateStr = order.created_at.split('T')[0];
      if (salesByDate[dateStr] !== undefined) {
        salesByDate[dateStr] += Number(order.total_amount || 0);
      }
    });

    const chartData = Object.entries(salesByDate).map(([date, amount]) => ({
      date,
      amount: amount.toFixed(2)
    }));

    return chartData;
  }
}
