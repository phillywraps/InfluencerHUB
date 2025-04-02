/**
 * API Key Rotation Service
 * Handles API key rotation operations and management
 */

import api from './api';
import localStorageService from './localStorageService';
import { STORAGE_KEYS } from '../constants';

/**
 * Service for managing API key rotation
 */
const apiKeyRotationService = {
  /**
   * Get rotation settings for a specific platform
   * @param {string} platformId - ID of the platform
   * @returns {Promise<Object>} Rotation settings
   */
  getRotationSettings: async (platformId) => {
    try {
      const response = await api.get(`/api/api-keys/${platformId}/rotation-settings`);
      return response.data;
    } catch (error) {
      console.error('Error getting rotation settings:', error);
      throw error;
    }
  },

  /**
   * Update rotation settings for a specific platform
   * @param {string} platformId - ID of the platform
   * @param {Object} settings - New rotation settings
   * @returns {Promise<Object>} Updated rotation settings
   */
  updateRotationSettings: async (platformId, settings) => {
    try {
      const response = await api.put(`/api/api-keys/${platformId}/rotation-settings`, settings);
      return response.data;
    } catch (error) {
      console.error('Error updating rotation settings:', error);
      throw error;
    }
  },

  /**
   * Rotate an API key immediately
   * @param {string} platformId - ID of the platform
   * @returns {Promise<Object>} New API key information
   */
  rotateKey: async (platformId) => {
    try {
      const response = await api.post(`/api/api-keys/${platformId}/rotate`);
      return response.data;
    } catch (error) {
      console.error('Error rotating API key:', error);
      throw error;
    }
  },

  /**
   * Get rotation history for a specific platform
   * @param {string} platformId - ID of the platform
   * @param {Object} options - Options for pagination
   * @returns {Promise<Array>} Rotation history
   */
  getRotationHistory: async (platformId, options = {}) => {
    try {
      const response = await api.get(`/api/api-keys/${platformId}/rotation-history`, {
        params: options,
      });
      return response.data;
    } catch (error) {
      console.error('Error getting rotation history:', error);
      throw error;
    }
  },

  /**
   * Get upcoming rotations for all platforms
   * @param {number} days - Number of days to look ahead
   * @returns {Promise<Array>} Upcoming rotations
   */
  getUpcomingRotations: async (days = 30) => {
    try {
      const response = await api.get('/api/api-keys/upcoming-rotations', {
        params: { days },
      });
      return response.data;
    } catch (error) {
      console.error('Error getting upcoming rotations:', error);
      throw error;
    }
  },

  /**
   * Check if any keys need rotation
   * @returns {Promise<Array>} Keys that need rotation
   */
  checkRotationStatus: async () => {
    try {
      const response = await api.get('/api/api-keys/rotation-status');
      return response.data;
    } catch (error) {
      console.error('Error checking rotation status:', error);
      throw error;
    }
  },
  
  /**
   * Set up key rotation for all platforms
   * @param {Object} globalSettings - Settings to apply to all platforms
   * @returns {Promise<Object>} Result of the operation
   */
  setupGlobalRotation: async (globalSettings) => {
    try {
      const response = await api.post('/api/api-keys/setup-rotation', globalSettings);
      return response.data;
    } catch (error) {
      console.error('Error setting up global rotation:', error);
      throw error;
    }
  },
  
  /**
   * Opt out of key rotation for a specific platform
   * @param {string} platformId - ID of the platform
   * @returns {Promise<Object>} Result of the operation
   */
  optOutOfRotation: async (platformId) => {
    try {
      const response = await api.post(`/api/api-keys/${platformId}/opt-out`);
      return response.data;
    } catch (error) {
      console.error('Error opting out of rotation:', error);
      throw error;
    }
  },
  
  /**
   * Get rotation preferences for the current user
   * @returns {Promise<Object>} User's rotation preferences
   */
  getRotationPreferences: async () => {
    try {
      const response = await api.get('/api/users/rotation-preferences');
      return response.data;
    } catch (error) {
      console.error('Error getting rotation preferences:', error);
      throw error;
    }
  },
  
  /**
   * Update rotation preferences for the current user
   * @param {Object} preferences - New rotation preferences
   * @returns {Promise<Object>} Updated preferences
   */
  updateRotationPreferences: async (preferences) => {
    try {
      const response = await api.put('/api/users/rotation-preferences', preferences);
      return response.data;
    } catch (error) {
      console.error('Error updating rotation preferences:', error);
      throw error;
    }
  },
  
  /**
   * Get mockup data for testing (remove in production)
   * This is just for demo purposes to provide mock data
   * @param {string} platformId - ID of the platform
   * @returns {Object} Mockup rotation settings
   */
  getMockRotationSettings: (platformId) => {
    // This is just a mock function for demonstration
    return {
      enabled: true,
      frequency: 30, // days
      notifyBefore: 7, // days
      autoRotate: Math.random() > 0.5, // random for demo
      notifyOnRotation: true,
      lastRotated: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString(),
    };
  },
  
  /**
   * Get mockup history for testing (remove in production)
   * @param {string} platformId - ID of the platform
   * @returns {Array} Mock rotation history
   */
  getMockRotationHistory: (platformId) => {
    // Mock history data for demonstration
    const history = [];
    const now = new Date();
    
    for (let i = 1; i <= 5; i++) {
      const date = new Date(now);
      date.setMonth(now.getMonth() - i);
      
      history.push({
        id: `rotation_${i}`,
        date: date.toISOString(),
        reason: i % 3 === 0 ? 'Manual rotation' : 'Scheduled rotation',
        initiatedBy: i % 3 === 0 ? 'user' : 'system',
      });
    }
    
    return history;
  }
};

export default apiKeyRotationService;
