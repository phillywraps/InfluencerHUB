const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  createAlipayOrder,
  checkAlipayStatus,
  cancelAlipayOrder,
  handleAlipayWebhook
} = require('../controllers/alipayController');

// Protected routes (require authentication)
router.post('/create-order', protect, createAlipayOrder);
router.get('/check-status/:orderNumber', protect, checkAlipayStatus);
router.post('/cancel-order', protect, cancelAlipayOrder);

// Public webhook route
router.post('/webhook', handleAlipayWebhook);

module.exports = router;
