const redis = require('redis');
const logger = require('../config/logger');
const Message = require('../models/messageModel');
const Conversation = require('../models/conversationModel');

/**
 * Service for caching message data and optimizing message operations
 * Uses Redis for caching when available, falls back to in-memory cache
 */
class MessageCacheService {
  constructor() {
    this.redisClient = null;
    this.inMemoryCache = new Map();
    this.isConnected = false;
    this.useRedis = process.env.USE_REDIS_CACHE === 'true';
    this.connectionPromise = null;
    this.conversationLastReadTimestamps = new Map();
    this.unreadCountCache = new Map();
    
    // Initialize Redis if enabled
    if (this.useRedis) {
      this.initRedis();
    }
  }

  /**
   * Initialize Redis client
   */
  async initRedis() {
    if (this.redisClient || this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = new Promise(async (resolve, reject) => {
      try {
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
        this.redisClient = redis.createClient({ url: redisUrl });
        
        this.redisClient.on('error', (error) => {
          logger.error(`Redis Cache Client Error: ${error.message}`);
          if (this.isConnected) {
            this.isConnected = false;
            logger.info('Falling back to in-memory cache');
          }
        });
        
        this.redisClient.on('connect', () => {
          logger.info('Connected to Redis for message caching');
          this.isConnected = true;
        });
        
        await this.redisClient.connect();
        resolve(this.redisClient);
      } catch (error) {
        logger.error(`Error connecting to Redis for caching: ${error.message}`);
        logger.info('Falling back to in-memory cache');
        this.useRedis = false;
        reject(error);
      }
    });

    return this.connectionPromise;
  }

  /**
   * Close the Redis connection
   */
  async close() {
    if (this.redisClient) {
      await this.redisClient.quit();
      this.redisClient = null;
      this.isConnected = false;
    }
  }

  /**
   * Cache a message in Redis or in-memory
   * @param {Object} message - Message object to cache
   */
  async cacheMessage(message) {
    const messageKey = `message:${message._id}`;
    const conversationKey = `conversation:${message.conversationId}:messages`;
    
    try {
      const messageData = JSON.stringify(message);
      
      if (this.useRedis && this.isConnected) {
        // Store message data
        await this.redisClient.set(messageKey, messageData);
        // Set expiration (24 hours)
        await this.redisClient.expire(messageKey, 86400);
        // Add to conversation's message list
        await this.redisClient.lPush(conversationKey, message._id.toString());
        // Set list expiration
        await this.redisClient.expire(conversationKey, 86400);
      } else {
        // In-memory fallback
        this.inMemoryCache.set(messageKey, messageData);
        
        if (!this.inMemoryCache.has(conversationKey)) {
          this.inMemoryCache.set(conversationKey, []);
        }
        
        const conversationMessages = this.inMemoryCache.get(conversationKey);
        conversationMessages.unshift(message._id.toString());
        this.inMemoryCache.set(conversationKey, conversationMessages);
      }
    } catch (error) {
      logger.error(`Error caching message: ${error.message}`);
    }
  }

  /**
   * Get a message from cache or database
   * @param {string} messageId - ID of the message to get
   * @returns {Object} Message object
   */
  async getMessage(messageId) {
    const messageKey = `message:${messageId}`;
    
    try {
      // Try to get from cache first
      let cachedMessage;
      
      if (this.useRedis && this.isConnected) {
        cachedMessage = await this.redisClient.get(messageKey);
      } else {
        cachedMessage = this.inMemoryCache.get(messageKey);
      }
      
      if (cachedMessage) {
        return typeof cachedMessage === 'string'
          ? JSON.parse(cachedMessage)
          : cachedMessage;
      }
      
      // Not in cache, get from database
      const message = await Message.findById(messageId);
      
      if (message) {
        // Cache for future use
        await this.cacheMessage(message);
        return message;
      }
      
      return null;
    } catch (error) {
      logger.error(`Error getting message from cache: ${error.message}`);
      return null;
    }
  }

  /**
   * Get recent messages for a conversation from cache or database
   * @param {string} conversationId - ID of the conversation
   * @param {number} limit - Maximum number of messages to get
   * @returns {Array} Array of message objects
   */
  async getRecentMessages(conversationId, limit = 20) {
    const conversationKey = `conversation:${conversationId}:messages`;
    
    try {
      let messageIds = [];
      
      // Try to get message IDs from cache
      if (this.useRedis && this.isConnected) {
        messageIds = await this.redisClient.lRange(conversationKey, 0, limit - 1);
      } else if (this.inMemoryCache.has(conversationKey)) {
        const cachedIds = this.inMemoryCache.get(conversationKey);
        messageIds = cachedIds.slice(0, limit);
      }
      
      // If message IDs are in cache, get messages
      if (messageIds.length > 0) {
        const messages = await Promise.all(
          messageIds.map(id => this.getMessage(id))
        );
        
        return messages.filter(message => message !== null);
      }
      
      // Not in cache, get from database
      const messages = await Message.find({ conversationId })
        .sort({ createdAt: -1 })
        .limit(limit);
      
      // Cache for future use
      for (const message of messages) {
        await this.cacheMessage(message);
      }
      
      return messages;
    } catch (error) {
      logger.error(`Error getting recent messages from cache: ${error.message}`);
      return [];
    }
  }

  /**
   * Track the last read timestamp for a user in a conversation
   * @param {string} conversationId - ID of the conversation
   * @param {string} userId - ID of the user
   * @param {Date} timestamp - Timestamp of the last read message
   */
  async trackLastRead(conversationId, userId, timestamp = new Date()) {
    const key = `conversation:${conversationId}:lastread`;
    
    try {
      if (this.useRedis && this.isConnected) {
        await this.redisClient.hSet(key, userId, timestamp.getTime());
        await this.redisClient.expire(key, 86400 * 7); // 7 days
      } else {
        if (!this.conversationLastReadTimestamps.has(conversationId)) {
          this.conversationLastReadTimestamps.set(conversationId, new Map());
        }
        
        const userMap = this.conversationLastReadTimestamps.get(conversationId);
        userMap.set(userId, timestamp.getTime());
      }
      
      // Invalidate unread count cache for this user and conversation
      this.invalidateUnreadCount(conversationId, userId);
    } catch (error) {
      logger.error(`Error tracking last read: ${error.message}`);
    }
  }

  /**
   * Get the last read timestamp for a user in a conversation
   * @param {string} conversationId - ID of the conversation
   * @param {string} userId - ID of the user
   * @returns {Date|null} Last read timestamp or null if not found
   */
  async getLastRead(conversationId, userId) {
    const key = `conversation:${conversationId}:lastread`;
    
    try {
      let timestamp;
      
      if (this.useRedis && this.isConnected) {
        timestamp = await this.redisClient.hGet(key, userId);
      } else {
        if (this.conversationLastReadTimestamps.has(conversationId)) {
          const userMap = this.conversationLastReadTimestamps.get(conversationId);
          timestamp = userMap.get(userId);
        }
      }
      
      return timestamp ? new Date(parseInt(timestamp)) : null;
    } catch (error) {
      logger.error(`Error getting last read: ${error.message}`);
      return null;
    }
  }

  /**
   * Get all last read timestamps for a conversation
   * @param {string} conversationId - ID of the conversation
   * @returns {Object} Map of user IDs to last read timestamps
   */
  async getAllLastRead(conversationId) {
    const key = `conversation:${conversationId}:lastread`;
    const result = {};
    
    try {
      if (this.useRedis && this.isConnected) {
        const data = await this.redisClient.hGetAll(key);
        
        for (const [userId, timestamp] of Object.entries(data)) {
          result[userId] = new Date(parseInt(timestamp));
        }
      } else {
        if (this.conversationLastReadTimestamps.has(conversationId)) {
          const userMap = this.conversationLastReadTimestamps.get(conversationId);
          
          for (const [userId, timestamp] of userMap.entries()) {
            result[userId] = new Date(timestamp);
          }
        }
      }
      
      return result;
    } catch (error) {
      logger.error(`Error getting all last read: ${error.message}`);
      return {};
    }
  }

  /**
   * Invalidate the unread count cache for a user in a conversation
   * @param {string} conversationId - ID of the conversation
   * @param {string} userId - ID of the user
   */
  invalidateUnreadCount(conversationId, userId) {
    const key = `${conversationId}:${userId}`;
    
    if (this.useRedis && this.isConnected) {
      this.redisClient.del(`unread:${key}`).catch(err => {
        logger.error(`Error invalidating unread count: ${err.message}`);
      });
    } else {
      this.unreadCountCache.delete(key);
    }
  }

  /**
   * Get the unread count for a user in a conversation
   * @param {string} conversationId - ID of the conversation
   * @param {string} userId - ID of the user
   * @returns {number} Number of unread messages
   */
  async getUnreadCount(conversationId, userId) {
    const key = `${conversationId}:${userId}`;
    
    try {
      // Check cache first
      let cachedCount;
      
      if (this.useRedis && this.isConnected) {
        cachedCount = await this.redisClient.get(`unread:${key}`);
      } else {
        cachedCount = this.unreadCountCache.get(key);
      }
      
      if (cachedCount !== undefined && cachedCount !== null) {
        return parseInt(cachedCount);
      }
      
      // Get last read timestamp
      const lastRead = await this.getLastRead(conversationId, userId);
      
      // Query for unread count
      const query = {
        conversationId,
        'sender.userId': { $ne: userId },
      };
      
      if (lastRead) {
        query.createdAt = { $gt: lastRead };
      }
      
      const count = await Message.countDocuments(query);
      
      // Cache the result (5 minutes expiration)
      if (this.useRedis && this.isConnected) {
        await this.redisClient.set(`unread:${key}`, count.toString(), { EX: 300 });
      } else {
        this.unreadCountCache.set(key, count);
      }
      
      return count;
    } catch (error) {
      logger.error(`Error getting unread count: ${error.message}`);
      return 0;
    }
  }

  /**
   * Get unread counts for all conversations for a user
   * @param {string} userId - ID of the user
   * @returns {Object} Map of conversation IDs to unread counts
   */
  async getAllUnreadCounts(userId) {
    try {
      // Get all conversations for this user
      const conversations = await Conversation.find({
        'participants.userId': userId
      });
      
      const result = {};
      
      // Get unread count for each conversation
      for (const conversation of conversations) {
        const count = await this.getUnreadCount(conversation._id, userId);
        result[conversation._id] = count;
      }
      
      return result;
    } catch (error) {
      logger.error(`Error getting all unread counts: ${error.message}`);
      return {};
    }
  }

  /**
   * Increment the unread count for a user in a conversation
   * Used when a new message is received
   * @param {string} conversationId - ID of the conversation
   * @param {string} senderId - ID of the message sender
   * @param {Array} recipientIds - IDs of the recipients
   */
  async incrementUnreadCount(conversationId, senderId, recipientIds) {
    for (const recipientId of recipientIds) {
      // Skip the sender
      if (recipientId === senderId) continue;
      
      const key = `${conversationId}:${recipientId}`;
      
      try {
        if (this.useRedis && this.isConnected) {
          // Increment count or set to 1 if not exists
          await this.redisClient.incrBy(`unread:${key}`, 1);
          // Set expiration (5 minutes)
          await this.redisClient.expire(`unread:${key}`, 300);
        } else {
          const currentCount = this.unreadCountCache.get(key) || 0;
          this.unreadCountCache.set(key, currentCount + 1);
        }
      } catch (error) {
        logger.error(`Error incrementing unread count: ${error.message}`);
      }
    }
  }

  /**
   * Reset the unread count for a user in a conversation
   * @param {string} conversationId - ID of the conversation
   * @param {string} userId - ID of the user
   */
  async resetUnreadCount(conversationId, userId) {
    const key = `${conversationId}:${userId}`;
    
    try {
      if (this.useRedis && this.isConnected) {
        await this.redisClient.set(`unread:${key}`, '0', { EX: 300 });
      } else {
        this.unreadCountCache.set(key, 0);
      }
      
      // Update last read timestamp
      await this.trackLastRead(conversationId, userId);
    } catch (error) {
      logger.error(`Error resetting unread count: ${error.message}`);
    }
  }
}

// Create singleton instance
const messageCacheService = new MessageCacheService();

module.exports = messageCacheService;
