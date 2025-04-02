const Message = require('../models/messageModel');
const Conversation = require('../models/conversationModel');
const User = require('../models/userModel');
const messageCacheService = require('../utils/messageCacheService');
const logger = require('../config/logger');

// Socket service instance
let socketService;

// Set socket service
const setSocketService = (service) => {
  socketService = service;
};

// @desc    Get all conversations for the current user
// @route   GET /api/messages/conversations
// @access  Private
const getConversations = async (req, res) => {
  try {
    // Find all conversations where the current user is a participant
    const conversations = await Conversation.find({
      participants: req.user._id
    })
      .sort({ updatedAt: -1 })
      .populate({
        path: 'participants',
        select: 'username profile userType'
      });
    
    // Format conversations for response
    const formattedConversations = conversations.map(conversation => {
      // Filter out the current user from participants
      const otherParticipants = conversation.participants.filter(
        participant => participant._id.toString() !== req.user._id.toString()
      );
      
      return {
        _id: conversation._id,
        participants: otherParticipants,
        lastMessage: conversation.lastMessage,
        isRead: conversation.isRead.get(req.user._id.toString()) || false,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt
      };
    });
    
    res.json({
      success: true,
      count: formattedConversations.length,
      data: formattedConversations
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get or create a conversation with another user
// @route   GET /api/messages/conversations/:userId
// @access  Private
const getOrCreateConversation = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Check if the other user exists
    const otherUser = await User.findById(userId);
    
    if (!otherUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Check if a conversation already exists between the two users
    let conversation = await Conversation.findOne({
      participants: { $all: [req.user._id, userId] }
    }).populate({
      path: 'participants',
      select: 'username profile userType'
    });
    
    // If no conversation exists, create a new one
    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user._id, userId],
        isRead: {
          [req.user._id]: true,
          [userId]: true
        }
      });
      
      // Populate participants
      conversation = await Conversation.findById(conversation._id).populate({
        path: 'participants',
        select: 'username profile userType'
      });
    }
    
    // Format conversation for response
    const otherParticipants = conversation.participants.filter(
      participant => participant._id.toString() !== req.user._id.toString()
    );
    
    const formattedConversation = {
      _id: conversation._id,
      participants: otherParticipants,
      lastMessage: conversation.lastMessage,
      isRead: conversation.isRead.get(req.user._id.toString()) || false,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt
    };
    
    res.json({
      success: true,
      data: formattedConversation
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get messages in a conversation
// @route   GET /api/messages/conversations/:conversationId/messages
// @access  Private
const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    // Check if conversation exists
    const conversation = await Conversation.findById(conversationId);
    
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }
    
    // Check if user is a participant in the conversation
    if (!conversation.participants.includes(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this conversation'
      });
    }
    
    let messages = [];
    let totalMessages = 0;
    
    // Try to get messages from cache first
    if (parseInt(page) === 1) {
      try {
        messages = await messageCacheService.getRecentMessages(conversationId, parseInt(limit));
        logger.debug(`Retrieved ${messages.length} messages from cache for conversation ${conversationId}`);
      } catch (cacheError) {
        logger.error(`Error retrieving messages from cache: ${cacheError.message}`);
      }
    }
    
    // If not in cache or not first page, get from database
    if (messages.length === 0) {
      // Calculate pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      // Get messages from database
      messages = await Message.find({ conversationId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate({
          path: 'senderId',
          select: 'username profile userType'
        });
      
      // Cache first page of messages
      if (parseInt(page) === 1) {
        try {
          for (const message of messages) {
            await messageCacheService.cacheMessage(message);
          }
          logger.debug(`Cached ${messages.length} messages for conversation ${conversationId}`);
        } catch (cacheError) {
          logger.error(`Error caching messages: ${cacheError.message}`);
        }
      }
    }
    
    // Get total count
    totalMessages = await Message.countDocuments({ conversationId });
    
    // Mark conversation as read for the current user
    await conversation.markAsRead(req.user._id);
    
    // Update last read timestamp in cache
    await messageCacheService.trackLastRead(conversationId, req.user._id.toString());
    
    // Reset unread count in cache
    await messageCacheService.resetUnreadCount(conversationId, req.user._id.toString());
    
    // Mark messages as read in database for consistency
    await Message.updateMany(
      {
        conversationId,
        senderId: { $ne: req.user._id },
        'readStatus.isRead': false
      },
      {
        $set: {
          'readStatus.isRead': true,
          'readStatus.readAt': Date.now()
        }
      }
    );
    
    res.json({
      success: true,
      count: messages.length,
      totalPages: Math.ceil(totalMessages / parseInt(limit)),
      currentPage: parseInt(page),
      data: messages
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Send a message
// @route   POST /api/messages/conversations/:conversationId/messages
// @access  Private
const sendMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { content, attachments, metadata } = req.body;
    
    // Check if conversation exists
    const conversation = await Conversation.findById(conversationId);
    
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }
    
    // Check if user is a participant in the conversation
    if (!conversation.participants.includes(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to send messages in this conversation'
      });
    }
    
    // Get all participants except sender for unread counts
    const recipientIds = conversation.participants
      .filter(id => id.toString() !== req.user._id.toString())
      .map(id => id.toString());
    
    // Create message
    const message = await Message.create({
      conversationId,
      senderId: req.user._id,
      content,
      attachments: attachments || [],
      metadata: metadata || {},
      readStatus: {
        isRead: false
      }
    });
    
    // Populate sender
    const populatedMessage = await Message.findById(message._id).populate({
      path: 'senderId',
      select: 'username profile userType'
    });
    
    // Update conversation's last message
    await conversation.updateLastMessage(message);
    
    // Cache the message
    await messageCacheService.cacheMessage(populatedMessage);
    
    // Increment unread count for recipients
    await messageCacheService.incrementUnreadCount(
      conversationId, 
      req.user._id.toString(), 
      recipientIds
    );
    
// Broadcast message via socket if available
if (socketService) {
  // Format the message for WebSocket delivery
  const messageForSocket = {
    _id: populatedMessage._id,
    conversationId: populatedMessage.conversationId,
    sender: {
      userId: populatedMessage.senderId._id,
      name: populatedMessage.senderId.username,
      userType: populatedMessage.senderId.userType,
      avatar: populatedMessage.senderId.profile?.avatar || null
    },
    content: {
      type: 'text',
      text: populatedMessage.content,
      attachments: populatedMessage.attachments || []
    },
    createdAt: populatedMessage.createdAt
  };
  
  // Emit to conversation room
  socketService.io.to(`conversation:${conversationId}`).emit('message_received', messageForSocket);
}
    
    res.status(201).json({
      success: true,
      data: populatedMessage
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Mark a message as read
// @route   PUT /api/messages/:messageId/read
// @access  Private
const markMessageAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    
    // Find the message
    const message = await Message.findById(messageId);
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }
    
    // Check if user is a participant in the conversation
    const conversation = await Conversation.findById(message.conversationId);
    
    if (!conversation || !conversation.participants.includes(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to mark this message as read'
      });
    }
    
    // Mark message as read
    message.readStatus.isRead = true;
    message.readStatus.readAt = Date.now();
    await message.save();
    
    // Update last read timestamp in cache
    await messageCacheService.trackLastRead(
      message.conversationId, 
      req.user._id.toString(), 
      new Date(message.readStatus.readAt)
    );
    
// Update read status via socket if available
if (socketService) {
  // Emit read receipt to conversation
  socketService.io.to(`conversation:${message.conversationId}`).emit('messages_read', {
    conversationId: message.conversationId,
    messageIds: [message._id],
    userId: req.user._id
  });
}
    
    res.json({
      success: true,
      data: message
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get unread message counts for all conversations
// @route   GET /api/messages/unread
// @access  Private
const getUnreadCounts = async (req, res) => {
  try {
    // Get unread counts from cache
    const unreadCounts = await messageCacheService.getAllUnreadCounts(req.user._id.toString());
    
    res.json({
      success: true,
      data: unreadCounts
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Mark all messages in a conversation as read
// @route   PUT /api/messages/conversations/:conversationId/read
// @access  Private
const markAllAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    
    // Check if conversation exists
    const conversation = await Conversation.findById(conversationId);
    
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }
    
    // Check if user is a participant in the conversation
    if (!conversation.participants.includes(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this conversation'
      });
    }
    
    // Mark all messages as read in database
    await Message.updateMany(
      {
        conversationId,
        senderId: { $ne: req.user._id },
        'readStatus.isRead': false
      },
      {
        $set: {
          'readStatus.isRead': true,
          'readStatus.readAt': Date.now()
        }
      }
    );
    
    // Update last read timestamp in cache
    await messageCacheService.trackLastRead(conversationId, req.user._id.toString());
    
    // Reset unread count in cache
    await messageCacheService.resetUnreadCount(conversationId, req.user._id.toString());
    
    // Emit read receipts via WebSocket if available
    if (socketService) {
      // Get all message IDs that were marked as read
      const messages = await Message.find({
        conversationId,
        senderId: { $ne: req.user._id },
        'readStatus.isRead': true
      }).select('_id');
      
      const messageIds = messages.map(msg => msg._id);
      
      if (messageIds.length > 0) {
        socketService.io.to(`conversation:${conversationId}`).emit('messages_read', {
          conversationId,
          messageIds,
          userId: req.user._id
        });
      }
    }
    
    res.json({
      success: true,
      message: 'All messages marked as read'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getConversations,
  getOrCreateConversation,
  getMessages,
  sendMessage,
  markMessageAsRead,
  getUnreadCounts,
  markAllAsRead,
  setSocketService
};
