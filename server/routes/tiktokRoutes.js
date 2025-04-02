const express = require('express');
const router = express.Router();
const tiktokController = require('../controllers/tiktokController');
const { protect } = require('../middleware/authMiddleware');

// Public routes
router.get('/auth-url', tiktokController.getAuthUrl);
router.post('/complete-auth', tiktokController.completeAuth);

// Protected routes (require authentication)
router.use(protect);
router.get('/connection-status', tiktokController.getConnectionStatus);
router.get('/account', tiktokController.getAccountDetails);
router.post('/disconnect', tiktokController.disconnectAccount);
router.get('/analytics/overview', tiktokController.getAnalyticsOverview);
router.get('/analytics/audience', tiktokController.getAudienceDemographics);
router.get('/analytics/content', tiktokController.getContentPerformance);
router.get('/analytics/top-videos', tiktokController.getTopVideos);
router.get('/analytics/growth', tiktokController.getGrowthMetrics);
router.get('/api-usage', tiktokController.getApiUsage);

// Content management
router.post('/content/schedule', tiktokController.schedulePost);
router.get('/content/scheduled', tiktokController.getScheduledPosts);
router.delete('/content/scheduled/:id', tiktokController.deleteScheduledPost);

// Hashtag suggestions
router.get('/hashtags/suggestions', tiktokController.getHashtagSuggestions);
router.get('/hashtags/trending', tiktokController.getTrendingHashtags);

module.exports = router;
