const crypto = require('crypto');
const CryptoJS = require('crypto-js');
const Influencer = require('../models/influencerModel');
const Rental = require('../models/rentalModel');
const notificationService = require('./notificationService');

/**
 * Generate a secure API key
 * @returns {string} A secure random API key
 */
const generateApiKey = () => {
  // Generate a 32-byte random string
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Generate a key ID for tracking and reference
 * @returns {string} A unique key ID
 */
const generateKeyId = () => {
  return crypto.randomBytes(8).toString('hex');
};

/**
 * Encrypt an API key for storage
 * @param {string} apiKey - The API key to encrypt
 * @returns {string} The encrypted API key
 */
const encryptApiKey = (apiKey) => {
  return CryptoJS.AES.encrypt(apiKey, process.env.API_KEY_SECRET).toString();
};

/**
 * Decrypt an API key
 * @param {string} encryptedKey - The encrypted API key
 * @returns {string} The decrypted API key
 */
const decryptApiKey = (encryptedKey) => {
  const bytes = CryptoJS.AES.decrypt(encryptedKey, process.env.API_KEY_SECRET);
  return bytes.toString(CryptoJS.enc.Utf8);
};

/**
 * Create a new API key for an influencer's social account
 * @param {string} influencerId - The influencer's ID
 * @param {string} socialAccountId - The social account ID
 * @param {Object} options - Options for the API key
 * @returns {Promise<Object>} The created API key details
 */
const createApiKey = async (influencerId, socialAccountId, options = {}) => {
  try {
    const influencer = await Influencer.findById(influencerId);
    if (!influencer) {
      throw new Error('Influencer not found');
    }

    const socialAccount = influencer.socialAccounts.id(socialAccountId);
    if (!socialAccount) {
      throw new Error('Social account not found');
    }

    // Generate a new API key
    const apiKey = generateApiKey();
    const keyId = generateKeyId();

    // Set expiration date (default to 1 year if not specified)
    const expiresAt = options.expiresAt || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

    // Set up API key object
    socialAccount.apiKey = {
      key: apiKey, // Will be encrypted by the pre-save hook
      keyId,
      version: 1,
      createdAt: new Date(),
      lastRotatedAt: new Date(),
      expiresAt,
      status: 'active',
      isAvailable: true,
      usageLimits: {
        dailyRequests: options.dailyRequests || 1000,
        monthlyRequests: options.monthlyRequests || 30000,
        concurrentRentals: options.concurrentRentals || 1
      },
      accessScopes: options.accessScopes || ['all'],
      rentalFee: {
        hourly: options.hourlyFee || 0,
        daily: options.dailyFee || 0,
        weekly: options.weeklyFee || 0
      },
      usageStats: {
        totalRequests: 0
      }
    };

    await influencer.save();

    return {
      apiKey,
      keyId,
      expiresAt,
      platform: socialAccount.platform
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Rotate an API key (generate a new one while invalidating the old one)
 * @param {string} influencerId - The influencer's ID
 * @param {string} socialAccountId - The social account ID
 * @returns {Promise<Object>} The new API key details
 */
const rotateApiKey = async (influencerId, socialAccountId) => {
  try {
    const influencer = await Influencer.findById(influencerId);
    if (!influencer) {
      throw new Error('Influencer not found');
    }

    const socialAccount = influencer.socialAccounts.id(socialAccountId);
    if (!socialAccount) {
      throw new Error('Social account not found');
    }

    // Generate a new API key
    const newApiKey = generateApiKey();

    // Update the API key fields
    socialAccount.apiKey.key = newApiKey;
    socialAccount.apiKey.version += 1;
    socialAccount.apiKey.lastRotatedAt = new Date();

    await influencer.save();

    return {
      apiKey: newApiKey,
      keyId: socialAccount.apiKey.keyId,
      version: socialAccount.apiKey.version,
      expiresAt: socialAccount.apiKey.expiresAt
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Revoke an API key
 * @param {string} influencerId - The influencer's ID
 * @param {string} socialAccountId - The social account ID
 * @returns {Promise<boolean>} Success status
 */
const revokeApiKey = async (influencerId, socialAccountId) => {
  try {
    const influencer = await Influencer.findById(influencerId);
    if (!influencer) {
      throw new Error('Influencer not found');
    }

    const socialAccount = influencer.socialAccounts.id(socialAccountId);
    if (!socialAccount) {
      throw new Error('Social account not found');
    }

    // Update the API key status
    socialAccount.apiKey.status = 'revoked';
    socialAccount.apiKey.isAvailable = false;

    await influencer.save();

    // Also update any active rentals to completed
    await Rental.updateMany(
      {
        influencerId,
        socialAccountId,
        status: 'active'
      },
      {
        status: 'completed'
      }
    );

    return true;
  } catch (error) {
    throw error;
  }
};

/**
 * Check if an API key is valid
 * @param {string} influencerId - The influencer's ID
 * @param {string} socialAccountId - The social account ID
 * @returns {Promise<boolean>} Whether the API key is valid
 */
const isApiKeyValid = async (influencerId, socialAccountId) => {
  try {
    const influencer = await Influencer.findById(influencerId);
    if (!influencer) {
      return false;
    }

    return influencer.isApiKeyValid(socialAccountId);
  } catch (error) {
    return false;
  }
};

/**
 * Track API key usage for a rental
 * @param {string} rentalId - The rental ID
 * @param {string} endpoint - The API endpoint that was accessed
 * @param {number} statusCode - The HTTP status code of the response
 * @returns {Promise<boolean>} Success status
 */
const trackApiKeyUsage = async (rentalId, endpoint, statusCode) => {
  try {
    const rental = await Rental.findById(rentalId);
    if (!rental) {
      throw new Error('Rental not found');
    }

    // Check if daily usage needs to be reset
    const now = new Date();
    const lastDailyReset = new Date(rental.apiKeyAccess.usageLimits.lastResetDate.daily);
    if (now.getDate() !== lastDailyReset.getDate() || 
        now.getMonth() !== lastDailyReset.getMonth() || 
        now.getFullYear() !== lastDailyReset.getFullYear()) {
      rental.apiKeyAccess.usageLimits.requestsUsed.daily = 0;
      rental.apiKeyAccess.usageLimits.lastResetDate.daily = now;
    }

    // Check if monthly usage needs to be reset
    const lastMonthlyReset = new Date(rental.apiKeyAccess.usageLimits.lastResetDate.monthly);
    if (now.getMonth() !== lastMonthlyReset.getMonth() || 
        now.getFullYear() !== lastMonthlyReset.getFullYear()) {
      rental.apiKeyAccess.usageLimits.requestsUsed.monthly = 0;
      rental.apiKeyAccess.usageLimits.lastResetDate.monthly = now;
    }

    // Increment usage counters
    rental.apiKeyAccess.usageLimits.requestsUsed.daily += 1;
    rental.apiKeyAccess.usageLimits.requestsUsed.monthly += 1;
    rental.apiKeyAccess.usageLimits.requestsUsed.total += 1;

    // Add to usage history
    rental.apiKeyAccess.usageHistory.push({
      date: now,
      requestCount: 1,
      endpoint,
      statusCode
    });

    // Limit history to last 1000 requests to prevent document size issues
    if (rental.apiKeyAccess.usageHistory.length > 1000) {
      rental.apiKeyAccess.usageHistory = rental.apiKeyAccess.usageHistory.slice(-1000);
    }

    await rental.save();

    // Also update the influencer's API key usage stats
    const influencer = await Influencer.findById(rental.influencerId);
    if (influencer) {
      const socialAccount = influencer.socialAccounts.id(rental.socialAccountId);
      if (socialAccount) {
        socialAccount.apiKey.usageStats.totalRequests += 1;
        socialAccount.apiKey.usageStats.lastUsed = now;
        await influencer.save();
      }
    }

    return true;
  } catch (error) {
    console.error('Error tracking API key usage:', error);
    return false;
  }
};

/**
 * Check if API key usage is within limits
 * @param {string} rentalId - The rental ID
 * @returns {Promise<Object>} Status and limit information
 */
const checkApiKeyUsageLimits = async (rentalId) => {
  try {
    const rental = await Rental.findById(rentalId);
    if (!rental) {
      throw new Error('Rental not found');
    }

    const { usageLimits } = rental.apiKeyAccess;
    
    // Check if daily limit is exceeded
    const isDailyLimitExceeded = 
      usageLimits.dailyRequests && 
      usageLimits.requestsUsed.daily >= usageLimits.dailyRequests;
    
    // Check if monthly limit is exceeded
    const isMonthlyLimitExceeded = 
      usageLimits.monthlyRequests && 
      usageLimits.requestsUsed.monthly >= usageLimits.monthlyRequests;
    
    return {
      isWithinLimits: !isDailyLimitExceeded && !isMonthlyLimitExceeded,
      dailyUsage: {
        used: usageLimits.requestsUsed.daily,
        limit: usageLimits.dailyRequests,
        remaining: Math.max(0, usageLimits.dailyRequests - usageLimits.requestsUsed.daily),
        isExceeded: isDailyLimitExceeded
      },
      monthlyUsage: {
        used: usageLimits.requestsUsed.monthly,
        limit: usageLimits.monthlyRequests,
        remaining: Math.max(0, usageLimits.monthlyRequests - usageLimits.requestsUsed.monthly),
        isExceeded: isMonthlyLimitExceeded
      },
      totalUsage: usageLimits.requestsUsed.total
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Get API key usage statistics
 * @param {string} influencerId - The influencer's ID
 * @param {string} socialAccountId - The social account ID
 * @returns {Promise<Object>} Usage statistics
 */
const getApiKeyUsageStats = async (influencerId, socialAccountId) => {
  try {
    // Get the influencer's API key usage stats
    const influencer = await Influencer.findById(influencerId);
    if (!influencer) {
      throw new Error('Influencer not found');
    }

    const socialAccount = influencer.socialAccounts.id(socialAccountId);
    if (!socialAccount) {
      throw new Error('Social account not found');
    }

    // Get all active rentals for this API key
    const activeRentals = await Rental.find({
      influencerId,
      socialAccountId,
      status: 'active'
    });

    // Aggregate usage data from all rentals
    const rentalStats = activeRentals.map(rental => ({
      rentalId: rental._id,
      advertiser: rental.advertiserId,
      startDate: rental.duration.startDate,
      endDate: rental.duration.endDate,
      dailyUsage: rental.apiKeyAccess.usageLimits.requestsUsed.daily,
      monthlyUsage: rental.apiKeyAccess.usageLimits.requestsUsed.monthly,
      totalUsage: rental.apiKeyAccess.usageLimits.requestsUsed.total,
      lastUsed: rental.apiKeyAccess.usageHistory.length > 0 
        ? rental.apiKeyAccess.usageHistory[rental.apiKeyAccess.usageHistory.length - 1].date 
        : null
    }));

    // Calculate total usage across all rentals
    const totalDailyUsage = rentalStats.reduce((sum, stat) => sum + stat.dailyUsage, 0);
    const totalMonthlyUsage = rentalStats.reduce((sum, stat) => sum + stat.monthlyUsage, 0);
    const totalUsage = socialAccount.apiKey.usageStats.totalRequests;

    return {
      keyId: socialAccount.apiKey.keyId,
      version: socialAccount.apiKey.version,
      status: socialAccount.apiKey.status,
      createdAt: socialAccount.apiKey.createdAt,
      lastRotatedAt: socialAccount.apiKey.lastRotatedAt,
      expiresAt: socialAccount.apiKey.expiresAt,
      isExpired: new Date() > new Date(socialAccount.apiKey.expiresAt),
      usageLimits: {
        dailyRequests: socialAccount.apiKey.usageLimits.dailyRequests,
        monthlyRequests: socialAccount.apiKey.usageLimits.monthlyRequests,
        concurrentRentals: socialAccount.apiKey.usageLimits.concurrentRentals
      },
      currentUsage: {
        daily: totalDailyUsage,
        monthly: totalMonthlyUsage,
        total: totalUsage
      },
      activeRentals: rentalStats,
      activeRentalCount: activeRentals.length
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Set up automatic API key rotation schedule
 * @param {string} influencerId - The influencer's ID
 * @param {string} socialAccountId - The social account ID
 * @param {Object} options - Rotation schedule options
 * @returns {Promise<boolean>} Success status
 */
const setupKeyRotationSchedule = async (influencerId, socialAccountId, options = {}) => {
  try {
    const influencer = await Influencer.findById(influencerId);
    if (!influencer) {
      throw new Error('Influencer not found');
    }

    const socialAccount = influencer.socialAccounts.id(socialAccountId);
    if (!socialAccount) {
      throw new Error('Social account not found');
    }

    // Default rotation interval is 90 days if not specified
    const rotationInterval = options.rotationInterval || 90;
    
    // Set up rotation schedule
    socialAccount.apiKey.rotationSchedule = {
      isEnabled: options.isEnabled !== undefined ? options.isEnabled : true,
      intervalDays: rotationInterval,
      nextRotationDate: new Date(Date.now() + rotationInterval * 24 * 60 * 60 * 1000),
      notifyDaysBefore: options.notifyDaysBefore || 7,
      autoRotate: options.autoRotate !== undefined ? options.autoRotate : true
    };

    await influencer.save();

    // Schedule notification for the next rotation
    if (socialAccount.apiKey.rotationSchedule.isEnabled) {
      const notificationDate = new Date(
        socialAccount.apiKey.rotationSchedule.nextRotationDate.getTime() - 
        (socialAccount.apiKey.rotationSchedule.notifyDaysBefore * 24 * 60 * 60 * 1000)
      );
      
      await notificationService.scheduleNotification({
        userId: influencerId,
        type: 'apiKeyRotation',
        title: 'API Key Rotation Scheduled',
        message: `Your API key for ${socialAccount.platform} will be automatically rotated in ${socialAccount.apiKey.rotationSchedule.notifyDaysBefore} days.`,
        data: {
          socialAccountId,
          platform: socialAccount.platform,
          keyId: socialAccount.apiKey.keyId,
          rotationDate: socialAccount.apiKey.rotationSchedule.nextRotationDate
        },
        scheduledFor: notificationDate
      });
    }

    return true;
  } catch (error) {
    console.error('Error setting up key rotation schedule:', error);
    return false;
  }
};

/**
 * Update API key rotation schedule
 * @param {string} influencerId - The influencer's ID
 * @param {string} socialAccountId - The social account ID
 * @param {Object} options - Updated rotation schedule options
 * @returns {Promise<boolean>} Success status
 */
const updateKeyRotationSchedule = async (influencerId, socialAccountId, options = {}) => {
  try {
    const influencer = await Influencer.findById(influencerId);
    if (!influencer) {
      throw new Error('Influencer not found');
    }

    const socialAccount = influencer.socialAccounts.id(socialAccountId);
    if (!socialAccount) {
      throw new Error('Social account not found');
    }

    if (!socialAccount.apiKey.rotationSchedule) {
      // If no rotation schedule exists, create one
      return setupKeyRotationSchedule(influencerId, socialAccountId, options);
    }

    // Update rotation schedule fields
    if (options.isEnabled !== undefined) {
      socialAccount.apiKey.rotationSchedule.isEnabled = options.isEnabled;
    }
    
    if (options.intervalDays) {
      socialAccount.apiKey.rotationSchedule.intervalDays = options.intervalDays;
      // Recalculate next rotation date based on last rotation
      socialAccount.apiKey.rotationSchedule.nextRotationDate = new Date(
        socialAccount.apiKey.lastRotatedAt.getTime() + 
        options.intervalDays * 24 * 60 * 60 * 1000
      );
    }
    
    if (options.notifyDaysBefore) {
      socialAccount.apiKey.rotationSchedule.notifyDaysBefore = options.notifyDaysBefore;
    }
    
    if (options.autoRotate !== undefined) {
      socialAccount.apiKey.rotationSchedule.autoRotate = options.autoRotate;
    }

    await influencer.save();

    // Update notification for the next rotation if enabled
    if (socialAccount.apiKey.rotationSchedule.isEnabled) {
      const notificationDate = new Date(
        socialAccount.apiKey.rotationSchedule.nextRotationDate.getTime() - 
        (socialAccount.apiKey.rotationSchedule.notifyDaysBefore * 24 * 60 * 60 * 1000)
      );
      
      // Cancel any existing notifications
      await notificationService.cancelNotificationsByType(influencerId, 'apiKeyRotation', {
        socialAccountId
      });
      
      // Schedule new notification
      await notificationService.scheduleNotification({
        userId: influencerId,
        type: 'apiKeyRotation',
        title: 'API Key Rotation Scheduled',
        message: `Your API key for ${socialAccount.platform} will be automatically rotated in ${socialAccount.apiKey.rotationSchedule.notifyDaysBefore} days.`,
        data: {
          socialAccountId,
          platform: socialAccount.platform,
          keyId: socialAccount.apiKey.keyId,
          rotationDate: socialAccount.apiKey.rotationSchedule.nextRotationDate
        },
        scheduledFor: notificationDate
      });
    }

    return true;
  } catch (error) {
    console.error('Error updating key rotation schedule:', error);
    return false;
  }
};

/**
 * Check for API keys that need rotation and rotate them if auto-rotate is enabled
 * @returns {Promise<Array>} Array of rotated API keys
 */
const checkAndRotateKeys = async () => {
  try {
    const now = new Date();
    const rotatedKeys = [];

    // Find all influencers with API keys that need rotation
    const influencers = await Influencer.find({
      'socialAccounts.apiKey.rotationSchedule.isEnabled': true,
      'socialAccounts.apiKey.rotationSchedule.nextRotationDate': { $lte: now },
      'socialAccounts.apiKey.status': 'active'
    });

    for (const influencer of influencers) {
      for (const socialAccount of influencer.socialAccounts) {
        // Skip if no API key or rotation schedule
        if (!socialAccount.apiKey || !socialAccount.apiKey.rotationSchedule) {
          continue;
        }

        // Check if this key needs rotation
        if (
          socialAccount.apiKey.rotationSchedule.isEnabled &&
          socialAccount.apiKey.status === 'active' &&
          socialAccount.apiKey.rotationSchedule.nextRotationDate <= now
        ) {
          // If auto-rotate is enabled, rotate the key
          if (socialAccount.apiKey.rotationSchedule.autoRotate) {
            try {
              const rotatedKey = await rotateApiKey(influencer._id, socialAccount._id);
              
              // Update next rotation date
              socialAccount.apiKey.rotationSchedule.nextRotationDate = new Date(
                now.getTime() + socialAccount.apiKey.rotationSchedule.intervalDays * 24 * 60 * 60 * 1000
              );
              
              await influencer.save();
              
              // Send notification to influencer
              await notificationService.createNotification({
                userId: influencer._id,
                type: 'apiKeyRotated',
                title: 'API Key Automatically Rotated',
                message: `Your API key for ${socialAccount.platform} has been automatically rotated for security purposes.`,
                data: {
                  socialAccountId: socialAccount._id,
                  platform: socialAccount.platform,
                  keyId: rotatedKey.keyId,
                  version: rotatedKey.version
                }
              });
              
              rotatedKeys.push({
                influencerId: influencer._id,
                socialAccountId: socialAccount._id,
                platform: socialAccount.platform,
                keyId: rotatedKey.keyId,
                version: rotatedKey.version
              });
            } catch (error) {
              console.error(`Error rotating API key for influencer ${influencer._id}, social account ${socialAccount._id}:`, error);
            }
          } else {
            // If auto-rotate is disabled, send a reminder notification
            await notificationService.createNotification({
              userId: influencer._id,
              type: 'apiKeyRotationNeeded',
              title: 'API Key Rotation Needed',
              message: `Your API key for ${socialAccount.platform} is due for rotation. Please rotate it manually for security purposes.`,
              data: {
                socialAccountId: socialAccount._id,
                platform: socialAccount.platform,
                keyId: socialAccount.apiKey.keyId
              }
            });
          }
        }
      }
    }

    return rotatedKeys;
  } catch (error) {
    console.error('Error checking and rotating API keys:', error);
    return [];
  }
};

/**
 * Get API keys that are due for rotation
 * @param {number} daysThreshold - Number of days to look ahead
 * @returns {Promise<Array>} Array of API keys due for rotation
 */
const getKeysForRotation = async (daysThreshold = 7) => {
  try {
    const now = new Date();
    const thresholdDate = new Date(now.getTime() + daysThreshold * 24 * 60 * 60 * 1000);
    const keysForRotation = [];

    // Find all influencers with API keys due for rotation within the threshold
    const influencers = await Influencer.find({
      'socialAccounts.apiKey.rotationSchedule.isEnabled': true,
      'socialAccounts.apiKey.rotationSchedule.nextRotationDate': { 
        $gt: now,
        $lte: thresholdDate
      },
      'socialAccounts.apiKey.status': 'active'
    });

    for (const influencer of influencers) {
      for (const socialAccount of influencer.socialAccounts) {
        // Skip if no API key or rotation schedule
        if (!socialAccount.apiKey || !socialAccount.apiKey.rotationSchedule) {
          continue;
        }

        // Check if this key is due for rotation within the threshold
        if (
          socialAccount.apiKey.rotationSchedule.isEnabled &&
          socialAccount.apiKey.status === 'active' &&
          socialAccount.apiKey.rotationSchedule.nextRotationDate > now &&
          socialAccount.apiKey.rotationSchedule.nextRotationDate <= thresholdDate
        ) {
          keysForRotation.push({
            influencerId: influencer._id,
            influencerName: influencer.name || influencer.username,
            socialAccountId: socialAccount._id,
            platform: socialAccount.platform,
            keyId: socialAccount.apiKey.keyId,
            version: socialAccount.apiKey.version,
            nextRotationDate: socialAccount.apiKey.rotationSchedule.nextRotationDate,
            autoRotate: socialAccount.apiKey.rotationSchedule.autoRotate
          });
        }
      }
    }

    return keysForRotation;
  } catch (error) {
    console.error('Error getting keys for rotation:', error);
    return [];
  }
};

module.exports = {
  generateApiKey,
  generateKeyId,
  encryptApiKey,
  decryptApiKey,
  createApiKey,
  rotateApiKey,
  revokeApiKey,
  isApiKeyValid,
  trackApiKeyUsage,
  checkApiKeyUsageLimits,
  getApiKeyUsageStats,
  setupKeyRotationSchedule,
  updateKeyRotationSchedule,
  checkAndRotateKeys,
  getKeysForRotation
};
