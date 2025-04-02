const express = require('express');
const router = express.Router();
const {
  getAdvertiserProfile,
  updateAdvertiserProfile,
  addPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
  getCampaigns,
  getCampaignById,
  addCampaign,
  updateCampaign,
  deleteCampaign,
  updateCampaignMetrics,
  addRentalToCampaign,
  removeRentalFromCampaign,
  getCampaignAnalytics
} = require('../controllers/advertiserController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// All routes require authentication and advertiser role
router.use(protect);
router.use(restrictTo('advertiser'));

// Profile routes
router.get('/profile', getAdvertiserProfile);
router.put('/profile', updateAdvertiserProfile);

// Payment method routes
router.post('/payment-methods', addPaymentMethod);
router.put('/payment-methods/:methodId', updatePaymentMethod);
router.delete('/payment-methods/:methodId', deletePaymentMethod);

// Campaign routes
router.get('/campaigns', getCampaigns);
router.get('/campaigns/:campaignId', getCampaignById);
router.post('/campaigns', addCampaign);
router.put('/campaigns/:campaignId', updateCampaign);
router.delete('/campaigns/:campaignId', deleteCampaign);

// Campaign metrics routes
router.put('/campaigns/:campaignId/metrics', updateCampaignMetrics);
router.get('/campaigns/:campaignId/analytics', getCampaignAnalytics);

// Campaign rental association routes
router.put('/campaigns/:campaignId/rentals/:rentalId', addRentalToCampaign);
router.delete('/campaigns/:campaignId/rentals/:rentalId', removeRentalFromCampaign);

module.exports = router;
