'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Search,
  Package,
  Truck,
  CheckCircle,
  Clock,
  MapPin,
  Phone,
  Mail,
  ArrowLeft,
  Calendar,
  User,
  Home,
  ShoppingBag,
  AlertCircle,
  XCircle,
  RotateCcw,
  RefreshCw,
  X
} from 'lucide-react';
import Header from '@/components/user/Header';
import Footer from '@/components/user/Footer';
import toast from 'react-hot-toast';
import { orderAPI } from '@/lib/userApi';

export default function TrackOrderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orderNumber, setOrderNumber] = useState('');
  const [email, setEmail] = useState('');
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // Modal states
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showReplacementModal, setShowReplacementModal] = useState(false);

  // Form states
  const [cancelReason, setCancelReason] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [replacementReason, setReplacementReason] = useState('');

  // Auto-search if order parameter is present in URL
  useEffect(() => {
    const orderParam = searchParams.get('order');
    if (orderParam) {
      setOrderNumber(orderParam);
      // Trigger search automatically
      setTimeout(() => {
        handleTrackOrderWithParam(orderParam);
      }, 100);
    }
  }, [searchParams]);

  // Dummy order data for demonstration
  const dummyOrders = {
    'ORD12345678': {
      orderNumber: 'ORD12345678',
      orderDate: '2024-12-01',
      estimatedDelivery: '2024-12-06',
      currentStatus: 'in-transit',
      product: {
        id: '1',
        name: 'Premium Wireless Bluetooth Headphones with Noise Cancellation',
        image: null,
        price: 3499,
        quantity: 1,
        sku: 'WH-1000XM4'
      },
      customer: {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '9876543210',
        address: '123 Main Street, Apartment 4B, Mumbai, Maharashtra - 400001'
      },
      payment: {
        method: 'Cash on Delivery',
        status: 'Pending'
      },
      total: 3598,
      trackingNumber: 'TRK987654321',
      statusHistory: [
        {
          status: 'ordered',
          title: 'Order Placed',
          description: 'Your order has been placed successfully',
          timestamp: '2024-12-01 10:30 AM',
          completed: true
        },
        {
          status: 'confirmed',
          title: 'Order Confirmed',
          description: 'Your order has been confirmed by the seller',
          timestamp: '2024-12-01 02:15 PM',
          completed: true
        },
        {
          status: 'packed',
          title: 'Packed',
          description: 'Your item has been packed and ready to ship',
          timestamp: '2024-12-02 11:00 AM',
          completed: true
        },
        {
          status: 'shipped',
          title: 'Shipped',
          description: 'Your order has been shipped',
          timestamp: '2024-12-02 05:30 PM',
          completed: true
        },
        {
          status: 'in-transit',
          title: 'In Transit',
          description: 'Your order is on the way',
          timestamp: '2024-12-03 09:00 AM',
          completed: true,
          current: true
        },
        {
          status: 'out-for-delivery',
          title: 'Out for Delivery',
          description: 'Your order is out for delivery',
          timestamp: null,
          completed: false
        },
        {
          status: 'delivered',
          title: 'Delivered',
          description: 'Order has been delivered',
          timestamp: null,
          completed: false
        }
      ]
    }
  };

  const handleTrackOrder = async (e) => {
    e.preventDefault();

    if (!orderNumber.trim()) {
      toast.error('Please enter order number');
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      const response = await orderAPI.getOrderByNumber(orderNumber.trim());

      if (response.data) {
        // Transform backend data to match UI format
        const transformedOrder = transformOrderData(response.data);
        setOrderData(transformedOrder);
        toast.success('Order found!');
      }
    } catch (error) {
      setOrderData(null);
      toast.error('Order not found. Please check your order number.');
    } finally {
      setLoading(false);
    }
  };

  const handleTrackOrderWithParam = async (orderNum) => {
    setLoading(true);
    setSearched(true);

    try {
      const response = await orderAPI.getOrderByNumber(orderNum.trim());

      if (response.data) {
        // Transform backend data to match UI format
        const transformedOrder = transformOrderData(response.data);
        setOrderData(transformedOrder);
        toast.success('Order found!');
      }
    } catch (error) {
      setOrderData(null);
      toast.error('Order not found. Please check your order number.');
    } finally {
      setLoading(false);
    }
  };

  // Transform backend order data to UI format
  const transformOrderData = (order) => {
    return {
      orderNumber: order.order_number,
      orderDate: new Date(order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }),
      estimatedDelivery: order.delivered_at || 'To be determined',
      currentStatus: order.status,
      product: {
        id: order.items[0]?.product_id || '',
        name: order.items[0]?.product_name || 'Product',
        image: order.items[0]?.product_image || null,
        price: order.items[0]?.price || 0,
        quantity: order.items[0]?.quantity || 1,
        sku: order.items[0]?.product_slug || ''
      },
      customer: {
        name: order.shipping_address?.fullName || '',
        email: order.customer_email || order.shipping_address?.email || '',
        phone: order.customer_phone || order.shipping_address?.phone || '',
        address: `${order.shipping_address?.address || ''}, ${order.shipping_address?.city || ''}, ${order.shipping_address?.state || ''} - ${order.shipping_address?.pincode || ''}`
      },
      payment: {
        method: order.payment_method === 'cod' ? 'Cash on Delivery' : order.payment_method,
        status: order.payment_status === 'paid' ? 'Paid' : 'Pending'
      },
      total: order.total_amount,
      trackingNumber: order.tracking_number || 'Not available',
      statusHistory: generateStatusHistory(order)
    };
  };

  // Generate status history based on order status
  const generateStatusHistory = (order) => {
    const statuses = [
      { status: 'pending', title: 'Order Placed', description: 'Your order has been placed successfully' },
      { status: 'confirmed', title: 'Order Confirmed', description: 'Your order has been confirmed' },
      { status: 'processing', title: 'Processing', description: 'Your order is being processed' },
      { status: 'shipped', title: 'Shipped', description: 'Your order has been shipped' },
      { status: 'delivered', title: 'Delivered', description: 'Order has been delivered' }
    ];

    const currentStatusIndex = statuses.findIndex(s => s.status === order.status);

    return statuses.map((status, index) => ({
      ...status,
      timestamp: index <= currentStatusIndex ? new Date(order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : null,
      completed: index <= currentStatusIndex,
      current: index === currentStatusIndex
    }));
  };

  const getStatusIcon = (status, completed, current) => {
    if (completed) {
      return <CheckCircle className="w-6 h-6 text-white" />;
    }
    return <div className="w-2 h-2 bg-slate-400 rounded-full"></div>;
  };

  // Cancel Order Handler
  const handleCancelOrder = () => {
    if (!cancelReason.trim()) {
      toast.error('Please provide a reason for cancellation');
      return;
    }

    // Simulate API call
    setTimeout(() => {
      toast.success('Order cancelled successfully! Refund will be processed in 5-7 business days.');
      setShowCancelModal(false);
      setCancelReason('');
      // Update order status
      if (orderData) {
        setOrderData({
          ...orderData,
          currentStatus: 'cancelled',
          statusHistory: orderData.statusHistory.map(item => ({
            ...item,
            completed: false,
            current: false
          }))
        });
      }
    }, 1000);
  };

  // Refund Request Handler
  const handleRefundRequest = () => {
    if (!refundReason.trim()) {
      toast.error('Please provide a reason for refund request');
      return;
    }

    // Simulate API call
    setTimeout(() => {
      toast.success('Refund request submitted successfully! We will review and process within 3-5 business days.');
      setShowRefundModal(false);
      setRefundReason('');
    }, 1000);
  };

  // Replacement Request Handler
  const handleReplacementRequest = () => {
    if (!replacementReason.trim()) {
      toast.error('Please provide a reason for replacement request');
      return;
    }

    // Simulate API call
    setTimeout(() => {
      toast.success('Replacement request submitted successfully! Our team will contact you within 24 hours.');
      setShowReplacementModal(false);
      setReplacementReason('');
    }, 1000);
  };

  // Check if order can be cancelled
  const canCancelOrder = () => {
    if (!orderData) return false;
    const cancellableStatuses = ['ordered', 'confirmed', 'packed', 'processing'];
    return cancellableStatuses.includes(orderData.currentStatus);
  };

  // Check if refund can be requested
  const canRequestRefund = () => {
    if (!orderData) return false;
    return orderData.currentStatus === 'delivered';
  };

  // Check if replacement can be requested
  const canRequestReplacement = () => {
    if (!orderData) return false;
    return orderData.currentStatus === 'delivered';
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-2 text-sm mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
            Track Your Order
          </h1>
          <p className="text-slate-600">
            Enter your order details to track your shipment
          </p>
        </div>

        {/* Search Form */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-8">
            <form onSubmit={handleTrackOrder} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Order Number *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                    placeholder="e.g., ORD12345678"
                    className="w-full px-4 py-3 pl-12 border-2 border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                  />
                  <Package className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  You can find your order number in the confirmation email
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-bold text-lg hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    <span>Track Order</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Order Not Found */}
        {searched && !orderData && !loading && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl border border-red-200 shadow-lg p-8 text-center">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-10 h-10 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Order Not Found</h2>
              <p className="text-slate-600 mb-6">
                We couldn't find an order with that number. Please check and try again.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => {
                    setOrderNumber('');
                    setSearched(false);
                  }}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
                >
                  Try Again
                </button>
                <Link
                  href="/support"
                  className="px-6 py-2 border-2 border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50"
                >
                  Contact Support
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Order Details */}
        {orderData && (
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Order Info Card */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl shadow-xl p-8 text-white">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <p className="text-blue-100 text-sm mb-1">Order Number</p>
                  <p className="text-3xl font-bold">{orderData.orderNumber}</p>
                </div>
                <div className="text-left md:text-right">
                  <p className="text-blue-100 text-sm mb-1">Estimated Delivery</p>
                  <p className="text-xl font-semibold">
                    {new Date(orderData.estimatedDelivery).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Status Timeline */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-2">
                <Truck className="w-6 h-6 text-blue-600" />
                Tracking Status
              </h2>

              <div className="relative">
                {orderData.statusHistory.map((item, index) => (
                  <div key={index} className="flex gap-4 pb-8 last:pb-0">
                    {/* Timeline Line */}
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center z-10 ${
                          item.completed
                            ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg'
                            : item.current
                            ? 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg animate-pulse'
                            : 'bg-slate-200'
                        }`}
                      >
                        {getStatusIcon(item.status, item.completed, item.current)}
                      </div>
                      {index !== orderData.statusHistory.length - 1 && (
                        <div
                          className={`w-0.5 flex-1 mt-2 ${
                            item.completed ? 'bg-emerald-500' : 'bg-slate-200'
                          }`}
                          style={{ minHeight: '40px' }}
                        ></div>
                      )}
                    </div>

                    {/* Status Info */}
                    <div className="flex-1 pb-4">
                      <div
                        className={`${
                          item.current
                            ? 'bg-blue-50 border-2 border-blue-500'
                            : item.completed
                            ? 'bg-emerald-50 border-2 border-emerald-200'
                            : 'bg-slate-50 border-2 border-slate-200'
                        } rounded-xl p-4`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3
                              className={`font-bold text-lg mb-1 ${
                                item.current
                                  ? 'text-blue-900'
                                  : item.completed
                                  ? 'text-emerald-900'
                                  : 'text-slate-500'
                              }`}
                            >
                              {item.title}
                              {item.current && (
                                <span className="ml-2 text-sm bg-blue-600 text-white px-3 py-1 rounded-full">
                                  Current
                                </span>
                              )}
                            </h3>
                            <p
                              className={`text-sm ${
                                item.completed || item.current
                                  ? 'text-slate-700'
                                  : 'text-slate-500'
                              }`}
                            >
                              {item.description}
                            </p>
                          </div>
                          {item.timestamp && (
                            <div className="text-right flex-shrink-0">
                              <p
                                className={`text-xs font-semibold ${
                                  item.completed || item.current
                                    ? 'text-slate-600'
                                    : 'text-slate-400'
                                }`}
                              >
                                {item.timestamp}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tracking Number */}
              {orderData.trackingNumber && (
                <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-slate-600 mb-1">
                        TRACKING NUMBER
                      </p>
                      <p className="text-lg font-bold text-slate-900">
                        {orderData.trackingNumber}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(orderData.trackingNumber);
                        toast.success('Tracking number copied!');
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Product Details */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-600" />
                  Product Details
                </h2>

                <div className="flex gap-4">
                  <div className="w-24 h-24 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                    {orderData.product.image ? (
                      <Image
                        src={orderData.product.image}
                        alt={orderData.product.name}
                        width={96}
                        height={96}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="w-10 h-10 text-slate-400" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 mb-2 line-clamp-2">
                      {orderData.product.name}
                    </h3>
                    <p className="text-sm text-slate-600 mb-2">
                      SKU: {orderData.product.sku}
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-slate-600">
                        Qty: {orderData.product.quantity}
                      </p>
                      <p className="text-lg font-bold text-blue-600">
                        ₹{orderData.product.price.toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-200">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-600">Payment Method</span>
                    <span className="font-semibold text-slate-900">
                      {orderData.payment.method}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Payment Status</span>
                    <span className="font-semibold text-orange-600">
                      {orderData.payment.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Delivery Address */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  Delivery Address
                </h2>

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-slate-600 mb-1">Name</p>
                      <p className="font-semibold text-slate-900">
                        {orderData.customer.name}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-slate-600 mb-1">Phone</p>
                      <p className="font-semibold text-slate-900">
                        {orderData.customer.phone}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-slate-600 mb-1">Email</p>
                      <p className="font-semibold text-slate-900">
                        {orderData.customer.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Home className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-slate-600 mb-1">Address</p>
                      <p className="font-semibold text-slate-900">
                        {orderData.customer.address}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Actions */}
            {(canCancelOrder() || canRequestRefund() || canRequestReplacement()) && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Order Actions</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {canCancelOrder() && (
                    <button
                      onClick={() => setShowCancelModal(true)}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-red-50 border-2 border-red-200 text-red-700 rounded-lg font-semibold hover:bg-red-100 transition-colors"
                    >
                      <XCircle className="w-5 h-5" />
                      <span>Cancel Order</span>
                    </button>
                  )}
                  {canRequestRefund() && (
                    <button
                      onClick={() => setShowRefundModal(true)}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-orange-50 border-2 border-orange-200 text-orange-700 rounded-lg font-semibold hover:bg-orange-100 transition-colors"
                    >
                      <RotateCcw className="w-5 h-5" />
                      <span>Request Refund</span>
                    </button>
                  )}
                  {canRequestReplacement() && (
                    <button
                      onClick={() => setShowReplacementModal(true)}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 border-2 border-blue-200 text-blue-700 rounded-lg font-semibold hover:bg-blue-100 transition-colors"
                    >
                      <RefreshCw className="w-5 h-5" />
                      <span>Request Replacement</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => {
                  setOrderData(null);
                  setOrderNumber('');
                  setSearched(false);
                }}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Track Another Order
              </button>
              <Link
                href="/support"
                className="px-8 py-3 border-2 border-slate-300 text-slate-700 text-center rounded-lg font-semibold hover:bg-slate-50 transition-colors"
              >
                Need Help?
              </Link>
            </div>
          </div>
        )}
      </main>

      <Footer />

      {/* Cancel Order Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 relative animate-fade-in">
            <button
              onClick={() => setShowCancelModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Cancel Order</h3>
                <p className="text-sm text-slate-600">Order #{orderData?.orderNumber}</p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-sm text-slate-700 mb-4">
                Are you sure you want to cancel this order? Please provide a reason for cancellation.
              </p>

              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Reason for Cancellation *
              </label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 mb-3"
              >
                <option value="">Select a reason</option>
                <option value="Changed my mind">Changed my mind</option>
                <option value="Found better price elsewhere">Found better price elsewhere</option>
                <option value="Ordered by mistake">Ordered by mistake</option>
                <option value="Delivery taking too long">Delivery taking too long</option>
                <option value="Need to change delivery address">Need to change delivery address</option>
                <option value="Other">Other</option>
              </select>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-xs text-yellow-800">
                  <strong>Note:</strong> Refund will be processed within 5-7 business days after cancellation.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 px-4 py-3 border-2 border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition-colors"
              >
                Keep Order
              </button>
              <button
                onClick={handleCancelOrder}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
              >
                Cancel Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refund Request Modal */}
      {showRefundModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 relative animate-fade-in">
            <button
              onClick={() => setShowRefundModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <RotateCcw className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Request Refund</h3>
                <p className="text-sm text-slate-600">Order #{orderData?.orderNumber}</p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-sm text-slate-700 mb-4">
                Please provide a reason for your refund request. Our team will review and process it within 3-5 business days.
              </p>

              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Reason for Refund *
              </label>
              <select
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 mb-3"
              >
                <option value="">Select a reason</option>
                <option value="Product damaged">Product damaged</option>
                <option value="Wrong product received">Wrong product received</option>
                <option value="Product not as described">Product not as described</option>
                <option value="Quality issues">Quality issues</option>
                <option value="Not satisfied with product">Not satisfied with product</option>
                <option value="Other">Other</option>
              </select>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800">
                  <strong>Refund Policy:</strong> Full refund will be issued after product inspection. Return shipping may apply.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowRefundModal(false)}
                className="flex-1 px-4 py-3 border-2 border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRefundRequest}
                className="flex-1 px-4 py-3 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-colors"
              >
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Replacement Request Modal */}
      {showReplacementModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 relative animate-fade-in">
            <button
              onClick={() => setShowReplacementModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <RefreshCw className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Request Replacement</h3>
                <p className="text-sm text-slate-600">Order #{orderData?.orderNumber}</p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-sm text-slate-700 mb-4">
                Please provide a reason for your replacement request. Our team will contact you within 24 hours.
              </p>

              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Reason for Replacement *
              </label>
              <select
                value={replacementReason}
                onChange={(e) => setReplacementReason(e.target.value)}
                className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-3"
              >
                <option value="">Select a reason</option>
                <option value="Defective product">Defective product</option>
                <option value="Product damaged during delivery">Product damaged during delivery</option>
                <option value="Missing parts/accessories">Missing parts/accessories</option>
                <option value="Wrong size/color">Wrong size/color</option>
                <option value="Product stopped working">Product stopped working</option>
                <option value="Other">Other</option>
              </select>

              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                <p className="text-xs text-emerald-800">
                  <strong>Replacement Process:</strong> We'll arrange pickup of the defective item and deliver the replacement.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowReplacementModal(false)}
                className="flex-1 px-4 py-3 border-2 border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReplacementRequest}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
