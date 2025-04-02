const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rentalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Rental',
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
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'paypal', 'bank_transfer', 'crypto', 'other'],
    required: true
  },
  paymentIntentId: {
    type: String
  },
  subscriptionId: {
    type: String
  },
  stripeCustomerId: {
    type: String
  },
  paymentMethodId: {
    type: String
  },
  isSubscription: {
    type: Boolean,
    default: false
  },
  subscriptionStatus: {
    type: String,
    enum: ['active', 'canceled', 'incomplete', 'incomplete_expired', 'past_due', 'trialing', 'unpaid'],
    default: null
  },
  subscriptionPeriod: {
    type: String,
    enum: ['monthly', 'quarterly', 'yearly'],
    default: null
  },
  description: {
    type: String
  },
  metadata: {
    type: Object
  },
  platformFee: {
    amount: {
      type: Number,
      default: 0
    },
    percentage: {
      type: Number,
      default: 10 // 10% platform fee
    }
  },
  refundReason: {
    type: String
  },
  errorMessage: {
    type: String
  }
}, {
  timestamps: true
});

// Index for efficient querying
transactionSchema.index({ userId: 1, rentalId: 1 });
transactionSchema.index({ paymentIntentId: 1 });
transactionSchema.index({ status: 1 });

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
