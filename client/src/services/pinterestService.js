/**
 * Pinterest API Integration Service
 * Provides methods for interacting with the Pinterest API
 */

import api from './api';

/**
 * Pinterest API service for integrating with Pinterest's API
 */
const pinterestService = {
  /**
   * Get the authentication URL for Pinterest OAuth
   * @returns {Promise<string>} The authentication URL
   */
  getAuthUrl: async () => {
    try {
      const response = await api.get('/api/social/pinterest/auth-url');
      return response.data.url;
    } catch (error) {
      console.error('Error getting Pinterest auth URL:', error);
      throw error;
    }
  },

  /**
   * Authenticate with Pinterest using the provided code
   * @param {string} code - The authorization code from Pinterest
   * @returns {Promise<Object>} The authentication result
   */
  authenticate: async (code) => {
    try {
      const response = await api.post('/api/social/pinterest/authenticate', { code });
      return response.data;
    } catch (error) {
      console.error('Error authenticating with Pinterest:', error);
      throw error;
    }
  },

  /**
   * Get the user's Pinterest profile
   * @returns {Promise<Object>} The user's Pinterest profile
   */
  getProfile: async () => {
    try {
      const response = await api.get('/api/social/pinterest/profile');
      return response.data;
    } catch (error) {
      console.error('Error getting Pinterest profile:', error);
      throw error;
    }
  },

  /**
   * Get the user's Pinterest boards
   * @returns {Promise<Array>} The user's Pinterest boards
   */
  getBoards: async () => {
    try {
      const response = await api.get('/api/social/pinterest/boards');
      return response.data;
    } catch (error) {
      console.error('Error getting Pinterest boards:', error);
      throw error;
    }
  },

  /**
   * Get pins from a specific board
   * @param {string} boardId - The ID of the board
   * @param {Object} options - Optional parameters (pagination, filters)
   * @returns {Promise<Array>} The pins in the board
   */
  getPins: async (boardId, options = {}) => {
    try {
      const response = await api.get(`/api/social/pinterest/boards/${boardId}/pins`, { params: options });
      return response.data;
    } catch (error) {
      console.error('Error getting Pinterest pins:', error);
      throw error;
    }
  },

  /**
   * Get analytics for the user's Pinterest account
   * @param {Object} params - Parameters for the analytics request
   * @returns {Promise<Object>} Pinterest analytics data
   */
  getAnalytics: async (params = {}) => {
    try {
      const response = await api.get('/api/social/pinterest/analytics', { params });
      return response.data;
    } catch (error) {
      console.error('Error getting Pinterest analytics:', error);
      throw error;
    }
  },

  /**
   * Create a new pin
   * @param {Object} pinData - The data for the new pin
   * @returns {Promise<Object>} The created pin
   */
  createPin: async (pinData) => {
    try {
      const response = await api.post('/api/social/pinterest/pins', pinData);
      return response.data;
    } catch (error) {
      console.error('Error creating Pinterest pin:', error);
      throw error;
    }
  },

  /**
   * Generate API key for Pinterest integration
   * @returns {Promise<Object>} The generated API key information
   */
  generateApiKey: async () => {
    try {
      const response = await api.post('/api/social/pinterest/api-key');
      return response.data;
    } catch (error) {
      console.error('Error generating Pinterest API key:', error);
      throw error;
    }
  },

  /**
   * Revoke an API key for Pinterest integration
   * @param {string} keyId - The ID of the API key to revoke
   * @returns {Promise<Object>} The result of the revocation
   */
  revokeApiKey: async (keyId) => {
    try {
      const response = await api.delete(`/api/social/pinterest/api-key/${keyId}`);
      return response.data;
    } catch (error) {
      console.error('Error revoking Pinterest API key:', error);
      throw error;
    }
  },

  /**
   * Get available API keys for Pinterest
   * @returns {Promise<Array>} The available API keys
   */
  getApiKeys: async () => {
    try {
      const response = await api.get('/api/social/pinterest/api-keys');
      return response.data;
    } catch (error) {
      console.error('Error getting Pinterest API keys:', error);
      throw error;
    }
  },

  /**
   * Check if a Pinterest account is connected
   * @returns {Promise<boolean>} Whether the account is connected
   */
  isConnected: async () => {
    try {
      const response = await api.get('/api/social/pinterest/status');
      return response.data.connected;
    } catch (error) {
      console.error('Error checking Pinterest connection status:', error);
      return false;
    }
  },

  /**
   * Disconnect a Pinterest account
   * @returns {Promise<Object>} The result of the disconnection
   */
  disconnect: async () => {
    try {
      const response = await api.post('/api/social/pinterest/disconnect');
      return response.data;
    } catch (error) {
      console.error('Error disconnecting Pinterest account:', error);
      throw error;
    }
  },

  /**
   * Update Pinterest account settings
   * @param {Object} settings - The new settings
   * @returns {Promise<Object>} The updated settings
   */
  updateSettings: async (settings) => {
    try {
      const response = await api.put('/api/social/pinterest/settings', settings);
      return response.data;
    } catch (error) {
      console.error('Error updating Pinterest settings:', error);
      throw error;
    }
  }
};

export default pinterestService;
