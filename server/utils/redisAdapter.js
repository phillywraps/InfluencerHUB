let createAdapter, createClient;
try {
  createAdapter = require('@socket.io/redis-adapter').createAdapter;
  createClient = require('redis').createClient;
} catch (error) {
  // Redis adapter is optional - if not installed, we'll use in-memory adapter
}
const logger = require('../config/logger');

/**
 * Redis adapter configuration for Socket.io to enable horizontal scaling
 * across multiple server instances
 */
class RedisAdapter {
  constructor() {
    this.pubClient = null;
    this.subClient = null;
    this.adapter = null;
    this.isConnected = false;
    this.connectionPromise = null;
  }

  /**
   * Connect to Redis and create adapter
   * @returns {Promise<object>} Promise that resolves to the Redis adapter
   */
  async connect() {
    // If Redis adapter is not installed or not enabled in environment, return null
    if (!createAdapter || !createClient || process.env.USE_REDIS_ADAPTER !== 'true') {
      logger.info('Redis adapter is not enabled or not installed, using in-memory adapter');
      return null;
    }

    // If already connected or connecting, return existing promise
    if (this.isConnected) {
      return this.adapter;
    }

    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = new Promise(async (resolve, reject) => {
      try {
        // Get Redis URL from environment or use default
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
        
        // Create Redis pub/sub clients
        this.pubClient = createClient({ url: redisUrl });
        this.subClient = this.pubClient.duplicate();
        
        // Handle connection events
        this.pubClient.on('error', (error) => {
          logger.error(`Redis Pub Client Error: ${error.message}`);
        });
        
        this.subClient.on('error', (error) => {
          logger.error(`Redis Sub Client Error: ${error.message}`);
        });
        
        // Connect to Redis
        await this.pubClient.connect();
        await this.subClient.connect();
        
        // Create the adapter
        this.adapter = createAdapter(this.pubClient, this.subClient);
        this.isConnected = true;
        
        logger.info('Redis adapter for Socket.io connected successfully');
        resolve(this.adapter);
      } catch (error) {
        logger.error(`Redis adapter connection error: ${error.message}`);
        this.connectionPromise = null;
        reject(error);
      }
    });

    return this.connectionPromise;
  }

  /**
   * Disconnect from Redis
   */
  async disconnect() {
    if (!createAdapter || !createClient) {
      return;
    }
    
    if (this.pubClient) {
      await this.pubClient.quit();
      this.pubClient = null;
    }
    
    if (this.subClient) {
      await this.subClient.quit();
      this.subClient = null;
    }
    
    this.adapter = null;
    this.isConnected = false;
    this.connectionPromise = null;
    
    logger.info('Redis adapter for Socket.io disconnected');
  }

  /**
   * Get the Redis adapter
   * @returns {Promise<object|null>} Promise that resolves to the Redis adapter or null if not enabled
   */
  async getAdapter() {
    if (!createAdapter || !createClient || process.env.USE_REDIS_ADAPTER !== 'true') {
      logger.info('Redis adapter is not enabled or not installed, using in-memory adapter');
      return null;
    }
    
    try {
      if (!this.adapter) {
        await this.connect();
      }
      return this.adapter;
    } catch (error) {
      logger.error(`Failed to get Redis adapter: ${error.message}`);
      return null;
    }
  }
  
  /**
   * Create a Redis client for pub/sub operations
   * This can be used for sending messages to specific channels
   * @returns {Promise<object|null>} Promise that resolves to a Redis client or null if not enabled
   */
  async createPubSubClient() {
    if (!createAdapter || !createClient || process.env.USE_REDIS_ADAPTER !== 'true') {
      logger.info('Redis adapter is not enabled or not installed, cannot create pub/sub client');
      return null;
    }
    
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      const client = createClient({ url: redisUrl });
      
      client.on('error', (error) => {
        logger.error(`Redis Client Error: ${error.message}`);
      });
      
      await client.connect();
      return client;
    } catch (error) {
      logger.error(`Failed to create Redis pub/sub client: ${error.message}`);
      return null;
    }
  }
}

// Create singleton instance
const redisAdapter = new RedisAdapter();

module.exports = redisAdapter;
