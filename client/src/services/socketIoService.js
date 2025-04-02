import { useEffect, useRef, useState, useCallback } from 'react';
import io from 'socket.io-client';

// Socket.io connection URL - this should be configured based on environment
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

/**
 * Socket.io service for connecting to the server's Socket.io endpoints
 */
class SocketIoService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.listeners = new Map();
    this.connectPromise = null;
  }

  /**
   * Initialize and connect to the Socket.io server
   * @param {string} token - Authentication token
   * @returns {Promise} Promise that resolves when connected
   */
  connect(token) {
    if (this.socket && this.isConnected) {
      return Promise.resolve();
    }

    // Only create a new promise if we don't have one in progress
    if (!this.connectPromise) {
      this.connectPromise = new Promise((resolve, reject) => {
        // Close any existing socket
        if (this.socket) {
          this.socket.disconnect();
          this.socket = null;
        }

        // Create a new Socket.io connection with the auth token
        this.socket = io(SOCKET_URL, {
          auth: { token },
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          timeout: 20000
        });

        // Set up event handlers
        this.socket.on('connect', () => {
          console.log('Socket.io connected');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          resolve();
          this.connectPromise = null;
          
          // Notify all connection listeners
          if (this.listeners.has('connection_status')) {
            const listeners = this.listeners.get('connection_status');
            listeners.forEach((callback) => callback(true));
          }
        });

        this.socket.on('disconnect', (reason) => {
          console.log(`Socket.io disconnected: ${reason}`);
          this.isConnected = false;
          
          // Notify all connection listeners
          if (this.listeners.has('connection_status')) {
            const listeners = this.listeners.get('connection_status');
            listeners.forEach((callback) => callback(false));
          }
        });

        this.socket.on('connect_error', (error) => {
          console.error('Socket.io connection error:', error);
          this.reconnectAttempts++;
          
          if (this.reconnectAttempts >= 5) {
            console.error('Max reconnect attempts reached. Socket.io connection failed.');
            reject(error);
            this.connectPromise = null;
          }
        });

        // Set up event handlers for message types
        this.setupMessageHandlers();
      });
    }

    return this.connectPromise;
  }

  /**
   * Set up handlers for all message types
   */
  setupMessageHandlers() {
    // Message received events
    this.socket.on('message_received', (data) => {
      this.notifyListeners('message_received', data);
    });

    // Message delivery confirmation
    this.socket.on('message_delivered', (data) => {
      this.notifyListeners('message_delivered', data);
    });

    // Message read receipt
    this.socket.on('messages_read', (data) => {
      this.notifyListeners('messages_read', data);
    });

    // Typing indicator
    this.socket.on('typing_indicator', (data) => {
      this.notifyListeners('typing_indicator', data);
    });

    // User presence (online/offline)
    this.socket.on('presence_changed', (data) => {
      this.notifyListeners('presence_changed', data);
    });

    // Conversation updates
    this.socket.on('conversation_updated', (data) => {
      this.notifyListeners('conversation_updated', data);
    });

    // Rental status changes
    this.socket.on('rental_status_changed', (data) => {
      this.notifyListeners('rental_status_changed', data);
    });

    // System notifications
    this.socket.on('system_notification', (data) => {
      this.notifyListeners('system_notification', data);
    });

    // Error events
    this.socket.on('error', (data) => {
      console.error('Socket.io error:', data);
      this.notifyListeners('error', data);
    });
  }

  /**
   * Notify all listeners of a specific event type
   * @param {string} eventType - Event type
   * @param {object} data - Event data
   */
  notifyListeners(eventType, data) {
    if (this.listeners.has(eventType)) {
      const listeners = this.listeners.get(eventType);
      listeners.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in Socket.io listener for '${eventType}':`, error);
        }
      });
    }
  }

  /**
   * Disconnect from the Socket.io server
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }

    this.listeners.clear();
  }

  /**
   * Join a conversation room to receive messages
   * @param {string} conversationId - ID of the conversation to join
   */
  joinConversation(conversationId) {
    if (!this.socket || !this.isConnected) {
      console.error('Cannot join conversation: Socket.io is not connected');
      return false;
    }

    this.socket.emit('join_conversation', { conversationId });
    return true;
  }

  /**
   * Leave a conversation room
   * @param {string} conversationId - ID of the conversation to leave
   */
  leaveConversation(conversationId) {
    if (!this.socket || !this.isConnected) {
      console.error('Cannot leave conversation: Socket.io is not connected');
      return false;
    }

    this.socket.emit('leave_conversation', { conversationId });
    return true;
  }

  /**
   * Send a message to a conversation
   * @param {string} conversationId - ID of the conversation
   * @param {string} text - Message text
   * @param {array} attachments - Optional attachments
   * @param {object} metadata - Optional metadata
   */
  sendMessage(conversationId, text, attachments = [], metadata = {}) {
    if (!this.socket || !this.isConnected) {
      console.error('Cannot send message: Socket.io is not connected');
      return false;
    }

    this.socket.emit('send_message', {
      conversationId,
      content: {
        type: 'text',
        text,
        attachments
      },
      metadata
    });

    return true;
  }

  /**
   * Mark messages as read
   * @param {string} conversationId - ID of the conversation
   * @param {array} messageIds - Optional array of message IDs, if empty will mark all as read
   */
  markMessagesAsRead(conversationId, messageIds = []) {
    if (!this.socket || !this.isConnected) {
      console.error('Cannot mark messages as read: Socket.io is not connected');
      return false;
    }

    this.socket.emit('mark_read', {
      conversationId,
      messageIds
    });

    return true;
  }

  /**
   * Send typing indicator
   * @param {string} conversationId - ID of the conversation
   * @param {boolean} isTyping - Whether the user is typing or stopped typing
   */
  sendTypingIndicator(conversationId, isTyping) {
    if (!this.socket || !this.isConnected) {
      console.error('Cannot send typing indicator: Socket.io is not connected');
      return false;
    }

    const eventName = isTyping ? 'typing_start' : 'typing_end';
    this.socket.emit(eventName, { conversationId });

    return true;
  }

  /**
   * Update presence status
   * @param {string} status - User's presence status (online, away, offline, etc.)
   */
  updatePresenceStatus(status) {
    if (!this.socket || !this.isConnected) {
      console.error('Cannot update presence: Socket.io is not connected');
      return false;
    }

    this.socket.emit('presence_update', { status });
    return true;
  }

  /**
   * Get online status for multiple users
   * @param {array} userIds - Array of user IDs
   * @returns {object} Map of user IDs to online status
   */
  getOnlineStatus(userIds) {
    const statuses = {};
    
    // If not connected, assume all offline
    if (!this.socket || !this.isConnected) {
      userIds.forEach(userId => {
        statuses[userId] = 'offline';
      });
      return statuses;
    }
    
    // Emit event to request online status
    this.socket.emit('get_online_status', { userIds });
    
    // The server will respond with an 'online_status' event
    // that will be handled by listeners
    return statuses;
  }

  /**
   * Subscribe to a specific event type
   * @param {string} eventType - Event type to subscribe to
   * @param {function} callback - Callback function when event occurs
   * @returns {function} Unsubscribe function
   */
  subscribe(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }

    const listeners = this.listeners.get(eventType);
    listeners.add(callback);

    // Return unsubscribe function
    return () => {
      if (this.listeners.has(eventType)) {
        const listeners = this.listeners.get(eventType);
        listeners.delete(callback);
        
        if (listeners.size === 0) {
          this.listeners.delete(eventType);
        }
      }
    };
  }

  /**
   * Subscribe to multiple event types
   * @param {object} subscriptions - Map of event types to callbacks
   * @returns {function} Unsubscribe function for all subscriptions
   */
  subscribeToMany(subscriptions) {
    const unsubscribers = Object.entries(subscriptions).map(
      ([eventType, callback]) => this.subscribe(eventType, callback)
    );

    // Return a function that unsubscribes from all
    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }
}

// Create a singleton instance
const socketIoService = new SocketIoService();

/**
 * React hook for using Socket.io in components
 * @param {Array} eventTypes - Array of event types to subscribe to
 * @param {Object} handlers - Map of event types to handler functions
 * @returns {Object} Socket state and methods
 */
export const useSocketIo = (eventTypes = [], handlers = {}) => {
  const [isConnected, setIsConnected] = useState(socketIoService.isConnected);
  const [lastEvent, setLastEvent] = useState(null);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  // Subscribe to connection events and socket.io events on mount
  useEffect(() => {
    // Update connection state when socket connects/disconnects
    const connectionHandler = (connected) => {
      setIsConnected(connected);
    };

    // Subscribe to connection status
    const unsubscribeConnection = socketIoService.subscribe(
      'connection_status',
      connectionHandler
    );

    // Handle incoming events for specified event types
    const eventHandlers = {};
    eventTypes.forEach((type) => {
      eventHandlers[type] = (data) => {
        // Call the handler if provided
        if (handlersRef.current[type]) {
          handlersRef.current[type](data);
        }
        
        // Update last event state
        setLastEvent({ type, data, timestamp: new Date() });
      };
    });

    // Subscribe to all events
    const unsubscribers = [];
    Object.entries(eventHandlers).forEach(([type, handler]) => {
      unsubscribers.push(socketIoService.subscribe(type, handler));
    });

    // Connect to Socket.io if not already connected
    const token = localStorage.getItem('token');
    socketIoService.connect(token).catch((error) => {
      console.error('Failed to connect to Socket.io:', error);
    });

    // Clean up subscriptions on unmount
    return () => {
      unsubscribeConnection();
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [eventTypes]); // Re-run if event types change

  // Helper methods wrapping the socketIoService
  const joinConversation = useCallback((conversationId) => {
    return socketIoService.joinConversation(conversationId);
  }, []);

  const leaveConversation = useCallback((conversationId) => {
    return socketIoService.leaveConversation(conversationId);
  }, []);

  const sendMessage = useCallback((conversationId, text, attachments = [], metadata = {}) => {
    return socketIoService.sendMessage(conversationId, text, attachments, metadata);
  }, []);

  const markAsRead = useCallback((conversationId, messageIds = []) => {
    return socketIoService.markMessagesAsRead(conversationId, messageIds);
  }, []);

  const sendTypingIndicator = useCallback((conversationId, isTyping) => {
    return socketIoService.sendTypingIndicator(conversationId, isTyping);
  }, []);

  return {
    isConnected,
    lastEvent,
    joinConversation,
    leaveConversation,
    sendMessage,
    markAsRead,
    sendTypingIndicator,
    connect: socketIoService.connect.bind(socketIoService),
    disconnect: socketIoService.disconnect.bind(socketIoService),
  };
};

// Export the service and hook
export default socketIoService;
