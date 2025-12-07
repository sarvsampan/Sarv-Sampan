'use client';

import { useEffect, useState } from 'react';
import { categoryAPI } from '@/lib/api';
import { Plus, Pencil, Trash2, Search, X, FolderTree, Upload, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [existingImage, setExistingImage] = useState(null);
  const [deletingImage, setDeletingImage] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'active',
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await categoryAPI.getAll();
      setCategories(response.data || []);
    } catch (error) {
      toast.error('Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      let categoryId;

      if (editingCategory) {
        await categoryAPI.update(editingCategory.id, formData);
        categoryId = editingCategory.id;
        toast.success('Category updated successfully');
      } else {
        const response = await categoryAPI.create(formData);
        categoryId = response.data.id;
        toast.success('Category created successfully');
      }

      // Upload image if provided
      if (imageFile) {
        const formDataImage = new FormData();
        formDataImage.append('image', imageFile);
        await categoryAPI.uploadImage(categoryId, formDataImage);
        toast.success('Image uploaded successfully');
      }

      closeModal();
      fetchCategories();
    } catch (error) {
      toast.error(error.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      status: category.status,
    });
    setExistingImage(category.image_url || null);
    setShowModal(true);
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

  const removeImagePreview = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleDeleteExistingImage = async () => {
    if (!editingCategory) return;

    setDeletingImage(true);
    try {
      await categoryAPI.deleteImage(editingCategory.id);
      setExistingImage(null);
      toast.success('Image deleted successfully');
    } catch (error) {
      toast.error('Failed to delete image');
    } finally {
      setDeletingImage(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setImageFile(null);
    setImagePreview(null);
    setExistingImage(null);
    setFormData({ name: '', description: '', status: 'active' });
  };

  const handleDelete = async (id) => {
    try {
      await categoryAPI.delete(id);
      toast.success('Category deleted successfully');
      fetchCategories();
    } catch (error) {
      const errorMessage = error?.message || error?.response?.data?.message || 'Failed to delete category';

      // Check if it's a foreign key constraint error or products-related
      if (errorMessage.toLowerCase().includes('products') ||
          errorMessage.toLowerCase().includes('foreign key') ||
          errorMessage.toLowerCase().includes('referenced')) {
        toast.error('This category cannot be deleted. It has products or other records assigned to it.', {
          duration: 4000,
        });
      } else {
        toast.error(errorMessage, {
          duration: 4000,
        });
      }
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await categoryAPI.toggleStatus(id);
      toast.success('Status updated successfully');
      fetchCategories();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-3 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="mt-3 text-sm text-slate-600">Loading categories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-slate-50 min-h-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Categories</h1>
          <p className="text-xs text-slate-600 mt-0.5">Manage your product categories</p>
        </div>
        <button
          onClick={() => {
            closeModal();
            setShowModal(true);
          }}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-lg transition-all shadow-md hover:shadow-lg text-sm font-medium cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Category</span>
        </button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
        {filteredCategories.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4">
              <FolderTree className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 mb-1">No categories found</h3>
            <p className="text-xs text-slate-500 mb-4">
              {searchTerm ? 'Try adjusting your search terms' : 'Get started by creating your first category'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => {
                  closeModal();
                  setShowModal(true);
                }}
                className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-all text-sm font-medium cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Category</span>
              </button>
            )}
          </div>
        ) : (
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-700 uppercase">Category</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-700 uppercase">Description</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-700 uppercase">Slug</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-700 uppercase">Products</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-700 uppercase">Status</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-700 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCategories.map((category) => (
                <tr key={category.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        {category.image_url ? (
                          <img
                            src={category.image_url}
                            alt={category.name}
                            className="h-10 w-10 rounded-lg object-cover border border-slate-200"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
                            <ImageIcon className="h-5 w-5 text-slate-400" />
                          </div>
                        )}
                      </div>
                      <div className="ml-3">
                        <span className="text-sm font-medium text-slate-900">{category.name}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-slate-600">{category.description || '-'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-slate-500 font-mono bg-slate-100 px-2 py-1 rounded">{category.slug}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                      {category.product_count || 0} Products
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleStatus(category.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all ${
                        category.status?.toLowerCase() === 'active'
                          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                          : 'bg-red-100 text-red-700 hover:bg-red-200'
                      }`}
                      title="Click to toggle status"
                    >
                      {category.status?.toLowerCase() === 'active' ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex space-x-1.5">
                      <button
                        onClick={() => handleEdit(category)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(category.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md border border-slate-200 my-4">
            <div className="flex justify-between items-center px-5 py-3 border-b border-slate-200 bg-slate-50">
              <h2 className="text-base font-semibold text-slate-900">
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </h2>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1 hover:bg-slate-200 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Category Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="e.g., Electronics, Fashion"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={2}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-colors"
                    placeholder="Brief description"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer transition-colors"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                {/* Category Image Section */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Category Image
                  </label>

                  {/* Existing Image */}
                  {existingImage && !imagePreview && (
                    <div className="mb-2">
                      <div className="relative inline-block group">
                        <img
                          src={existingImage}
                          alt="Category"
                          className="w-24 h-24 object-cover rounded-lg border border-slate-300"
                        />
                        <button
                          type="button"
                          onClick={handleDeleteExistingImage}
                          disabled={deletingImage}
                          className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full shadow-md transition-colors disabled:opacity-50"
                        >
                          {deletingImage ? (
                            <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                          ) : (
                            <X className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* New Image Preview */}
                  {imagePreview && (
                    <div className="mb-2">
                      <div className="relative inline-block group">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-24 h-24 object-cover rounded-lg border-2 border-blue-500"
                        />
                        <button
                          type="button"
                          onClick={removeImagePreview}
                          className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full shadow-md transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        <span className="absolute bottom-1.5 left-1.5 bg-blue-600 text-white text-[10px] font-medium px-1.5 py-0.5 rounded">
                          New
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Upload Area */}
                  {!imagePreview && (
                    <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 bg-slate-50 hover:border-blue-500 hover:bg-blue-50/50 transition-all cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                        id="category-image-upload"
                      />
                      <label
                        htmlFor="category-image-upload"
                        className="flex flex-col items-center cursor-pointer"
                      >
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center mb-1.5">
                          <Upload className="w-5 h-5 text-blue-600" />
                        </div>
                        <span className="text-xs text-slate-700 font-medium">
                          Upload Image
                        </span>
                        <span className="text-[11px] text-slate-500 mt-0.5">
                          PNG, JPG (Max 5MB)
                        </span>
                      </label>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 mt-5 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent mr-2"></div>
                      {editingCategory ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>{editingCategory ? 'Update' : 'Create'}</>
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
