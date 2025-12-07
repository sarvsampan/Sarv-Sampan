'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
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
  const [refundImages, setRefundImages] = useState([]);
  const [replacementImages, setReplacementImages] = useState([]);

  // Request status states
  const [returnRequest, setReturnRequest] = useState(null);
  const [replacementRequest, setReplacementRequest] = useState(null);

  // Loading states for requests
  const [refundLoading, setRefundLoading] = useState(false);
  const [replacementLoading, setReplacementLoading] = useState(false);

  // Auto-load order from URL parameter
  useEffect(() => {
    const orderParam = searchParams.get('order');
    if (orderParam) {
      handleTrackOrderWithParam(orderParam);
    }
  }, [searchParams]);

  const handleTrackOrderWithParam = async (orderNum) => {
    setLoading(true);
    setSearched(true);

    try {
      const response = await orderAPI.getOrderByNumber(orderNum.trim());

      if (response.data) {
        // Transform backend data to match UI format
        const transformedOrder = transformOrderData(response.data);
        setOrderData(transformedOrder);

        // Fetch return/replacement requests
        fetchRequestsStatus(transformedOrder.id);
      }
    } catch (error) {
      setOrderData(null);
      toast.error('Order not found. Please check your order number.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch return/replacement request status
  const fetchRequestsStatus = async (orderId) => {
    try {
      const userToken = localStorage.getItem('userToken');
      if (!userToken) return;

      const { returnAPI, replacementAPI } = await import('@/lib/userApi');

      // Fetch all requests and filter by order_id
      const [returnRes, replacementRes] = await Promise.all([
        returnAPI.getMyReturnRequests().catch(() => ({ data: [] })),
        replacementAPI.getMyReplacementRequests().catch(() => ({ data: [] }))
      ]);

      // Find request for this specific order
      const returnReq = returnRes.data?.find(r => r.order_id === orderId);
      const replacementReq = replacementRes.data?.find(r => r.order_id === orderId);

      setReturnRequest(returnReq || null);
      setReplacementRequest(replacementReq || null);
    } catch (error) {
      console.error('Error fetching requests:', error);
    }
  };

  // Transform backend order data to UI format
  const transformOrderData = (order) => {
    // Calculate estimated delivery (3-5 business days from order date)
    const orderDate = new Date(order.created_at);
    const estimatedDate = new Date(orderDate);
    estimatedDate.setDate(estimatedDate.getDate() + 5); // Add 5 days for delivery

    return {
      id: order.id, // ✅ Added order ID
      orderNumber: order.order_number,
      orderDate: new Date(order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }),
      estimatedDelivery: order.delivered_at || estimatedDate.toISOString(),
      currentStatus: order.status,
      items: (order.order_items || []).map(item => ({
        id: item.product_id || '',
        name: item.product_name || 'Product',
        image: item.product_image || null,
        price: item.price || 0,
        quantity: item.quantity || 1,
        slug: item.product_slug || '',
        sku: item.product_slug || 'N/A'
      })),
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
      subtotal: order.subtotal || 0,
      shipping: order.shipping_amount || order.shipping_cost || 0,
      discount: order.discount_amount || 0,
      total: order.total_amount || 0,
      trackingNumber: order.tracking_number || 'Not available',
      statusHistory: generateStatusHistory(order)
    };
  };

  // Generate status history based on order status
  const generateStatusHistory = (order) => {
    // If order is cancelled, show only cancelled status
    if (order.status === 'cancelled') {
      return [
        {
          status: 'cancelled',
          title: 'Order Cancelled',
          description: 'Your order has been cancelled',
          timestamp: new Date(order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
          completed: true,
          current: true,
          cancelled: true
        }
      ];
    }

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

  const getStatusIcon = (status, completed, current, cancelled) => {
    if (cancelled) {
      return <XCircle className="w-6 h-6 text-white" />;
    }
    if (completed) {
      return <CheckCircle className="w-6 h-6 text-white" />;
    }
    return <div className="w-2 h-2 bg-slate-400 rounded-full"></div>;
  };

  // Handle image upload
  const handleImageUpload = (e, type) => {
    const files = Array.from(e.target.files);
    const currentImages = type === 'refund' ? refundImages : replacementImages;

    // Check if adding these files would exceed the limit
    if (currentImages.length + files.length > 5) {
      toast.error(`Maximum 5 images allowed. You can add ${5 - currentImages.length} more image(s).`);
      return;
    }

    // Convert files to base64 for preview and upload
    const imagePromises = files.map(file => {
      return new Promise((resolve, reject) => {
        // Check file size (max 5MB per image)
        if (file.size > 5 * 1024 * 1024) {
          reject(new Error('Image size should be less than 5MB'));
          return;
        }

        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    });

    Promise.all(imagePromises).then(newImages => {
      if (type === 'refund') {
        setRefundImages([...currentImages, ...newImages]);
      } else {
        setReplacementImages([...currentImages, ...newImages]);
      }
      toast.success(`${newImages.length} image(s) added successfully`);
    }).catch(error => {
      toast.error(error.message || 'Error uploading images');
      console.error('Image upload error:', error);
    });

    // Reset input value to allow selecting the same file again
    e.target.value = '';
  };

  // Remove image from upload
  const removeImage = (index, type) => {
    if (type === 'refund') {
      setRefundImages(prev => prev.filter((_, i) => i !== index));
    } else {
      setReplacementImages(prev => prev.filter((_, i) => i !== index));
    }
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
  const handleRefundRequest = async () => {
    if (!refundReason.trim()) {
      toast.error('Please provide a reason for refund request');
      return;
    }

    // Check if replacement request already exists
    if (replacementRequest) {
      toast.error('Cannot request refund - replacement request already exists for this order');
      return;
    }

    setRefundLoading(true);
    try {
      const { returnAPI } = await import('@/lib/userApi');

      await returnAPI.createReturnRequest({
        order_id: orderData.id,
        order_number: orderData.orderNumber,
        reason: refundReason.trim(),
        images: refundImages
      });

      toast.success('Refund request submitted successfully! We will review and process within 3-5 business days.');
      setShowRefundModal(false);
      setRefundReason('');
      setRefundImages([]);

      // Reload request status
      fetchRequestsStatus(orderData.id);
    } catch (error) {
      console.error('Error submitting refund request:', error);
      toast.error(error?.message || 'Failed to submit refund request');
    } finally {
      setRefundLoading(false);
    }
  };

  // Replacement Request Handler
  const handleReplacementRequest = async () => {
    if (!replacementReason.trim()) {
      toast.error('Please provide a reason for replacement request');
      return;
    }

    // Check if return request already exists
    if (returnRequest) {
      toast.error('Cannot request replacement - refund request already exists for this order');
      return;
    }

    setReplacementLoading(true);
    try {
      const { replacementAPI } = await import('@/lib/userApi');

      await replacementAPI.createReplacementRequest({
        order_id: orderData.id,
        order_number: orderData.orderNumber,
        reason: replacementReason.trim(),
        images: replacementImages
      });

      toast.success('Replacement request submitted successfully! Our team will contact you within 24 hours.');
      setShowReplacementModal(false);
      setReplacementReason('');
      setReplacementImages([]);

      // Reload request status
      fetchRequestsStatus(orderData.id);
    } catch (error) {
      console.error('Error submitting replacement request:', error);
      toast.error(error?.message || 'Failed to submit replacement request');
    } finally {
      setReplacementLoading(false);
    }
  };

  // Check if order can be cancelled
  const canCancelOrder = () => {
    if (!orderData) return false;
    const cancellableStatuses = ['ordered', 'confirmed', 'packed', 'processing'];
    return cancellableStatuses.includes(orderData.currentStatus);
  };

  // Cancel Return Request
  const handleCancelReturnRequest = async () => {
    if (!returnRequest) return;

    try {
      const { returnAPI } = await import('@/lib/userApi');
      await returnAPI.deleteReturnRequest(returnRequest.id);

      toast.success('Refund request cancelled successfully');
      setReturnRequest(null);
    } catch (error) {
      console.error('Error cancelling return request:', error);
      toast.error('Failed to cancel refund request');
    }
  };

  // Cancel Replacement Request
  const handleCancelReplacementRequest = async () => {
    if (!replacementRequest) return;

    try {
      const { replacementAPI } = await import('@/lib/userApi');
      await replacementAPI.deleteReplacementRequest(replacementRequest.id);

      toast.success('Replacement request cancelled successfully');
      setReplacementRequest(null);
    } catch (error) {
      console.error('Error cancelling replacement request:', error);
      toast.error('Failed to cancel replacement request');
    }
  };

  // Check if refund can be requested
  const canRequestRefund = () => {
    if (!orderData) return false;
    // Don't show button if refund request already exists
    if (returnRequest) return false;
    // Don't show button if replacement request already exists
    if (replacementRequest) return false;
    return orderData.currentStatus === 'delivered';
  };

  // Check if replacement can be requested
  const canRequestReplacement = () => {
    if (!orderData) return false;
    // Don't show button if replacement request already exists
    if (replacementRequest) return false;
    // Don't show button if refund request already exists
    if (returnRequest) return false;
    return orderData.currentStatus === 'delivered';
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/account/orders"
            className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-2 text-sm mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to My Orders</span>
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
            Order Details
          </h1>
          <p className="text-slate-600">
            View your order status and tracking information
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="max-w-2xl mx-auto text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-slate-600">Loading order details...</p>
          </div>
        )}

        {/* Order Not Found */}
        {!loading && searched && !orderData && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl border border-red-200 shadow-lg p-8 text-center">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-10 h-10 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Order Not Found</h2>
              <p className="text-slate-600 mb-6">
                We couldn't find this order. Please check your order number and try again.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/account/orders"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
                >
                  Go to My Orders
                </Link>
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Order Items */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-600" />
                  Order Items ({orderData.items.length})
                </h2>

                <div className="space-y-4 mb-4">
                  {orderData.items.map((item, index) => (
                    <Link
                      key={index}
                      href={`/product/${item.slug}`}
                      className="flex gap-4 pb-4 border-b border-slate-200 last:border-b-0 hover:bg-slate-50 rounded-lg p-2 -m-2 transition-colors cursor-pointer"
                    >
                      <div className="w-20 h-20 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={item.name}
                            width={80}
                            height={80}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShoppingBag className="w-8 h-8 text-slate-400" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-900 mb-1 line-clamp-2 hover:text-blue-600 transition-colors">
                          {item.name}
                        </h3>
                        <p className="text-xs text-slate-500 mb-2">
                          SKU: {item.sku}
                        </p>
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-slate-600">
                            Qty: {item.quantity}
                          </p>
                          <p className="text-base font-bold text-blue-600">
                            ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Order Summary */}
                <div className="pt-4 border-t-2 border-slate-200 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Subtotal</span>
                    <span className="font-semibold text-slate-900">
                      ₹{orderData.subtotal.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Shipping</span>
                    <span className="font-semibold text-slate-900">
                      {orderData.shipping === 0 ? (
                        <span className="text-emerald-600">FREE</span>
                      ) : (
                        `₹${orderData.shipping.toLocaleString('en-IN')}`
                      )}
                    </span>
                  </div>
                  {orderData.discount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Discount</span>
                      <span className="font-semibold text-emerald-600">
                        -₹{orderData.discount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-base pt-2 border-t border-slate-200">
                    <span className="font-bold text-slate-900">Total</span>
                    <span className="font-bold text-blue-600 text-lg">
                      ₹{orderData.total.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Payment Info */}
                <div className="mt-4 pt-4 border-t-2 border-slate-200">
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

            {/* Status Timeline */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-2">
                <Truck className="w-6 h-6 text-blue-600" />
                Order Tracking Status
              </h2>

              <div className="relative">
                {orderData.statusHistory.map((item, index) => (
                  <div key={index} className="flex gap-4 pb-8 last:pb-0">
                    {/* Timeline Line */}
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center z-10 ${
                          item.cancelled
                            ? 'bg-gradient-to-br from-red-500 to-red-600 shadow-lg'
                            : item.completed
                            ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg'
                            : item.current
                            ? 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg animate-pulse'
                            : 'bg-slate-200'
                        }`}
                      >
                        {getStatusIcon(item.status, item.completed, item.current, item.cancelled)}
                      </div>
                      {index !== orderData.statusHistory.length - 1 && (
                        <div
                          className={`w-0.5 flex-1 mt-2 ${
                            item.cancelled ? 'bg-red-500' : item.completed ? 'bg-emerald-500' : 'bg-slate-200'
                          }`}
                          style={{ minHeight: '40px' }}
                        ></div>
                      )}
                    </div>

                    {/* Status Info */}
                    <div className="flex-1 pb-4">
                      <div
                        className={`${
                          item.cancelled
                            ? 'bg-red-50 border-2 border-red-500'
                            : item.current
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

            {/* Return/Replacement Request Status */}
            {(returnRequest || replacementRequest) && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-200 shadow-lg p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-600" />
                  Request Status
                </h3>
                <div className="space-y-3">
                  {returnRequest && (
                    <div className="bg-white rounded-lg p-4 border border-blue-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-slate-900">Refund Request</p>
                          <p className="text-xs text-slate-600 mt-1">
                            Reason: {returnRequest.reason}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          returnRequest.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          returnRequest.status === 'approved' ? 'bg-green-100 text-green-700' :
                          returnRequest.status === 'rejected' ? 'bg-red-100 text-red-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {returnRequest.status.toUpperCase()}
                        </span>
                      </div>
                      {returnRequest.admin_notes && (
                        <p className="text-xs text-slate-600 mt-2 p-2 bg-slate-50 rounded">
                          <strong>Admin Note:</strong> {returnRequest.admin_notes}
                        </p>
                      )}
                      {returnRequest.status === 'pending' && (
                        <button
                          onClick={handleCancelReturnRequest}
                          className="mt-3 w-full px-4 py-2 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm font-semibold hover:bg-red-100 transition-colors"
                        >
                          Cancel Refund Request
                        </button>
                      )}
                    </div>
                  )}
                  {replacementRequest && (
                    <div className="bg-white rounded-lg p-4 border border-blue-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-slate-900">Replacement Request</p>
                          <p className="text-xs text-slate-600 mt-1">
                            Reason: {replacementRequest.reason}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          replacementRequest.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          replacementRequest.status === 'approved' ? 'bg-green-100 text-green-700' :
                          replacementRequest.status === 'rejected' ? 'bg-red-100 text-red-700' :
                          replacementRequest.status === 'shipped' ? 'bg-purple-100 text-purple-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {replacementRequest.status.toUpperCase()}
                        </span>
                      </div>
                      {replacementRequest.admin_notes && (
                        <p className="text-xs text-slate-600 mt-2 p-2 bg-slate-50 rounded">
                          <strong>Admin Note:</strong> {replacementRequest.admin_notes}
                        </p>
                      )}
                      {replacementRequest.status === 'pending' && (
                        <button
                          onClick={handleCancelReplacementRequest}
                          className="mt-3 w-full px-4 py-2 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm font-semibold hover:bg-red-100 transition-colors"
                        >
                          Cancel Replacement Request
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

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
          </div>
        )}
      </main>

      <Footer />

      {/* Cancel Order Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
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
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 relative animate-fade-in my-8 max-h-[90vh] overflow-y-auto">
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

              <label className="block text-sm font-semibold text-slate-900 mb-2 mt-4">
                Upload Images (Optional) - {refundImages.length}/5
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleImageUpload(e, 'refund')}
                  className="hidden"
                  id="refund-image-upload"
                  disabled={refundImages.length >= 5}
                />
                <label
                  htmlFor="refund-image-upload"
                  className={`w-full px-4 py-3 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors ${
                    refundImages.length >= 5
                      ? 'border-slate-200 bg-slate-50 cursor-not-allowed'
                      : 'border-orange-300 hover:border-orange-500 hover:bg-orange-50'
                  }`}
                >
                  <Package className="w-8 h-8 text-orange-500 mb-2" />
                  <span className="text-sm font-medium text-slate-700">
                    {refundImages.length >= 5 ? 'Maximum images reached' : 'Click to select images'}
                  </span>
                  <span className="text-xs text-slate-500 mt-1">
                    You can select multiple images at once (Ctrl/Cmd + Click)
                  </span>
                </label>
              </div>
              <p className="text-xs text-slate-500 mt-2 mb-3">PNG, JPG up to 5MB each. Maximum 5 images total.</p>

              {refundImages.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {refundImages.map((image, index) => (
                    <div key={index} className="relative aspect-square">
                      <img
                        src={image}
                        alt={`Upload ${index + 1}`}
                        className="w-full h-full object-cover rounded-lg border border-slate-200"
                      />
                      <button
                        onClick={() => removeImage(index, 'refund')}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800">
                  <strong>Refund Policy:</strong> Full refund will be issued after product inspection. Return shipping may apply.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowRefundModal(false)}
                disabled={refundLoading}
                className="flex-1 px-4 py-3 border-2 border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleRefundRequest}
                disabled={refundLoading}
                className="flex-1 px-4 py-3 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {refundLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Submitting...
                  </>
                ) : (
                  'Submit Request'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Replacement Request Modal */}
      {showReplacementModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 relative animate-fade-in my-8 max-h-[90vh] overflow-y-auto">
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

              <label className="block text-sm font-semibold text-slate-900 mb-2 mt-4">
                Upload Images (Optional) - {replacementImages.length}/5
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleImageUpload(e, 'replacement')}
                  className="hidden"
                  id="replacement-image-upload"
                  disabled={replacementImages.length >= 5}
                />
                <label
                  htmlFor="replacement-image-upload"
                  className={`w-full px-4 py-3 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors ${
                    replacementImages.length >= 5
                      ? 'border-slate-200 bg-slate-50 cursor-not-allowed'
                      : 'border-blue-300 hover:border-blue-500 hover:bg-blue-50'
                  }`}
                >
                  <Package className="w-8 h-8 text-blue-500 mb-2" />
                  <span className="text-sm font-medium text-slate-700">
                    {replacementImages.length >= 5 ? 'Maximum images reached' : 'Click to select images'}
                  </span>
                  <span className="text-xs text-slate-500 mt-1">
                    You can select multiple images at once (Ctrl/Cmd + Click)
                  </span>
                </label>
              </div>
              <p className="text-xs text-slate-500 mt-2 mb-3">PNG, JPG up to 5MB each. Maximum 5 images total.</p>

              {replacementImages.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {replacementImages.map((image, index) => (
                    <div key={index} className="relative aspect-square">
                      <img
                        src={image}
                        alt={`Upload ${index + 1}`}
                        className="w-full h-full object-cover rounded-lg border border-slate-200"
                      />
                      <button
                        onClick={() => removeImage(index, 'replacement')}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                <p className="text-xs text-emerald-800">
                  <strong>Replacement Process:</strong> We'll arrange pickup of the defective item and deliver the replacement.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowReplacementModal(false)}
                disabled={replacementLoading}
                className="flex-1 px-4 py-3 border-2 border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleReplacementRequest}
                disabled={replacementLoading}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {replacementLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Submitting...
                  </>
                ) : (
                  'Submit Request'
                )}
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
