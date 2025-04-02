const express = require('express');
const router = express.Router();
const { protect, influencerOnly } = require('../middleware/authMiddleware');
const {
  createSubscriptionTier,
  getSubscriptionTiers,
  getSubscriptionTiersByPlatform,
  getSubscriptionTierById,
  updateSubscriptionTier,
  deleteSubscriptionTier,
  setDefaultSubscriptionTier,
  getDefaultSubscriptionTier,
  createDefaultSubscriptionTiers
} = require('../controllers/subscriptionTierController');

// Routes that require authentication
router.use(protect);

// Routes for influencers only
router.route('/')
  .post(influencerOnly, createSubscriptionTier)
  .get(influencerOnly, getSubscriptionTiers);

router.route('/create-defaults')
  .post(influencerOnly, createDefaultSubscriptionTiers);

router.route('/tier/:id')
  .get(getSubscriptionTierById)
  .put(influencerOnly, updateSubscriptionTier)
  .delete(influencerOnly, deleteSubscriptionTier);

router.route('/:id/default')
  .put(influencerOnly, setDefaultSubscriptionTier);

// Public routes (no authentication required)
router.use(function(req, res, next) {
  req.originalProtect = req.protect;
  req.protect = false;
  next();
});

router.route('/:platform')
  .get(getSubscriptionTiersByPlatform);

router.route('/default/:platform')
  .get(getDefaultSubscriptionTier);

module.exports = router;
