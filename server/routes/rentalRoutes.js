const express = require('express');
const router = express.Router();
const {
  createRentalRequest,
  getRentals,
  getRentalById,
  updateRentalStatus,
  getRentalApiKey,
  getApiKeyUsage,
  trackApiKeyUsage
} = require('../controllers/rentalController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

// Get all rentals for the current user
router.get('/', getRentals);

// Get rental by ID
router.get('/:id', getRentalById);

// Create rental request (advertiser only)
router.post('/', restrictTo('advertiser'), createRentalRequest);

// Update rental status
router.put('/:id/status', updateRentalStatus);

// Get API key for a rental (advertiser only)
router.get('/:id/api-key', restrictTo('advertiser'), getRentalApiKey);

// Get API key usage statistics
router.get('/:id/usage', getApiKeyUsage);

// Track API key usage (advertiser only)
router.post('/:id/track-usage', restrictTo('advertiser'), trackApiKeyUsage);

module.exports = router;
