const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const subscriptionSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  influencer: {
    type: Schema.Types.ObjectId,
    ref: 'Influencer',
    default: null
  },
  socialAccount: {
    type: Schema.Types.ObjectId,
    ref: 'SocialAccount',
    default: null
  },
  paymentMethod: {
    type: String,
    enum: ['paypal', 'stripe', 'crypto', 'alipay'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    required: true,
    default: 'USD'
  },
  cryptoCurrency: {
    type: String,
    default: null
  },
  billingPeriod: {
    type: String,
    enum: ['monthly', 'quarterly', 'yearly'],
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'canceled', 'failed', 'pending'],
    default: 'pending'
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  nextBillingDate: {
    type: Date,
    required: true
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    default: null
  },
  canceledAt: {
    type: Date,
    default: null
  },
  externalId: {
    type: String,
    default: null
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Add any subscription-specific methods or statics here
subscriptionSchema.statics.findActiveSubscriptions = function(userId) {
  return this.find({
    user: userId,
    status: 'active'
  });
};

subscriptionSchema.statics.findSubscriptionsByInfluencer = function(influencerId) {
  return this.find({
    influencer: influencerId
  });
};

const Subscription = mongoose.model('Subscription', subscriptionSchema);

module.exports = Subscription;
