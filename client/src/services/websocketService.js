import { useEffect, useRef, useState, useCallback } from 'react';

// WebSocket connection URL - this should be configured based on environment
const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:5000';

/**
 * WebSocket service for connecting to the server's WebSocket endpoints
 */
class WebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectTimeout = null;
    this.listeners = new Map();
    this.connectPromise = null;
    this.reconnectInterval = 2000; // Start with 2 seconds
    this.events = {};
  }

  /**
   * Initialize and connect to the WebSocket server
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
          this.socket.close();
          this.socket = null;
        }

        // Create a new WebSocket connection with the auth token
        const url = `${WS_URL}${token ? `?token=${token}` : ''}`;
        this.socket = new WebSocket(url);

        // Set up event handlers
        this.socket.onopen = () => {
          console.log('WebSocket connected');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.reconnectInterval = 2000; // Reset reconnect interval
          resolve();
          this.connectPromise = null;
        };

        this.socket.onclose = (event) => {
          console.log(`WebSocket disconnected: ${event.code} ${event.reason}`);
          this.isConnected = false;
          this.handleReconnect();
          // Don't reject here to avoid unhandled promise rejection
        };

        this.socket.onerror = (error) => {
          console.error('WebSocket error:', error);
          if (!this.isConnected) {
            reject(error);
            this.connectPromise = null;
          }
        };

        this.socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };
      });
    }

    return this.connectPromise;
  }

  /**
   * Handle reconnection logic with exponential backoff
   */
  handleReconnect() {
    // Clear any existing timeout
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    // Check if we should try to reconnect
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(30000, this.reconnectInterval * Math.pow(1.5, this.reconnectAttempts - 1));
      
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms`);
      
      this.reconnectTimeout = setTimeout(() => {
        // Get token from localStorage to maintain authentication
        const token = localStorage.getItem('token');
        this.connect(token);
      }, delay);
    } else {
      console.error('Max reconnect attempts reached. WebSocket connection failed.');
    }
  }

  /**
   * Disconnect from the WebSocket server
   */
  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      this.isConnected = false;
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    this.listeners.clear();
  }

  /**
   * Send a message to the WebSocket server
   * @param {string} type - Message type
   * @param {object} data - Message data
   * @returns {boolean} Success status
   */
  send(type, data = {}) {
    if (!this.socket || !this.isConnected) {
      console.error('Cannot send message: WebSocket is not connected');
      return false;
    }

    const message = JSON.stringify({
      type,
      data,
      timestamp: new Date().toISOString(),
    });

    try {
      this.socket.send(message);
      return true;
    } catch (error) {
      console.error('Error sending WebSocket message:', error);
      return false;
    }
  }

  /**
   * Handle incoming WebSocket messages
   * @param {object} message - Message object from server
   */
  handleMessage(message) {
    const { type, data } = message;
    
    // Notify all listeners for this event type
    if (this.listeners.has(type)) {
      const listeners = this.listeners.get(type);
      listeners.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in WebSocket listener for '${type}':`, error);
        }
      });
    }
  }

  /**
   * Subscribe to a specific message type
   * @param {string} type - Message type to subscribe to
   * @param {function} callback - Callback function to execute when message is received
   * @returns {function} Unsubscribe function
   */
  subscribe(type, callback) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }

    const listeners = this.listeners.get(type);
    listeners.add(callback);

    // Return unsubscribe function
    return () => {
      if (this.listeners.has(type)) {
        const listeners = this.listeners.get(type);
        listeners.delete(callback);
        
        if (listeners.size === 0) {
          this.listeners.delete(type);
        }
      }
    };
  }

  /**
   * Subscribe to multiple message types
   * @param {object} subscriptions - Map of event types to callbacks
   * @returns {function} Unsubscribe function for all subscriptions
   */
  subscribeToMany(subscriptions) {
    const unsubscribers = Object.entries(subscriptions).map(
      ([type, callback]) => this.subscribe(type, callback)
    );

    // Return a function that unsubscribes from all
    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }

  /**
   * Request data from the server through WebSocket
   * @param {string} dataType - Type of data to request
   * @param {object} params - Request parameters
   */
  requestData(dataType, params = {}) {
    return this.send('data_request', {
      dataType,
      params,
    });
  }
}

// Create a singleton instance
const websocketService = new WebSocketService();

/**
 * React hook for using WebSocket in components
 * @param {Array} eventTypes - Array of event types to subscribe to
 * @param {Object} handlers - Map of event types to handler functions
 * @returns {Object} WebSocket state and methods
 */
export const useWebSocket = (eventTypes = [], handlers = {}) => {
  const [isConnected, setIsConnected] = useState(websocketService.isConnected);
  const [lastMessage, setLastMessage] = useState(null);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  // Subscribe to connection events and websocket events on mount
  useEffect(() => {
    // Update connection state when websocket connects/disconnects
    const connectionHandler = (connected) => {
      setIsConnected(connected);
    };

    // Handle incoming messages for specified event types
    const messageHandlers = {};
    eventTypes.forEach((type) => {
      messageHandlers[type] = (data) => {
        // Call the handler if provided
        if (handlersRef.current[type]) {
          handlersRef.current[type](data);
        }
        
        // Update last message state
        setLastMessage({ type, data, timestamp: new Date() });
      };
    });

    // Subscribe to all events
    const unsubscribers = [];
    Object.entries(messageHandlers).forEach(([type, handler]) => {
      unsubscribers.push(websocketService.subscribe(type, handler));
    });

    // Connect to WebSocket if not already connected
    const token = localStorage.getItem('token');
    websocketService.connect(token).catch((error) => {
      console.error('Failed to connect to WebSocket:', error);
    });

    // Clean up subscriptions on unmount
    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [eventTypes]); // Re-run if event types change

  // Request data function
  const requestData = useCallback((dataType, params = {}) => {
    return websocketService.requestData(dataType, params);
  }, []);

  // Send message function
  const sendMessage = useCallback((type, data = {}) => {
    return websocketService.send(type, data);
  }, []);

  return {
    isConnected,
    lastMessage,
    requestData,
    sendMessage,
    connect: websocketService.connect.bind(websocketService),
    disconnect: websocketService.disconnect.bind(websocketService),
  };
};

// Export the service and hook
export default websocketService;
