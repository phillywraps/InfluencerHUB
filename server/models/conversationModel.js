const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  lastMessage: {
    content: {
      type: String,
      trim: true
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  isRead: {
    type: Map,
    of: Boolean,
    default: {}
  },
  rentalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Rental'
  }
}, {
  timestamps: true
});

// Ensure participants are unique
conversationSchema.index({ participants: 1 }, { unique: true });

// Method to mark conversation as read for a user
conversationSchema.methods.markAsRead = function(userId) {
  this.isRead.set(userId.toString(), true);
  return this.save();
};

// Method to mark conversation as unread for a user
conversationSchema.methods.markAsUnread = function(userId) {
  this.isRead.set(userId.toString(), false);
  return this.save();
};

// Method to update last message
conversationSchema.methods.updateLastMessage = function(message) {
  this.lastMessage = {
    content: message.content,
    senderId: message.senderId,
    timestamp: message.createdAt || Date.now()
  };
  
  // Mark as read for sender and unread for all other participants
  this.participants.forEach(participantId => {
    this.isRead.set(
      participantId.toString(),
      participantId.toString() === message.senderId.toString()
    );
  });
  
  return this.save();
};

const Conversation = mongoose.model('Conversation', conversationSchema);

module.exports = Conversation;
