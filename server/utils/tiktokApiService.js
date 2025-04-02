const axios = require('axios');
const logger = require('../config/logger');
const encryptionService = require('./encryptionService');
const { TIKTOK_API_BASE_URL } = process.env;

/**
 * Service for TikTok API operations
 */
class TikTokApiService {
  constructor() {
    this.baseURL = TIKTOK_API_BASE_URL || 'https://open.tiktokapis.com/v2';
    this.apiVersion = 'v2';
  }
  
  /**
   * Create an authenticated axios instance for a user
   * @param {string} accessToken - TikTok API access token
   * @returns {Object} Axios instance
   */
  createAuthenticatedClient(accessToken) {
    return axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Check if user account is eligible for content publishing
   * @param {string} accessToken - TikTok API access token
   * @param {string} userId - TikTok user ID
   * @returns {Promise<Object>} Publishing eligibility information
   */
  async checkPublishingEligibility(accessToken, userId) {
    try {
      // Initialize authenticated client
      const client = this.createAuthenticatedClient(accessToken);
      
      // Check required permissions
      const scopesResponse = await client.get(`/oauth/scopes/`);
      const scopes = scopesResponse.data.data.scopes || [];
      
      // Check if user has required publishing scopes
      const hasVideoUpload = scopes.includes('video.upload');
      const hasVideoPublish = scopes.includes('video.publish');
      
      if (!hasVideoUpload || !hasVideoPublish) {
        return {
          canPublish: false,
          reason: 'MISSING_PERMISSIONS',
          requiredScopes: ['video.upload', 'video.publish'],
          currentScopes: scopes
        };
      }
      
      // Check account type and eligibility
      const userInfoResponse = await client.get(`/user/info/`);
      const userInfo = userInfoResponse.data.data;
      
      // Check for business account
      if (userInfo.account_type !== 'business') {
        return {
          canPublish: false,
          reason: 'NOT_BUSINESS_ACCOUNT',
          accountType: userInfo.account_type
        };
      }
      
      // Check if account is in good standing
      // (This is a hypothetical endpoint - actual API may differ)
      const accountStatusResponse = await client.get(`/user/account_status/`);
      const accountStatus = accountStatusResponse.data.data;
      
      if (accountStatus.restrictions && accountStatus.restrictions.includes('content_publishing')) {
        return {
          canPublish: false,
          reason: 'ACCOUNT_RESTRICTED',
          restrictions: accountStatus.restrictions
        };
      }
      
      // All checks passed
      return {
        canPublish: true,
        accountType: userInfo.account_type,
        followers: userInfo.follower_count,
        scopes: scopes
      };
    } catch (error) {
      logger.error('TikTok API error checking publishing eligibility:', error);
      
      // If specific error response is available, parse it
      if (error.response && error.response.data) {
        const errorData = error.response.data;
        
        // Handle specific TikTok API errors
        if (errorData.error && errorData.error.code) {
          switch (errorData.error.code) {
            case 'access_token_expired':
              return {
                canPublish: false,
                reason: 'TOKEN_EXPIRED',
                message: 'Access token has expired. Please reconnect your TikTok account.'
              };
            case 'access_token_invalid':
              return {
                canPublish: false,
                reason: 'TOKEN_INVALID',
                message: 'Access token is invalid. Please reconnect your TikTok account.'
              };
            default:
              return {
                canPublish: false,
                reason: 'API_ERROR',
                code: errorData.error.code,
                message: errorData.error.message
              };
          }
        }
      }
      
      // Generic error fallback
      return {
        canPublish: false,
        reason: 'UNKNOWN_ERROR',
        message: error.message
      };
    }
  }
  
  /**
   * Schedule a video upload to TikTok
   * @param {Object} params - Upload parameters
   * @param {string} params.accessToken - TikTok API access token
   * @param {string} params.userId - TikTok user ID
   * @param {string} params.videoPath - Path to video file
   * @param {string} params.caption - Post caption
   * @param {Date} params.scheduledTime - When to publish the post
   * @returns {Promise<Object>} Scheduling result
   */
  async scheduleVideoUpload({
    accessToken,
    userId,
    videoPath,
    caption,
    scheduledTime
  }) {
    try {
      // Initialize authenticated client
      const client = this.createAuthenticatedClient(accessToken);
      
      // Step 1: Initialize video upload
      const initResponse = await client.post('/video/init/', {
        post_info: {
          title: caption.substring(0, 150), // Ensure title is within limits
          privacy_level: 'PUBLIC',
          scheduled_publish_time: Math.floor(scheduledTime.getTime() / 1000) // Convert to UNIX timestamp
        }
      });
      
      // Extract upload credentials from response
      const { id: uploadId, upload_url } = initResponse.data.data;
      
      // Step 2: Upload video content
      // Note: In a real implementation, this would involve reading the file
      // and uploading it to the TikTok-provided upload_url
      // This is a simplified version
      const fileContent = await this.readVideoFile(videoPath);
      await axios.put(upload_url, fileContent, {
        headers: {
          'Content-Type': 'video/mp4'
        }
      });
      
      // Step 3: Complete the upload
      const completeResponse = await client.post('/video/complete/', {
        upload_id: uploadId
      });
      
      return {
        success: true,
        post_id: uploadId,
        scheduled_time: scheduledTime,
        status: 'scheduled',
        details: completeResponse.data.data
      };
    } catch (error) {
      logger.error('TikTok API error scheduling video upload:', error);
      
      throw new Error(
        error.response?.data?.error?.message || 
        'Failed to schedule video upload to TikTok'
      );
    }
  }
  
  /**
   * Cancel a scheduled video upload
   * @param {Object} params - Cancellation parameters
   * @param {string} params.accessToken - TikTok API access token
   * @param {string} params.userId - TikTok user ID
   * @param {string} params.postId - ID of the scheduled post
   * @returns {Promise<Object>} Cancellation result
   */
  async cancelScheduledUpload({
    accessToken,
    userId,
    postId
  }) {
    try {
      // Initialize authenticated client
      const client = this.createAuthenticatedClient(accessToken);
      
      // Cancel the scheduled upload
      await client.post('/video/cancel/', {
        post_id: postId
      });
      
      return {
        success: true,
        postId,
        status: 'cancelled'
      };
    } catch (error) {
      logger.error('TikTok API error cancelling scheduled upload:', error);
      
      throw new Error(
        error.response?.data?.error?.message || 
        'Failed to cancel scheduled upload on TikTok'
      );
    }
  }
  
  /**
   * Get audience activity data
   * @param {Object} params - Request parameters
   * @param {string} params.accessToken - TikTok API access token
   * @param {string} params.userId - TikTok user ID
   * @returns {Promise<Object>} Audience activity data
   */
  async getAudienceActivity({
    accessToken,
    userId
  }) {
    try {
      // Initialize authenticated client
      const client = this.createAuthenticatedClient(accessToken);
      
      // Fetch audience insights
      const response = await client.get('/insights/audience/', {
        params: {
          metrics: ['audience_activity'],
          date_range: '30_day'
        }
      });
      
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      logger.error('TikTok API error fetching audience activity:', error);
      
      throw new Error(
        error.response?.data?.error?.message || 
        'Failed to fetch audience activity data from TikTok'
      );
    }
  }
  
  /**
   * Calculate optimal posting times based on audience activity
   * @param {Object} analytics - Audience analytics data
   * @returns {Array<Object>} Recommended posting times by day of week
   */
  calculateOptimalPostingTimes(analytics) {
    try {
      const activityData = analytics.data?.audience_activity;
      
      // If no real data available, return default recommendations
      if (!activityData) {
        return this.getDefaultRecommendedTimes();
      }
      
      // Process the activity data (this would be a more complex algorithm in practice)
      // For each day, find the hours with highest activity and recommend posting times
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const recommendedTimes = [];
      
      days.forEach((day, dayIndex) => {
        // Get activity data for this day
        const dayActivity = activityData[dayIndex] || [];
        
        // Find top 2-3 activity hours
        const hourIndices = this.findTopActivityHours(dayActivity, 3);
        
        // Convert hour indices to formatted times
        const times = hourIndices.map(hourIndex => {
          // Format hour as HH:00
          return `${hourIndex.toString().padStart(2, '0')}:00`;
        });
        
        recommendedTimes.push({
          day,
          times
        });
      });
      
      return recommendedTimes;
    } catch (error) {
      logger.error('Error calculating optimal posting times:', error);
      
      // Fall back to default recommendations on error
      return this.getDefaultRecommendedTimes();
    }
  }
  
  /**
   * Find the hours with highest activity values
   * @param {Array<number>} activityByHour - Activity values for each hour
   * @param {number} count - Number of top hours to find
   * @returns {Array<number>} Hour indices with highest activity
   */
  findTopActivityHours(activityByHour, count) {
    // If no data or invalid data, return default peak hours
    if (!Array.isArray(activityByHour) || activityByHour.length === 0) {
      return [18, 20, 21]; // Default peak hours: 6pm, 8pm, 9pm
    }
    
    // Create array of [hourIndex, activityValue] pairs
    const hourActivityPairs = activityByHour.map((activity, index) => [index, activity]);
    
    // Sort by activity value in descending order
    hourActivityPairs.sort((a, b) => b[1] - a[1]);
    
    // Return the top N hour indices
    return hourActivityPairs
      .slice(0, count)
      .map(pair => pair[0]);
  }
  
  /**
   * Get default recommended posting times
   * @returns {Array<Object>} Default recommended times by day
   */
  getDefaultRecommendedTimes() {
    return [
      { day: 'Monday', times: ['18:00', '21:00'] },
      { day: 'Tuesday', times: ['17:00', '20:00'] },
      { day: 'Wednesday', times: ['17:30', '20:30'] },
      { day: 'Thursday', times: ['18:00', '21:00'] },
      { day: 'Friday', times: ['19:00', '22:00'] },
      { day: 'Saturday', times: ['11:00', '15:00', '20:00'] },
      { day: 'Sunday', times: ['12:00', '16:00', '19:00'] }
    ];
  }
  
  /**
   * Simulate reading a video file (placeholder for actual implementation)
   * @param {string} videoPath - Path to video file
   * @returns {Promise<Buffer>} Video file content
   */
  async readVideoFile(videoPath) {
    // This is a placeholder. In a real implementation, this would:
    // 1. Validate the file exists
    // 2. Check file size and type
    // 3. Read file content using fs.promises.readFile
    // 4. Return the buffer
    
    // For simulation, just return a mock buffer
    return Buffer.from('mock video content');
    
    // Real implementation would be something like:
    // const fs = require('fs').promises;
    // return await fs.readFile(videoPath);
  }
}

module.exports = new TikTokApiService();
