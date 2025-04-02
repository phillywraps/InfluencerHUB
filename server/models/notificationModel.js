const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: [
      'subscription_renewal', 
      'payment_method_expiring', 
      'payment_success', 
      'payment_failed',
      'subscription_canceled',
      'subscription_created',
      'subscription_updated',
      'rental_expiring',
      'rental_expired',
      'new_message',
      'new_review',
      'system'
    ],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  data: {
    type: Object,
    default: {}
  },
  isRead: {
    type: Boolean,
    default: false
  },
  actionLink: {
    type: String
  },
  actionText: {
    type: String
  },
  expiresAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for efficient querying
notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index for auto-deletion

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
