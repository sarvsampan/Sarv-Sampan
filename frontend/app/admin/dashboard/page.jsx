'use client';

import { useEffect, useState } from 'react';
import { dashboardAPI, productAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';
import {
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Eye,
  Plus,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  Loader,
  AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';

export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [salesChart, setSalesChart] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, chartRes, ordersRes, productsRes, lowStockRes] = await Promise.all([
        dashboardAPI.getStats(),
        dashboardAPI.getSalesChart(),
        dashboardAPI.getRecentOrders(5),
        dashboardAPI.getTopProducts(5),
        productAPI.getLowStock(),
      ]);

      setStats(statsRes.data);
      setSalesChart(chartRes.data || []);
      setRecentOrders(ordersRes.data || []);
      setTopProducts(productsRes.data || []);

      const lowStockData = lowStockRes.data || { lowStock: [], outOfStock: [], criticalStock: [] };
      const allLowStock = [
        ...lowStockData.outOfStock,
        ...lowStockData.criticalStock,
        ...lowStockData.lowStock,
      ].slice(0, 5);
      setLowStockProducts(allLowStock);
    } catch (error) {
      toast.error('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-3 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="mt-3 text-sm text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Revenue',
      value: `₹${Number(stats?.totalRevenue || 0).toLocaleString('en-IN')}`,
      icon: DollarSign,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      change: '+12.5%',
      isPositive: true,
    },
    {
      title: 'Total Orders',
      value: stats?.totalOrders || 0,
      icon: ShoppingCart,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      change: '+8.2%',
      isPositive: true,
    },
    {
      title: 'Total Customers',
      value: stats?.totalCustomers || 0,
      icon: Users,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      change: '+15.3%',
      isPositive: true,
    },
    {
      title: 'Total Products',
      value: stats?.totalProducts || 0,
      icon: Package,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      change: '+3.1%',
      isPositive: true,
    },
  ];

  // Order Status Data for Pie Chart
  const orderStatusData = [
    { name: 'Pending', value: stats?.pendingOrders || 0, color: '#f59e0b' },
    { name: 'Completed', value: Math.floor((stats?.totalOrders || 0) * 0.6), color: '#10b981' },
    { name: 'Processing', value: Math.floor((stats?.totalOrders || 0) * 0.2), color: '#3b82f6' },
    { name: 'Cancelled', value: Math.floor((stats?.totalOrders || 0) * 0.1), color: '#ef4444' },
  ];

  // Format sales chart data
  const formattedSalesData = salesChart.map((item) => ({
    date: format(new Date(item.date), 'MMM dd'),
    amount: parseFloat(item.amount),
  }));

  const getOrderStatusColor = (status) => {
    const colors = {
      pending: 'bg-amber-100 text-amber-700',
      processing: 'bg-blue-100 text-blue-700',
      completed: 'bg-emerald-100 text-emerald-700',
      shipped: 'bg-purple-100 text-purple-700',
      delivered: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  };

  const getPaymentStatusColor = (status) => {
    const colors = {
      paid: 'bg-emerald-100 text-emerald-700',
      pending: 'bg-amber-100 text-amber-700',
      failed: 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  };

  const getStockStatusIcon = (quantity) => {
    if (quantity === 0) return <XCircle className="w-4 h-4 text-red-600" />;
    if (quantity <= 5) return <AlertTriangle className="w-4 h-4 text-orange-600" />;
    return <AlertCircle className="w-4 h-4 text-amber-600" />;
  };

  return (
    <div className="p-4 bg-slate-50 min-h-full">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-600 mt-1">
            Welcome back! Here's what's happening with your store today.
          </p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          const TrendIcon = stat.isPositive ? TrendingUp : TrendingDown;
          return (
            <div
              key={stat.title}
              className={`bg-white rounded-xl border ${stat.border} p-4 hover:shadow-lg transition-all cursor-pointer group`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`p-3 ${stat.bg} rounded-lg group-hover:scale-110 transition-transform`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div
                  className={`flex items-center text-xs font-semibold ${
                    stat.isPositive ? 'text-emerald-600' : 'text-red-600'
                  }`}
                >
                  <TrendIcon className="w-3 h-3 mr-1" />
                  {stat.change}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1">{stat.title}</p>
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Revenue Cards Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-5 text-white shadow-lg hover:shadow-xl transition-all cursor-pointer">
          <div className="flex items-center space-x-2 mb-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-sm font-semibold">Today's Revenue</h3>
          </div>
          <p className="text-3xl font-bold mb-2">₹{Number(stats?.todayRevenue || 0).toLocaleString('en-IN')}</p>
          <p className="text-xs text-blue-100">Keep up the great work!</p>
        </div>

        <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-5 text-white shadow-lg hover:shadow-xl transition-all cursor-pointer">
          <div className="flex items-center space-x-2 mb-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-sm font-semibold">Monthly Revenue</h3>
          </div>
          <p className="text-3xl font-bold mb-2">₹{Number(stats?.monthlyRevenue || 0).toLocaleString('en-IN')}</p>
          <p className="text-xs text-purple-100">This month's earnings</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-xl p-5 text-white shadow-lg hover:shadow-xl transition-all cursor-pointer">
          <div className="flex items-center space-x-2 mb-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-sm font-semibold">Yearly Revenue</h3>
          </div>
          <p className="text-3xl font-bold mb-2">₹{Number(stats?.yearlyRevenue || 0).toLocaleString('en-IN')}</p>
          <p className="text-xs text-emerald-100">This year's total</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Sales Trend Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Sales Trend</h3>
              <p className="text-xs text-slate-600 mt-1">Last 7 days revenue</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={formattedSalesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#64748b" />
              <YAxis tick={{ fontSize: 12 }} stroke="#64748b" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                }}
              />
              <Line
                type="monotone"
                dataKey="amount"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ fill: '#3b82f6', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Order Status Breakdown */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="mb-4">
            <h3 className="text-base font-bold text-slate-900">Order Status</h3>
            <p className="text-xs text-slate-600 mt-1">Current distribution</p>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={orderStatusData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {orderStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                formatter={(value) => (
                  <span className="text-xs text-slate-700">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Orders & Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="p-5 border-b border-slate-200 flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-slate-900">Recent Orders</h3>
              <p className="text-xs text-slate-600 mt-1">Latest 5 orders</p>
            </div>
            <button
              onClick={() => router.push('/admin/orders')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center space-x-1"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
          <div className="p-5">
            {recentOrders.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">No orders yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/admin/orders`)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <p className="text-sm font-semibold text-slate-900">
                          {order.order_number}
                        </p>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${getOrderStatusColor(
                            order.status
                          )}`}
                        >
                          {order.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">
                        {order.users?.first_name} {order.users?.last_name}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {format(new Date(order.created_at), 'MMM dd, yyyy hh:mm a')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-900">
                        ₹{Number(order.total_amount).toLocaleString('en-IN')}
                      </p>
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium mt-1 ${getPaymentStatusColor(
                          order.payment_status
                        )}`}
                      >
                        {order.payment_status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="p-5 border-b border-slate-200 flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-slate-900">Top Selling Products</h3>
              <p className="text-xs text-slate-600 mt-1">Best performers</p>
            </div>
            <button
              onClick={() => router.push('/admin/products')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center space-x-1"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
          <div className="p-5">
            {topProducts.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">No products yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {topProducts.map((product, index) => (
                  <div
                    key={product.id}
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => router.push('/admin/products')}
                  >
                    <div className="flex-shrink-0 w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center font-bold text-slate-700 text-sm">
                      #{index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {product.name}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <p className="text-xs text-slate-600">SKU: {product.sku}</p>
                        <span className="text-xs text-slate-400">•</span>
                        <p className="text-xs text-slate-600">
                          Sold: {product.total_sales || 0}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-900">
                        ₹{Number(product.regular_price).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Low Stock Alerts & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Low Stock Alerts */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="p-5 border-b border-slate-200 flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <span>Low Stock Alerts</span>
              </h3>
              <p className="text-xs text-slate-600 mt-1">Products need restocking</p>
            </div>
            <button
              onClick={() => router.push('/admin/inventory')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center space-x-1"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
          <div className="p-5">
            {lowStockProducts.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-900">All Good!</p>
                <p className="text-xs text-slate-500 mt-1">No low stock products</p>
              </div>
            ) : (
              <div className="space-y-3">
                {lowStockProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      {getStockStatusIcon(product.stock_quantity)}
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {product.name}
                        </p>
                        <p className="text-xs text-slate-600">SKU: {product.sku}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-sm font-bold ${
                          product.stock_quantity === 0
                            ? 'text-red-600'
                            : product.stock_quantity <= 5
                            ? 'text-orange-600'
                            : 'text-amber-600'
                        }`}
                      >
                        {product.stock_quantity} units
                      </p>
                      <p className="text-xs text-slate-500">
                        Threshold: {product.low_stock_threshold || 10}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="p-5 border-b border-slate-200">
            <h3 className="text-base font-bold text-slate-900">Quick Actions</h3>
            <p className="text-xs text-slate-600 mt-1">Common tasks</p>
          </div>
          <div className="p-5 space-y-3">
            <button
              onClick={() => router.push('/admin/products')}
              className="w-full flex items-center space-x-3 px-4 py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Product</span>
            </button>
            <button
              onClick={() => router.push('/admin/orders')}
              className="w-full flex items-center space-x-3 px-4 py-3 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg transition-colors text-sm font-medium"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>View Orders</span>
            </button>
            <button
              onClick={() => router.push('/admin/coupons')}
              className="w-full flex items-center space-x-3 px-4 py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors text-sm font-medium"
            >
              <Package className="w-4 h-4" />
              <span>Create Coupon</span>
            </button>
            <button
              onClick={() => router.push('/admin/customers')}
              className="w-full flex items-center space-x-3 px-4 py-3 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg transition-colors text-sm font-medium"
            >
              <Users className="w-4 h-4" />
              <span>View Customers</span>
            </button>
          </div>

          {/* Pending Orders Alert */}
          {stats?.pendingOrders > 0 && (
            <div className="p-5 border-t border-slate-200">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <Clock className="w-4 h-4 text-amber-600 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-amber-900">
                      {stats.pendingOrders} Pending Orders
                    </p>
                    <p className="text-xs text-amber-700 mt-1">
                      Orders need attention
                    </p>
                    <button
                      onClick={() => router.push('/admin/orders')}
                      className="text-xs font-semibold text-amber-800 hover:text-amber-900 mt-2 underline"
                    >
                      Process Now →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
