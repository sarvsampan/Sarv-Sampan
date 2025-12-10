import axios from 'axios';

const USER_API_URL = process.env.NEXT_PUBLIC_USER_API_URL || 'http://localhost:5000/api/user';

// Generate or get session ID for guest users
export const getSessionId = () => {
  let sessionId = localStorage.getItem('sessionId');
  if (!sessionId) {
    sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('sessionId', sessionId);
  }
  return sessionId;
};

// Create axios instance for user APIs
const userApi = axios.create({
  baseURL: USER_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token and session ID
userApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add session ID for cart/wishlist operations
    const sessionId = getSessionId();
    config.headers['x-session-id'] = sessionId;

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
  login: (credentials) => {
    // Include session_id for cart merging
    const sessionId = getSessionId();
    return userApi.post('/auth/login', { ...credentials, session_id: sessionId });
  },
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

// Cart APIs
export const cartAPI = {
  getCart: () => userApi.get('/cart'),
  addToCart: (product_id, quantity = 1) => userApi.post('/cart', { product_id, quantity }),
  updateQuantity: (cartItemId, quantity) => userApi.put(`/cart/${cartItemId}`, { quantity }),
  removeFromCart: (cartItemId) => userApi.delete(`/cart/${cartItemId}`),
  clearCart: () => userApi.delete('/cart'),
  mergeCart: (session_id) => userApi.post('/cart/merge', { session_id }),
};

// Wishlist APIs
export const wishlistAPI = {
  getWishlist: () => userApi.get('/wishlist'),
  addToWishlist: (product_id) => userApi.post('/wishlist', { product_id }),
  removeFromWishlist: (wishlistItemId) => userApi.delete(`/wishlist/${wishlistItemId}`),
  clearWishlist: () => userApi.delete('/wishlist'),
  checkWishlist: (productId) => userApi.get(`/wishlist/check/${productId}`),
  moveToCart: (wishlistItemId) => userApi.post(`/wishlist/${wishlistItemId}/move-to-cart`),
};

// Review APIs
export const reviewAPI = {
  // Public endpoints
  getProductReviews: (productId, params = {}) => userApi.get(`/reviews/product/${productId}`, { params }),
  getReviewStats: (productId) => userApi.get(`/reviews/stats/${productId}`),

  // Protected endpoints (require authentication)
  createReview: (reviewData) => userApi.post('/reviews', reviewData),
  getMyReviews: () => userApi.get('/reviews/my-reviews'),
  updateReview: (reviewId, reviewData) => userApi.put(`/reviews/${reviewId}`, reviewData),
  deleteReview: (reviewId) => userApi.delete(`/reviews/${reviewId}`),
  markHelpful: (reviewId) => userApi.post(`/reviews/${reviewId}/helpful`),
};

// Return APIs
export const returnAPI = {
  createReturnRequest: (returnData) => userApi.post('/returns', returnData),
  getMyReturnRequests: () => userApi.get('/returns'),
  getReturnRequestById: (id) => userApi.get(`/returns/${id}`),
  deleteReturnRequest: (id) => userApi.delete(`/returns/${id}`),
};

// Replacement APIs
export const replacementAPI = {
  createReplacementRequest: (replacementData) => userApi.post('/replacements', replacementData),
  getMyReplacementRequests: () => userApi.get('/replacements'),
  getReplacementRequestById: (id) => userApi.get(`/replacements/${id}`),
  deleteReplacementRequest: (id) => userApi.delete(`/replacements/${id}`),
};

// Payment APIs
export const paymentAPI = {
  createPaymentOrder: (orderData) => userApi.post('/payments/create-order', orderData),
  verifyPayment: (paymentData) => userApi.post('/payments/verify', paymentData),
  initiateRefund: (refundData) => userApi.post('/payments/refund', refundData),
};
