const mongoose = require('mongoose');

const advertiserSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  company: {
    name: {
      type: String,
      trim: true
    },
    website: {
      type: String,
      trim: true
    },
    industry: {
      type: String,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    logo: {
      type: String
    }
  },
  stripeCustomerId: {
    type: String,
    select: false // Hide Stripe customer ID by default
  },
  paymentMethods: [{
    type: {
      type: String,
      enum: ['credit_card', 'paypal', 'bank_transfer', 'crypto', 'other'],
      required: true
    },
    details: {
      type: Object,
      select: false // Hide payment details by default
    },
    isDefault: {
      type: Boolean,
      default: false
    }
  }],
  ratings: {
    average: {
      type: Number,
      default: 0
    },
    count: {
      type: Number,
      default: 0
    }
  },
  campaigns: [{
    name: {
      type: String,
      trim: true,
      required: true
    },
    description: {
      type: String,
      trim: true
    },
    objective: {
      type: String,
      enum: ['awareness', 'consideration', 'conversion', 'engagement', 'traffic', 'other'],
      default: 'awareness'
    },
    startDate: {
      type: Date
    },
    endDate: {
      type: Date
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'paused', 'completed', 'cancelled'],
      default: 'draft'
    },
    budget: {
      total: {
        type: Number,
        default: 0
      },
      spent: {
        type: Number,
        default: 0
      },
      currency: {
        type: String,
        default: 'USD'
      }
    },
    targetAudience: {
      platforms: [{
        type: String,
        enum: ['instagram', 'tiktok', 'youtube', 'twitter', 'facebook', 'twitch', 'other']
      }],
      demographics: {
        ageRange: {
          min: {
            type: Number,
            min: 13,
            max: 100
          },
          max: {
            type: Number,
            min: 13,
            max: 100
          }
        },
        interests: [String],
        locations: [String]
      }
    },
    metrics: {
      impressions: {
        type: Number,
        default: 0
      },
      clicks: {
        type: Number,
        default: 0
      },
      conversions: {
        type: Number,
        default: 0
      },
      engagement: {
        type: Number,
        default: 0
      }
    },
    tags: [String],
    rentals: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Rental'
    }]
  }]
}, {
  timestamps: true
});

const Advertiser = mongoose.model('Advertiser', advertiserSchema);

module.exports = Advertiser;
