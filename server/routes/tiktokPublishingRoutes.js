const express = require('express');
const router = express.Router();
const { protect, influencerOnly } = require('../middleware/authMiddleware');
const {
  checkPublishingEligibility,
  scheduleContent,
  getScheduledContent,
  cancelScheduledContent,
  getRecommendedPostingTimes
} = require('../controllers/tiktokPublishingController');

// Apply authentication middleware to all routes
router.use(protect);
// Ensure only influencers can access these endpoints
router.use(influencerOnly);

// TikTok publishing eligibility
router.get('/check-eligibility', checkPublishingEligibility);

// TikTok content scheduling
router.post('/schedule', scheduleContent);
router.get('/scheduled', getScheduledContent);
router.delete('/scheduled/:contentId', cancelScheduledContent);

// TikTok posting recommendations
router.get('/recommended-times', getRecommendedPostingTimes);

module.exports = router;
