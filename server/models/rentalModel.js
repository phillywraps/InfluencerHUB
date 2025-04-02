const mongoose = require('mongoose');

const rentalSchema = new mongoose.Schema({
  influencerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Influencer',
    required: true
  },
  advertiserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Advertiser',
    required: true
  },
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Advertiser.campaigns'
  },
  socialAccountId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  platform: {
    type: String,
    required: true,
    enum: ['instagram', 'tiktok', 'youtube', 'twitter', 'facebook', 'twitch', 'other']
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'active', 'completed', 'cancelled', 'rejected'],
    default: 'pending'
  },
  duration: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    }
  },
  payment: {
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'USD'
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'refunded', 'failed'],
      default: 'pending'
    },
    method: {
      type: String,
      enum: ['credit_card', 'paypal', 'bank_transfer', 'crypto', 'other']
    },
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction'
    },
    isSubscription: {
      type: Boolean,
      default: false
    },
    subscriptionId: {
      type: String
    },
    subscriptionStatus: {
      type: String,
      enum: ['active', 'canceled', 'incomplete', 'incomplete_expired', 'past_due', 'trialing', 'unpaid', null],
      default: null
    },
    subscriptionPeriod: {
      type: String,
      enum: ['monthly', 'quarterly', 'yearly', null],
      default: null
    },
    nextBillingDate: {
      type: Date
    },
    billingHistory: [{
      date: {
        type: Date
      },
      amount: {
        type: Number
      },
      status: {
        type: String,
        enum: ['completed', 'failed', 'refunded']
      },
      transactionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction'
      }
    }]
  },
  apiKeyAccess: {
    temporaryKey: {
      type: String,
      select: false // Hide temporary key by default
    },
    keyId: {
      type: String
    },
    version: {
      type: Number,
      default: 1
    },
    expiresAt: {
      type: Date
    },
    accessScopes: [{
      type: String,
      enum: ['read', 'write', 'analytics', 'content', 'messaging', 'all']
    }],
    usageLimits: {
      dailyRequests: {
        type: Number
      },
      monthlyRequests: {
        type: Number
      },
      requestsUsed: {
        daily: {
          type: Number,
          default: 0
        },
        monthly: {
          type: Number,
          default: 0
        },
        total: {
          type: Number,
          default: 0
        }
      },
      lastResetDate: {
        daily: {
          type: Date,
          default: Date.now
        },
        monthly: {
          type: Date,
          default: Date.now
        }
      }
    },
    usageHistory: [{
      date: {
        type: Date
      },
      requestCount: {
        type: Number
      },
      endpoint: {
        type: String
      },
      statusCode: {
        type: Number
      }
    }]
  },
  termsAccepted: {
    type: Boolean,
    default: false
  },
  notes: {
    type: String,
    trim: true
  },
  isReviewed: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for efficient querying
rentalSchema.index({ influencerId: 1, advertiserId: 1, status: 1 });
rentalSchema.index({ 'duration.startDate': 1, 'duration.endDate': 1 });

const Rental = mongoose.model('Rental', rentalSchema);

module.exports = Rental;
