const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const Conversation = require('../models/conversationModel');
const Message = require('../models/messageModel');
const notificationService = require('./notificationService');

/**
 * Socket Service - Handles real-time communication
 */
class SocketService {
  constructor(server) {
    this.io = socketIO(server, {
      cors: {
        origin: process.env.CLIENT_URL || '*',
        methods: ['GET', 'POST'],
        credentials: true
      }
    });
    
    this.userSockets = new Map(); // Map of userId -> socketId
    this.socketUsers = new Map(); // Map of socketId -> userId
    
    this.setupSocketHandlers();
  }
  
  /**
   * Set up socket event handlers
   */
  setupSocketHandlers() {
    this.io.on('connection', async (socket) => {
      console.log(`New socket connection: ${socket.id}`);
      
      // Authenticate user
      socket.on('authenticate', async (token) => {
        try {
          // Verify JWT token
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          const userId = decoded.id;
          
          // Get user from database
          const user = await User.findById(userId);
          
          if (!user) {
            socket.emit('authentication_error', 'User not found');
            return;
          }
          
          // Store user socket mapping
          this.userSockets.set(userId, socket.id);
          this.socketUsers.set(socket.id, userId);
          
          console.log(`User ${userId} authenticated on socket ${socket.id}`);
          
          // Join user's room for private messages
          socket.join(`user:${userId}`);
          
          // Get user's conversations
          const conversations = await Conversation.find({
            participants: userId
          });
          
          // Join conversation rooms
          conversations.forEach(conversation => {
            socket.join(`conversation:${conversation._id}`);
          });
          
          socket.emit('authenticated', { userId });
          
          // Update user's online status
          this.io.emit('user_status_change', {
            userId,
            status: 'online'
          });
        } catch (error) {
          console.error('Socket authentication error:', error);
          socket.emit('authentication_error', 'Invalid token');
        }
      });
      
      // Handle disconnect
      socket.on('disconnect', () => {
        const userId = this.socketUsers.get(socket.id);
        
        if (userId) {
          console.log(`User ${userId} disconnected from socket ${socket.id}`);
          
          // Remove socket mappings
          this.userSockets.delete(userId);
          this.socketUsers.delete(socket.id);
          
          // Update user's online status
          this.io.emit('user_status_change', {
            userId,
            status: 'offline'
          });
        }
      });
      
      // Handle joining a conversation
      socket.on('join_conversation', async (conversationId) => {
        const userId = this.socketUsers.get(socket.id);
        
        if (!userId) {
          socket.emit('error', 'Not authenticated');
          return;
        }
        
        // Check if user is a participant in the conversation
        const conversation = await Conversation.findOne({
          _id: conversationId,
          participants: userId
        });
        
        if (!conversation) {
          socket.emit('error', 'Not authorized to join this conversation');
          return;
        }
        
        socket.join(`conversation:${conversationId}`);
        console.log(`User ${userId} joined conversation ${conversationId}`);
      });
      
      // Handle leaving a conversation
      socket.on('leave_conversation', (conversationId) => {
        socket.leave(`conversation:${conversationId}`);
        
        const userId = this.socketUsers.get(socket.id);
        if (userId) {
          console.log(`User ${userId} left conversation ${conversationId}`);
        }
      });
      
      // Handle typing indicator
      socket.on('typing', async (data) => {
        const { conversationId } = data;
        const userId = this.socketUsers.get(socket.id);
        
        if (!userId) {
          socket.emit('error', 'Not authenticated');
          return;
        }
        
        // Broadcast typing indicator to other participants
        socket.to(`conversation:${conversationId}`).emit('typing', {
          conversationId,
          userId
        });
      });
      
      // Handle stop typing indicator
      socket.on('stop_typing', async (data) => {
        const { conversationId } = data;
        const userId = this.socketUsers.get(socket.id);
        
        if (!userId) {
          socket.emit('error', 'Not authenticated');
          return;
        }
        
        // Broadcast stop typing indicator to other participants
        socket.to(`conversation:${conversationId}`).emit('stop_typing', {
          conversationId,
          userId
        });
      });
    });
  }
  
  /**
   * Send a message to a specific user
   * @param {String} userId - User ID
   * @param {String} event - Event name
   * @param {Object} data - Event data
   */
  sendToUser(userId, event, data) {
    const socketId = this.userSockets.get(userId);
    
    if (socketId) {
      this.io.to(socketId).emit(event, data);
    }
  }
  
  /**
   * Send a message to a conversation
   * @param {String} conversationId - Conversation ID
   * @param {String} event - Event name
   * @param {Object} data - Event data
   */
  sendToConversation(conversationId, event, data) {
    this.io.to(`conversation:${conversationId}`).emit(event, data);
  }
  
  /**
   * Broadcast a new message to conversation participants
   * @param {Object} message - Message object
   * @param {Object} conversation - Conversation object
   */
  async broadcastNewMessage(message, conversation) {
    // Send message to conversation room
    this.sendToConversation(conversation._id, 'new_message', message);
    
    // Send notification to offline participants
    const offlineParticipants = conversation.participants.filter(
      participantId => !this.userSockets.has(participantId.toString()) && 
                       participantId.toString() !== message.senderId.toString()
    );
    
    // Get sender info
    const sender = await User.findById(message.senderId).select('username profile');
    
    // Create notifications for offline participants
    for (const participantId of offlineParticipants) {
      await notificationService.createNotification({
        userId: participantId,
        type: 'new_message',
        title: 'New Message',
        message: `${sender.profile?.name || sender.username}: ${message.content.substring(0, 50)}${message.content.length > 50 ? '...' : ''}`,
        data: {
          conversationId: conversation._id,
          messageId: message._id,
          senderId: message.senderId
        },
        actionLink: `/messages/${message.senderId}`,
        actionText: 'View Message'
      });
    }
  }
  
  /**
   * Update conversation read status
   * @param {String} conversationId - Conversation ID
   * @param {String} userId - User ID
   */
  updateReadStatus(conversationId, userId) {
    this.sendToConversation(conversationId, 'read_status_update', {
      conversationId,
      userId,
      timestamp: new Date()
    });
  }
}

module.exports = SocketService;
