const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  attachments: [{
    type: {
      type: String,
      enum: ['image', 'document', 'video', 'audio', 'other']
    },
    url: {
      type: String
    },
    name: {
      type: String
    },
    size: {
      type: Number
    }
  }],
  readStatus: {
    isRead: {
      type: Boolean,
      default: false
    },
    readAt: {
      type: Date
    }
  },
  metadata: {
    type: Map,
    of: String
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1, receiverId: 1 });

// Method to mark message as read
messageSchema.methods.markAsRead = function() {
  this.readStatus.isRead = true;
  this.readStatus.readAt = Date.now();
  return this.save();
};

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
