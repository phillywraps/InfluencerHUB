/**
 * Cryptocurrency Payment Routes
 */

const express = require('express');
const router = express.Router();
const cryptoController = require('../controllers/cryptoController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const rateLimiter = require('../middleware/rateLimiterMiddleware');

// Public routes
router.get('/currencies', rateLimiter.medium, cryptoController.getSupportedCurrencies);
router.get('/rates', rateLimiter.medium, cryptoController.getExchangeRates);
router.post('/webhook', cryptoController.handleWebhook);

// Protected routes - require authentication
router.post('/charges', protect, rateLimiter.medium, cryptoController.createCharge);
router.get('/charges/:chargeId', protect, rateLimiter.medium, cryptoController.getCharge);
router.post('/charges/:chargeId/cancel', protect, rateLimiter.medium, cryptoController.cancelCharge);
router.post('/charges/:chargeId/resolve', protect, adminOnly, rateLimiter.medium, cryptoController.resolveCharge);
router.get('/history', protect, rateLimiter.medium, cryptoController.getPaymentHistory);

// Subscription routes
router.post('/subscriptions', protect, rateLimiter.medium, cryptoController.createSubscription);
router.post('/subscriptions/:subscriptionId/cancel', protect, rateLimiter.medium, cryptoController.cancelSubscription);

module.exports = router;
