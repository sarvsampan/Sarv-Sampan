'use client';

import { useEffect, useState } from 'react';
import { returnAPI } from '@/lib/api';
import { Search, Eye, CheckCircle, XCircle, Package, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function Returns() {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchReturns();
  }, [statusFilter]);

  const fetchReturns = async () => {
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;

      const response = await returnAPI.getAll(params);
      setReturns(response.data?.returns || []);
    } catch (error) {
      toast.error('Failed to fetch returns');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (returnId) => {
    try {
      const response = await returnAPI.getById(returnId);
      setSelectedReturn(response.data);
      setShowDetailsModal(true);
    } catch (error) {
      toast.error('Failed to fetch return details');
    }
  };

  const handleUpdateStatus = async (returnId, newStatus, adminNotes = '') => {
    setActionLoading(true);
    try {
      await returnAPI.updateStatus(returnId, {
        status: newStatus,
        admin_notes: adminNotes || undefined
      });

      const statusText = {
        approved: 'approved',
        rejected: 'rejected',
        refunded: 'refunded'
      }[newStatus];

      toast.success(`Return ${statusText} successfully`);
      setShowDetailsModal(false);
      fetchReturns();
    } catch (error) {
      toast.error(error.message || 'Failed to update return status');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-amber-100 text-amber-700',
      approved: 'bg-blue-100 text-blue-700',
      rejected: 'bg-red-100 text-red-700',
      refunded: 'bg-emerald-100 text-emerald-700',
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  };

  const filteredReturns = returns.filter((returnReq) =>
    returnReq.return_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    returnReq.order?.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    returnReq.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-3 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="mt-3 text-sm text-slate-600">Loading returns...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-slate-50 min-h-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Returns & Refunds</h1>
          <p className="text-xs text-slate-600 mt-0.5">Manage return requests and refunds</p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by return number, order number, or email..."
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
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="refunded">Refunded</option>
        </select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
          <div className="text-xs font-medium text-slate-600">Total Returns</div>
          <div className="text-xl font-bold text-slate-900 mt-1">
            {returns.length}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
          <div className="text-xs font-medium text-slate-600">Pending</div>
          <div className="text-xl font-bold text-amber-600 mt-1">
            {returns.filter((r) => r.status === 'pending').length}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
          <div className="text-xs font-medium text-slate-600">Approved</div>
          <div className="text-xl font-bold text-blue-600 mt-1">
            {returns.filter((r) => r.status === 'approved').length}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
          <div className="text-xs font-medium text-slate-600">Refunded</div>
          <div className="text-xl font-bold text-emerald-600 mt-1">
            {returns.filter((r) => r.status === 'refunded').length}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
        {filteredReturns.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4">
              <RefreshCw className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 mb-1">No returns found</h3>
            <p className="text-xs text-slate-500">
              {searchTerm ? 'Try adjusting your search terms' : 'Return requests will appear here'}
            </p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-700 uppercase">Return #</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-700 uppercase">Order #</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-700 uppercase">Customer</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-700 uppercase">Reason</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-700 uppercase">Amount</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-700 uppercase">Date</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-700 uppercase">Status</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-700 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReturns.map((returnReq) => {
                const userName = returnReq.user
                  ? `${returnReq.user.first_name || ''} ${returnReq.user.last_name || ''}`.trim()
                  : 'N/A';

                return (
                <tr key={returnReq.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium text-slate-900">{returnReq.order_number || 'N/A'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-slate-900">#{returnReq.order?.order_number || 'N/A'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-slate-900">{userName}</div>
                    <div className="text-xs text-slate-500">{returnReq.user?.email || 'N/A'}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-slate-600 line-clamp-2">{returnReq.reason}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-semibold text-slate-900">₹{returnReq.refund_amount}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-slate-900">{format(new Date(returnReq.created_at), 'MMM dd, yyyy')}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(returnReq.status)}`}
                    >
                      {returnReq.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleViewDetails(returnReq.id)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
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

      {/* Return Details Modal */}
      {showDetailsModal && selectedReturn && (
        <div
          className="fixed inset-0 bg-slate-900/40 flex items-start justify-center z-50 p-4 overflow-y-auto"
          onClick={() => setShowDetailsModal(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl w-full max-w-2xl my-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-6 py-4">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Return Request
                  </h2>
                  <p className="text-sm text-slate-500 mt-0.5">
                    Order #{selectedReturn.order?.order_number || selectedReturn.order_number} • {format(new Date(selectedReturn.created_at), 'MMM dd, yyyy • hh:mm a')}
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
              {/* Status */}
              <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Current Status</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold capitalize ${getStatusColor(selectedReturn.status)}`}>
                      {selectedReturn.status}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500 mb-1">Refund Amount</p>
                    <p className="text-2xl font-bold text-blue-600">₹{selectedReturn.refund_amount}</p>
                  </div>
                </div>
              </div>

              {/* Customer & Return Info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 mb-3">Customer</h3>
                  <p className="text-sm text-slate-900 font-medium">
                    {selectedReturn.user ? `${selectedReturn.user.first_name || ''} ${selectedReturn.user.last_name || ''}`.trim() : 'N/A'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">{selectedReturn.user?.email}</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 mb-3">Refund Method</h3>
                  <p className="text-sm text-slate-900 font-medium capitalize">{selectedReturn.refund_method || 'Original Payment'}</p>
                </div>
              </div>

              {/* Return Reason */}
              <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 mb-2">Return Reason</h3>
                <p className="text-sm font-medium text-slate-700">{selectedReturn.reason}</p>
                {selectedReturn.description && (
                  <p className="text-sm text-slate-600 mt-2">{selectedReturn.description}</p>
                )}
              </div>

              {/* Uploaded Images */}
              {selectedReturn.images && selectedReturn.images.length > 0 && (
                <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 mb-3">Uploaded Images</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {selectedReturn.images.map((image, index) => (
                      <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200">
                        <img
                          src={image}
                          alt={`Return image ${index + 1}`}
                          className="w-full h-full object-cover hover:scale-110 transition-transform duration-300 cursor-pointer"
                          onClick={() => window.open(image, '_blank')}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Admin Notes */}
              {selectedReturn.admin_notes && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h3 className="text-sm font-bold text-amber-900 mb-2">Admin Notes</h3>
                  <p className="text-sm text-amber-800">{selectedReturn.admin_notes}</p>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            {selectedReturn.status === 'pending' && (
              <div className="px-6 py-4 bg-white border-t border-slate-200 flex gap-3">
                <button
                  onClick={() => handleUpdateStatus(selectedReturn.id, 'rejected', 'Return request rejected by admin')}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  {actionLoading ? 'Processing...' : 'Reject'}
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedReturn.id, 'approved', 'Return request approved')}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  {actionLoading ? 'Processing...' : 'Approve'}
                </button>
              </div>
            )}
            {selectedReturn.status === 'approved' && (
              <div className="px-6 py-4 bg-white border-t border-slate-200">
                <button
                  onClick={() => handleUpdateStatus(selectedReturn.id, 'refunded', 'Refund processed successfully')}
                  disabled={actionLoading}
                  className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  {actionLoading ? 'Processing...' : 'Mark as Refunded'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
