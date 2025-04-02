const Influencer = require('../models/influencerModel');
const apiKeyService = require('../utils/apiKeyService');
const notificationService = require('../utils/notificationService');
const logger = require('../config/logger');
const { 
  wrap, 
  createResourceNotFoundError, 
  createValidationError,
  createAuthorizationError,
  ErrorTypes
} = require('../middleware/errorMiddleware');

// @desc    Manually rotate an API key
// @route   POST /api/api-keys/:accountId/rotate
// @access  Private (Influencer only)
const rotateApiKey = wrap(async (req, res) => {
  const { accountId } = req.params;
  const influencer = await Influencer.findOne({ userId: req.user._id });
  
  if (!influencer) {
    throw createResourceNotFoundError('Influencer', req.user._id);
  }
  
  // Find the account
  const account = influencer.socialAccounts.id(accountId);
  if (!account) {
    throw createResourceNotFoundError('Social account', accountId);
  }
  
  // Rotate the API key
  const rotatedKey = await apiKeyService.rotateApiKey(influencer._id, accountId);
  
  // Update next rotation date
  const intervalDays = account.apiKey.rotationSchedule?.intervalDays || 90;
  account.apiKey.rotationSchedule = {
    ...account.apiKey.rotationSchedule,
    nextRotationDate: new Date(Date.now() + intervalDays * 24 * 60 * 60 * 1000)
  };
  
  await influencer.save();
  
  return res.json({
    success: true,
    message: 'API key rotated successfully',
    data: {
      keyId: rotatedKey.keyId,
      version: rotatedKey.version,
      expiresAt: rotatedKey.expiresAt,
      nextRotationDate: account.apiKey.rotationSchedule.nextRotationDate
    }
  });
});

// @desc    Update API key rotation schedule
// @route   PUT /api/api-keys/:accountId/rotation-schedule
// @access  Private (Influencer only)
const updateRotationSchedule = wrap(async (req, res) => {
  const { accountId } = req.params;
  const { isEnabled, intervalDays, notifyDaysBefore, autoRotate } = req.body;
  
  const influencer = await Influencer.findOne({ userId: req.user._id });
  
  if (!influencer) {
    throw createResourceNotFoundError('Influencer', req.user._id);
  }
  
  // Find the account
  const account = influencer.socialAccounts.id(accountId);
  if (!account) {
    throw createResourceNotFoundError('Social account', accountId);
  }
  
  // Update rotation schedule using the service
  const result = await apiKeyService.updateKeyRotationSchedule(influencer._id, accountId, {
    isEnabled,
    intervalDays,
    notifyDaysBefore,
    autoRotate
  });
  
  if (!result) {
    throw createValidationError('Failed to update rotation schedule', {
      accountId,
      schedule: { isEnabled, intervalDays, notifyDaysBefore, autoRotate }
    });
  }
  
  // Get updated influencer
  const updatedInfluencer = await Influencer.findOne({ userId: req.user._id });
  const updatedAccount = updatedInfluencer.socialAccounts.id(accountId);
  
  return res.json({
    success: true,
    message: 'Rotation schedule updated successfully',
    data: {
      rotationSchedule: updatedAccount.apiKey.rotationSchedule
    }
  });
});

// @desc    Get API keys due for rotation
// @route   GET /api/api-keys/rotation-schedule
// @access  Private (Influencer only)
const getKeysForRotation = wrap(async (req, res) => {
  const { days = 30 } = req.query; // Default to 30 days
  
  const influencer = await Influencer.findOne({ userId: req.user._id });
  
  if (!influencer) {
    throw createResourceNotFoundError('Influencer', req.user._id);
  }
  
  // Get all accounts with rotation enabled
  const accounts = influencer.socialAccounts.filter(
    account => account.apiKey?.rotationSchedule?.isEnabled
  );
  
  const now = new Date();
  const thresholdDate = new Date(now.getTime() + parseInt(days) * 24 * 60 * 60 * 1000);
  
  // Filter accounts due for rotation within the threshold
  const keysForRotation = accounts
    .filter(account => {
      const nextRotationDate = account.apiKey?.rotationSchedule?.nextRotationDate;
      return nextRotationDate && nextRotationDate <= thresholdDate;
    })
    .map(account => ({
      accountId: account._id,
      platform: account.platform,
      username: account.username,
      nextRotationDate: account.apiKey.rotationSchedule.nextRotationDate,
      daysRemaining: Math.ceil(
        (new Date(account.apiKey.rotationSchedule.nextRotationDate) - now) / 
        (1000 * 60 * 60 * 24)
      ),
      autoRotate: account.apiKey.rotationSchedule.autoRotate
    }));
  
  return res.json({
    success: true,
    count: keysForRotation.length,
    data: keysForRotation
  });
});

// @desc    Run API key rotation check (admin only)
// @route   POST /api/api-keys/rotation-check
// @access  Private (Admin only)
const runRotationCheck = wrap(async (req, res) => {
  // Check if user is admin
  if (req.user.role !== 'admin') {
    throw createAuthorizationError('Admin access required');
  }
  
  // Run the rotation check
  const rotatedKeys = await apiKeyService.checkAndRotateKeys();
  
  logger.info(`API key rotation check completed. ${rotatedKeys.length} keys rotated.`);
  
  return res.json({
    success: true,
    message: `Rotation check completed. ${rotatedKeys.length} keys rotated.`,
    data: rotatedKeys
  });
});

module.exports = {
  rotateApiKey,
  updateRotationSchedule,
  getKeysForRotation,
  runRotationCheck
};
