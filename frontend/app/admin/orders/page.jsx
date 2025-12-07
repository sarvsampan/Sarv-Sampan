'use client';

import { useEffect, useState } from 'react';
import { orderAPI } from '@/lib/api';
import { Search, Eye, Package, Truck, CheckCircle, XCircle, ShoppingCart } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await orderAPI.getAll();
      setOrders(response.data || []);
    } catch (error) {
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await orderAPI.updateStatus(orderId, { status: newStatus });

      if (newStatus === 'shipped') {
        toast.success('Order marked as shipped! Tracking number auto-generated.');
      } else {
        toast.success('Order status updated successfully');
      }

      fetchOrders();
    } catch (error) {
      toast.error('Failed to update order status');
    }
  };

  const handleViewDetails = async (orderId) => {
    try {
      const response = await orderAPI.getById(orderId);
      setSelectedOrder(response.data);
      setShowDetailsModal(true);
    } catch (error) {
      toast.error('Failed to fetch order details');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-amber-100 text-amber-700',
      processing: 'bg-blue-100 text-blue-700',
      shipped: 'bg-purple-100 text-purple-700',
      delivered: 'bg-emerald-100 text-emerald-700',
      cancelled: 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: Package,
      processing: Package,
      shipped: Truck,
      delivered: CheckCircle,
      cancelled: XCircle,
    };
    return icons[status] || Package;
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user?.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = !statusFilter || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-3 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="mt-3 text-sm text-slate-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-slate-50 min-h-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Orders</h1>
          <p className="text-xs text-slate-600 mt-0.5">Manage customer orders and shipping</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by order number or customer email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm cursor-pointer"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4">
              <ShoppingCart className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 mb-1">No orders found</h3>
            <p className="text-xs text-slate-500">
              {searchTerm ? 'Try adjusting your search terms' : 'Orders will appear here once customers start placing them'}
            </p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-700 uppercase">Order Number</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-700 uppercase">Customer</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-700 uppercase">Date</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-700 uppercase">Total</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-700 uppercase">Status</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-700 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.map((order) => {
                const StatusIcon = getStatusIcon(order.status);
                return (
                  <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-slate-900">#{order.order_number}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-slate-900">{order.customer_email || 'Guest'}</div>
                      <div className="text-xs text-slate-500">{order.customer_phone || 'N/A'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-slate-900">{format(new Date(order.created_at), 'MMM dd, yyyy')}</div>
                      <div className="text-xs text-slate-500">{format(new Date(order.created_at), 'hh:mm a')}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-semibold text-slate-900">₹{order.total_amount}</span>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)} border-0 cursor-pointer`}
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleViewDetails(order.id)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Order Details Modal */}
      {showDetailsModal && selectedOrder && (
        <div
          className="fixed inset-0 bg-slate-900/40 flex items-start justify-center z-50 p-4 overflow-y-auto"
          onClick={() => setShowDetailsModal(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-2xl my-8 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-6 py-4">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Order #{selectedOrder.order_number}
                  </h2>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {format(new Date(selectedOrder.created_at), 'MMM dd, yyyy • hh:mm a')}
                  </p>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-lg transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 max-h-[70vh] overflow-y-auto bg-slate-50">
              {/* Status Cards Row */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
                  <p className="text-xs text-slate-500 mb-1">Order Status</p>
                  <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedOrder.status)}`}>
                    {selectedOrder.status}
                  </span>
                </div>
                <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
                  <p className="text-xs text-slate-500 mb-1">Payment Status</p>
                  <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
                    selectedOrder.payment_status === 'paid'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    {selectedOrder.payment_status || 'pending'}
                  </span>
                </div>
                <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
                  <p className="text-xs text-slate-500 mb-1">Total Amount</p>
                  <p className="text-lg font-bold text-blue-600">₹{selectedOrder.total_amount}</p>
                </div>
              </div>

              {/* Order Items */}
              {selectedOrder.items && selectedOrder.items.length > 0 && (
                <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm mb-4">
                  <h3 className="text-sm font-bold text-slate-900 mb-3">Order Items</h3>
                  <div className="space-y-3">
                    {selectedOrder.items.map((item, index) => (
                      <div key={item.id || index} className="flex items-center gap-3 pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                        <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          {item.product_image ? (
                            <img src={item.product_image} alt={item.product_name} className="w-full h-full object-cover rounded-lg" />
                          ) : (
                            <Package className="w-6 h-6 text-slate-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">{item.product_name}</p>
                          {item.product_sku && (
                            <p className="text-xs text-slate-500">SKU: {item.product_sku}</p>
                          )}
                          <p className="text-xs text-slate-600 mt-0.5">₹{item.price} × {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-slate-900">₹{item.total}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Customer Info */}
              <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm mb-4">
                <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center">
                  <Package className="w-4 h-4 mr-2 text-blue-600" />
                  Customer Information
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-sm text-slate-600">Name</span>
                    <span className="text-sm font-semibold text-slate-900">
                      {selectedOrder.user ? `${selectedOrder.user.first_name || ''} ${selectedOrder.user.last_name || ''}`.trim() || 'N/A' : selectedOrder.shipping_address?.fullName || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-sm text-slate-600">Email</span>
                    <span className="text-sm font-medium text-slate-900">{selectedOrder.customer_email || selectedOrder.user?.email || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-slate-600">Phone</span>
                    <span className="text-sm font-medium text-slate-900">{selectedOrder.customer_phone || selectedOrder.user?.phone || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Order Summary */}
              <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm mb-4">
                <h3 className="text-sm font-bold text-slate-900 mb-3">Order Summary</h3>
                <div className="space-y-2.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Subtotal</span>
                    <span className="font-medium text-slate-900">₹{selectedOrder.subtotal || 0}</span>
                  </div>
                  {selectedOrder.discount_amount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-emerald-600">Discount</span>
                      <span className="font-medium text-emerald-600">-₹{selectedOrder.discount_amount}</span>
                    </div>
                  )}
                  {selectedOrder.tax_amount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Tax</span>
                      <span className="font-medium text-slate-900">₹{selectedOrder.tax_amount}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm pb-2">
                    <span className="text-slate-600">Shipping</span>
                    <span className="font-medium text-slate-900">₹{selectedOrder.shipping_amount || 0}</span>
                  </div>
                  <div className="flex justify-between text-base pt-3 border-t-2 border-slate-200">
                    <span className="font-bold text-slate-900">Total</span>
                    <span className="font-bold text-blue-600">₹{selectedOrder.total_amount}</span>
                  </div>
                </div>
              </div>

              {/* Payment & Shipping Info */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 mb-3">Payment Method</h3>
                  <p className="text-sm font-medium text-slate-900 uppercase">{selectedOrder.payment_method || 'N/A'}</p>
                </div>
                {selectedOrder.tracking_number && (
                  <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-900 mb-3">Tracking Number</h3>
                    <p className="text-sm font-medium text-slate-900">{selectedOrder.tracking_number}</p>
                  </div>
                )}
              </div>

              {/* Notes */}
              {(selectedOrder.notes || selectedOrder.admin_notes) && (
                <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 mb-3">Notes</h3>
                  <div className="space-y-2">
                    {selectedOrder.notes && (
                      <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg">
                        <p className="text-xs font-semibold text-blue-900 mb-1">Customer Note</p>
                        <p className="text-sm text-slate-700">{selectedOrder.notes}</p>
                      </div>
                    )}
                    {selectedOrder.admin_notes && (
                      <div className="bg-amber-50 border border-amber-100 p-3 rounded-lg">
                        <p className="text-xs font-semibold text-amber-900 mb-1">Admin Note</p>
                        <p className="text-sm text-slate-700">{selectedOrder.admin_notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-white border-t border-slate-200">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
