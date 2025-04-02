const User = require('../models/userModel');
const Influencer = require('../models/influencerModel');
const Content = require('../models/contentModel');
const tiktokApiService = require('../utils/tiktokApiService');
const logger = require('../config/logger');
const queryOptimizer = require('../utils/queryOptimizer');
const { 
  wrap, 
  createResourceNotFoundError, 
  createValidationError,
  createThirdPartyApiError,
  ErrorTypes
} = require('../middleware/errorMiddleware');

/**
 * @desc    Check TikTok publishing eligibility
 * @route   GET /api/tiktok/publishing/check-eligibility
 * @access  Private (Influencer)
 */
const checkPublishingEligibility = wrap(async (req, res) => {
  const userId = req.user._id;

  // Get influencer profile with TikTok connection details (with caching)
  const influencer = await queryOptimizer.executeQuery(
    Influencer.findOne({ userId }).select('platforms.tiktok'),
    `influencer:tiktok:${userId.toString()}`,
    { ttl: 300 } // Cache for 5 minutes
  );

  if (!influencer) {
    throw createResourceNotFoundError('Influencer', userId);
  }

  // Check if TikTok account is connected
  const tiktokAccount = influencer.platforms.find(p => p.name === 'TikTok');
  if (!tiktokAccount || !tiktokAccount.accessToken) {
    throw createValidationError('TikTok account not connected', {
      eligibility: {
        canPublish: false,
        reason: 'ACCOUNT_NOT_CONNECTED',
        requiredScopes: ['video.upload', 'video.publish']
      }
    });
  }

  // Check account eligibility with the TikTok API
  try {
    const eligibility = await tiktokApiService.checkPublishingEligibility(
      tiktokAccount.accessToken,
      tiktokAccount.userId
    );

    return res.json({
      success: true,
      eligibility
    });
  } catch (error) {
    logger.error(`TikTok eligibility check error: ${error.message}`, { userId, error });
    throw createThirdPartyApiError(
      'TikTok', 
      'Failed to check publishing eligibility', 
      { userId, error: error.message }, 
      error
    );
  }
});

/**
 * @desc    Schedule content for TikTok
 * @route   POST /api/tiktok/publishing/schedule
 * @access  Private (Influencer)
 */
const scheduleContent = wrap(async (req, res) => {
  const { contentId, scheduledTime, caption, hashtags } = req.body;
  const userId = req.user._id;

  // Validate required fields
  if (!contentId || !scheduledTime) {
    throw createValidationError('Content ID and scheduled time are required', {
      fields: { contentId: !contentId, scheduledTime: !scheduledTime }
    });
  }

  // Validate scheduled time is in the future
  const scheduleDate = new Date(scheduledTime);
  if (scheduleDate <= new Date()) {
    throw createValidationError('Scheduled time must be in the future', {
      scheduledTime: scheduleDate.toISOString()
    });
  }

  // Get content (with field selection optimization)
  const content = await queryOptimizer.executeQuery(
    Content.findById(contentId).select('creator mediaUrls platformSchedules title'),
    `content:${contentId}`,
    { ttl: 60 } // Short cache time for content that might change
  );
  if (!content) {
    throw createResourceNotFoundError('Content', contentId);
  }
  
  // Check for permission
  if (content.creator.toString() !== userId.toString()) {
    throw createValidationError('You do not have permission to schedule this content', {
      contentId,
      creator: content.creator,
      userId
    });
  }

  // Check if content has media
  if (!content.mediaUrls || content.mediaUrls.length === 0) {
    throw createValidationError('Content must have media to publish to TikTok', {
      contentId,
      mediaUrlsCount: content.mediaUrls ? content.mediaUrls.length : 0
    });
  }

  // Use cached influencer data if we already fetched it
  const cacheKey = `influencer:tiktok:${userId.toString()}`;
  let cachedInfluencer = queryOptimizer.getCachedData(cacheKey);
  
  if (!cachedInfluencer) {
    // Get influencer profile with TikTok connection details (with caching)
    cachedInfluencer = await queryOptimizer.executeQuery(
      Influencer.findOne({ userId }).select('platforms.tiktok'),
      cacheKey,
      { ttl: 300 } // Cache for 5 minutes
    );
  }
  
  const influencer = cachedInfluencer;

  if (!influencer) {
    throw createResourceNotFoundError('Influencer', userId);
  }

  // Check if TikTok account is connected
  const tiktokAccount = influencer.platforms.find(p => p.name === 'TikTok');
  if (!tiktokAccount || !tiktokAccount.accessToken) {
    throw createValidationError('TikTok account not connected');
  }

  try {
    // Format hashtags
    const formattedHashtags = hashtags 
      ? hashtags.map(tag => tag.startsWith('#') ? tag : `#${tag}`).join(' ')
      : '';
    
    // Prepare full caption with hashtags
    const fullCaption = caption 
      ? (formattedHashtags ? `${caption}\n\n${formattedHashtags}` : caption)
      : formattedHashtags;

    // Schedule with TikTok API
    const schedulingResult = await tiktokApiService.scheduleVideoUpload({
      accessToken: tiktokAccount.accessToken,
      userId: tiktokAccount.userId,
      videoPath: content.mediaUrls[0], // Use first media for TikTok
      caption: fullCaption,
      scheduledTime: scheduleDate
    });

    // Update content with scheduling info
    content.platformSchedules = content.platformSchedules || [];
    content.platformSchedules.push({
      platform: 'TikTok',
      scheduledTime: scheduleDate,
      status: 'scheduled',
      platformPostId: schedulingResult.post_id,
      platformData: schedulingResult
    });

    await content.save();

    return res.json({
      success: true,
      message: 'Content scheduled successfully for TikTok',
      scheduledTime: scheduleDate,
      platformPostId: schedulingResult.post_id
    });
  } catch (error) {
    logger.error(`TikTok scheduling error: ${error.message}`, { userId, contentId, error });
    throw createThirdPartyApiError(
      'TikTok', 
      'Failed to schedule content', 
      { contentId, userId, error: error.message },
      error
    );
  }
});

/**
 * @desc    Get scheduled content for TikTok
 * @route   GET /api/tiktok/publishing/scheduled
 * @access  Private (Influencer)
 */
const getScheduledContent = wrap(async (req, res) => {
  const userId = req.user._id;

  // Get influencer profile
  const influencer = await Influencer.findOne({ userId });
  if (!influencer) {
    throw createResourceNotFoundError('Influencer', userId);
  }

  // Check if TikTok account is connected
  const tiktokAccount = influencer.platforms.find(p => p.name === 'TikTok');
  if (!tiktokAccount || !tiktokAccount.accessToken) {
    throw createValidationError('TikTok account not connected');
  }

  try {
    // Find content with TikTok schedules (with cursor-based pagination and field selection)
    const { skip, limit, cursor } = req.query;
    
    // Fields to select for optimization
    const fields = 'title mediaUrls platformSchedules';
    
    let result;
    
    if (cursor) {
      // Use cursor-based pagination
      result = await queryOptimizer.paginateWithCursor(
        Content,
        {
          creator: userId,
          'platformSchedules.platform': 'TikTok',
          'platformSchedules.status': { $in: ['scheduled', 'publishing', 'published', 'failed'] }
        },
        {
          cursor,
          limit: parseInt(limit) || 20,
          sortField: 'updatedAt',
          sortDirection: 'desc',
          fields,
          cacheKey: `tiktok:scheduled:${userId.toString()}`
        }
      );
      
      // Extract the items from pagination result
      scheduledContent = result.items;
    } else {
      // Use traditional pagination or get all (with caching)
      scheduledContent = await queryOptimizer.executeQuery(
        Content.find({
          creator: userId,
          'platformSchedules.platform': 'TikTok',
          'platformSchedules.status': { $in: ['scheduled', 'publishing', 'published', 'failed'] }
        })
        .select(fields)
        .sort({ 'platformSchedules.scheduledTime': -1 })
        .skip(parseInt(skip) || 0)
        .limit(parseInt(limit) || 20),
        `tiktok:scheduled:${userId.toString()}:${skip || 0}:${limit || 20}`,
        { ttl: 60 }
      );
    }

    // Extract TikTok schedule data
    const tiktokSchedules = scheduledContent.map(content => {
      const tiktokSchedule = content.platformSchedules.find(s => s.platform === 'TikTok');
      return {
        contentId: content._id,
        title: content.title,
        mediaUrl: content.mediaUrls[0],
        scheduledTime: tiktokSchedule.scheduledTime,
        status: tiktokSchedule.status,
        platformPostId: tiktokSchedule.platformPostId
      };
    });

    // Return pagination metadata if cursor-based pagination was used
    if (cursor && result) {
      return res.json({
        success: true,
        scheduledContent: tiktokSchedules,
        pagination: {
          hasMore: result.hasMore,
          nextCursor: result.nextCursor
        }
      });
    } else {
      return res.json({
        success: true,
        scheduledContent: tiktokSchedules
      });
    }
  } catch (error) {
    logger.error(`TikTok get scheduled content error: ${error.message}`, { userId, error });
    throw createThirdPartyApiError(
      'TikTok', 
      'Failed to retrieve scheduled content', 
      { userId, error: error.message },
      error
    );
  }
});

/**
 * @desc    Cancel scheduled TikTok content
 * @route   DELETE /api/tiktok/publishing/scheduled/:contentId
 * @access  Private (Influencer)
 */
const cancelScheduledContent = wrap(async (req, res) => {
  const { contentId } = req.params;
  const userId = req.user._id;

  // Get content (with field selection optimization)
  const content = await queryOptimizer.executeQuery(
    Content.findById(contentId).select('creator platformSchedules'),
    null, // No caching for operations that will modify data
    { skipCache: true }
  );
  if (!content) {
    throw createResourceNotFoundError('Content', contentId);
  }
  
  // Check permission
  if (content.creator.toString() !== userId.toString()) {
    throw createValidationError('You do not have permission to cancel this scheduled content', {
      contentId,
      creator: content.creator,
      userId
    });
  }

  // Check if content has TikTok schedule
  const tiktokScheduleIndex = content.platformSchedules
    ? content.platformSchedules.findIndex(s => s.platform === 'TikTok' && s.status === 'scheduled')
    : -1;

  if (tiktokScheduleIndex === -1) {
    throw createValidationError('No scheduled TikTok post found for this content', {
      contentId,
      schedules: content.platformSchedules?.map(s => ({
        platform: s.platform, 
        status: s.status
      }))
    });
  }

  // Get TikTok schedule
  const tiktokSchedule = content.platformSchedules[tiktokScheduleIndex];

  // Get influencer profile
  const influencer = await queryOptimizer.executeQuery(
    Influencer.findOne({ userId }).select('platforms'),
    `influencer:${userId.toString()}`,
    { ttl: 300 }
  );
  const tiktokAccount = influencer?.platforms.find(p => p.name === 'TikTok');

  if (!tiktokAccount || !tiktokAccount.accessToken) {
    throw createValidationError('TikTok account not connected');
  }

  try {
    // Cancel with TikTok API
    await tiktokApiService.cancelScheduledUpload({
      accessToken: tiktokAccount.accessToken,
      userId: tiktokAccount.userId,
      postId: tiktokSchedule.platformPostId
    });

    // Update content
    content.platformSchedules[tiktokScheduleIndex].status = 'cancelled';
    await content.save();

    return res.json({
      success: true,
      message: 'Scheduled TikTok content cancelled successfully'
    });
  } catch (error) {
    logger.error(`TikTok cancel scheduled content error: ${error.message}`, { userId, contentId, error });
    throw createThirdPartyApiError(
      'TikTok', 
      'Failed to cancel scheduled content', 
      { contentId, userId, error: error.message },
      error
    );
  }
});

/**
 * @desc    Get recommended posting times for TikTok
 * @route   GET /api/tiktok/publishing/recommended-times
 * @access  Private (Influencer)
 */
const getRecommendedPostingTimes = wrap(async (req, res) => {
  const userId = req.user._id;

  // Get influencer profile
  const influencer = await Influencer.findOne({ userId });
  if (!influencer) {
    throw createResourceNotFoundError('Influencer', userId);
  }

  // Check if TikTok account is connected
  const tiktokAccount = influencer.platforms.find(p => p.name === 'TikTok');
  if (!tiktokAccount || !tiktokAccount.accessToken) {
    throw createValidationError('TikTok account not connected');
  }

  try {
    // Get analytics for audience activity
    const analytics = await tiktokApiService.getAudienceActivity({
      accessToken: tiktokAccount.accessToken,
      userId: tiktokAccount.userId
    });

    // Process and analyze to find optimal posting times
    const recommendedTimes = tiktokApiService.calculateOptimalPostingTimes(analytics);

    return res.json({
      success: true,
      recommendedTimes
    });
  } catch (error) {
    logger.error(`TikTok recommended times error: ${error.message}`, { userId, error });
    
    // This is a special case where we provide fallback data rather than an error
    // Catching explicitly to provide default recommendations
    return res.json({
      success: true,
      message: 'Using default recommended times (TikTok API analytics unavailable)',
      recommendedTimes: [
        { day: 'Monday', times: ['18:00', '21:00'] },
        { day: 'Tuesday', times: ['17:00', '20:00'] },
        { day: 'Wednesday', times: ['17:30', '20:30'] },
        { day: 'Thursday', times: ['18:00', '21:00'] },
        { day: 'Friday', times: ['19:00', '22:00'] },
        { day: 'Saturday', times: ['11:00', '15:00', '20:00'] },
        { day: 'Sunday', times: ['12:00', '16:00', '19:00'] }
      ]
    });
  }
});

/**
 * Helper functions for common TikTok-related queries
 */

// Get TikTok account data for an influencer
const getTiktokAccountData = async (userId) => {
  // Consistently cache the full influencer profile
  const cacheKey = `influencer:${userId.toString()}`;
  
  // Get influencer profile with TikTok connection details
  const influencer = await queryOptimizer.executeQuery(
    Influencer.findOne({ userId }).select('platforms'),
    cacheKey,
    { ttl: 300 } // Cache for 5 minutes
  );
  
  if (!influencer) {
    return null;
  }
  
  // Get TikTok account
  return influencer.platforms.find(p => p.name === 'TikTok');
};

// Preload commonly accessed data for TikTok screens
const preloadTiktokUserData = async (userId) => {
  // Preload data in parallel
  const tasks = [
    // Get influencer profile
    queryOptimizer.executeQuery(
      Influencer.findOne({ userId }).select('platforms'),
      `influencer:${userId.toString()}`,
      { ttl: 300 }
    ),
    
    // Get recent TikTok scheduled content
    queryOptimizer.executeQuery(
      Content.find({
        creator: userId,
        'platformSchedules.platform': 'TikTok',
      })
      .select('title mediaUrls platformSchedules')
      .sort({ 'platformSchedules.scheduledTime': -1 })
      .limit(5),
      `tiktok:recent:${userId.toString()}`,
      { ttl: 60 }
    )
  ];
  
  // Execute all tasks in parallel
  await Promise.all(tasks);
  
  // Data is now cached for subsequent requests
  return true;
};

// Clear TikTok-related cache for a user when data changes
const clearTiktokUserCache = (userId) => {
  const userIdStr = userId.toString();
  queryOptimizer.clearQueryCache(`influencer:${userIdStr}`);
  queryOptimizer.clearQueryCache(`influencer:tiktok:${userIdStr}`);
  queryOptimizer.clearQueryCache(`tiktok:scheduled:${userIdStr}`);
  queryOptimizer.clearQueryCache(`tiktok:recent:${userIdStr}`);
  return true;
};

module.exports = {
  checkPublishingEligibility,
  scheduleContent,
  getScheduledContent,
  cancelScheduledContent,
  getRecommendedPostingTimes,
  // Export helper functions for use in other modules
  getTiktokAccountData,
  preloadTiktokUserData,
  clearTiktokUserCache
};
