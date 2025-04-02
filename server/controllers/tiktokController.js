/**
 * TikTok Controller
 * 
 * Handles requests related to TikTok integration:
 * - OAuth authentication
 * - Account management
 * - Analytics
 * - Content scheduling
 * - Hashtag suggestions
 * 
 * Enhanced with:
 * - Cached API responses for better performance
 * - Retry logic for API resilience
 * - Proper rate limit handling
 * - Comprehensive error handling
 */

const User = require('../models/userModel');
const mongoose = require('mongoose');
const axios = require('axios');
const crypto = require('crypto');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const logger = require('../config/logger');
const tiktokApiService = require('../utils/tiktokApiService');
const tiktokCache = require('../utils/caching/tiktokCacheService');

// TikTok API configuration
const TIKTOK_API_BASE = 'https://open.tiktokapis.com/v2';
const TIKTOK_CLIENT_ID = process.env.TIKTOK_CLIENT_ID;
const TIKTOK_CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET;
const TIKTOK_REDIRECT_URI = process.env.TIKTOK_REDIRECT_URI;

// Storage for uploaded videos (temporary)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/tiktok';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniquePrefix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniquePrefix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB file size limit
  fileFilter: (req, file, cb) => {
    // Only allow video files
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed'), false);
    }
  }
}).single('video');

const uploadAsync = promisify(upload);

/**
 * Get TikTok authentication URL for OAuth flow
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getAuthUrl = async (req, res) => {
  try {
    // Generate a secure random state parameter to prevent CSRF
    const state = crypto.randomBytes(24).toString('hex');
    // Define needed scopes for our app functionality
    const scope = 'user.info.basic,video.list,video.upload,video.analytics';
    
    // Store state in session for verification during callback
    req.session.tiktokAuthState = state;
    
    // Cache state in case session is lost
    if (req.user) {
      tiktokCache.setCachedData('auth_state', req.user.id, { state }, { userId: req.user.id }, 60 * 15); // 15 minutes TTL
    }
    
    const authUrl = `https://www.tiktok.com/auth/authorize?` +
      `client_key=${TIKTOK_CLIENT_ID}&` +
      `scope=${scope}&` +
      `response_type=code&` +
      `redirect_uri=${TIKTOK_REDIRECT_URI}&` +
      `state=${state}`;
    
    logger.info(`Generated TikTok auth URL for user ${req.user ? req.user.id : 'anonymous'}`);
    res.status(200).json({ url: authUrl });
  } catch (error) {
    logger.error('Error generating TikTok auth URL:', error);
    res.status(500).json({ 
      error: 'Failed to generate TikTok authentication URL',
      details: error.message
    });
  }
};

/**
 * Complete OAuth flow by exchanging code for access token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.completeAuth = async (req, res) => {
  try {
    const { code, state } = req.body;
    
    // Validate state to prevent CSRF attacks
    if (state !== req.session.tiktokAuthState) {
      return res.status(400).json({ error: 'Invalid state parameter' });
    }
    
    // Clear the state from session
    req.session.tiktokAuthState = undefined;
    
    // Exchange code for access token
    const tokenResponse = await tiktokApiService.makeRequest(
      '/oauth/token',
      'POST',
      {
        data: {
          client_key: TIKTOK_CLIENT_ID,
          client_secret: TIKTOK_CLIENT_SECRET,
          code,
          grant_type: 'authorization_code',
          redirect_uri: TIKTOK_REDIRECT_URI
        },
        skipCache: true
      }
    );
    
    const { 
      access_token, 
      refresh_token, 
      expires_in, 
      open_id, 
      scope 
    } = tokenResponse;
    
    // Get user profile using our API service
    const profileResponse = await tiktokApiService.getUserProfile(
      access_token,
      req.user.id,
      true // Skip cache for fresh data
    );
    
    const profileData = profileResponse.data;
    
    // Update or create TikTok connection for user
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Prepare connection data
    const connectionData = {
      platform: 'tiktok',
      platformId: open_id,
      accessToken: access_token,
      refreshToken: refresh_token,
      tokenExpires: new Date(Date.now() + expires_in * 1000),
      profile: {
        username: profileData.display_name,
        displayName: profileData.display_name,
        bio: profileData.bio_description || '',
        profileUrl: profileData.profile_deep_link,
        profileImageUrl: profileData.avatar_url,
        verifiedStatus: profileData.is_verified || false,
        followerCount: profileData.follower_count || 0,
        followingCount: profileData.following_count || 0,
        likesCount: profileData.likes_count || 0
      },
      scope: scope.split(','),
      connectedAt: new Date(),
      lastUpdated: new Date()
    };
    
    // Check if connection already exists and update it
    const connectionIndex = user.platformConnections.findIndex(
      conn => conn.platform === 'tiktok'
    );
    
    if (connectionIndex >= 0) {
      user.platformConnections[connectionIndex] = connectionData;
    } else {
      user.platformConnections.push(connectionData);
    }
    
    await user.save();
    
    res.status(200).json({
      message: 'TikTok account connected successfully',
      username: profileData.display_name,
      profileImageUrl: profileData.avatar_url
    });
  } catch (error) {
    logger.error('Error completing TikTok auth:', error);
    
    // Provide more detailed error message based on the source
    let errorMessage = 'Failed to complete TikTok authentication';
    if (error.status) {
      errorMessage = `TikTok API error: ${error.message}`;
    } else if (error.response) {
      const tiktokError = error.response.data.error || {};
      errorMessage = `TikTok API error: ${tiktokError.message || tiktokError.error_description || error.response.status}`;
    }
    
    res.status(500).json({ 
      error: errorMessage,
      details: error.message
    });
  }
};

/**
 * Get connection status of TikTok account
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getConnectionStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const tiktokConnection = user.platformConnections.find(
      conn => conn.platform === 'tiktok'
    );
    
    const connected = !!tiktokConnection;
    
    res.status(200).json({
      connected,
      lastUpdated: tiktokConnection ? tiktokConnection.lastUpdated : null
    });
  } catch (error) {
    logger.error('Error checking TikTok connection status:', error);
    res.status(500).json({ 
      error: 'Failed to check TikTok connection status',
      details: error.message
    });
  }
};

/**
 * Get TikTok account details
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getAccountDetails = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const tiktokConnection = user.platformConnections.find(
      conn => conn.platform === 'tiktok'
    );
    
    if (!tiktokConnection) {
      return res.status(404).json({ error: 'TikTok account not connected' });
    }
    
    // Return cached profile data along with connection details
    res.status(200).json({
      connected: true,
      username: tiktokConnection.profile.username,
      displayName: tiktokConnection.profile.displayName,
      bio: tiktokConnection.profile.bio,
      profileUrl: tiktokConnection.profile.profileUrl,
      profileImageUrl: tiktokConnection.profile.profileImageUrl,
      verifiedStatus: tiktokConnection.profile.verifiedStatus,
      followerCount: tiktokConnection.profile.followerCount,
      followingCount: tiktokConnection.profile.followingCount,
      likesCount: tiktokConnection.profile.likesCount,
      connectedAt: tiktokConnection.connectedAt,
      lastUpdated: tiktokConnection.lastUpdated,
      permissions: tiktokConnection.scope
    });
  } catch (error) {
    logger.error('Error fetching TikTok account details:', error);
    res.status(500).json({ 
      error: 'Failed to fetch TikTok account details',
      details: error.message
    });
  }
};

/**
 * Disconnect TikTok account
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.disconnectAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Filter out TikTok connection
    user.platformConnections = user.platformConnections.filter(
      conn => conn.platform !== 'tiktok'
    );
    
    await user.save();
    
    // Clear user's cache data
    tiktokCache.clearUserCache(req.user.id);
    
    res.status(200).json({ message: 'TikTok account disconnected successfully' });
  } catch (error) {
    logger.error('Error disconnecting TikTok account:', error);
    res.status(500).json({ 
      error: 'Failed to disconnect TikTok account',
      details: error.message
    });
  }
};

/**
 * Get analytics overview
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getAnalyticsOverview = async (req, res) => {
  try {
    const { timeRange = 'month' } = req.query;
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const tiktokConnection = user.platformConnections.find(
      conn => conn.platform === 'tiktok'
    );
    
    if (!tiktokConnection) {
      return res.status(404).json({ error: 'TikTok account not connected' });
    }
    
    // Ensure token is still valid
    await refreshTokenIfNeeded(user, tiktokConnection);
    
    // Calculate date range based on timeRange
    const { startDate, endDate } = getDateRangeFromTimeRange(timeRange);
    
    // Get analytics using our API service with caching
    const analyticsData = await tiktokApiService.getUserAnalytics(
      tiktokConnection.accessToken,
      req.user.id,
      tiktokConnection.platformId,
      timeRange,
      req.query.skipCache === 'true'
    );
    
    const data = analyticsData.data;
    
    // Process analytics data
    const overview = {
      timeRange,
      period: {
        start: startDate,
        end: endDate
      },
      followers: {
        count: tiktokConnection.profile.followerCount,
        growth: calculateGrowth(data.followers)
      },
      engagement: {
        likes: sum(data.likes),
        comments: sum(data.comments),
        shares: sum(data.shares),
        engagementRate: calculateEngagementRate(
          sum(data.likes) + sum(data.comments) + sum(data.shares),
          tiktokConnection.profile.followerCount
        )
      },
      views: {
        profileViews: sum(data.profile_views),
        videoViews: sum(data.video_views)
      },
      reach: sum(data.reach),
      metadata: {
        cached: !req.query.skipCache === 'true' && !!tiktokCache.getCachedData('analytics', req.user.id, { timeRange }),
        timestamp: new Date().toISOString()
      }
    };
    
    res.status(200).json(overview);
  } catch (error) {
    logger.error('Error fetching TikTok analytics overview:', error);
    
    // Handle errors from our API service
    if (error.status) {
      return res.status(error.status).json({
        error: 'TikTok API error',
        message: error.message,
        details: error.details || {}
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to fetch TikTok analytics overview',
      details: error.message
    });
  }
};

/**
 * Get audience demographics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getAudienceDemographics = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const tiktokConnection = user.platformConnections.find(
      conn => conn.platform === 'tiktok'
    );
    
    if (!tiktokConnection) {
      return res.status(404).json({ error: 'TikTok account not connected' });
    }
    
    // Ensure token is still valid
    await refreshTokenIfNeeded(user, tiktokConnection);
    
    // Use our TikTok API service to get demographics with caching
    const demographicsData = await tiktokApiService.getAudienceDemographics(
      tiktokConnection.accessToken,
      req.user.id,
      tiktokConnection.platformId,
      req.query.skipCache === 'true'
    );
    
    // Process and format demographics data
    const demographics = {
      gender: processDemographicBreakdown(demographicsData.data.gender),
      age: processDemographicBreakdown(demographicsData.data.age),
      countries: processDemographicBreakdown(demographicsData.data.country),
      languages: processDemographicBreakdown(demographicsData.data.language)
    };
    
    // Add metadata about cache status
    const response = {
      ...demographics,
      metadata: {
        cached: !req.query.skipCache === 'true' && !!tiktokCache.getCachedData('audience', req.user.id),
        timestamp: new Date().toISOString()
      }
    };
    
    res.status(200).json(response);
  } catch (error) {
    logger.error('Error fetching TikTok audience demographics:', error);
    
    // Handle errors from our API service
    if (error.status) {
      return res.status(error.status).json({
        error: 'TikTok API error',
        message: error.message,
        details: error.details || {}
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to fetch TikTok audience demographics',
      details: error.message
    });
  }
};

/**
 * Get content performance
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getContentPerformance = async (req, res) => {
  try {
    const { timeRange = 'month', limit = 10 } = req.query;
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const tiktokConnection = user.platformConnections.find(
      conn => conn.platform === 'tiktok'
    );
    
    if (!tiktokConnection) {
      return res.status(404).json({ error: 'TikTok account not connected' });
    }
    
    // Ensure token is still valid
    await refreshTokenIfNeeded(user, tiktokConnection);
    
    // Calculate date range based on timeRange
    const { startDate, endDate } = getDateRangeFromTimeRange(timeRange);
    
    // Get videos using our API service with caching
    const videosData = await tiktokApiService.getUserVideos(
      tiktokConnection.accessToken,
      req.user.id,
      parseInt(limit, 10),
      req.query.skipCache === 'true'
    );
    
    // Filter by date range
    const videos = videosData.data.videos.filter(video => {
      const videoDate = new Date(video.create_time * 1000);
      return videoDate >= startDate && videoDate <= endDate;
    });
    
    // Get video stats
    const videoPerformance = videos.map(video => ({
      id: video.id,
      title: video.caption || 'Untitled',
      thumbnailUrl: video.cover_image_url,
      url: video.share_url,
      createdAt: new Date(video.create_time * 1000),
      metrics: {
        views: video.view_count || 0,
        likes: video.like_count || 0,
        comments: video.comment_count || 0,
        shares: video.share_count || 0,
        engagementRate: calculateEngagementRate(
          (video.like_count || 0) + (video.comment_count || 0) + (video.share_count || 0),
          video.view_count || 0
        )
      }
    }));
    
    res.status(200).json({
      timeRange,
      period: {
        start: startDate,
        end: endDate
      },
      posts: videoPerformance,
      metadata: {
        cached: !req.query.skipCache === 'true' && !!tiktokCache.getCachedData('content', req.user.id, { limit }),
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Error fetching TikTok content performance:', error);
    
    // Handle errors from our API service
    if (error.status) {
      return res.status(error.status).json({
        error: 'TikTok API error',
        message: error.message,
        details: error.details || {}
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to fetch TikTok content performance',
      details: error.message
    });
  }
};

/**
 * Get top videos
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getTopVideos = async (req, res) => {
  try {
    const { timeRange = 'month', metric = 'views', limit = 5 } = req.query;
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const tiktokConnection = user.platformConnections.find(
      conn => conn.platform === 'tiktok'
    );
    
    if (!tiktokConnection) {
      return res.status(404).json({ error: 'TikTok account not connected' });
    }
    
    // Ensure token is still valid
    await refreshTokenIfNeeded(user, tiktokConnection);
    
    // Calculate date range based on timeRange
    const { startDate, endDate } = getDateRangeFromTimeRange(timeRange);
    
    // Get videos using our API service with caching
    const videosData = await tiktokApiService.getUserVideos(
      tiktokConnection.accessToken,
      req.user.id,
      50, // Get a larger list to filter and sort
      req.query.skipCache === 'true'
    );
    
    // Filter by date range
    const videos = videosData.data.videos.filter(video => {
      const videoDate = new Date(video.create_time * 1000);
      return videoDate >= startDate && videoDate <= endDate;
    });
    
    // Map API response to our format
    let mappedVideos = videos.map(video => ({
      id: video.id,
      title: video.caption || 'Untitled',
      thumbnailUrl: video.cover_image_url,
      url: video.share_url,
      createdAt: new Date(video.create_time * 1000),
      metrics: {
        views: video.view_count || 0,
        likes: video.like_count || 0,
        comments: video.comment_count || 0,
        shares: video.share_count || 0
      }
    }));
    
    // Sort by specified metric
    let sortField;
    switch (metric) {
      case 'likes':
        sortField = 'metrics.likes';
        break;
      case 'comments':
        sortField = 'metrics.comments';
        break;
      case 'shares':
        sortField = 'metrics.shares';
        break;
      case 'views':
      default:
        sortField = 'metrics.views';
    }
    
    mappedVideos.sort((a, b) => {
      const fieldA = sortField.split('.').reduce((obj, field) => obj[field], a);
      const fieldB = sortField.split('.').reduce((obj, field) => obj[field], b);
      return fieldB - fieldA; // Descending order
    });
    
    // Limit results
    const topVideos = mappedVideos.slice(0, parseInt(limit, 10));
    
    res.status(200).json({
      timeRange,
      metric,
      period: {
        start: startDate,
        end: endDate
      },
      videos: topVideos,
      metadata: {
        cached: !req.query.skipCache === 'true' && !!tiktokCache.getCachedData('content', req.user.id, { limit: 50 }),
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Error fetching TikTok top videos:', error);
    
    // Handle errors from our API service
    if (error.status) {
      return res.status(error.status).json({
        error: 'TikTok API error',
        message: error.message,
        details: error.details || {}
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to fetch TikTok top videos',
      details: error.message
    });
  }
};

/**
 * Get growth metrics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getGrowthMetrics = async (req, res) => {
  try {
    const { timeRange = 'month', metric = 'followers' } = req.query;
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const tiktokConnection = user.platformConnections.find(
      conn => conn.platform === 'tiktok'
    );
    
    if (!tiktokConnection) {
      return res.status(404).json({ error: 'TikTok account not connected' });
    }
    
    // Ensure token is still valid
    await refreshTokenIfNeeded(user, tiktokConnection);
    
    // Calculate date range based on timeRange
    const { startDate, endDate, interval } = getDateRangeFromTimeRange(timeRange);
    
    // Get metrics data using our API service
    const metricsData = await tiktokApiService.makeRequest(
      '/research/user/stats',
      'GET',
      {
        accessToken: tiktokConnection.accessToken,
        userId: req.user.id,
        cacheType: 'analytics',
        cacheParams: { timeRange, metric, interval },
        skipCache: req.query.skipCache === 'true',
        params: {
          user_id: tiktokConnection.platformId,
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          metrics: metric,
          interval
        }
      }
    );
    
    const data = metricsData.data;
    
    // Process time series data
    const timeSeries = data[metric].map((value, index) => {
      // Calculate date for this interval
      const date = new Date(startDate);
      if (interval === 'day') {
        date.setDate(date.getDate() + index);
      } else if (interval === 'week') {
        date.setDate(date.getDate() + index * 7);
      } else if (interval === 'month') {
        date.setMonth(date.getMonth() + index);
      }
      
      return {
        date: date.toISOString().split('T')[0],
        value
      };
    });
    
    // Calculate summary metrics
    const total = sum(data[metric]);
    const average = calculateAverage(data[metric]);
    const growth = calculateGrowth(data[metric]);
    
    res.status(200).json({
      timeRange,
      metric,
      period: {
        start: startDate,
        end: endDate,
        interval
      },
      summary: {
        total,
        average,
        growth
      },
      timeSeries,
      metadata: {
        cached: !req.query.skipCache === 'true' && !!tiktokCache.getCachedData('analytics', req.user.id, { timeRange, metric, interval }),
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Error fetching TikTok growth metrics:', error);
    
    // Handle errors from our API service
    if (error.status) {
      return res.status(error.status).json({
        error: 'TikTok API error',
        message: error.message,
        details: error.details || {}
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to fetch TikTok growth metrics',
      details: error.message
    });
  }
};

/**
 * Get API usage information
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getApiUsage = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const tiktokConnection = user.platformConnections.find(
      conn => conn.platform === 'tiktok'
    );
    
    if (!tiktokConnection) {
      return res.status(404).json({ error: 'TikTok account not connected' });
    }
    
    // Ensure token is still valid
    await refreshTokenIfNeeded(user, tiktokConnection);
    
    // Get rate limit info using our API service
    const rateLimitData = await tiktokApiService.getRateLimitInfo(
      tiktokConnection.accessToken
    );
    
    // Get cache stats
    const cacheStats = tiktokCache.getCacheStats();
    
    res.status(200).json({
      rateLimit: rateLimitData.data,
      tokenExpires: tiktokConnection.tokenExpires,
      cache: cacheStats
    });
  } catch (error) {
    logger.error('Error fetching TikTok API usage:', error);
    
    // Handle errors from our API service
    if (error.status) {
      return res.status(error.status).json({
        error: 'TikTok API error',
        message: error.message,
        details: error.details || {}
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to fetch TikTok API usage information',
      details: error.message
    });
  }
};

/**
 * Schedule a new post
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.schedulePost = async (req, res) => {
  try {
    // Handle file upload with multer
    await uploadAsync(req, res);
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const tiktokConnection = user.platformConnections.find(
      conn => conn.platform === 'tiktok'
    );
    
    if (!tiktokConnection) {
      return res.status(404).json({ error: 'TikTok account not connected' });
    }
    
    // Parse request body
    const {
      caption,
      scheduledTime,
      hashtags = [],
      privacy = 'public',
      allowComments = true
    } = req.body;
    
    // Validate inputs
    if (!caption) {
      return res.status(400).json({ error: 'Caption is required' });
    }
    
    if (!scheduledTime) {
      return res.status(400).json({ error: 'Scheduled time is required' });
    }
    
    // Ensure token is still valid
    await refreshTokenIfNeeded(user, tiktokConnection);
    
    // Create new scheduled post
    const scheduledPost = new mongoose.models.ScheduledPost({
      user: req.user.id,
      platform: 'tiktok',
      content: {
        caption,
        hashtags: Array.isArray(hashtags) ? hashtags : JSON.parse(hashtags || '[]'),
        videoFile: req.file ? req.file.path : null,
        thumbnailUrl: null, // Will be generated when actually uploading to TikTok
        scheduledTime: new Date(scheduledTime),
        privacy,
        allowComments
      },
      status: 'scheduled',
      createdAt: new Date()
    });
    
    await scheduledPost.save();
    
    // Return the scheduled post data
    res.status(201).json({
      id: scheduledPost._id,
      caption,
      scheduledTime: new Date(scheduledTime),
      hashtags: scheduledPost.content.hashtags,
      privacy,
      allowComments,
      thumbnailUrl: req.file ? `/uploads/tiktok/thumbnails/${path.basename(req.file.path, path.extname(req.file.path))}.jpg` : null,
      status: 'scheduled',
      createdAt: scheduledPost.createdAt
    });
  } catch (error) {
    logger.error('Error scheduling TikTok post:', error);
    
    // Clean up uploaded file if it exists
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ 
      error: 'Failed to schedule TikTok post',
      details: error.message
    });
  }
};

/**
 * Get scheduled posts
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getScheduledPosts = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get all scheduled posts for this user and platform
    const scheduledPosts = await mongoose.models.ScheduledPost.find({
      user: req.user.id,
      platform: 'tiktok',
      'content.scheduledTime': { $gte: new Date() } // Only future posts
    }).sort({ 'content.scheduledTime': 1 });
    
    // Format response
    const formattedPosts = scheduledPosts.map(post => ({
      id: post._id,
      caption: post.content.caption,
      scheduledTime: post.content.scheduledTime,
      hashtags: post.content.hashtags,
      privacy: post.content.privacy,
      allowComments: post.content.allowComments,
      thumbnailUrl: post.content.thumbnailUrl,
      status: post.status,
      createdAt: post.createdAt
    }));
    
    res.status(200).json({ posts: formattedPosts });
  } catch (error) {
    logger.error('Error fetching scheduled TikTok posts:', error);
    res.status(500).json({ 
      error: 'Failed to fetch scheduled TikTok posts',
      details: error.message
    });
  }
};

/**
 * Delete a scheduled post
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.deleteScheduledPost = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Find and delete the scheduled post
    const post = await mongoose.models.ScheduledPost.findOne({
      _id: id,
      user: req.user.id,
      platform: 'tiktok'
    });
    
    if (!post) {
      return res.status(404).json({ error: 'Scheduled post not found' });
    }
    
    // Delete the post
    await post.remove();
    
    // Delete the video file if it exists
    if (post.content.videoFile && fs.existsSync(post.content.videoFile)) {
      fs.unlinkSync(post.content.videoFile);
    }
    
    res.status(200).json({ message: 'Scheduled post deleted successfully' });
  } catch (error) {
    logger.error('Error deleting scheduled TikTok post:', error);
    res.status(500).json({ 
      error: 'Failed to delete scheduled TikTok post',
      details: error.message
    });
  }
};

/**
 * Get hashtag suggestions
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getHashtagSuggestions = async (req, res) => {
  try {
    const { text, count = 10 } = req.query;
    
    if (!text) {
      return res.status(400).json({ error: 'Text parameter is required' });
    }
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const tiktokConnection = user.platformConnections.find(
      conn => conn.platform === 'tiktok'
    );
    
    if (!tiktokConnection) {
      return res.status(404).json({ error: 'TikTok account not connected' });
    }
    
    // Ensure token is still valid
    await refreshTokenIfNeeded(user, tiktokConnection);
    
    try {
      // Use our TikTok API service to get hashtag suggestions with caching
      const suggestionResponse = await tiktokApiService.getHashtagSuggestions(
        tiktokConnection.accessToken,
        req.user.id,
        text,
        parseInt(count, 10),
        req.query.skipCache === 'true'
      );
      
      const suggestions = suggestionResponse.data.suggestions;
      
      // Add metadata about cache status
      const response = {
        hashtags: suggestions.map(s => s.hashtag),
        metadata: {
          cached: !req.query.skipCache === 'true' && !!tiktokCache.getCachedData('hashtags', req.user.id, { keywords: text, count }),
          timestamp: new Date().toISOString()
        }
      };
      
      res.status(200).json(response);
    } catch (apiError) {
      // If TikTok API fails, fallback to generating some basic suggestions
      logger.warn('Falling back to local hashtag generation:', apiError);
      
      const hashtags = generateHashtagSuggestions(text, parseInt(count, 10));
      return res.status(200).json({ 
        hashtags, 
        source: 'fallback',
        reason: apiError.message || 'API request failed'
      });
    }
  } catch (error) {
    logger.error('Error getting TikTok hashtag suggestions:', error);
    
    res.status(500).json({ 
      error: 'Failed to get hashtag suggestions',
      details: error.message
    });
  }
};

/**
 * Get trending hashtags
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getTrendingHashtags = async (req, res) => {
  try {
    const { count = 20 } = req.query;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const tiktokConnection = user.platformConnections.find(
      conn => conn.platform === 'tiktok'
    );
    
    if (!tiktokConnection) {
      return res.status(404).json({ error: 'TikTok account not connected' });
    }
    
    // Ensure token is still valid
    await refreshTokenIfNeeded(user, tiktokConnection);
    
    // Get trending hashtags from TikTok API
    const trendingResponse = await tiktokApiService.makeRequest(
      '/hashtag/trending',
      'GET',
      {
        accessToken: tiktokConnection.accessToken,
        userId: req.user.id,
        cacheType: 'hashtags',
        cacheParams: { trending: true, count },
        skipCache: req.query.skipCache === 'true',
        params: {
          count: parseInt(count, 10)
        }
      }
    );
    
    const trending = trendingResponse.data.trending;
    
    res.status(200).json({
      hashtags: trending.map(t => ({
        name: t.hashtag,
        viewCount: t.view_count,
        videoCount: t.video_count,
        rank: t.rank
      })),
      metadata: {
        cached: !req.query.skipCache === 'true' && !!tiktokCache.getCachedData('hashtags', req.user.id, { trending: true, count }),
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Error getting TikTok trending hashtags:', error);
    
    // If TikTok API fails, fallback to providing static popular hashtags
    try {
      const hashtags = getPopularHashtags(parseInt(req.query.count || 20, 10));
      return res.status(200).json({ hashtags, source: 'fallback' });
    } catch (fallbackError) {
      return res.status(500).json({ 
        error: 'Failed to get trending hashtags',
        details: error.message
      });
    }
  }
};

// ========== UTILITY FUNCTIONS ==========

/**
 * Refresh the access token if it's close to expiration or expired
 * @param {Object} user - User document
 * @param {Object} connection - Platform connection object
 */
async function refreshTokenIfNeeded(user, connection) {
  // Check if token is close to expiring (within 1 hour)
  const tokenExpiry = new Date(connection.tokenExpires);
  const now = new Date();
  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
  
  if (tokenExpiry <= oneHourFromNow) {
    try {
      logger.info(`Refreshing TikTok token for user ${user.id}, token expires at ${tokenExpiry}`);
      
      // Use our TikTok API service for the refresh token API call
      const tokenResponse = await tiktokApiService.makeRequest(
        '/oauth/refresh_token',
        'POST',
        {
          data: {
            client_key: TIKTOK_CLIENT_ID,
            client_secret: TIKTOK_CLIENT_SECRET,
            grant_type: 'refresh_token',
            refresh_token: connection.refreshToken
          },
          skipCache: true // Always skip cache for token refreshes
        }
      );
      
      const {
        access_token,
        refresh_token,
        expires_in
      } = tokenResponse;
      
      // Update connection with new tokens
      const connectionIndex = user.platformConnections.findIndex(
        conn => conn.platform === 'tiktok'
      );
      
      if (connectionIndex >= 0) {
        user.platformConnections[connectionIndex].accessToken = access_token;
        user.platformConnections[connectionIndex].refreshToken = refresh_token;
        user.platformConnections[connectionIndex].tokenExpires = new Date(Date.now() + expires_in * 1000);
        user.platformConnections[connectionIndex].lastUpdated = new Date();
        
        await user.save();
        
        // Clear any user cache when tokens are refreshed to prevent stale data
        tiktokCache.clearUserCache(user.id);
        
        logger.info(`Successfully refreshed TikTok token for user ${user.id}, new expiry: ${new Date(Date.now() + expires_in * 1000)}`);
      }
    } catch (error) {
      logger.error('Error refreshing TikTok access token:', error);
      throw new Error('Failed to refresh access token: ' + (error.message || 'Unknown error'));
    }
  }
}

/**
 * Calculate date range based on time range string
 * @param {string} timeRange - Time range ('day', 'week', 'month', 'year')
 * @returns {Object} Date range object
 */
function getDateRangeFromTimeRange(timeRange) {
  const now = new Date();
  let startDate, endDate, interval;
  
  switch (timeRange) {
    case 'day':
      startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);
      interval = 'hour';
      break;
    
    case 'week':
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
      endDate = new Date(now);
      interval = 'day';
      break;
    
    case 'year':
      startDate = new Date(now);
      startDate.setFullYear(now.getFullYear() - 1);
      endDate = new Date(now);
      interval = 'month';
      break;
    
    case 'month':
    default:
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 1);
      endDate = new Date(now);
      interval = 'day';
  }
  
  return { startDate, endDate, interval };
}

/**
 * Process demographic data into standardized format
 * @param {Object} data - Demographic data from TikTok API
 * @returns {Array} Processed demographic data
 */
function processDemographicBreakdown(data) {
  if (!data || !Array.isArray(data)) return [];
  
  return data.map(item => ({
    label: item.key,
    value: item.value,
    percentage: item.percentage
  }));
}

/**
 * Calculate growth percentage between first and last values in array
 * @param {Array} data - Array of numeric values
 * @returns {number} Growth percentage
 */
function calculateGrowth(data) {
  if (!data || !Array.isArray(data) || data.length < 2) return 0;
  
  const first = data[0];
  const last = data[data.length - 1];
  
  if (first === 0) return last > 0 ? 100 : 0;
  
  return ((last - first) / first) * 100;
}

/**
 * Calculate engagement rate
 * @param {number} engagements - Total engagements
 * @param {number} audience - Audience size
 * @returns {number} Engagement rate percentage
 */
function calculateEngagementRate(engagements, audience) {
  if (!audience || audience === 0) return 0;
  return (engagements / audience) * 100;
}

/**
 * Sum array of numbers
 * @param {Array} data - Array of numeric values
 * @returns {number} Sum
 */
function sum(data) {
  if (!data || !Array.isArray(data)) return 0;
  return data.reduce((acc, val) => acc + (val || 0), 0);
}

/**
 * Calculate average of array of numbers
 * @param {Array} data - Array of numeric values
 * @returns {number} Average
 */
function calculateAverage(data) {
  if (!data || !Array.isArray(data) || data.length === 0) return 0;
  return sum(data) / data.length;
}

/**
 * Generate hashtag suggestions based on input text
 * Fallback method when API fails
 * @param {string} text - Input text
 * @param {number} count - Number of suggestions to return
 * @returns {Array} Array of hashtag suggestions
 */
function generateHashtagSuggestions(text, count) {
  if (!text) return [];
  
  // Common categories of hashtags
  const commonHashtags = {
    general: ['fyp', 'foryou', 'foryoupage', 'viral', 'trending', 'tiktok'],
    entertainment: ['comedy', 'funny', 'meme', 'laugh', 'humor', 'jokes'],
    lifestyle: ['lifestyle', 'daily', 'life', 'motivation', 'inspiration'],
    beauty: ['beauty', 'makeup', 'skincare', 'glam', 'cosmetics'],
    fashion: ['fashion', 'style', 'outfit', 'ootd', 'clothes'],
    food: ['food', 'recipe', 'cooking', 'baking', 'foodie', 'delicious'],
    fitness: ['fitness', 'workout', 'gym', 'exercise', 'health', 'wellness'],
    travel: ['travel', 'adventure', 'explore', 'vacation', 'wanderlust'],
    music: ['music', 'song', 'singer', 'musician', 'artist', 'dance'],
    business: ['business', 'entrepreneur', 'marketing', 'success', 'money'],
    tech: ['tech', 'technology', 'gadget', 'smartphone', 'computer']
  };
  
  // Split input text into keywords
  const keywords = text.toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .split(/\s+/) // Split by whitespace
    .filter(word => word.length > 2); // Filter out short words
  
  // Create a set of hashtags to avoid duplicates
  const suggestionSet = new Set();
  
  // First add trending/general hashtags
  commonHashtags.general.slice(0, 3).forEach(tag => suggestionSet.add(tag));
  
  // Add relevant hashtags based on keyword matching
  for (const keyword of keywords) {
    // Try to find hashtags that match this keyword
    for (const category in commonHashtags) {
      const matchingTags = commonHashtags[category].filter(tag => 
        tag.includes(keyword) || keyword.includes(tag)
      );
      
      // Add matching tags to our suggestion set
      matchingTags.forEach(tag => suggestionSet.add(tag));
      
      // If we have enough suggestions, break
      if (suggestionSet.size >= count + 3) {
        break;
      }
    }
  }
  
  // If we don't have enough suggestions, add more from common categories
  if (suggestionSet.size < count) {
    // Determine which categories might be relevant based on the text
    const potentialCategories = [];
    
    for (const category in commonHashtags) {
      for (const keyword of keywords) {
        if (category.includes(keyword) || keyword.includes(category)) {
          potentialCategories.push(category);
          break;
        }
      }
    }
    
    // Add hashtags from potentially relevant categories
    for (const category of potentialCategories) {
      for (const tag of commonHashtags[category]) {
        suggestionSet.add(tag);
        if (suggestionSet.size >= count) {
          break;
        }
      }
    }
    
    // If still not enough, add from random categories
    if (suggestionSet.size < count) {
      const allCategories = Object.keys(commonHashtags);
      
      while (suggestionSet.size < count && allCategories.length > 0) {
        // Get a random category
        const randomIndex = Math.floor(Math.random() * allCategories.length);
        const category = allCategories[randomIndex];
        
        // Add a random hashtag from this category
        const categoryTags = commonHashtags[category];
        const randomTag = categoryTags[Math.floor(Math.random() * categoryTags.length)];
        
        suggestionSet.add(randomTag);
        
        // Remove this category to avoid reusing it
        allCategories.splice(randomIndex, 1);
      }
    }
  }
  
  // Convert set to array and limit to requested count
  return Array.from(suggestionSet).slice(0, count);
}

/**
 * Get popular hashtags as a fallback for trending hashtags API
 * @param {number} count - Number of hashtags to return
 * @returns {Array} Array of hashtag objects
 */
function getPopularHashtags(count) {
  // Static list of popular hashtags with mock statistics
  const popularHashtags = [
    { name: 'fyp', viewCount: 1200000000, videoCount: 500000, rank: 1 },
    { name: 'foryou', viewCount: 1100000000, videoCount: 450000, rank: 2 },
    { name: 'viral', viewCount: 900000000, videoCount: 400000, rank: 3 },
    { name: 'trending', viewCount: 800000000, videoCount: 350000, rank: 4 },
    { name: 'dance', viewCount: 750000000, videoCount: 320000, rank: 5 },
    { name: 'funny', viewCount: 700000000, videoCount: 300000, rank: 6 },
    { name: 'comedy', viewCount: 650000000, videoCount: 280000, rank: 7 },
    { name: 'music', viewCount: 600000000, videoCount: 250000, rank: 8 },
    { name: 'fashion', viewCount: 550000000, videoCount: 230000, rank: 9 },
    { name: 'beauty', viewCount: 500000000, videoCount: 210000, rank: 10 },
    { name: 'food', viewCount: 450000000, videoCount: 200000, rank: 11 },
    { name: 'fitness', viewCount: 400000000, videoCount: 180000, rank: 12 },
    { name: 'travel', viewCount: 380000000, videoCount: 170000, rank: 13 },
    { name: 'art', viewCount: 350000000, videoCount: 150000, rank: 14 },
    { name: 'makeup', viewCount: 320000000, videoCount: 140000, rank: 15 },
    { name: 'motivation', viewCount: 300000000, videoCount: 130000, rank: 16 },
    { name: 'inspiration', viewCount: 280000000, videoCount: 120000, rank: 17 },
    { name: 'pet', viewCount: 260000000, videoCount: 110000, rank: 18 },
    { name: 'family', viewCount: 240000000, videoCount: 100000, rank: 19 },
    { name: 'tech', viewCount: 220000000, videoCount: 90000, rank: 20 },
    { name: 'gaming', viewCount: 210000000, videoCount: 85000, rank: 21 },
    { name: 'cooking', viewCount: 200000000, videoCount: 80000, rank: 22 },
    { name: 'skincare', viewCount: 190000000, videoCount: 75000, rank: 23 },
    { name: 'photography', viewCount: 180000000, videoCount: 70000, rank: 24 },
    { name: 'nature', viewCount: 170000000, videoCount: 65000, rank: 25 },
    { name: 'love', viewCount: 160000000, videoCount: 60000, rank: 26 },
    { name: 'cute', viewCount: 150000000, videoCount: 55000, rank: 27 },
    { name: 'diy', viewCount: 140000000, videoCount: 50000, rank: 28 },
    { name: 'tips', viewCount: 130000000, videoCount: 45000, rank: 29 },
    { name: 'life', viewCount: 120000000, videoCount: 40000, rank: 30 }
  ];
  
  // Return a subset of the popular hashtags
  return popularHashtags.slice(0, count);
}
