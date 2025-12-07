'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Package, Clock, CheckCircle, XCircle, Eye, Truck, ArrowLeft, ShoppingBag } from 'lucide-react';
import Header from '@/components/user/Header';
import Footer from '@/components/user/Footer';
import toast from 'react-hot-toast';
import { orderAPI } from '@/lib/userApi';

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const checkAuthAndFetchOrders = async () => {
      const token = localStorage.getItem('userToken');
      const user = localStorage.getItem('user');

      if (!token || !user) {
        toast.error('Please login to view orders');
        router.push('/login');
        return;
      }

      await fetchOrders();
    };

    checkAuthAndFetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);

      const response = await orderAPI.getUserOrders();

      const transformedOrders = (response.data || []).map(order => ({
        id: order.order_number,
        date: new Date(order.created_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        }),
        status: order.status,
        total: order.total_amount,
        items: (order.order_items || []).map(item => ({
          name: item.product_name,
          quantity: item.quantity,
          price: item.price,
          image: item.product_image,
          slug: item.product_slug || '#'
        }))
      }));

      setOrders(transformedOrders);
    } catch (error) {
      localStorage.setItem('lastOrdersError', JSON.stringify({
        message: error?.message,
        status: error?.status,
        data: error?.data,
        timestamp: new Date().toISOString()
      }));
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderNumber, e) => {
    e.stopPropagation();

    try {
      await orderAPI.cancelOrder(orderNumber);
      toast.success('Order cancelled successfully!');
      fetchOrders();
    } catch (error) {
      toast.error(error?.message || 'Failed to cancel order');
    }
  };

  const canCancelOrder = (status) => {
    return ['pending', 'confirmed', 'processing'].includes(status);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'processing':
        return 'bg-blue-100 text-blue-700';
      case 'shipped':
        return 'bg-purple-100 text-purple-700';
      case 'delivered':
        return 'bg-green-100 text-green-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'processing':
        return <Package className="w-4 h-4" />;
      case 'shipped':
        return <Truck className="w-4 h-4" />;
      case 'delivered':
        return <CheckCircle className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  const filteredOrders = filter === 'all'
    ? orders
    : orders.filter(order => order.status === filter);

  const handleOrderClick = (order) => {
    // Navigate to order tracking/details page
    router.push(`/track-order?order=${order.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-slate-600">Loading orders...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 flex items-center space-x-2">
              <Package className="w-8 h-8 text-blue-600" />
              <span>My Orders</span>
            </h1>
            <p className="text-slate-600 mt-1">{orders.length} total orders</p>
          </div>
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-700 font-semibold flex items-center space-x-2 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Continue Shopping</span>
          </Link>
        </div>

        {/* Filter Dropdown */}
        <div className="mb-6">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Orders ({orders.length})</option>
            <option value="pending">Pending ({orders.filter(o => o.status === 'pending').length})</option>
            <option value="processing">Processing ({orders.filter(o => o.status === 'processing').length})</option>
            <option value="shipped">Shipped ({orders.filter(o => o.status === 'shipped').length})</option>
            <option value="delivered">Delivered ({orders.filter(o => o.status === 'delivered').length})</option>
            <option value="cancelled">Cancelled ({orders.filter(o => o.status === 'cancelled').length})</option>
          </select>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No orders found</h3>
            <p className="text-slate-600 mb-6">
              {filter === 'all'
                ? "You haven't placed any orders yet"
                : `No ${filter} orders`}
            </p>
            <Link
              href="/products"
              className="inline-block px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                onClick={() => handleOrderClick(order)}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all cursor-pointer"
              >
                {/* Order Header */}
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center space-x-4">
                      <div>
                        <p className="text-sm text-slate-600">Order ID</p>
                        <p className="font-semibold text-slate-900">#{order.id}</p>
                      </div>
                      <div className="h-10 w-px bg-slate-300"></div>
                      <div>
                        <p className="text-sm text-slate-600">Placed on</p>
                        <p className="font-semibold text-slate-900">{order.date}</p>
                      </div>
                      <div className="h-10 w-px bg-slate-300"></div>
                      <div>
                        <p className="text-sm text-slate-600">Total</p>
                        <p className="font-semibold text-slate-900">₹{order.total.toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`inline-flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        <span className="capitalize">{order.status}</span>
                      </span>
                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/track-order?order=${order.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors flex items-center space-x-2"
                        >
                          <Eye className="w-4 h-4" />
                          <span>View</span>
                        </Link>
                        {canCancelOrder(order.status) && (
                          <button
                            onClick={(e) => handleCancelOrder(order.id, e)}
                            className="px-4 py-2 border border-red-300 bg-red-50 rounded-lg text-sm font-medium text-red-600 hover:bg-red-100 transition-colors flex items-center space-x-2"
                          >
                            <XCircle className="w-4 h-4" />
                            <span>Cancel Order</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="p-6">
                  <div className="space-y-3">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                          {item.image ? (
                            <Image
                              src={item.image}
                              alt={item.name}
                              width={64}
                              height={64}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ShoppingBag className="w-8 h-8 text-slate-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-900 truncate">{item.name}</p>
                          <p className="text-sm text-slate-600">Qty: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-slate-900">₹{item.price.toLocaleString('en-IN')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
