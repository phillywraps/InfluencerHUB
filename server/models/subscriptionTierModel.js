const mongoose = require('mongoose');

const subscriptionTierSchema = new mongoose.Schema({
  influencerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Influencer',
    required: true
  },
  platform: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true,
    enum: ['Basic', 'Premium', 'Enterprise', 'Custom']
  },
  description: {
    type: String,
    required: true
  },
  features: [{
    type: String
  }],
  priceMonthly: {
    type: Number,
    required: true,
    min: 0
  },
  priceQuarterly: {
    type: Number,
    required: true,
    min: 0
  },
  priceYearly: {
    type: Number,
    required: true,
    min: 0
  },
  apiRateLimit: {
    type: Number,
    default: 1000,
    min: 0
  },
  apiFeatures: {
    type: Map,
    of: Boolean,
    default: {}
  },
  supportLevel: {
    type: String,
    enum: ['Basic', 'Priority', 'Dedicated'],
    default: 'Basic'
  },
  analyticsLevel: {
    type: String,
    enum: ['Basic', 'Advanced', 'Premium'],
    default: 'Basic'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  customFields: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Ensure each influencer has only one default tier per platform
subscriptionTierSchema.pre('save', async function(next) {
  if (this.isDefault) {
    // Find any other default tiers for this influencer and platform
    const existingDefault = await this.constructor.findOne({
      influencerId: this.influencerId,
      platform: this.platform,
      isDefault: true,
      _id: { $ne: this._id }
    });
    
    if (existingDefault) {
      existingDefault.isDefault = false;
      await existingDefault.save();
    }
  }
  next();
});

// Create indexes for efficient querying
subscriptionTierSchema.index({ influencerId: 1, platform: 1 });
subscriptionTierSchema.index({ influencerId: 1, platform: 1, isDefault: 1 });
subscriptionTierSchema.index({ influencerId: 1, platform: 1, isActive: 1 });

const SubscriptionTier = mongoose.model('SubscriptionTier', subscriptionTierSchema);

module.exports = SubscriptionTier;
