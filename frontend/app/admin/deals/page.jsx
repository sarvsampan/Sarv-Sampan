'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Calendar,
  Tag,
  TrendingUp,
  Eye,
  EyeOff,
  Percent,
  Package,
  X,
  Upload,
  ImageIcon
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminDealsPage() {
  const router = useRouter();
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingDeal, setEditingDeal] = useState(null);

  // Image upload state
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    discount_percentage: '',
    start_date: '',
    end_date: '',
    is_active: true
  });

  useEffect(() => {
    checkAuth();
    fetchDeals();
  }, []);

  const checkAuth = () => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      toast.error('Please login to access admin panel');
      router.push('/admin/login');
    }
  };

  const fetchDeals = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch('http://localhost:5000/api/admin/deals', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setDeals(data.data || []);
      } else {
        toast.error('Failed to fetch deals');
      }
    } catch (error) {
      toast.error('Failed to fetch deals');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.title.trim()) {
      toast.error('Please enter deal title');
      return;
    }
    if (!formData.discount_percentage || formData.discount_percentage <= 0) {
      toast.error('Please enter valid discount percentage');
      return;
    }
    if (!formData.start_date || !formData.end_date) {
      toast.error('Please select start and end dates');
      return;
    }
    if (new Date(formData.start_date) >= new Date(formData.end_date)) {
      toast.error('End date must be after start date');
      return;
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem('adminToken');

      // First create/update the deal
      const url = editingDeal
        ? `http://localhost:5000/api/admin/deals/${editingDeal.id}`
        : 'http://localhost:5000/api/admin/deals';

      const method = editingDeal ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        const dealId = editingDeal ? editingDeal.id : data.data.id;

        // Upload image if new image is selected
        if (imageFile) {
          const imageFormData = new FormData();
          imageFormData.append('image', imageFile);

          const imageResponse = await fetch(`http://localhost:5000/api/admin/deals/${dealId}/image`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            body: imageFormData
          });

          const imageData = await imageResponse.json();
          if (!imageData.success) {
            toast.error('Deal saved but image upload failed');
          }
        }

        toast.success(editingDeal ? 'Deal updated successfully!' : 'Deal created successfully!');
        fetchDeals();
        closeModal();
      } else {
        toast.error(data.message || 'Failed to save deal');
      }
    } catch (error) {
      toast.error('Failed to save deal');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (deal) => {
    setEditingDeal(deal);
    setFormData({
      title: deal.title,
      description: deal.description,
      discount_percentage: deal.discount_percentage,
      start_date: deal.start_date,
      end_date: deal.end_date,
      is_active: deal.is_active
    });

    // Set existing image preview
    if (deal.banner_image) {
      setImagePreview(deal.banner_image);
    }

    setShowModal(true);
  };

  const handleDelete = async (dealId) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`http://localhost:5000/api/admin/deals/${dealId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Deal deleted successfully!');
        fetchDeals();
      } else {
        toast.error(data.message || 'Failed to delete deal');
      }
    } catch (error) {
      toast.error('Failed to delete deal');
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingDeal(null);
    setImageFile(null);
    setImagePreview('');
    setFormData({
      title: '',
      description: '',
      discount_percentage: '',
      start_date: '',
      end_date: '',
      is_active: true
    });
  };

  const filteredDeals = deals.filter(deal =>
    deal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    deal.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isActive = (deal) => {
    const now = new Date();
    const start = new Date(deal.start_date);
    const end = new Date(deal.end_date);
    return deal.is_active && now >= start && now <= end;
  };

  return (
    <div className="p-3">
        {/* Header */}
        <div className="mb-3">
          <h1 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-1.5">
            <Tag className="w-5 h-5 text-blue-600" />
            Deals Management
          </h1>
          <p className="text-xs text-slate-600">Create and manage promotional deals</p>
        </div>

        {/* Actions Bar */}
        <div className="bg-white rounded-lg border border-slate-200 p-2.5 mb-3">
          <div className="flex flex-col md:flex-row gap-2 items-center justify-between">
            <div className="relative flex-1 max-w-md w-full">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search deals..."
                className="w-full pl-8 pr-2.5 py-1.5 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Deal</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-3">
          <div className="bg-white rounded-md border border-slate-200 p-2.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-slate-600 mb-0.5">Total Deals</p>
                <p className="text-lg font-bold text-slate-900">{deals.length}</p>
              </div>
              <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                <Tag className="w-4 h-4 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-md border border-slate-200 p-2.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-slate-600 mb-0.5">Active Deals</p>
                <p className="text-lg font-bold text-emerald-600">
                  {deals.filter(d => isActive(d)).length}
                </p>
              </div>
              <div className="w-8 h-8 bg-emerald-100 rounded-md flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-md border border-slate-200 p-2.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-slate-600 mb-0.5">Upcoming</p>
                <p className="text-lg font-bold text-orange-600">
                  {deals.filter(d => new Date(d.start_date) > new Date() && d.is_active).length}
                </p>
              </div>
              <div className="w-8 h-8 bg-orange-100 rounded-md flex items-center justify-center">
                <Calendar className="w-4 h-4 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-md border border-slate-200 p-2.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-slate-600 mb-0.5">Expired</p>
                <p className="text-lg font-bold text-red-600">
                  {deals.filter(d => new Date(d.end_date) < new Date()).length}
                </p>
              </div>
              <div className="w-8 h-8 bg-red-100 rounded-md flex items-center justify-center">
                <Calendar className="w-4 h-4 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Deals Table */}
        <div className="bg-white rounded-md border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-3 border-blue-600 border-t-transparent mx-auto mb-2"></div>
              <p className="text-xs text-slate-600">Loading deals...</p>
            </div>
          ) : filteredDeals.length === 0 ? (
            <div className="p-4 text-center">
              <Tag className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-slate-900 mb-1">No deals found</h3>
              <p className="text-xs text-slate-600 mb-2">
                {searchQuery ? 'Try a different search term' : 'Create your first deal to get started'}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setShowModal(true)}
                  className="px-2.5 py-1.5 text-xs bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700"
                >
                  Create Deal
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-1.5 text-left text-[10px] font-semibold text-slate-600 uppercase w-12">Image</th>
                    <th className="px-3 py-1.5 text-left text-[10px] font-semibold text-slate-600 uppercase">Deal</th>
                    <th className="px-3 py-1.5 text-left text-[10px] font-semibold text-slate-600 uppercase">Discount</th>
                    <th className="px-3 py-1.5 text-left text-[10px] font-semibold text-slate-600 uppercase">Duration</th>
                    <th className="px-3 py-1.5 text-left text-[10px] font-semibold text-slate-600 uppercase">Status</th>
                    <th className="px-3 py-1.5 text-left text-[10px] font-semibold text-slate-600 uppercase">Products</th>
                    <th className="px-3 py-1.5 text-right text-[10px] font-semibold text-slate-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredDeals.map((deal) => (
                    <tr key={deal.id} className="hover:bg-slate-50">
                      <td className="px-3 py-2">
                        {deal.banner_image ? (
                          <img
                            src={deal.banner_image}
                            alt={deal.title}
                            className="w-12 h-12 object-cover rounded-md border border-slate-200"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-slate-100 rounded-md flex items-center justify-center">
                            <ImageIcon className="w-5 h-5 text-slate-400" />
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <div>
                          <p className="font-semibold text-xs text-slate-900">{deal.title}</p>
                          <p className="text-[10px] text-slate-600 line-clamp-1">{deal.description}</p>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-semibold">
                          <Percent className="w-2.5 h-2.5" />
                          {deal.discount_percentage}% OFF
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="text-[10px]">
                          <p className="text-slate-900">
                            {new Date(deal.start_date).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </p>
                          <p className="text-slate-600">to</p>
                          <p className="text-slate-900">
                            {new Date(deal.end_date).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        {isActive(deal) ? (
                          <span className="inline-flex items-center px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-semibold">
                            Active
                          </span>
                        ) : new Date(deal.start_date) > new Date() ? (
                          <span className="inline-flex items-center px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded-full text-[10px] font-semibold">
                            Upcoming
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-1.5 py-0.5 bg-red-100 text-red-700 rounded-full text-[10px] font-semibold">
                            Expired
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1">
                          <Package className="w-3 h-3 text-slate-400" />
                          <span className="text-[10px] text-slate-900 font-semibold">
                            {deal.product_count || 0}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleEdit(deal)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                            title="Edit deal"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete "${deal.title}"?`)) {
                                handleDelete(deal.id);
                              }
                            }}
                            className="p-1 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            title="Delete deal"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Create/Edit Deal Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/40 z-50 overflow-y-auto">
            <div className="min-h-screen flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl my-8 animate-scale-in max-h-[90vh] flex flex-col">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-2xl px-5 py-3 flex items-center justify-between flex-shrink-0">
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {editingDeal ? 'Edit Deal' : 'Create New Deal'}
                  </h2>
                  <p className="text-blue-100 text-xs mt-0.5">
                    {editingDeal ? 'Update deal information' : 'Fill in the details to create a new deal'}
                  </p>
                </div>
                <button
                  onClick={closeModal}
                  className="text-white hover:bg-white/20 rounded-lg p-1.5 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 overflow-y-auto flex-1 scrollbar-hide">
                <form onSubmit={handleSubmit} className="space-y-3">
              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-900 mb-1.5">
                  Deal Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Summer Sale 2024"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-900 mb-1.5">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your deal..."
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Discount Percentage */}
              <div>
                <label className="block text-xs font-semibold text-slate-900 mb-1.5">
                  Discount Percentage *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.discount_percentage}
                    onChange={(e) => setFormData({ ...formData, discount_percentage: e.target.value })}
                    placeholder="e.g., 50"
                    min="1"
                    max="100"
                    className="w-full px-3 py-2 pr-10 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                  <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                </div>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-900 mb-1.5">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-900 mb-1.5">
                    End Date *
                  </label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              {/* Banner Image Upload */}
              <div>
                <label className="block text-xs font-semibold text-slate-900 mb-1.5">
                  Banner Image
                </label>

                {/* Image Preview */}
                {imagePreview && (
                  <div className="relative mb-3 group">
                    <img
                      src={imagePreview}
                      alt="Banner preview"
                      className="w-full h-40 object-cover rounded-lg border border-slate-200"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Upload Area */}
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 bg-slate-50 hover:border-blue-400 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="banner-upload"
                  />
                  <label
                    htmlFor="banner-upload"
                    className="flex flex-col items-center cursor-pointer"
                  >
                    <Upload className="w-6 h-6 text-slate-400 mb-1" />
                    <span className="text-xs text-slate-600 font-medium">
                      {imagePreview ? 'Click to change image' : 'Click to upload banner image'}
                    </span>
                    <span className="text-[10px] text-slate-500 mt-0.5">
                      PNG, JPG up to 5MB
                    </span>
                  </label>
                </div>
              </div>

              {/* Active Status */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-3.5 h-3.5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="is_active" className="text-xs font-semibold text-slate-900">
                  Active Deal
                </label>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-3 mt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={submitting}
                  className="flex-1 px-3 py-2 text-sm bg-slate-100 text-slate-700 rounded-lg font-semibold hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-3 py-2 text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      {editingDeal ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>{editingDeal ? 'Update Deal' : 'Create Deal'}</>
                  )}
                </button>
              </div>
                </form>
              </div>
              </div>
            </div>
          </div>
        )}

        {/* CSS for Modal Animation */}
        <style jsx>{`
          @keyframes scale-in {
            from {
              opacity: 0;
              transform: scale(0.95);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }

          .animate-scale-in {
            animation: scale-in 0.2s ease-out;
          }

          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }

          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
        `}</style>
      </div>
  );
}
