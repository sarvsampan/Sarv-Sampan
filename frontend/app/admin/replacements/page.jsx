'use client';

import { useEffect, useState } from 'react';
import { replacementAPI } from '@/lib/api';
import { Search, Eye, CheckCircle, XCircle, Package, Truck, ClipboardCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function Replacements() {
  const [replacements, setReplacements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedReplacement, setSelectedReplacement] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showShipModal, setShowShipModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState('');

  useEffect(() => {
    fetchReplacements();
  }, [statusFilter]);

  const fetchReplacements = async () => {
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;

      const response = await replacementAPI.getAll(params);
      setReplacements(response.data?.replacements || []);
    } catch (error) {
      toast.error('Failed to fetch replacements');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (replacementId) => {
    try {
      const response = await replacementAPI.getById(replacementId);
      setSelectedReplacement(response.data);
      setShowDetailsModal(true);
    } catch (error) {
      toast.error('Failed to fetch replacement details');
    }
  };

  const handleUpdateStatus = async (replacementId, newStatus, adminNotes = '') => {
    setActionLoading(true);
    try {
      await replacementAPI.updateStatus(replacementId, {
        status: newStatus,
        admin_notes: adminNotes || undefined
      });

      const statusText = {
        approved: 'approved',
        rejected: 'rejected',
        shipped: 'shipped',
        completed: 'completed'
      }[newStatus];

      toast.success(`Replacement ${statusText} successfully`);
      setShowDetailsModal(false);
      setShowShipModal(false);
      fetchReplacements();
    } catch (error) {
      toast.error(error.message || 'Failed to update replacement status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleShipReplacement = async () => {
    if (!trackingNumber.trim()) {
      toast.error('Please enter tracking number');
      return;
    }

    setActionLoading(true);
    try {
      await replacementAPI.updateStatus(selectedReplacement.id, {
        status: 'shipped',
        tracking_number: trackingNumber,
        admin_notes: `Replacement shipped with tracking number: ${trackingNumber}`
      });

      toast.success('Replacement shipped successfully');
      setShowShipModal(false);
      setShowDetailsModal(false);
      setTrackingNumber('');
      fetchReplacements();
    } catch (error) {
      toast.error(error.message || 'Failed to ship replacement');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-amber-100 text-amber-700',
      approved: 'bg-blue-100 text-blue-700',
      rejected: 'bg-red-100 text-red-700',
      shipped: 'bg-purple-100 text-purple-700',
      completed: 'bg-emerald-100 text-emerald-700',
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  };

  const filteredReplacements = replacements.filter((replacement) =>
    replacement.replacement_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    replacement.order?.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    replacement.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-3 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="mt-3 text-sm text-slate-600">Loading replacements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-slate-50 min-h-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Product Replacements</h1>
          <p className="text-xs text-slate-600 mt-0.5">Manage product replacement requests</p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by replacement number, order number, or email..."
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
          <option value="shipped">Shipped</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-4">
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
          <div className="text-xs font-medium text-slate-600">Total</div>
          <div className="text-xl font-bold text-slate-900 mt-1">
            {replacements.length}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
          <div className="text-xs font-medium text-slate-600">Pending</div>
          <div className="text-xl font-bold text-amber-600 mt-1">
            {replacements.filter((r) => r.status === 'pending').length}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
          <div className="text-xs font-medium text-slate-600">Approved</div>
          <div className="text-xl font-bold text-blue-600 mt-1">
            {replacements.filter((r) => r.status === 'approved').length}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
          <div className="text-xs font-medium text-slate-600">Shipped</div>
          <div className="text-xl font-bold text-purple-600 mt-1">
            {replacements.filter((r) => r.status === 'shipped').length}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
          <div className="text-xs font-medium text-slate-600">Completed</div>
          <div className="text-xl font-bold text-emerald-600 mt-1">
            {replacements.filter((r) => r.status === 'completed').length}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
        {filteredReplacements.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4">
              <Package className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 mb-1">No replacements found</h3>
            <p className="text-xs text-slate-500">
              {searchTerm ? 'Try adjusting your search terms' : 'Replacement requests will appear here'}
            </p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-700 uppercase">Replacement #</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-700 uppercase">Order #</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-700 uppercase">Customer</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-700 uppercase">Reason</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-700 uppercase">Date</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-700 uppercase">Status</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-700 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReplacements.map((replacement) => (
                <tr key={replacement.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium text-slate-900">{replacement.replacement_number}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-slate-900">#{replacement.order?.order_number || 'N/A'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-slate-900">{replacement.user?.name || 'N/A'}</div>
                    <div className="text-xs text-slate-500">{replacement.user?.email || 'N/A'}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-slate-600 line-clamp-2">{replacement.reason}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-slate-900">{format(new Date(replacement.created_at), 'MMM dd, yyyy')}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(replacement.status)}`}
                    >
                      {replacement.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleViewDetails(replacement.id)}
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

      {/* Replacement Details Modal */}
      {showDetailsModal && selectedReplacement && (
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
                    Replacement #{selectedReplacement.replacement_number}
                  </h2>
                  <p className="text-sm text-slate-500 mt-0.5">
                    Order #{selectedReplacement.order?.order_number} • {format(new Date(selectedReplacement.created_at), 'MMM dd, yyyy • hh:mm a')}
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
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold capitalize ${getStatusColor(selectedReplacement.status)}`}>
                      {selectedReplacement.status}
                    </span>
                  </div>
                  {selectedReplacement.tracking_number && (
                    <div className="text-right">
                      <p className="text-xs text-slate-500 mb-1">Tracking Number</p>
                      <p className="text-sm font-bold text-purple-600">{selectedReplacement.tracking_number}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Customer & Replacement Info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 mb-3">Customer</h3>
                  <p className="text-sm text-slate-900 font-medium">{selectedReplacement.user?.name}</p>
                  <p className="text-xs text-slate-500 mt-1">{selectedReplacement.user?.email}</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 mb-3">Replacement Method</h3>
                  <p className="text-sm text-slate-900 font-medium capitalize">{selectedReplacement.replacement_method?.replace('_', ' ') || 'Ship New'}</p>
                </div>
              </div>

              {/* Replacement Reason */}
              <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 mb-2">Replacement Reason</h3>
                <p className="text-sm font-medium text-slate-700">{selectedReplacement.reason}</p>
                {selectedReplacement.description && (
                  <p className="text-sm text-slate-600 mt-2">{selectedReplacement.description}</p>
                )}
              </div>

              {/* Admin Notes */}
              {selectedReplacement.admin_notes && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h3 className="text-sm font-bold text-amber-900 mb-2">Admin Notes</h3>
                  <p className="text-sm text-amber-800">{selectedReplacement.admin_notes}</p>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            {selectedReplacement.status === 'pending' && (
              <div className="px-6 py-4 bg-white border-t border-slate-200 flex gap-3">
                <button
                  onClick={() => handleUpdateStatus(selectedReplacement.id, 'rejected', 'Replacement request rejected by admin')}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  {actionLoading ? 'Processing...' : 'Reject'}
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedReplacement.id, 'approved', 'Replacement request approved')}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  {actionLoading ? 'Processing...' : 'Approve'}
                </button>
              </div>
            )}
            {selectedReplacement.status === 'approved' && (
              <div className="px-6 py-4 bg-white border-t border-slate-200">
                <button
                  onClick={() => setShowShipModal(true)}
                  disabled={actionLoading}
                  className="w-full px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Truck className="w-4 h-4" />
                  {actionLoading ? 'Processing...' : 'Mark as Shipped'}
                </button>
              </div>
            )}
            {selectedReplacement.status === 'shipped' && (
              <div className="px-6 py-4 bg-white border-t border-slate-200">
                <button
                  onClick={() => handleUpdateStatus(selectedReplacement.id, 'completed', 'Replacement completed successfully')}
                  disabled={actionLoading}
                  className="w-full px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <ClipboardCheck className="w-4 h-4" />
                  {actionLoading ? 'Processing...' : 'Mark as Completed'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Ship Modal */}
      {showShipModal && selectedReplacement && (
        <div
          className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4"
          onClick={() => setShowShipModal(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white border-b border-slate-200 px-6 py-4">
              <h2 className="text-lg font-bold text-slate-900">Ship Replacement</h2>
              <p className="text-sm text-slate-500 mt-0.5">Enter tracking details for the replacement</p>
            </div>
            <div className="p-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Tracking Number
              </label>
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="Enter tracking number"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex gap-3">
              <button
                onClick={() => {
                  setShowShipModal(false);
                  setTrackingNumber('');
                }}
                className="flex-1 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-semibold rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleShipReplacement}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                {actionLoading ? 'Shipping...' : 'Ship Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
