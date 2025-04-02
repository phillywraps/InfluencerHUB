/**
 * LinkedIn API Integration Service
 * Provides methods for interacting with the LinkedIn API
 */

import api from './api';

/**
 * LinkedIn API service for integrating with LinkedIn's API
 */
const linkedinService = {
  /**
   * Get the authentication URL for LinkedIn OAuth
   * @returns {Promise<string>} The authentication URL
   */
  getAuthUrl: async () => {
    try {
      const response = await api.get('/api/social/linkedin/auth-url');
      return response.data.url;
    } catch (error) {
      console.error('Error getting LinkedIn auth URL:', error);
      throw error;
    }
  },

  /**
   * Authenticate with LinkedIn using the provided code
   * @param {string} code - The authorization code from LinkedIn
   * @returns {Promise<Object>} The authentication result
   */
  authenticate: async (code) => {
    try {
      const response = await api.post('/api/social/linkedin/authenticate', { code });
      return response.data;
    } catch (error) {
      console.error('Error authenticating with LinkedIn:', error);
      throw error;
    }
  },

  /**
   * Get the user's LinkedIn profile
   * @returns {Promise<Object>} The user's LinkedIn profile
   */
  getProfile: async () => {
    try {
      const response = await api.get('/api/social/linkedin/profile');
      return response.data;
    } catch (error) {
      console.error('Error getting LinkedIn profile:', error);
      throw error;
    }
  },

  /**
   * Get the user's LinkedIn connections
   * @param {Object} options - Optional parameters (pagination, filters)
   * @returns {Promise<Array>} The user's LinkedIn connections
   */
  getConnections: async (options = {}) => {
    try {
      const response = await api.get('/api/social/linkedin/connections', { params: options });
      return response.data;
    } catch (error) {
      console.error('Error getting LinkedIn connections:', error);
      throw error;
    }
  },

  /**
   * Get the user's LinkedIn posts
   * @param {Object} options - Optional parameters (pagination, filters)
   * @returns {Promise<Array>} The user's LinkedIn posts
   */
  getPosts: async (options = {}) => {
    try {
      const response = await api.get('/api/social/linkedin/posts', { params: options });
      return response.data;
    } catch (error) {
      console.error('Error getting LinkedIn posts:', error);
      throw error;
    }
  },

  /**
   * Get analytics for the user's LinkedIn profile
   * @param {Object} params - Parameters for the analytics request
   * @returns {Promise<Object>} LinkedIn analytics data
   */
  getAnalytics: async (params = {}) => {
    try {
      const response = await api.get('/api/social/linkedin/analytics', { params });
      return response.data;
    } catch (error) {
      console.error('Error getting LinkedIn analytics:', error);
      throw error;
    }
  },

  /**
   * Create a new post on LinkedIn
   * @param {Object} postData - The data for the new post
   * @returns {Promise<Object>} The created post
   */
  createPost: async (postData) => {
    try {
      const response = await api.post('/api/social/linkedin/posts', postData);
      return response.data;
    } catch (error) {
      console.error('Error creating LinkedIn post:', error);
      throw error;
    }
  },

  /**
   * Generate API key for LinkedIn integration
   * @returns {Promise<Object>} The generated API key information
   */
  generateApiKey: async () => {
    try {
      const response = await api.post('/api/social/linkedin/api-key');
      return response.data;
    } catch (error) {
      console.error('Error generating LinkedIn API key:', error);
      throw error;
    }
  },

  /**
   * Revoke an API key for LinkedIn integration
   * @param {string} keyId - The ID of the API key to revoke
   * @returns {Promise<Object>} The result of the revocation
   */
  revokeApiKey: async (keyId) => {
    try {
      const response = await api.delete(`/api/social/linkedin/api-key/${keyId}`);
      return response.data;
    } catch (error) {
      console.error('Error revoking LinkedIn API key:', error);
      throw error;
    }
  },

  /**
   * Get available API keys for LinkedIn
   * @returns {Promise<Array>} The available API keys
   */
  getApiKeys: async () => {
    try {
      const response = await api.get('/api/social/linkedin/api-keys');
      return response.data;
    } catch (error) {
      console.error('Error getting LinkedIn API keys:', error);
      throw error;
    }
  },

  /**
   * Check if a LinkedIn account is connected
   * @returns {Promise<boolean>} Whether the account is connected
   */
  isConnected: async () => {
    try {
      const response = await api.get('/api/social/linkedin/status');
      return response.data.connected;
    } catch (error) {
      console.error('Error checking LinkedIn connection status:', error);
      return false;
    }
  },

  /**
   * Disconnect a LinkedIn account
   * @returns {Promise<Object>} The result of the disconnection
   */
  disconnect: async () => {
    try {
      const response = await api.post('/api/social/linkedin/disconnect');
      return response.data;
    } catch (error) {
      console.error('Error disconnecting LinkedIn account:', error);
      throw error;
    }
  },

  /**
   * Get company pages the user has access to
   * @returns {Promise<Array>} List of company pages
   */
  getCompanyPages: async () => {
    try {
      const response = await api.get('/api/social/linkedin/company-pages');
      return response.data;
    } catch (error) {
      console.error('Error getting LinkedIn company pages:', error);
      throw error;
    }
  },

  /**
   * Get analytics for a specific company page
   * @param {string} companyId - The ID of the company
   * @param {Object} params - Parameters for the analytics request
   * @returns {Promise<Object>} Company page analytics data
   */
  getCompanyAnalytics: async (companyId, params = {}) => {
    try {
      const response = await api.get(`/api/social/linkedin/companies/${companyId}/analytics`, { params });
      return response.data;
    } catch (error) {
      console.error('Error getting LinkedIn company analytics:', error);
      throw error;
    }
  },

  /**
   * Update LinkedIn account settings
   * @param {Object} settings - The new settings
   * @returns {Promise<Object>} The updated settings
   */
  updateSettings: async (settings) => {
    try {
      const response = await api.put('/api/social/linkedin/settings', settings);
      return response.data;
    } catch (error) {
      console.error('Error updating LinkedIn settings:', error);
      throw error;
    }
  }
};

export default linkedinService;
