const express = require('express');
const router = express.Router();
const { protect, influencerOnly, adminOnly } = require('../middleware/authMiddleware');
const payoutController = require('../controllers/payoutController');

// Health check route
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Payout service is running' });
});

// Influencer routes
router.get('/balance', protect, influencerOnly, (req, res) => payoutController.getBalance(req, res));
router.get('/transactions', protect, influencerOnly, (req, res) => payoutController.getBalanceTransactions(req, res));
router.post('/', protect, influencerOnly, (req, res) => payoutController.createPayout(req, res));
router.get('/methods', protect, influencerOnly, (req, res) => payoutController.getPayoutMethods(req, res));
router.post('/methods', protect, influencerOnly, (req, res) => payoutController.addPayoutMethod(req, res));
router.delete('/methods/:methodId', protect, influencerOnly, (req, res) => payoutController.deletePayoutMethod(req, res));
router.put('/schedule', protect, influencerOnly, (req, res) => payoutController.updatePayoutSchedule(req, res));

// Admin routes
router.post('/process-automatic', protect, adminOnly, (req, res) => payoutController.processAutomaticPayouts(req, res));
router.put('/:payoutId/status', protect, adminOnly, (req, res) => payoutController.updatePayoutStatus(req, res));

module.exports = router;
