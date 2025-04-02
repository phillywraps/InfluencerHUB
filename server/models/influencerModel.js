const mongoose = require('mongoose');
const CryptoJS = require('crypto-js');

// Define a schema for balance transactions
const balanceTransactionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['rental_payment', 'payout', 'refund', 'adjustment'],
    required: true
  },
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
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  description: {
    type: String
  },
  rentalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Rental'
  },
  transactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction'
  },
  payoutId: {
    type: String
  },
  platformFee: {
    amount: {
      type: Number,
      default: 0
    },
    percentage: {
      type: Number,
      default: 10
    }
  },
  metadata: {
    type: Object
  }
}, {
  timestamps: true
});

// Define a schema for payout methods
const payoutMethodSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['bank_account', 'paypal', 'stripe', 'crypto', 'other'],
    required: true
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  details: {
    // Bank account details
    accountNumber: {
      type: String,
      select: false // Hide account number by default
    },
    routingNumber: {
      type: String,
      select: false // Hide routing number by default
    },
    accountHolderName: {
      type: String
    },
    bankName: {
      type: String
    },
    // PayPal details
    email: {
      type: String
    },
    // Stripe details
    stripeAccountId: {
      type: String
    },
    // Crypto details
    walletAddress: {
      type: String
    },
    cryptoCurrency: {
      type: String,
      enum: ['BTC', 'ETH', 'USDC', 'USDT', 'other']
    },
    // Other details
    description: {
      type: String
    }
  },
  status: {
    type: String,
    enum: ['active', 'pending_verification', 'verified', 'rejected'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const influencerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  balance: {
    available: {
      type: Number,
      default: 0
    },
    pending: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: 'USD'
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  balanceTransactions: [balanceTransactionSchema],
  payoutMethods: [payoutMethodSchema],
  payoutSchedule: {
    frequency: {
      type: String,
      enum: ['manual', 'weekly', 'biweekly', 'monthly'],
      default: 'manual'
    },
    minimumAmount: {
      type: Number,
      default: 100
    },
    dayOfWeek: {
      type: Number,
      min: 0,
      max: 6,
      default: 1 // Monday
    },
    dayOfMonth: {
      type: Number,
      min: 1,
      max: 31,
      default: 1
    },
    nextPayoutDate: {
      type: Date
    }
  },
  socialAccounts: [{
    platform: {
      type: String,
      required: true,
      enum: ['instagram', 'tiktok', 'youtube', 'twitter', 'facebook', 'twitch', 'other']
    },
    username: {
      type: String,
      required: true,
      trim: true
    },
    followers: {
      type: Number,
      default: 0
    },
    apiKey: {
      key: {
        type: String,
        required: true,
        select: false // Hide API key by default
      },
      keyId: {
        type: String,
        default: function() {
          return require('crypto').randomBytes(8).toString('hex');
        }
      },
      version: {
        type: Number,
        default: 1
      },
      createdAt: {
        type: Date,
        default: Date.now
      },
      lastRotatedAt: {
        type: Date,
        default: Date.now
      },
      expiresAt: {
        type: Date,
        default: function() {
          // Default expiration is 1 year from creation
          const oneYearFromNow = new Date();
          oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
          return oneYearFromNow;
        }
      },
      status: {
        type: String,
        enum: ['active', 'suspended', 'expired', 'revoked'],
        default: 'active'
      },
      isAvailable: {
        type: Boolean,
        default: true
      },
      usageLimits: {
        dailyRequests: {
          type: Number,
          default: 1000
        },
        monthlyRequests: {
          type: Number,
          default: 30000
        },
        concurrentRentals: {
          type: Number,
          default: 1
        }
      },
      accessScopes: [{
        type: String,
        enum: ['read', 'write', 'analytics', 'content', 'messaging', 'all'],
        default: 'all'
      }],
      rentalFee: {
        hourly: {
          type: Number,
          default: 0
        },
        daily: {
          type: Number,
          default: 0
        },
        weekly: {
          type: Number,
          default: 0
        }
      },
      usageStats: {
        totalRequests: {
          type: Number,
          default: 0
        },
        lastUsed: {
          type: Date
        }
      },
      rotationSchedule: {
        isEnabled: {
          type: Boolean,
          default: true
        },
        intervalDays: {
          type: Number,
          default: 90 // Default to 90 days
        },
        nextRotationDate: {
          type: Date,
          default: function() {
            // Default to 90 days from creation
            const ninetyDaysFromNow = new Date();
            ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);
            return ninetyDaysFromNow;
          }
        },
        notifyDaysBefore: {
          type: Number,
          default: 7 // Notify 7 days before rotation
        },
        autoRotate: {
          type: Boolean,
          default: true
        }
      }
    }
  }],
  termsAndConditions: {
    type: String,
    trim: true
  },
  ratings: {
    average: {
      type: Number,
      default: 0
    },
    count: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Encrypt API key before saving
influencerSchema.pre('save', function(next) {
  // Only encrypt if API key is modified
  if (this.isModified('socialAccounts')) {
    this.socialAccounts.forEach(account => {
      if (account.apiKey && account.apiKey.key) {
        // Encrypt the API key
        account.apiKey.key = CryptoJS.AES.encrypt(
          account.apiKey.key,
          process.env.API_KEY_SECRET
        ).toString();
      }
    });
  }
  next();
});

// Method to decrypt API key
influencerSchema.methods.decryptApiKey = function(encryptedKey) {
  const bytes = CryptoJS.AES.decrypt(encryptedKey, process.env.API_KEY_SECRET);
  return bytes.toString(CryptoJS.enc.Utf8);
};

// Method to generate a new API key
influencerSchema.methods.generateApiKey = function(accountId) {
  const account = this.socialAccounts.id(accountId);
  if (!account) return null;
  
  // Generate a new API key with crypto
  const newKey = require('crypto').randomBytes(32).toString('hex');
  
  // Update the API key fields
  account.apiKey.key = newKey;
  account.apiKey.version += 1;
  account.apiKey.lastRotatedAt = new Date();
  
  return newKey;
};

// Method to check if an API key is expired
influencerSchema.methods.isApiKeyExpired = function(accountId) {
  const account = this.socialAccounts.id(accountId);
  if (!account) return true;
  
  return new Date() > new Date(account.apiKey.expiresAt);
};

// Method to check if an API key is valid (not expired, suspended, or revoked)
influencerSchema.methods.isApiKeyValid = function(accountId) {
  const account = this.socialAccounts.id(accountId);
  if (!account) return false;
  
  return (
    account.apiKey.status === 'active' && 
    !this.isApiKeyExpired(accountId)
  );
};

const Influencer = mongoose.model('Influencer', influencerSchema);

module.exports = Influencer;
