const express = require('express');
const router = express.Router();
const { protect, influencerOnly, adminOnly } = require('../middleware/authMiddleware');
const {
  rotateApiKey,
  updateRotationSchedule,
  getKeysForRotation,
  runRotationCheck
} = require('../controllers/apiKeyController');

// Routes for API key operations
router.post('/:accountId/rotate', protect, influencerOnly, rotateApiKey);
router.put('/:accountId/rotation-schedule', protect, influencerOnly, updateRotationSchedule);
router.get('/rotation-schedule', protect, influencerOnly, getKeysForRotation);
router.post('/rotation-check', protect, adminOnly, runRotationCheck);

module.exports = router;
