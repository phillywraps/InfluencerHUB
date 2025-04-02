const SubscriptionTier = require('../models/subscriptionTierModel');
const Influencer = require('../models/influencerModel');
const User = require('../models/userModel');
const notificationService = require('../utils/notificationService');

// @desc    Create a new subscription tier
// @route   POST /api/subscription-tiers
// @access  Private (Influencer only)
const createSubscriptionTier = async (req, res) => {
  try {
    // Get influencer
    const influencer = await Influencer.findOne({ userId: req.user._id });
    
    if (!influencer) {
      return res.status(404).json({
        success: false,
        message: 'Influencer profile not found'
      });
    }
    
    // Check if platform exists in influencer's platforms
    if (!influencer.platforms.includes(req.body.platform)) {
      return res.status(400).json({
        success: false,
        message: 'Platform not found in your connected platforms'
      });
    }
    
    // Create subscription tier
    const subscriptionTier = new SubscriptionTier({
      ...req.body,
      influencerId: influencer._id
    });
    
    // If this is the first tier for this platform, set it as default
    const existingTiers = await SubscriptionTier.countDocuments({
      influencerId: influencer._id,
      platform: req.body.platform
    });
    
    if (existingTiers === 0) {
      subscriptionTier.isDefault = true;
    }
    
    // Save subscription tier
    await subscriptionTier.save();
    
    res.status(201).json({
      success: true,
      data: subscriptionTier
    });
  } catch (error) {
    console.error('Error creating subscription tier:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all subscription tiers for an influencer
// @route   GET /api/subscription-tiers
// @access  Private (Influencer only)
const getSubscriptionTiers = async (req, res) => {
  try {
    // Get influencer
    const influencer = await Influencer.findOne({ userId: req.user._id });
    
    if (!influencer) {
      return res.status(404).json({
        success: false,
        message: 'Influencer profile not found'
      });
    }
    
    // Get subscription tiers
    const subscriptionTiers = await SubscriptionTier.find({
      influencerId: influencer._id
    }).sort({ platform: 1, name: 1 });
    
    res.json({
      success: true,
      count: subscriptionTiers.length,
      data: subscriptionTiers
    });
  } catch (error) {
    console.error('Error getting subscription tiers:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get subscription tiers for a specific platform
// @route   GET /api/subscription-tiers/:platform
// @access  Public
const getSubscriptionTiersByPlatform = async (req, res) => {
  try {
    const { platform } = req.params;
    const { influencerId } = req.query;
    
    if (!influencerId) {
      return res.status(400).json({
        success: false,
        message: 'Influencer ID is required'
      });
    }
    
    // Get subscription tiers
    const subscriptionTiers = await SubscriptionTier.find({
      influencerId,
      platform,
      isActive: true
    }).sort({ priceMonthly: 1 });
    
    res.json({
      success: true,
      count: subscriptionTiers.length,
      data: subscriptionTiers
    });
  } catch (error) {
    console.error('Error getting subscription tiers by platform:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get a subscription tier by ID
// @route   GET /api/subscription-tiers/tier/:id
// @access  Private
const getSubscriptionTierById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get subscription tier
    const subscriptionTier = await SubscriptionTier.findById(id);
    
    if (!subscriptionTier) {
      return res.status(404).json({
        success: false,
        message: 'Subscription tier not found'
      });
    }
    
    // Check if user is authorized to access this tier
    if (req.user.userType === 'influencer') {
      const influencer = await Influencer.findOne({ userId: req.user._id });
      
      if (!influencer || subscriptionTier.influencerId.toString() !== influencer._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to access this subscription tier'
        });
      }
    }
    
    res.json({
      success: true,
      data: subscriptionTier
    });
  } catch (error) {
    console.error('Error getting subscription tier by ID:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update a subscription tier
// @route   PUT /api/subscription-tiers/:id
// @access  Private (Influencer only)
const updateSubscriptionTier = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get influencer
    const influencer = await Influencer.findOne({ userId: req.user._id });
    
    if (!influencer) {
      return res.status(404).json({
        success: false,
        message: 'Influencer profile not found'
      });
    }
    
    // Get subscription tier
    const subscriptionTier = await SubscriptionTier.findById(id);
    
    if (!subscriptionTier) {
      return res.status(404).json({
        success: false,
        message: 'Subscription tier not found'
      });
    }
    
    // Check if subscription tier belongs to this influencer
    if (subscriptionTier.influencerId.toString() !== influencer._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this subscription tier'
      });
    }
    
    // Update subscription tier
    const updatedTier = await SubscriptionTier.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );
    
    res.json({
      success: true,
      data: updatedTier
    });
  } catch (error) {
    console.error('Error updating subscription tier:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete a subscription tier
// @route   DELETE /api/subscription-tiers/:id
// @access  Private (Influencer only)
const deleteSubscriptionTier = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get influencer
    const influencer = await Influencer.findOne({ userId: req.user._id });
    
    if (!influencer) {
      return res.status(404).json({
        success: false,
        message: 'Influencer profile not found'
      });
    }
    
    // Get subscription tier
    const subscriptionTier = await SubscriptionTier.findById(id);
    
    if (!subscriptionTier) {
      return res.status(404).json({
        success: false,
        message: 'Subscription tier not found'
      });
    }
    
    // Check if subscription tier belongs to this influencer
    if (subscriptionTier.influencerId.toString() !== influencer._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this subscription tier'
      });
    }
    
    // Check if this is the default tier
    if (subscriptionTier.isDefault) {
      // Count other tiers for this platform
      const otherTiers = await SubscriptionTier.find({
        influencerId: influencer._id,
        platform: subscriptionTier.platform,
        _id: { $ne: id }
      });
      
      if (otherTiers.length > 0) {
        // Set another tier as default
        const newDefault = otherTiers[0];
        newDefault.isDefault = true;
        await newDefault.save();
      }
    }
    
    // Delete subscription tier
    await subscriptionTier.remove();
    
    res.json({
      success: true,
      message: 'Subscription tier deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting subscription tier:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Set a subscription tier as default
// @route   PUT /api/subscription-tiers/:id/default
// @access  Private (Influencer only)
const setDefaultSubscriptionTier = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get influencer
    const influencer = await Influencer.findOne({ userId: req.user._id });
    
    if (!influencer) {
      return res.status(404).json({
        success: false,
        message: 'Influencer profile not found'
      });
    }
    
    // Get subscription tier
    const subscriptionTier = await SubscriptionTier.findById(id);
    
    if (!subscriptionTier) {
      return res.status(404).json({
        success: false,
        message: 'Subscription tier not found'
      });
    }
    
    // Check if subscription tier belongs to this influencer
    if (subscriptionTier.influencerId.toString() !== influencer._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this subscription tier'
      });
    }
    
    // Set as default
    subscriptionTier.isDefault = true;
    await subscriptionTier.save();
    
    res.json({
      success: true,
      data: subscriptionTier
    });
  } catch (error) {
    console.error('Error setting default subscription tier:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get default subscription tier for a platform
// @route   GET /api/subscription-tiers/default/:platform
// @access  Public
const getDefaultSubscriptionTier = async (req, res) => {
  try {
    const { platform } = req.params;
    const { influencerId } = req.query;
    
    if (!influencerId) {
      return res.status(400).json({
        success: false,
        message: 'Influencer ID is required'
      });
    }
    
    // Get default subscription tier
    const subscriptionTier = await SubscriptionTier.findOne({
      influencerId,
      platform,
      isDefault: true,
      isActive: true
    });
    
    if (!subscriptionTier) {
      return res.status(404).json({
        success: false,
        message: 'Default subscription tier not found'
      });
    }
    
    res.json({
      success: true,
      data: subscriptionTier
    });
  } catch (error) {
    console.error('Error getting default subscription tier:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create default subscription tiers for all platforms
// @route   POST /api/subscription-tiers/create-defaults
// @access  Private (Influencer only)
const createDefaultSubscriptionTiers = async (req, res) => {
  try {
    // Get influencer
    const influencer = await Influencer.findOne({ userId: req.user._id });
    
    if (!influencer) {
      return res.status(404).json({
        success: false,
        message: 'Influencer profile not found'
      });
    }
    
    const createdTiers = [];
    
    // Create default tiers for each platform
    for (const platform of influencer.platforms) {
      // Check if a tier already exists for this platform
      const existingTier = await SubscriptionTier.findOne({
        influencerId: influencer._id,
        platform
      });
      
      if (!existingTier) {
        // Create basic tier
        const basicTier = new SubscriptionTier({
          influencerId: influencer._id,
          platform,
          name: 'Basic',
          description: `Basic access to ${platform} API`,
          features: ['Standard API access', 'Basic support', 'Basic analytics'],
          priceMonthly: 9.99,
          priceQuarterly: 26.99,
          priceYearly: 99.99,
          apiRateLimit: 1000,
          supportLevel: 'Basic',
          analyticsLevel: 'Basic',
          isActive: true,
          isDefault: true
        });
        
        await basicTier.save();
        createdTiers.push(basicTier);
        
        // Create premium tier
        const premiumTier = new SubscriptionTier({
          influencerId: influencer._id,
          platform,
          name: 'Premium',
          description: `Enhanced access to ${platform} API with additional features`,
          features: [
            'Higher API rate limits',
            'Priority support',
            'Advanced analytics',
            'Extended data access'
          ],
          priceMonthly: 19.99,
          priceQuarterly: 53.99,
          priceYearly: 199.99,
          apiRateLimit: 5000,
          supportLevel: 'Priority',
          analyticsLevel: 'Advanced',
          isActive: true,
          isDefault: false
        });
        
        await premiumTier.save();
        createdTiers.push(premiumTier);
        
        // Create enterprise tier
        const enterpriseTier = new SubscriptionTier({
          influencerId: influencer._id,
          platform,
          name: 'Enterprise',
          description: `Full-featured ${platform} API access for business needs`,
          features: [
            'Unlimited API access',
            'Dedicated support',
            'Premium analytics',
            'Custom integrations',
            'SLA guarantees'
          ],
          priceMonthly: 49.99,
          priceQuarterly: 134.99,
          priceYearly: 499.99,
          apiRateLimit: 50000,
          supportLevel: 'Dedicated',
          analyticsLevel: 'Premium',
          isActive: true,
          isDefault: false
        });
        
        await enterpriseTier.save();
        createdTiers.push(enterpriseTier);
      }
    }
    
    // Create notification for the influencer
    if (createdTiers.length > 0) {
      await notificationService.createNotification({
        userId: req.user._id,
        type: 'system',
        title: 'Subscription Tiers Created',
        message: `Default subscription tiers have been created for your platforms. You can customize them in your profile settings.`,
        data: {
          tiersCreated: createdTiers.length
        },
        actionLink: '/profile',
        actionText: 'View Profile',
        sendEmail: false
      });
    }
    
    res.json({
      success: true,
      count: createdTiers.length,
      data: createdTiers
    });
  } catch (error) {
    console.error('Error creating default subscription tiers:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  createSubscriptionTier,
  getSubscriptionTiers,
  getSubscriptionTiersByPlatform,
  getSubscriptionTierById,
  updateSubscriptionTier,
  deleteSubscriptionTier,
  setDefaultSubscriptionTier,
  getDefaultSubscriptionTier,
  createDefaultSubscriptionTiers
};
