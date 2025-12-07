'use client';

import { useEffect, useState } from 'react';
import { couponAPI } from '@/lib/api';
import { Plus, Pencil, Trash2, Search, X, Ticket, Copy, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function Coupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [copiedCode, setCopiedCode] = useState('');

  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discount_type: 'percentage',
    discount_value: '',
    min_purchase_amount: '',
    max_discount_amount: '',
    usage_limit: '',
    valid_from: '',
    valid_until: '',
    is_active: true,
  });

  useEffect(() => {
    fetchCoupons();
  }, [statusFilter]);

  const fetchCoupons = async () => {
    try {
      const params = {};
      if (statusFilter) params.is_active = statusFilter;

      const response = await couponAPI.getAll(params);
      setCoupons(response.data?.coupons || []);
    } catch (error) {
      toast.error('Failed to fetch coupons');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editingCoupon) {
        await couponAPI.update(editingCoupon.id, formData);
        toast.success('Coupon updated successfully');
      } else {
        await couponAPI.create(formData);
        toast.success('Coupon created successfully');
      }

      closeModal();
      fetchCoupons();
    } catch (error) {
      toast.error(error.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      description: coupon.description || '',
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      min_purchase_amount: coupon.min_purchase_amount || '',
      max_discount_amount: coupon.max_discount_amount || '',
      usage_limit: coupon.usage_limit || '',
      valid_from: coupon.valid_from ? format(new Date(coupon.valid_from), "yyyy-MM-dd'T'HH:mm") : '',
      valid_until: coupon.valid_until ? format(new Date(coupon.valid_until), "yyyy-MM-dd'T'HH:mm") : '',
      is_active: coupon.is_active,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    try {
      await couponAPI.delete(id);
      toast.success('Coupon deleted successfully');
      fetchCoupons();
    } catch (error) {
      toast.error('Failed to delete coupon');
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await couponAPI.toggleStatus(id);
      toast.success('Status updated successfully');
      fetchCoupons();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success('Code copied!');
    setTimeout(() => setCopiedCode(''), 2000);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCoupon(null);
    setFormData({
      code: '',
      description: '',
      discount_type: 'percentage',
      discount_value: '',
      min_purchase_amount: '',
      max_discount_amount: '',
      usage_limit: '',
      valid_from: '',
      valid_until: '',
      is_active: true,
    });
  };

  const getStatusColor = (coupon) => {
    if (!coupon.is_active) return 'bg-red-100 text-red-700';
    if (coupon.valid_until && new Date(coupon.valid_until) < new Date()) return 'bg-slate-100 text-slate-700';
    return 'bg-emerald-100 text-emerald-700';
  };

  const getStatusText = (coupon) => {
    if (!coupon.is_active) return 'Inactive';
    if (coupon.valid_until && new Date(coupon.valid_until) < new Date()) return 'Expired';
    return 'Active';
  };

  const filteredCoupons = coupons.filter((coupon) =>
    coupon.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coupon.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-3 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="mt-3 text-sm text-slate-600">Loading coupons...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-slate-50 min-h-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Coupons & Discounts</h1>
          <p className="text-xs text-slate-600 mt-0.5">Create and manage promotional codes</p>
        </div>
        <button
          onClick={() => {
            closeModal();
            setShowModal(true);
          }}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-lg transition-all shadow-md hover:shadow-lg text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          <span>Create Coupon</span>
        </button>
      </div>

      {/* Filters */}
      <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search coupons..."
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
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
          <div className="text-xs font-medium text-slate-600">Total Coupons</div>
          <div className="text-xl font-bold text-slate-900 mt-1">{coupons.length}</div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
          <div className="text-xs font-medium text-slate-600">Active</div>
          <div className="text-xl font-bold text-emerald-600 mt-1">
            {coupons.filter((c) => c.is_active).length}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
          <div className="text-xs font-medium text-slate-600">Inactive</div>
          <div className="text-xl font-bold text-red-600 mt-1">
            {coupons.filter((c) => !c.is_active).length}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
          <div className="text-xs font-medium text-slate-600">Total Usage</div>
          <div className="text-xl font-bold text-blue-600 mt-1">
            {coupons.reduce((sum, c) => sum + (c.used_count || 0), 0)}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
        {filteredCoupons.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4">
              <Ticket className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 mb-1">No coupons found</h3>
            <p className="text-xs text-slate-500 mb-4">
              {searchTerm ? 'Try adjusting your search terms' : 'Create your first promotional coupon'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => {
                  closeModal();
                  setShowModal(true);
                }}
                className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-all text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                <span>Create Coupon</span>
              </button>
            )}
          </div>
        ) : (
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-700 uppercase">Code</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-700 uppercase">Discount</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-700 uppercase">Usage</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-700 uppercase">Valid Until</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-700 uppercase">Status</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-700 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCoupons.map((coupon) => (
                <tr key={coupon.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold text-blue-600">{coupon.code}</span>
                      <button
                        onClick={() => copyCode(coupon.code)}
                        className="p-1 hover:bg-blue-50 rounded transition-colors"
                      >
                        {copiedCode === coupon.code ? (
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-slate-400" />
                        )}
                      </button>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">{coupon.description}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-semibold text-slate-900">
                      {coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : `₹${coupon.discount_value}`}
                    </div>
                    <div className="text-xs text-slate-500">
                      {coupon.discount_type === 'percentage' ? 'Percentage' : 'Fixed Amount'}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-slate-900">
                      {coupon.used_count || 0} / {coupon.usage_limit || '∞'}
                    </div>
                    {coupon.usage_limit && (
                      <div className="w-full bg-slate-200 rounded-full h-1.5 mt-1">
                        <div
                          className="bg-blue-600 h-1.5 rounded-full"
                          style={{ width: `${Math.min(((coupon.used_count || 0) / coupon.usage_limit) * 100, 100)}%` }}
                        ></div>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-slate-900">
                      {coupon.valid_until ? format(new Date(coupon.valid_until), 'MMM dd, yyyy') : 'No expiry'}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleStatus(coupon.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${getStatusColor(coupon)}`}
                    >
                      {getStatusText(coupon)}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex space-x-1.5">
                      <button
                        onClick={() => handleEdit(coupon)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(coupon.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl my-4 mx-4">
            <div className="flex justify-between items-center px-4 py-3 border-b border-slate-200">
              <h2 className="text-base font-bold text-slate-900">
                {editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}
              </h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="p-4 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">Coupon Code *</label>
                    <input
                      type="text"
                      required
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase font-bold"
                      placeholder="WELCOME10"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      placeholder="Description of the coupon"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">Discount Type *</label>
                    <select
                      required
                      value={formData.discount_type}
                      onChange={(e) => setFormData({ ...formData, discount_type: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount (₹)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">Discount Value *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.discount_value}
                      onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={formData.discount_type === 'percentage' ? '10' : '100'}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">Min Purchase (₹)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.min_purchase_amount}
                      onChange={(e) => setFormData({ ...formData, min_purchase_amount: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">Max Discount (₹)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.max_discount_amount}
                      onChange={(e) => setFormData({ ...formData, max_discount_amount: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="100"
                      disabled={formData.discount_type === 'fixed'}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">Usage Limit</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.usage_limit}
                      onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">Valid From</label>
                    <input
                      type="datetime-local"
                      value={formData.valid_from}
                      onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">Valid Until</label>
                    <input
                      type="datetime-local"
                      value={formData.valid_until}
                      onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-700">Active</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex space-x-2.5 px-4 py-3 border-t border-slate-200 bg-slate-50">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={submitting}
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-white transition-colors text-sm disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all shadow-md hover:shadow-lg text-sm disabled:opacity-50 flex items-center justify-center"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      {editingCoupon ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>{editingCoupon ? 'Update' : 'Create'}</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
