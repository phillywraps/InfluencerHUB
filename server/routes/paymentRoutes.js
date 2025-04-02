const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const paymentController = require('../controllers/paymentController');
const mobilePaymentController = require('../controllers/mobilePaymentController');
const paymentSecurity = require('../middleware/paymentSecurityMiddleware');

// Health check route
router.get('/health', paymentSecurity.securityHeaders, (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Payment service is running' });
});

// Public route for Stripe webhook - must be raw body for signature verification
// Note: This route should be registered before the express.json() middleware in server.js
router.post(
  '/webhook', 
  paymentSecurity.webhookMiddleware,
  paymentController.handleWebhook
);

// Protected routes - require authentication
router.post(
  '/create-intent', 
  protect, 
  paymentSecurity.createPaymentIntentMiddleware, 
  paymentController.createPaymentIntent
);

router.post(
  '/confirm-intent', 
  protect, 
  paymentSecurity.confirmPaymentIntentMiddleware, 
  paymentController.confirmPaymentIntent
);

// Payment methods
router.get(
  '/methods', 
  protect, 
  paymentSecurity.securityHeaders, 
  paymentSecurity.paymentRateLimiter, 
  paymentSecurity.pciCompliantLogger, 
  paymentController.getPaymentMethods
);

router.post(
  '/methods', 
  protect, 
  paymentSecurity.paymentMethodsMiddleware, 
  paymentController.addPaymentMethod
);

router.delete(
  '/methods/:paymentMethodId', 
  protect, 
  paymentSecurity.paymentMethodRateLimiter, 
  paymentSecurity.pciCompliantLogger,
  paymentSecurity.originValidation,
  paymentController.deletePaymentMethod
);

// Transaction history
router.get(
  '/transactions', 
  protect, 
  paymentSecurity.securityHeaders, 
  paymentSecurity.paymentRateLimiter, 
  paymentController.getTransactionHistory
);

// Refunds - admin only
router.post(
  '/refund', 
  protect, 
  admin, 
  paymentSecurity.securityHeaders, 
  paymentSecurity.paymentRateLimiter, 
  paymentSecurity.pciCompliantLogger, 
  paymentSecurity.fraudDetection, 
  paymentController.processRefund
);

// Subscriptions
router.post(
  '/subscriptions', 
  protect, 
  paymentSecurity.subscriptionMiddleware, 
  paymentController.createSubscription
);

router.post(
  '/subscriptions/:subscriptionId/cancel', 
  protect, 
  paymentSecurity.securityHeaders, 
  paymentSecurity.paymentRateLimiter, 
  paymentSecurity.pciCompliantLogger, 
  paymentSecurity.fraudDetection, 
  paymentController.cancelSubscription
);

// Mobile payment routes - with enhanced security
router.post(
  '/mobile/apple-pay', 
  protect, 
  paymentSecurity.securityHeaders, 
  paymentSecurity.paymentRateLimiter, 
  paymentSecurity.pciCompliantLogger, 
  paymentSecurity.fraudDetection, 
  mobilePaymentController.processApplePayment
);

router.post(
  '/mobile/google-pay', 
  protect, 
  paymentSecurity.securityHeaders, 
  paymentSecurity.paymentRateLimiter, 
  paymentSecurity.pciCompliantLogger, 
  paymentSecurity.fraudDetection, 
  mobilePaymentController.processGooglePayment
);

router.get(
  '/mobile/methods', 
  protect, 
  paymentSecurity.securityHeaders, 
  paymentSecurity.paymentRateLimiter, 
  mobilePaymentController.getMobilePaymentMethods
);

router.get(
  '/mobile/transactions', 
  protect, 
  paymentSecurity.securityHeaders, 
  paymentSecurity.paymentRateLimiter, 
  mobilePaymentController.getMobilePaymentTransactions
);

module.exports = router;
