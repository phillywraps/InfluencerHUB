/**
 * Snapchat API Integration Service
 * Provides methods for interacting with the Snapchat API
 */

import api from './api';

/**
 * Snapchat API service for integrating with Snapchat's API
 */
const snapchatService = {
  /**
   * Get the authentication URL for Snapchat OAuth
   * @returns {Promise<string>} The authentication URL
   */
  getAuthUrl: async () => {
    try {
      const response = await api.get('/api/social/snapchat/auth-url');
      return response.data.url;
    } catch (error) {
      console.error('Error getting Snapchat auth URL:', error);
      throw error;
    }
  },

  /**
   * Authenticate with Snapchat using the provided code
   * @param {string} code - The authorization code from Snapchat
   * @returns {Promise<Object>} The authentication result
   */
  authenticate: async (code) => {
    try {
      const response = await api.post('/api/social/snapchat/authenticate', { code });
      return response.data;
    } catch (error) {
      console.error('Error authenticating with Snapchat:', error);
      throw error;
    }
  },

  /**
   * Get the user's Snapchat profile
   * @returns {Promise<Object>} The user's Snapchat profile
   */
  getProfile: async () => {
    try {
      const response = await api.get('/api/social/snapchat/profile');
      return response.data;
    } catch (error) {
      console.error('Error getting Snapchat profile:', error);
      throw error;
    }
  },

  /**
   * Get analytics for the user's Snapchat account
   * @param {Object} params - Parameters for the analytics request
   * @returns {Promise<Object>} Snapchat analytics data
   */
  getAnalytics: async (params = {}) => {
    try {
      const response = await api.get('/api/social/snapchat/analytics', { params });
      return response.data;
    } catch (error) {
      console.error('Error getting Snapchat analytics:', error);
      throw error;
    }
  },

  /**
   * Get engagement metrics for the user's Snapchat content
   * @param {Object} params - Parameters for the engagement metrics request
   * @returns {Promise<Object>} Snapchat engagement metrics
   */
  getEngagementMetrics: async (params = {}) => {
    try {
      const response = await api.get('/api/social/snapchat/engagement', { params });
      return response.data;
    } catch (error) {
      console.error('Error getting Snapchat engagement metrics:', error);
      throw error;
    }
  },

  /**
   * Get demographic information about the user's Snapchat audience
   * @returns {Promise<Object>} Snapchat audience demographics
   */
  getDemographics: async () => {
    try {
      const response = await api.get('/api/social/snapchat/demographics');
      return response.data;
    } catch (error) {
      console.error('Error getting Snapchat demographics:', error);
      throw error;
    }
  },

  /**
   * Get the user's Snapchat public stories
   * @param {Object} params - Parameters for the stories request
   * @returns {Promise<Array>} The user's Snapchat stories
   */
  getStories: async (params = {}) => {
    try {
      const response = await api.get('/api/social/snapchat/stories', { params });
      return response.data;
    } catch (error) {
      console.error('Error getting Snapchat stories:', error);
      throw error;
    }
  },

  /**
   * Generate API key for Snapchat integration
   * @returns {Promise<Object>} The generated API key information
   */
  generateApiKey: async () => {
    try {
      const response = await api.post('/api/social/snapchat/api-key');
      return response.data;
    } catch (error) {
      console.error('Error generating Snapchat API key:', error);
      throw error;
    }
  },

  /**
   * Revoke an API key for Snapchat integration
   * @param {string} keyId - The ID of the API key to revoke
   * @returns {Promise<Object>} The result of the revocation
   */
  revokeApiKey: async (keyId) => {
    try {
      const response = await api.delete(`/api/social/snapchat/api-key/${keyId}`);
      return response.data;
    } catch (error) {
      console.error('Error revoking Snapchat API key:', error);
      throw error;
    }
  },

  /**
   * Get available API keys for Snapchat
   * @returns {Promise<Array>} The available API keys
   */
  getApiKeys: async () => {
    try {
      const response = await api.get('/api/social/snapchat/api-keys');
      return response.data;
    } catch (error) {
      console.error('Error getting Snapchat API keys:', error);
      throw error;
    }
  },

  /**
   * Check if a Snapchat account is connected
   * @returns {Promise<boolean>} Whether the account is connected
   */
  isConnected: async () => {
    try {
      const response = await api.get('/api/social/snapchat/status');
      return response.data.connected;
    } catch (error) {
      console.error('Error checking Snapchat connection status:', error);
      return false;
    }
  },

  /**
   * Disconnect a Snapchat account
   * @returns {Promise<Object>} The result of the disconnection
   */
  disconnect: async () => {
    try {
      const response = await api.post('/api/social/snapchat/disconnect');
      return response.data;
    } catch (error) {
      console.error('Error disconnecting Snapchat account:', error);
      throw error;
    }
  },

  /**
   * Get location data for Snapchat stories (geolocation analytics)
   * @returns {Promise<Object>} Location data for Snapchat stories
   */
  getLocationData: async () => {
    try {
      const response = await api.get('/api/social/snapchat/locations');
      return response.data;
    } catch (error) {
      console.error('Error getting Snapchat location data:', error);
      throw error;
    }
  },

  /**
   * Update Snapchat account settings
   * @param {Object} settings - The new settings
   * @returns {Promise<Object>} The updated settings
   */
  updateSettings: async (settings) => {
    try {
      const response = await api.put('/api/social/snapchat/settings', settings);
      return response.data;
    } catch (error) {
      console.error('Error updating Snapchat settings:', error);
      throw error;
    }
  }
};

export default snapchatService;
