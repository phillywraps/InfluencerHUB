const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const Message = require('../models/messageModel');
const Conversation = require('../models/conversationModel');
const User = require('../models/userModel');
const redisAdapter = require('./redisAdapter');
const logger = require('../config/logger');

/**
 * WebSocket Service - Manages real-time messaging with Socket.io
 */
class WebSocketService {
  constructor(server) {
    // Initialize Socket.io
    this.io = socketIo(server, {
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? process.env.FRONTEND_URL 
          : ['http://localhost:3000', 'http://localhost:19006'], // Web and mobile dev servers
        methods: ['GET', 'POST'],
        credentials: true
      }
    });
    
    // Set up Redis adapter if enabled
    this.setupRedisAdapter();
    
    // Store active connections by userId
    this.connections = new Map();
    
    // Store typing state by conversationId and userId
    this.typingUsers = new Map();
    
    // Initialize socket middleware and event handlers
    this.init();
  }

  /**
   * Set up Redis adapter for horizontal scaling if enabled in environment
   */
  async setupRedisAdapter() {
    // Only use Redis adapter if enabled in environment
    if (process.env.USE_REDIS_ADAPTER === 'true') {
      try {
        logger.info('Setting up Redis adapter for Socket.io');
        const adapter = await redisAdapter.getAdapter();
        this.io.adapter(adapter);
        logger.info('Redis adapter for Socket.io set up successfully');
      } catch (error) {
        logger.error(`Failed to set up Redis adapter: ${error.message}`);
        logger.info('Falling back to in-memory adapter');
      }
    } else {
      logger.info('Using default in-memory adapter for Socket.io');
    }
  }

  /**
   * Initialize the socket.io server with middleware and event handlers
   */
  init() {
    // Authenticate all socket connections
    this.io.use(this.authMiddleware.bind(this));
    
    this.io.on('connection', (socket) => {
      const userId = socket.user._id.toString();
      console.log(`User connected: ${userId}`);
      
      // Add to active connections
      this.connections.set(userId, socket.id);
      
      // Emit presence event to all connected users
      this.io.emit('presence_changed', { userId, status: 'online' });
      
      // Handle socket events
      this.registerSocketEvents(socket);
      
      // Handle disconnect
      socket.on('disconnect', () => {
        console.log(`User disconnected: ${userId}`);
        this.connections.delete(userId);
        this.io.emit('presence_changed', { userId, status: 'offline' });
        
        // Clear typing status for this user in all conversations
        this.typingUsers.forEach((usersTyping, conversationId) => {
          if (usersTyping.has(userId)) {
            usersTyping.delete(userId);
            this.emitTypingStatus(conversationId);
          }
        });
      });
    });
  }

  /**
   * Authentication middleware for socket connections
   */
  async authMiddleware(socket, next) {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      
      if (!token) {
        return next(new Error('Authentication error: Token not provided'));
      }
      
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from database
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }
      
      // Attach user object to socket
      socket.user = user;
      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication error: Invalid token'));
    }
  }

  /**
   * Register event handlers for a socket connection
   */
  registerSocketEvents(socket) {
    const userId = socket.user._id.toString();
    
    // Join a conversation room
    socket.on('join_conversation', async (data) => {
      try {
        const { conversationId } = data;
        
        // Verify user is a participant in this conversation
        const conversation = await Conversation.findOne({
          _id: conversationId,
          'participants.userId': userId
        });
        
        if (!conversation) {
          socket.emit('error', { message: 'Not authorized to join this conversation' });
          return;
        }
        
        // Join the room
        socket.join(`conversation:${conversationId}`);
        console.log(`User ${userId} joined conversation ${conversationId}`);
        
        // Get unread count for this user in this conversation
        const unreadCount = await Message.countDocuments({
          conversationId,
          'sender.userId': { $ne: userId },
          'metadata.readBy.userId': { $ne: userId }
        });
        
        // Send notification to user with unread count
        socket.emit('conversation_joined', { 
          conversationId, 
          unreadCount
        });
      } catch (error) {
        console.error('Error joining conversation:', error);
        socket.emit('error', { message: 'Failed to join conversation' });
      }
    });
    
    // Leave a conversation room
    socket.on('leave_conversation', (data) => {
      const { conversationId } = data;
      socket.leave(`conversation:${conversationId}`);
      console.log(`User ${userId} left conversation ${conversationId}`);
    });
    
    // Send a new message
    socket.on('send_message', async (data) => {
      try {
        const { conversationId, content, metadata = {} } = data;
        
        // Verify user is a participant in this conversation
        const conversation = await Conversation.findOne({
          _id: conversationId,
          'participants.userId': userId
        });
        
        if (!conversation) {
          socket.emit('error', { message: 'Not authorized to send messages to this conversation' });
          return;
        }
        
        // Create a new message
        const message = new Message({
          conversationId,
          sender: {
            userId: socket.user._id,
            userType: socket.user.role
          },
          content: {
            type: content.type || 'text',
            text: content.text,
            attachments: content.attachments || []
          },
          metadata: {
            ...metadata,
            deliveredTo: [], // Will be filled as message is delivered
            readBy: [] // Will be filled as message is read
          }
        });
        
        // Save to database
        await message.save();
        
        // Update conversation's last message
        await Conversation.findByIdAndUpdate(conversationId, {
          lastMessage: {
            text: content.text,
            senderId: socket.user._id,
            timestamp: new Date()
          },
          updatedAt: new Date()
        });
        
        // Prepare message for delivery
        const messageData = {
          _id: message._id,
          conversationId,
          sender: {
            userId: message.sender.userId,
            name: socket.user.name, // Include sender name for display
            avatar: socket.user.avatar, // Include avatar if available
            userType: message.sender.userType
          },
          content: message.content,
          createdAt: message.createdAt
        };
        
        // Emit message to all participants in the conversation
        this.io.to(`conversation:${conversationId}`).emit('message_received', messageData);
        
        // Clear typing indicator for the sender
        this.handleTypingEnd(socket, { conversationId });
        
        // Mark as delivered for all online participants
        this.markMessageAsDelivered(message._id, conversationId);
        
        // If this is a rental-related message, notify users about rental status change
        if (metadata.rentalAction) {
          this.io.to(`conversation:${conversationId}`).emit('rental_status_changed', {
            conversationId,
            rentalId: metadata.rentalId,
            action: metadata.rentalAction
          });
        }
        
        // Acknowledge successful send
        socket.emit('message_sent', { messageId: message._id });
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });
    
    // Handle typing indicator start
    socket.on('typing_start', (data) => {
      this.handleTypingStart(socket, data);
    });
    
    // Handle typing indicator end
    socket.on('typing_end', (data) => {
      this.handleTypingEnd(socket, data);
    });
    
    // Mark messages as read
    socket.on('mark_read', async (data) => {
      try {
        const { conversationId, messageIds } = data;
        
        // If no specific messageIds, mark all unread messages in conversation as read
        if (!messageIds || messageIds.length === 0) {
          const messages = await Message.find({
            conversationId,
            'sender.userId': { $ne: userId },
            'metadata.readBy.userId': { $ne: userId }
          });
          
          const readMessageIds = [];
          
          for (const message of messages) {
            message.metadata.readBy.push({
              userId: socket.user._id,
              timestamp: new Date()
            });
            await message.save();
            readMessageIds.push(message._id);
          }
          
          // Emit read receipts to conversation
          if (readMessageIds.length > 0) {
            this.io.to(`conversation:${conversationId}`).emit('messages_read', {
              conversationId,
              messageIds: readMessageIds,
              userId: socket.user._id
            });
          }
        } else {
          // Mark specific messages as read
          for (const messageId of messageIds) {
            await Message.findOneAndUpdate(
              { 
                _id: messageId,
                conversationId,
                'sender.userId': { $ne: userId },
                'metadata.readBy.userId': { $ne: userId }
              },
              { 
                $push: { 
                  'metadata.readBy': {
                    userId: socket.user._id,
                    timestamp: new Date()
                  }
                }
              }
            );
          }
          
          // Emit read receipts to conversation
          this.io.to(`conversation:${conversationId}`).emit('messages_read', {
            conversationId,
            messageIds,
            userId: socket.user._id
          });
        }
      } catch (error) {
        console.error('Error marking messages as read:', error);
        socket.emit('error', { message: 'Failed to mark messages as read' });
      }
    });
    
    // Update presence status
    socket.on('presence_update', (data) => {
      const { status } = data;
      this.io.emit('presence_changed', { userId, status });
    });
  }

  /**
   * Handle typing indicator start
   */
  handleTypingStart(socket, data) {
    const { conversationId } = data;
    const userId = socket.user._id.toString();
    
    // Initialize typing users for this conversation if not exists
    if (!this.typingUsers.has(conversationId)) {
      this.typingUsers.set(conversationId, new Set());
    }
    
    // Add user to typing users for this conversation
    this.typingUsers.get(conversationId).add(userId);
    
    // Emit typing status to all users in conversation except sender
    this.emitTypingStatus(conversationId);
  }

  /**
   * Handle typing indicator end
   */
  handleTypingEnd(socket, data) {
    const { conversationId } = data;
    const userId = socket.user._id.toString();
    
    // Check if this conversation has typing users
    if (this.typingUsers.has(conversationId)) {
      // Remove user from typing users
      this.typingUsers.get(conversationId).delete(userId);
      
      // If no more typing users, delete the set
      if (this.typingUsers.get(conversationId).size === 0) {
        this.typingUsers.delete(conversationId);
      }
      
      // Emit updated typing status
      this.emitTypingStatus(conversationId);
    }
  }

  /**
   * Emit typing status to all users in a conversation
   */
  emitTypingStatus(conversationId) {
    const typingUserIds = this.typingUsers.has(conversationId) 
      ? Array.from(this.typingUsers.get(conversationId))
      : [];
    
    this.io.to(`conversation:${conversationId}`).emit('typing_indicator', {
      conversationId,
      userIds: typingUserIds
    });
  }

  /**
   * Mark a message as delivered for all online participants
   */
  async markMessageAsDelivered(messageId, conversationId) {
    try {
      // Get all participants for this conversation
      const conversation = await Conversation.findById(conversationId);
      
      if (!conversation) return;
      
      const message = await Message.findById(messageId);
      
      if (!message) return;
      
      // Get the sender ID
      const senderId = message.sender.userId.toString();
      
      // For each participant who is online but not the sender, mark as delivered
      for (const participant of conversation.participants) {
        const participantId = participant.userId.toString();
        
        // Skip the sender
        if (participantId === senderId) continue;
        
        // Check if participant is online
        if (this.connections.has(participantId)) {
          // Add to delivered list if not already there
          const alreadyDelivered = message.metadata.deliveredTo.some(
            delivery => delivery.userId.toString() === participantId
          );
          
          if (!alreadyDelivered) {
            message.metadata.deliveredTo.push({
              userId: participant.userId,
              timestamp: new Date()
            });
          }
        }
      }
      
      // Save message with updated delivery status
      await message.save();
      
      // Emit delivery confirmation to sender
      if (this.connections.has(senderId)) {
        const socketId = this.connections.get(senderId);
        this.io.to(socketId).emit('message_delivered', {
          messageId,
          deliveredTo: message.metadata.deliveredTo
        });
      }
    } catch (error) {
      console.error('Error marking message as delivered:', error);
    }
  }

  /**
   * Get online status for a list of users
   */
  getOnlineStatus(userIds) {
    const statuses = {};
    
    for (const userId of userIds) {
      statuses[userId] = this.connections.has(userId) ? 'online' : 'offline';
    }
    
    return statuses;
  }

  /**
   * Send a system notification to specific users
   */
  sendSystemNotification(userIds, notification) {
    for (const userId of userIds) {
      if (this.connections.has(userId)) {
        const socketId = this.connections.get(userId);
        this.io.to(socketId).emit('system_notification', notification);
      }
    }
  }

  /**
   * Notify participants about a rental status change
   */
  notifyRentalStatusChange(rentalId, status, affectedUserIds) {
    for (const userId of affectedUserIds) {
      if (this.connections.has(userId)) {
        const socketId = this.connections.get(userId);
        this.io.to(socketId).emit('rental_status_changed', {
          rentalId,
          status
        });
      }
    }
  }
}

module.exports = WebSocketService;
