import axios from 'axios';
import cacheService from './cacheService';

// Create an axios instance
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to check cache and add the auth token to requests
api.interceptors.request.use(
  async (config) => {
    // Add auth token to request
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Check cache for GET requests
    if (cacheService.shouldCache(config)) {
      const cacheKey = cacheService.generateKey(config);
      const cachedResponse = cacheService.get(cacheKey);
      
      if (cachedResponse) {
        // Return cached response in a format that axios will recognize
        // This will cause the request to resolve immediately with the cached data
        return {
          ...config,
          cached: true,
          adapter: () => {
            return Promise.resolve({
              data: cachedResponse.data,
              status: 200,
              statusText: 'OK',
              headers: cachedResponse.headers,
              config,
              request: {}
            });
          }
        };
      }
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptors to cache responses and handle token expiration
api.interceptors.response.use(
  (response) => {
    // Don't cache responses that were already served from cache
    if (response.config.cached) {
      return response;
    }
    
    // Cache successful GET responses
    if (cacheService.shouldCache(response.config)) {
      const cacheKey = cacheService.generateKey(response.config);
      const ttl = cacheService.getTTL(response.config);
      cacheService.set(cacheKey, response, ttl);
    }
    
    return response;
  },
  (error) => {
    // Handle token expiration
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

// Cache invalidation for non-GET requests (mutations)
const invalidateRelatedCaches = (url) => {
  if (url.includes('/influencers')) {
    cacheService.clearPattern(/\/influencers/);
  } else if (url.includes('/rentals')) {
    cacheService.clearPattern(/\/rentals/);
  } else if (url.includes('/campaigns')) {
    cacheService.clearPattern(/\/campaigns/);
  } else if (url.includes('/users') || url.includes('/profile')) {
    cacheService.clearPattern(/\/users|\/profile/);
  } else if (url.includes('/messages')) {
    cacheService.clearPattern(/\/messages/);
  } else if (url.includes('/analytics')) {
    cacheService.clearPattern(/\/analytics/);
  }
};

// Override methods that mutate data to invalidate cache
const originalPost = api.post;
api.post = function(...args) {
  const result = originalPost.apply(this, args);
  invalidateRelatedCaches(args[0]);
  return result;
};

const originalPut = api.put;
api.put = function(...args) {
  const result = originalPut.apply(this, args);
  invalidateRelatedCaches(args[0]);
  return result;
};

const originalPatch = api.patch;
api.patch = function(...args) {
  const result = originalPatch.apply(this, args);
  invalidateRelatedCaches(args[0]);
  return result;
};

const originalDelete = api.delete;
api.delete = function(...args) {
  const result = originalDelete.apply(this, args);
  invalidateRelatedCaches(args[0]);
  return result;
};

// Auth API
export const authAPI = {
  register: (userData) => api.post('/users/register', userData),
  login: (credentials) => api.post('/users/login', credentials),
  verifyTwoFactor: (verificationData) => api.post('/users/verify-2fa', verificationData),
  getProfile: () => api.get('/users/profile'),
  updateProfile: (userData) => api.put('/users/profile', userData),
  changePassword: (passwordData) => api.put('/users/password', passwordData),
  verifyEmail: (token) => api.get(`/users/verify-email/${token}`),
  resendVerification: (email) => api.post('/users/resend-verification', { email }),
  forgotPassword: (email) => api.post('/users/forgot-password', { email }),
  resetPassword: (token, password) => api.post(`/users/reset-password/${token}`, { password }),
  
  // Two-factor authentication
  enableTwoFactor: () => api.post('/users/enable-2fa'),
  verifyTwoFactorSetup: (token) => api.post('/users/verify-2fa-setup', { token }),
  disableTwoFactor: (data) => api.post('/users/disable-2fa', data),
  generateRecoveryCodes: (data) => api.post('/users/generate-recovery-codes', data),
};

// Influencer API
export const influencerAPI = {
  getProfile: () => api.get('/influencers/profile'),
  updateProfile: (profileData) => api.put('/influencers/profile', profileData),
  addSocialAccount: (accountData) => api.post('/influencers/social-accounts', accountData),
  updateSocialAccount: (accountId, accountData) =>
    api.put(`/influencers/social-accounts/${accountId}`, accountData),
  deleteSocialAccount: (accountId) => api.delete(`/influencers/social-accounts/${accountId}`),
  getAllInfluencers: (params) => api.get('/influencers', { params }),
  getInfluencerById: (id) => api.get(`/influencers/${id}`),
  getFeaturedInfluencers: () => api.get('/influencers/featured'),
  getTopInfluencers: (category) => api.get('/influencers/top', { params: { category } }),
  getTrendingInfluencers: () => api.get('/influencers/trending'),
  getInfluencersByPlatform: (platform, params) => api.get(`/influencers/platform/${platform}`, { params }),
  getInfluencerStatistics: () => api.get('/influencers/statistics'),
  
  // API Key Management
  rotateApiKey: (accountId) => api.post(`/influencers/social-accounts/${accountId}/rotate-key`),
  getApiKeyUsage: (accountId) => api.get(`/influencers/social-accounts/${accountId}/usage`),
  getApiKeyRentals: (accountId) => api.get(`/influencers/social-accounts/${accountId}/rentals`),
  updateApiKeyStatus: (accountId, statusData) => 
    api.put(`/influencers/social-accounts/${accountId}/status`, statusData),
  
  // API Key Security Settings
  getApiKeySecuritySettings: (accountId) => 
    api.get(`/influencers/social-accounts/${accountId}/security-settings`),
  updateApiKeyRotationSettings: (accountId, settings) => 
    api.put(`/influencers/social-accounts/${accountId}/rotation-settings`, settings),
};

// API Key Management
export const apiKeyAPI = {
  // Rotation operations
  rotateApiKey: (accountId) => api.post(`/api-keys/${accountId}/rotate`),
  updateRotationSchedule: (accountId, scheduleData) => 
    api.put(`/api-keys/${accountId}/rotation-schedule`, scheduleData),
  getKeysForRotation: (days) => api.get('/api-keys/rotation-schedule', { params: { days } }),
  runRotationCheck: () => api.post('/api-keys/rotation-check'),
};

// Advertiser API
export const advertiserAPI = {
  getProfile: () => api.get('/advertisers/profile'),
  updateProfile: (profileData) => api.put('/advertisers/profile', profileData),
  addPaymentMethod: (paymentData) => api.post('/advertisers/payment-methods', paymentData),
  updatePaymentMethod: (methodId, paymentData) =>
    api.put(`/advertisers/payment-methods/${methodId}`, paymentData),
  deletePaymentMethod: (methodId) => api.delete(`/advertisers/payment-methods/${methodId}`),
  
  // Campaign endpoints
  getCampaigns: () => api.get('/advertisers/campaigns'),
  getCampaignById: (campaignId) => api.get(`/advertisers/campaigns/${campaignId}`),
  addCampaign: (campaignData) => api.post('/advertisers/campaigns', campaignData),
  updateCampaign: (campaignId, campaignData) =>
    api.put(`/advertisers/campaigns/${campaignId}`, campaignData),
  deleteCampaign: (campaignId) => api.delete(`/advertisers/campaigns/${campaignId}`),
  
  // Campaign metrics and analytics
  updateCampaignMetrics: (campaignId, metricsData) =>
    api.put(`/advertisers/campaigns/${campaignId}/metrics`, { metrics: metricsData }),
  getCampaignAnalytics: (campaignId) => 
    api.get(`/advertisers/campaigns/${campaignId}/analytics`),
  
  // Campaign rental associations
  addRentalToCampaign: (campaignId, rentalId) =>
    api.put(`/advertisers/campaigns/${campaignId}/rentals/${rentalId}`),
  removeRentalFromCampaign: (campaignId, rentalId) =>
    api.delete(`/advertisers/campaigns/${campaignId}/rentals/${rentalId}`),
};

// Rental API
export const rentalAPI = {
  createRentalRequest: (rentalData) => api.post('/rentals', rentalData),
  getRentals: () => api.get('/rentals'),
  getRentalById: (id) => api.get(`/rentals/${id}`),
  updateRentalStatus: (id, statusData) => api.put(`/rentals/${id}/status`, statusData),
  getRentalApiKey: (id) => api.get(`/rentals/${id}/api-key`),
  getApiKeyUsage: (id) => api.get(`/rentals/${id}/usage`),
  trackApiKeyUsage: (id, usageData) => api.post(`/rentals/${id}/track-usage`, usageData),
};

// Message API
export const messageAPI = {
  getConversations: () => api.get('/messages/conversations'),
  getOrCreateConversation: (userId) => api.get(`/messages/conversations/${userId}`),
  getMessages: (conversationId, params) =>
    api.get(`/messages/conversations/${conversationId}/messages`, { params }),
  sendMessage: (conversationId, messageData) =>
    api.post(`/messages/conversations/${conversationId}/messages`, messageData),
  markMessageAsRead: (messageId) => api.put(`/messages/${messageId}/read`),
};

// Review API
export const reviewAPI = {
  createReview: (reviewData) => api.post('/reviews', reviewData),
  getUserReviews: (userId, params) => api.get(`/reviews/user/${userId}`, { params }),
  getMyReviews: (params) => api.get('/reviews/my-reviews', { params }),
  getReviewsOfMe: (params) => api.get('/reviews/reviews-of-me', { params }),
  respondToReview: (reviewId, responseData) =>
    api.post(`/reviews/${reviewId}/respond`, responseData),
  reportReview: (reviewId, reportData) => api.post(`/reviews/${reviewId}/report`, reportData),
};

export default api;
