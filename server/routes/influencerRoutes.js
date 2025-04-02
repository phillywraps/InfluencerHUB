const express = require('express');
const router = express.Router();
const {
  getInfluencerProfile,
  updateInfluencerProfile,
  addSocialAccount,
  updateSocialAccount,
  deleteSocialAccount,
  getAllInfluencers,
  getInfluencerById
} = require('../controllers/influencerController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Public routes
router.get('/', getAllInfluencers);
router.get('/:id', getInfluencerById);

// Protected routes (require authentication and influencer role)
router.get('/profile', protect, restrictTo('influencer'), getInfluencerProfile);
router.put('/profile', protect, restrictTo('influencer'), updateInfluencerProfile);

// Social account routes
router.post('/social-accounts', protect, restrictTo('influencer'), addSocialAccount);
router.put('/social-accounts/:accountId', protect, restrictTo('influencer'), updateSocialAccount);
router.delete('/social-accounts/:accountId', protect, restrictTo('influencer'), deleteSocialAccount);

module.exports = router;
