import axios from 'axios';

const USER_API_URL = process.env.NEXT_PUBLIC_USER_API_URL || 'http://localhost:5000/api/user';

// Create axios instance for user APIs
const userApi = axios.create({
  baseURL: USER_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
userApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('userToken');
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
userApi.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('userToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || error.message);
  }
);

// User Auth APIs
export const userAuthAPI = {
  signup: (credentials) => userApi.post('/auth/signup', credentials),
  login: (credentials) => userApi.post('/auth/login', credentials),
  getProfile: () => userApi.get('/auth/profile'),
  updateProfile: (data) => userApi.put('/auth/profile', data),
  changePassword: (data) => userApi.post('/auth/change-password', data),
};

// Order APIs
export const orderAPI = {
  createOrder: (orderData) => userApi.post('/orders', orderData),
  getUserOrders: () => userApi.get('/orders'),
  getOrderById: (id) => userApi.get(`/orders/${id}`),
  getOrderByNumber: (orderNumber) => userApi.get(`/orders/by-number/${orderNumber}`),
  cancelOrder: (orderNumber) => userApi.patch(`/orders/${orderNumber}/cancel`),
};

// Coupon APIs
export const couponAPI = {
  validateCoupon: (code, cart_total) => userApi.post('/coupons/validate', { code, cart_total }),
  getActiveCoupons: () => userApi.get('/coupons/active'),
};

// Deals APIs
export const dealAPI = {
  getActiveDeals: () => userApi.get('/deals'),
  getFeaturedDeals: () => userApi.get('/deals/featured'),
  getDealById: (id) => userApi.get(`/deals/${id}`),
};
