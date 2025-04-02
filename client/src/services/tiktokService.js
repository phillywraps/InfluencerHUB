/**
 * TikTok API Service
 * 
 * Provides methods for interacting with the TikTok API
 * including authentication, fetching analytics, and content management
 */

import api from './api';
import { handleApiError } from '../utils/apiUtils';

const BASE_URL = '/api/platforms/tiktok';

/**
 * Get authentication URL for TikTok OAuth 
 * @returns {Promise<Object>} Auth URL object
 */
export const getAuthUrl = async () => {
  try {
    const response = await api.get(`${BASE_URL}/auth-url`);
    return response.data;
  } catch (error) {
    throw handleApiError(error, 'Failed to get TikTok authentication URL');
  }
};

/**
 * Complete OAuth flow with the auth code
 * @param {string} code - The OAuth code from TikTok callback
 * @returns {Promise<Object>} Auth result object
 */
export const completeAuth = async (code) => {
  try {
    const response = await api.post(`${BASE_URL}/complete-auth`, { code });
    return response.data;
  } catch (error) {
    throw handleApiError(error, 'Failed to complete TikTok authentication');
  }
};

/**
 * Disconnect TikTok account
 * @returns {Promise<Object>} Disconnect result
 */
export const disconnectAccount = async () => {
  try {
    const response = await api.post(`${BASE_URL}/disconnect`);
    return response.data;
  } catch (error) {
    throw handleApiError(error, 'Failed to disconnect TikTok account');
  }
};

/**
 * Get TikTok account details
 * @returns {Promise<Object>} Account details
 */
export const getAccountDetails = async () => {
  try {
    const response = await api.get(`${BASE_URL}/account`);
    return response.data;
  } catch (error) {
    throw handleApiError(error, 'Failed to fetch TikTok account details');
  }
};

/**
 * Get analytics overview
 * @param {string} timeRange - Time range for analytics: 'week', 'month', 'year'
 * @returns {Promise<Object>} Analytics overview data
 */
export const getAnalyticsOverview = async (timeRange = 'month') => {
  try {
    const response = await api.get(`${BASE_URL}/analytics/overview`, {
      params: { timeRange }
    });
    return response.data;
  } catch (error) {
    throw handleApiError(error, 'Failed to fetch TikTok analytics overview');
  }
};

/**
 * Get audience demographics
 * @returns {Promise<Object>} Audience demographics data
 */
export const getAudienceDemographics = async () => {
  try {
    const response = await api.get(`${BASE_URL}/analytics/audience`);
    return response.data;
  } catch (error) {
    throw handleApiError(error, 'Failed to fetch TikTok audience demographics');
  }
};

/**
 * Get content performance analytics
 * @param {string} timeRange - Time range for analytics: 'week', 'month', 'year'
 * @param {number} limit - Number of videos to fetch (default: 10)
 * @returns {Promise<Object>} Content performance data
 */
export const getContentPerformance = async (timeRange = 'month', limit = 10) => {
  try {
    const response = await api.get(`${BASE_URL}/analytics/content`, {
      params: { timeRange, limit }
    });
    return response.data;
  } catch (error) {
    throw handleApiError(error, 'Failed to fetch TikTok content performance');
  }
};

/**
 * Get top-performing videos
 * @param {string} timeRange - Time range: 'week', 'month', 'year'
 * @param {string} metric - Metric to sort by: 'views', 'likes', 'shares', 'comments'
 * @param {number} limit - Number of videos to fetch (default: 5)
 * @returns {Promise<Object>} Top videos data
 */
export const getTopVideos = async (timeRange = 'month', metric = 'views', limit = 5) => {
  try {
    const response = await api.get(`${BASE_URL}/analytics/top-videos`, {
      params: { timeRange, metric, limit }
    });
    return response.data;
  } catch (error) {
    throw handleApiError(error, 'Failed to fetch TikTok top videos');
  }
};

/**
 * Get growth metrics over time
 * @param {string} timeRange - Time range: 'week', 'month', 'year'
 * @param {string} metric - Metric to analyze: 'followers', 'views', 'engagement'
 * @returns {Promise<Object>} Growth data with time series
 */
export const getGrowthMetrics = async (timeRange = 'month', metric = 'followers') => {
  try {
    const response = await api.get(`${BASE_URL}/analytics/growth`, {
      params: { timeRange, metric }
    });
    return response.data;
  } catch (error) {
    throw handleApiError(error, 'Failed to fetch TikTok growth metrics');
  }
};

/**
 * Get TikTok API key usage and rate limit information
 * @returns {Promise<Object>} API usage data
 */
export const getApiUsage = async () => {
  try {
    const response = await api.get(`${BASE_URL}/api-usage`);
    return response.data;
  } catch (error) {
    throw handleApiError(error, 'Failed to fetch TikTok API usage information');
  }
};

/**
 * Schedule a TikTok video post
 * @param {Object} postData - Post data including video, caption, etc.
 * @returns {Promise<Object>} Scheduled post result
 */
export const schedulePost = async (postData) => {
  try {
    const formData = new FormData();
    
    // Append video file
    if (postData.videoFile) {
      formData.append('video', postData.videoFile);
    }
    
    // Append other post data
    formData.append('caption', postData.caption || '');
    formData.append('scheduledTime', postData.scheduledTime || '');
    
    if (postData.hashtags && Array.isArray(postData.hashtags)) {
      formData.append('hashtags', JSON.stringify(postData.hashtags));
    }
    
    if (postData.privacy) {
      formData.append('privacy', postData.privacy);
    }
    
    if (postData.allowComments !== undefined) {
      formData.append('allowComments', postData.allowComments ? 'true' : 'false');
    }
    
    const response = await api.post(`${BASE_URL}/content/schedule`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data;
  } catch (error) {
    throw handleApiError(error, 'Failed to schedule TikTok post');
  }
};

/**
 * Get scheduled posts
 * @returns {Promise<Object>} List of scheduled posts
 */
export const getScheduledPosts = async () => {
  try {
    const response = await api.get(`${BASE_URL}/content/scheduled`);
    return response.data;
  } catch (error) {
    throw handleApiError(error, 'Failed to fetch scheduled TikTok posts');
  }
};

/**
 * Delete a scheduled post
 * @param {string} postId - ID of the scheduled post
 * @returns {Promise<Object>} Delete result
 */
export const deleteScheduledPost = async (postId) => {
  try {
    const response = await api.delete(`${BASE_URL}/content/scheduled/${postId}`);
    return response.data;
  } catch (error) {
    throw handleApiError(error, 'Failed to delete scheduled TikTok post');
  }
};

/**
 * Get hashtag suggestions based on content and trending topics
 * @param {string} content - Content text to base suggestions on
 * @param {number} count - Number of hashtags to suggest (default: 10)
 * @returns {Promise<Object>} Hashtag suggestions
 */
export const getHashtagSuggestions = async (content, count = 10) => {
  try {
    const response = await api.get(`${BASE_URL}/hashtags/suggestions`, {
      params: { content, count }
    });
    return response.data;
  } catch (error) {
    throw handleApiError(error, 'Failed to get TikTok hashtag suggestions');
  }
};

/**
 * Get trending hashtags
 * @param {number} count - Number of hashtags to return (default: 20)
 * @returns {Promise<Object>} Trending hashtags
 */
export const getTrendingHashtags = async (count = 20) => {
  try {
    const response = await api.get(`${BASE_URL}/hashtags/trending`, {
      params: { count }
    });
    return response.data;
  } catch (error) {
    throw handleApiError(error, 'Failed to get trending TikTok hashtags');
  }
};

/**
 * Check if a TikTok account is connected
 * @returns {Promise<boolean>} True if connected, false otherwise
 */
export const isAccountConnected = async () => {
  try {
    const response = await api.get(`${BASE_URL}/connection-status`);
    return response.data.connected;
  } catch (error) {
    console.error('Error checking TikTok connection status:', error);
    return false;
  }
};

const tiktokService = {
  getAuthUrl,
  completeAuth,
  disconnectAccount,
  getAccountDetails,
  getAnalyticsOverview,
  getAudienceDemographics,
  getContentPerformance,
  getTopVideos,
  getGrowthMetrics,
  getApiUsage,
  schedulePost,
  getScheduledPosts,
  deleteScheduledPost,
  getHashtagSuggestions,
  getTrendingHashtags,
  isAccountConnected
};

export default tiktokService;
