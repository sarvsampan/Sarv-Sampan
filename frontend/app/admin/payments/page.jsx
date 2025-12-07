'use client';

import { useEffect, useState } from 'react';
import { paymentAPI } from '@/lib/api';
import { Search, Eye, DollarSign, CreditCard, XCircle, CheckCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    fetchPayments();
  }, [statusFilter, methodFilter]);

  const fetchPayments = async () => {
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (methodFilter) params.payment_method = methodFilter;

      const response = await paymentAPI.getAll(params);
      setPayments(response.data?.payments || []);
    } catch (error) {
      toast.error('Failed to fetch payments');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (paymentId) => {
    try {
      const response = await paymentAPI.getById(paymentId);
      setSelectedPayment(response.data);
      setShowDetailsModal(true);
    } catch (error) {
      toast.error('Failed to fetch payment details');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      completed: 'bg-emerald-100 text-emerald-700',
      pending: 'bg-amber-100 text-amber-700',
      failed: 'bg-red-100 text-red-700',
      processing: 'bg-blue-100 text-blue-700',
      refunded: 'bg-purple-100 text-purple-700',
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  };

  const getPaymentMethodDisplay = (method) => {
    const methods = {
      credit_card: 'Credit Card',
      debit_card: 'Debit Card',
      upi: 'UPI',
      net_banking: 'Net Banking',
      wallet: 'Wallet',
    };
    return methods[method] || method;
  };

  const filteredPayments = payments.filter((payment) =>
    payment.payment_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.order?.order_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-3 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="mt-3 text-sm text-slate-600">Loading payments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-slate-50 min-h-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Payments</h1>
          <p className="text-xs text-slate-600 mt-0.5">View and manage all payment transactions</p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by payment ID, transaction ID, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
        >
          <option value="">All Status</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>
        <select
          value={methodFilter}
          onChange={(e) => setMethodFilter(e.target.value)}
          className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
        >
          <option value="">All Methods</option>
          <option value="credit_card">Credit Card</option>
          <option value="debit_card">Debit Card</option>
          <option value="upi">UPI</option>
          <option value="net_banking">Net Banking</option>
          <option value="wallet">Wallet</option>
        </select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
          <div className="text-xs font-medium text-slate-600">Total Payments</div>
          <div className="text-xl font-bold text-slate-900 mt-1">
            {payments.length}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
          <div className="text-xs font-medium text-slate-600">Completed</div>
          <div className="text-xl font-bold text-emerald-600 mt-1">
            {payments.filter((p) => p.status === 'completed').length}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
          <div className="text-xs font-medium text-slate-600">Pending</div>
          <div className="text-xl font-bold text-amber-600 mt-1">
            {payments.filter((p) => p.status === 'pending').length}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
          <div className="text-xs font-medium text-slate-600">Failed</div>
          <div className="text-xl font-bold text-red-600 mt-1">
            {payments.filter((p) => p.status === 'failed').length}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
        {filteredPayments.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4">
              <DollarSign className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 mb-1">No payments found</h3>
            <p className="text-xs text-slate-500">
              {searchTerm ? 'Try adjusting your search terms' : 'Payment transactions will appear here'}
            </p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-700 uppercase">Payment ID</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-700 uppercase">Order</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-700 uppercase">Customer</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-700 uppercase">Amount</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-700 uppercase">Method</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-700 uppercase">Gateway</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-700 uppercase">Date</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-700 uppercase">Status</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-700 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPayments.map((payment) => (
                <tr key={payment.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium text-slate-900">{payment.payment_id}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-slate-900">#{payment.order?.order_number || 'N/A'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-slate-900">{payment.user?.name || 'N/A'}</div>
                    <div className="text-xs text-slate-500">{payment.user?.email || 'N/A'}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-semibold text-slate-900">₹{payment.amount}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-slate-600">{getPaymentMethodDisplay(payment.payment_method)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-slate-600 capitalize">{payment.payment_gateway || 'N/A'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-slate-900">
                      {payment.payment_date ? format(new Date(payment.payment_date), 'MMM dd, yyyy') : 'Pending'}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(payment.status)}`}
                    >
                      {payment.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleViewDetails(payment.id)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Payment Details Modal */}
      {showDetailsModal && selectedPayment && (
        <div
          className="fixed inset-0 bg-slate-900/40 flex items-start justify-center z-50 p-4 overflow-y-auto"
          onClick={() => setShowDetailsModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-3xl my-8 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-6 py-4">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Payment #{selectedPayment.payment_id}
                  </h2>
                  <p className="text-sm text-slate-500 mt-0.5">
                    Transaction ID: {selectedPayment.transaction_id || 'N/A'}
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
            <div className="p-6 max-h-[70vh] overflow-y-auto bg-slate-50 space-y-4">
              {/* Payment Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs text-slate-500">Payment Status</p>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold capitalize ${getStatusColor(selectedPayment.status)}`}>
                      {selectedPayment.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-500">Amount</p>
                    <p className="text-2xl font-bold text-blue-600">₹{selectedPayment.amount}</p>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 mb-3">Payment Details</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-xs text-slate-500">Method</span>
                      <span className="text-xs font-medium text-slate-900">{getPaymentMethodDisplay(selectedPayment.payment_method)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-slate-500">Gateway</span>
                      <span className="text-xs font-medium text-slate-900 capitalize">{selectedPayment.payment_gateway || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-slate-500">Currency</span>
                      <span className="text-xs font-medium text-slate-900">{selectedPayment.currency}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer & Order Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 mb-3">Customer</h3>
                  <p className="text-sm text-slate-900 font-medium">{selectedPayment.user?.name}</p>
                  <p className="text-xs text-slate-500 mt-1">{selectedPayment.user?.email}</p>
                  {selectedPayment.user?.phone && (
                    <p className="text-xs text-slate-500 mt-1">{selectedPayment.user?.phone}</p>
                  )}
                </div>

                <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 mb-3">Order Details</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-xs text-slate-500">Order Number</span>
                      <span className="text-xs font-medium text-slate-900">#{selectedPayment.order?.order_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-slate-500">Order Total</span>
                      <span className="text-xs font-medium text-slate-900">₹{selectedPayment.order?.total_amount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-slate-500">Order Status</span>
                      <span className="text-xs font-medium text-slate-900 capitalize">{selectedPayment.order?.status}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 mb-3">Timeline</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Created At</p>
                    <p className="text-sm text-slate-900">{format(new Date(selectedPayment.created_at), 'MMM dd, yyyy • hh:mm a')}</p>
                  </div>
                  {selectedPayment.payment_date && (
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Payment Date</p>
                      <p className="text-sm text-slate-900">{format(new Date(selectedPayment.payment_date), 'MMM dd, yyyy • hh:mm a')}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
