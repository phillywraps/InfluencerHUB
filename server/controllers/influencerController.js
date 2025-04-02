const Influencer = require('../models/influencerModel');
const User = require('../models/userModel');
const CryptoJS = require('crypto-js');

// @desc    Get influencer profile
// @route   GET /api/influencers/profile
// @access  Private (Influencer only)
const getInfluencerProfile = async (req, res) => {
  try {
    const influencer = await Influencer.findOne({ userId: req.user._id });
    
    if (!influencer) {
      return res.status(404).json({
        success: false,
        message: 'Influencer profile not found'
      });
    }
    
    res.json({
      success: true,
      data: influencer
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update influencer profile
// @route   PUT /api/influencers/profile
// @access  Private (Influencer only)
const updateInfluencerProfile = async (req, res) => {
  try {
    const influencer = await Influencer.findOne({ userId: req.user._id });
    
    if (!influencer) {
      return res.status(404).json({
        success: false,
        message: 'Influencer profile not found'
      });
    }
    
    // Update terms and conditions
    if (req.body.termsAndConditions) {
      influencer.termsAndConditions = req.body.termsAndConditions;
    }
    
    // Save updated influencer
    const updatedInfluencer = await influencer.save();
    
    res.json({
      success: true,
      data: updatedInfluencer
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Add social media account
// @route   POST /api/influencers/social-accounts
// @access  Private (Influencer only)
const addSocialAccount = async (req, res) => {
  try {
    const { platform, username, followers, apiKey, rentalFee, rotationSchedule } = req.body;
    
    const influencer = await Influencer.findOne({ userId: req.user._id });
    
    if (!influencer) {
      return res.status(404).json({
        success: false,
        message: 'Influencer profile not found'
      });
    }
    
    // Check if account for this platform already exists
    const existingAccount = influencer.socialAccounts.find(
      account => account.platform === platform
    );
    
    if (existingAccount) {
      return res.status(400).json({
        success: false,
        message: `A ${platform} account is already connected to your profile`
      });
    }
    
    // Add new social account
    influencer.socialAccounts.push({
      platform,
      username,
      followers: followers || 0,
      apiKey: {
        key: apiKey,
        isAvailable: true,
        rentalFee: {
          hourly: rentalFee?.hourly || 0,
          daily: rentalFee?.daily || 0,
          weekly: rentalFee?.weekly || 0
        },
        rotationSchedule: {
          isEnabled: rotationSchedule?.isEnabled !== undefined ? rotationSchedule.isEnabled : true,
          intervalDays: rotationSchedule?.intervalDays || 90,
          notifyDaysBefore: rotationSchedule?.notifyDaysBefore || 7,
          autoRotate: rotationSchedule?.autoRotate !== undefined ? rotationSchedule.autoRotate : true,
          nextRotationDate: new Date(Date.now() + (rotationSchedule?.intervalDays || 90) * 24 * 60 * 60 * 1000)
        }
      }
    });
    
    // Save updated influencer
    await influencer.save();
    
    // Return without API key for security
    const sanitizedInfluencer = await Influencer.findOne({ userId: req.user._id });
    
    res.status(201).json({
      success: true,
      data: sanitizedInfluencer
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update social media account
// @route   PUT /api/influencers/social-accounts/:accountId
// @access  Private (Influencer only)
const updateSocialAccount = async (req, res) => {
  try {
    const { accountId } = req.params;
    const { username, followers, apiKey, rentalFee, isAvailable, rotationSchedule } = req.body;
    
    const influencer = await Influencer.findOne({ userId: req.user._id });
    
    if (!influencer) {
      return res.status(404).json({
        success: false,
        message: 'Influencer profile not found'
      });
    }
    
    // Find the account to update
    const accountIndex = influencer.socialAccounts.findIndex(
      account => account._id.toString() === accountId
    );
    
    if (accountIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Social account not found'
      });
    }
    
    // Update account fields
    if (username) {
      influencer.socialAccounts[accountIndex].username = username;
    }
    
    if (followers) {
      influencer.socialAccounts[accountIndex].followers = followers;
    }
    
    if (apiKey) {
      influencer.socialAccounts[accountIndex].apiKey.key = apiKey;
    }
    
    if (isAvailable !== undefined) {
      influencer.socialAccounts[accountIndex].apiKey.isAvailable = isAvailable;
    }
    
    if (rentalFee) {
      influencer.socialAccounts[accountIndex].apiKey.rentalFee = {
        hourly: rentalFee.hourly || influencer.socialAccounts[accountIndex].apiKey.rentalFee.hourly,
        daily: rentalFee.daily || influencer.socialAccounts[accountIndex].apiKey.rentalFee.daily,
        weekly: rentalFee.weekly || influencer.socialAccounts[accountIndex].apiKey.rentalFee.weekly
      };
    }
    
    if (rotationSchedule) {
      // If rotation schedule doesn't exist yet, create it
      if (!influencer.socialAccounts[accountIndex].apiKey.rotationSchedule) {
        influencer.socialAccounts[accountIndex].apiKey.rotationSchedule = {
          isEnabled: true,
          intervalDays: 90,
          notifyDaysBefore: 7,
          autoRotate: true,
          nextRotationDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
        };
      }
      
      // Update rotation schedule fields
      if (rotationSchedule.isEnabled !== undefined) {
        influencer.socialAccounts[accountIndex].apiKey.rotationSchedule.isEnabled = rotationSchedule.isEnabled;
      }
      
      if (rotationSchedule.intervalDays) {
        influencer.socialAccounts[accountIndex].apiKey.rotationSchedule.intervalDays = rotationSchedule.intervalDays;
        
        // Recalculate next rotation date based on last rotation
        const lastRotatedAt = influencer.socialAccounts[accountIndex].apiKey.lastRotatedAt || new Date();
        influencer.socialAccounts[accountIndex].apiKey.rotationSchedule.nextRotationDate = new Date(
          lastRotatedAt.getTime() + rotationSchedule.intervalDays * 24 * 60 * 60 * 1000
        );
      }
      
      if (rotationSchedule.notifyDaysBefore) {
        influencer.socialAccounts[accountIndex].apiKey.rotationSchedule.notifyDaysBefore = rotationSchedule.notifyDaysBefore;
      }
      
      if (rotationSchedule.autoRotate !== undefined) {
        influencer.socialAccounts[accountIndex].apiKey.rotationSchedule.autoRotate = rotationSchedule.autoRotate;
      }
    }
    
    // Save updated influencer
    await influencer.save();
    
    // Return without API key for security
    const sanitizedInfluencer = await Influencer.findOne({ userId: req.user._id });
    
    res.json({
      success: true,
      data: sanitizedInfluencer
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete social media account
// @route   DELETE /api/influencers/social-accounts/:accountId
// @access  Private (Influencer only)
const deleteSocialAccount = async (req, res) => {
  try {
    const { accountId } = req.params;
    
    const influencer = await Influencer.findOne({ userId: req.user._id });
    
    if (!influencer) {
      return res.status(404).json({
        success: false,
        message: 'Influencer profile not found'
      });
    }
    
    // Find the account to delete
    const accountIndex = influencer.socialAccounts.findIndex(
      account => account._id.toString() === accountId
    );
    
    if (accountIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Social account not found'
      });
    }
    
    // Remove the account
    influencer.socialAccounts.splice(accountIndex, 1);
    
    // Save updated influencer
    await influencer.save();
    
    res.json({
      success: true,
      message: 'Social account removed successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all influencers (for advertisers to browse)
// @route   GET /api/influencers
// @access  Public
const getAllInfluencers = async (req, res) => {
  try {
    const { platform, minFollowers, maxFollowers, sort } = req.query;
    
    // Build query
    let query = {};
    
    if (platform) {
      query['socialAccounts.platform'] = platform;
    }
    
    if (minFollowers || maxFollowers) {
      query['socialAccounts.followers'] = {};
      
      if (minFollowers) {
        query['socialAccounts.followers']['$gte'] = Number(minFollowers);
      }
      
      if (maxFollowers) {
        query['socialAccounts.followers']['$lte'] = Number(maxFollowers);
      }
    }
    
    // Only show influencers with available API keys
    query['socialAccounts.apiKey.isAvailable'] = true;
    
    // Build sort options
    let sortOptions = {};
    
    if (sort === 'followers-high') {
      sortOptions = { 'socialAccounts.followers': -1 };
    } else if (sort === 'followers-low') {
      sortOptions = { 'socialAccounts.followers': 1 };
    } else if (sort === 'rating-high') {
      sortOptions = { 'ratings.average': -1 };
    } else {
      // Default sort by ratings
      sortOptions = { 'ratings.average': -1 };
    }
    
    // Find influencers
    const influencers = await Influencer.find(query)
      .sort(sortOptions)
      .populate({
        path: 'userId',
        select: 'username profile'
      });
    
    // Map to return formatted data
    const formattedInfluencers = await Promise.all(
      influencers.map(async (influencer) => {
        const user = await User.findById(influencer.userId);
        
        return {
          _id: influencer._id,
          username: user.username,
          profile: user.profile,
          socialAccounts: influencer.socialAccounts.map(account => ({
            _id: account._id,
            platform: account.platform,
            username: account.username,
            followers: account.followers,
            rentalFee: account.apiKey.rentalFee
          })),
          ratings: influencer.ratings,
          termsAndConditions: influencer.termsAndConditions
        };
      })
    );
    
    res.json({
      success: true,
      count: formattedInfluencers.length,
      data: formattedInfluencers
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get influencer by ID
// @route   GET /api/influencers/:id
// @access  Public
const getInfluencerById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const influencer = await Influencer.findById(id);
    
    if (!influencer) {
      return res.status(404).json({
        success: false,
        message: 'Influencer not found'
      });
    }
    
    const user = await User.findById(influencer.userId);
    
    // Format response
    const formattedInfluencer = {
      _id: influencer._id,
      username: user.username,
      profile: user.profile,
      socialAccounts: influencer.socialAccounts.map(account => ({
        _id: account._id,
        platform: account.platform,
        username: account.username,
        followers: account.followers,
        isAvailable: account.apiKey.isAvailable,
        rentalFee: account.apiKey.rentalFee
      })),
      ratings: influencer.ratings,
      termsAndConditions: influencer.termsAndConditions
    };
    
    res.json({
      success: true,
      data: formattedInfluencer
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getInfluencerProfile,
  updateInfluencerProfile,
  addSocialAccount,
  updateSocialAccount,
  deleteSocialAccount,
  getAllInfluencers,
  getInfluencerById
};
