import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/admin';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error.response?.data || error.message);
  }
);

// Auth APIs
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
  logout: () => api.post('/auth/logout'),
};

// Dashboard APIs
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getRecentOrders: (limit = 10) => api.get(`/dashboard/recent-orders?limit=${limit}`),
  getTopProducts: (limit = 10) => api.get(`/dashboard/top-products?limit=${limit}`),
  getSalesChart: () => api.get('/dashboard/sales-chart'),
};

// Category APIs
export const categoryAPI = {
  getAll: (params) => api.get('/categories', { params }),
  getById: (id) => api.get(`/categories/${id}`),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
  toggleStatus: (id) => api.patch(`/categories/${id}/status`),
  uploadImage: (id, formData) =>
    api.post(`/categories/${id}/image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  deleteImage: (id) => api.delete(`/categories/${id}/image`),
};

// Product APIs
export const productAPI = {
  getAll: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  toggleStatus: (id) => api.patch(`/products/${id}/status`),
  uploadImages: (id, formData) =>
    api.post(`/products/${id}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  deleteImage: (productId, imageId) =>
    api.delete(`/products/${productId}/images/${imageId}`),
  getLowStock: () => api.get('/products/low-stock'),
};

// Order APIs
export const orderAPI = {
  getAll: (params) => api.get('/orders', { params }),
  getById: (id) => api.get(`/orders/${id}`),
  updateStatus: (id, data) => api.put(`/orders/${id}/status`, data),
  updateTracking: (id, data) => api.put(`/orders/${id}/tracking`, data),
  addNotes: (id, data) => api.post(`/orders/${id}/notes`, data),
  getStats: () => api.get('/orders/stats'),
};

// Customer APIs
export const customerAPI = {
  getAll: (params) => api.get('/customers', { params }),
  getById: (id) => api.get(`/customers/${id}`),
  updateStatus: (id, data) => api.patch(`/customers/${id}/status`, data),
};

// Deals APIs
export const dealAPI = {
  getAll: (params) => api.get('/deals', { params }),
  getById: (id) => api.get(`/deals/${id}`),
  create: (data) => api.post('/deals', data),
  update: (id, data) => api.put(`/deals/${id}`, data),
  delete: (id) => api.delete(`/deals/${id}`),
  assignProducts: (dealId, data) => api.post(`/deals/${dealId}/products`, data),
  removeProducts: (dealId, data) => api.delete(`/deals/${dealId}/products`, { data }),
};

// Return APIs
export const returnAPI = {
  getAll: (params) => api.get('/returns', { params }),
  getById: (id) => api.get(`/returns/${id}`),
  updateStatus: (id, data) => api.put(`/returns/${id}/status`, data),
  create: (data) => api.post('/returns', data),
  getStats: () => api.get('/returns/stats'),
};

// Replacement APIs
export const replacementAPI = {
  getAll: (params) => api.get('/replacements', { params }),
  getById: (id) => api.get(`/replacements/${id}`),
  updateStatus: (id, data) => api.put(`/replacements/${id}/status`, data),
  create: (data) => api.post('/replacements', data),
  getStats: () => api.get('/replacements/stats'),
};

// Payment APIs
export const paymentAPI = {
  getAll: (params) => api.get('/payments', { params }),
  getById: (id) => api.get(`/payments/${id}`),
  updateStatus: (id, data) => api.put(`/payments/${id}/status`, data),
  getStats: () => api.get('/payments/stats'),
};

// Coupon APIs
export const couponAPI = {
  getAll: (params) => api.get('/coupons', { params }),
  getById: (id) => api.get(`/coupons/${id}`),
  create: (data) => api.post('/coupons', data),
  update: (id, data) => api.put(`/coupons/${id}`, data),
  delete: (id) => api.delete(`/coupons/${id}`),
  toggleStatus: (id) => api.patch(`/coupons/${id}/status`),
  validate: (data) => api.post('/coupons/validate', data),
  getStats: () => api.get('/coupons/stats'),
};

export default api;
