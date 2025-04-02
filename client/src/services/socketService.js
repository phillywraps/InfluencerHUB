import { io } from 'socket.io-client';
import store from '../redux/store';
import { addMessage } from '../redux/slices/messageSlice';
import { addNotification } from '../redux/slices/notificationSlice';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.isAuthenticated = false;
    this.typingTimeouts = new Map();
  }

  /**
   * Initialize socket connection
   */
  init() {
    if (this.socket) {
      return;
    }

    // Connect to the server
    const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    this.socket = io(baseUrl, {
      transports: ['websocket'],
      autoConnect: false,
    });

    // Set up event listeners
    this.setupEventListeners();
  }

  /**
   * Set up socket event listeners
   */
  setupEventListeners() {
    // Connection events
    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.isConnected = true;
      this.authenticate();
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
      this.isConnected = false;
      this.isAuthenticated = false;
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    // Authentication events
    this.socket.on('authenticated', (data) => {
      console.log('Socket authenticated:', data);
      this.isAuthenticated = true;
    });

    this.socket.on('authentication_error', (error) => {
      console.error('Socket authentication error:', error);
      this.isAuthenticated = false;
    });

    // Message events
    this.socket.on('new_message', (message) => {
      console.log('New message received:', message);
      store.dispatch(addMessage(message));
    });

    // Read status events
    this.socket.on('read_status_update', (data) => {
      console.log('Read status update:', data);
      // Update read status in the UI
      // This will be handled by the message slice
    });

    // Typing events
    this.socket.on('typing', (data) => {
      console.log('User typing:', data);
      // Update typing indicator in the UI
      // This will be handled by the component
      const event = new CustomEvent('user_typing', { detail: data });
      window.dispatchEvent(event);
    });

    this.socket.on('stop_typing', (data) => {
      console.log('User stopped typing:', data);
      // Update typing indicator in the UI
      // This will be handled by the component
      const event = new CustomEvent('user_stop_typing', { detail: data });
      window.dispatchEvent(event);
    });

    // User status events
    this.socket.on('user_status_change', (data) => {
      console.log('User status change:', data);
      // Update user status in the UI
      // This will be handled by the component
      const event = new CustomEvent('user_status_change', { detail: data });
      window.dispatchEvent(event);
    });
  }

  /**
   * Connect to the socket server
   */
  connect() {
    if (!this.socket) {
      this.init();
    }

    if (!this.isConnected) {
      this.socket.connect();
    }
  }

  /**
   * Disconnect from the socket server
   */
  disconnect() {
    if (this.socket && this.isConnected) {
      this.socket.disconnect();
    }
  }

  /**
   * Authenticate with the socket server
   */
  authenticate() {
    if (!this.socket || !this.isConnected || this.isAuthenticated) {
      return;
    }

    const token = localStorage.getItem('token');
    if (token) {
      this.socket.emit('authenticate', token);
    }
  }

  /**
   * Join a conversation room
   * @param {String} conversationId - Conversation ID
   */
  joinConversation(conversationId) {
    if (!this.socket || !this.isConnected || !this.isAuthenticated) {
      return;
    }

    this.socket.emit('join_conversation', conversationId);
  }

  /**
   * Leave a conversation room
   * @param {String} conversationId - Conversation ID
   */
  leaveConversation(conversationId) {
    if (!this.socket || !this.isConnected) {
      return;
    }

    this.socket.emit('leave_conversation', conversationId);
  }

  /**
   * Send typing indicator
   * @param {String} conversationId - Conversation ID
   */
  sendTypingIndicator(conversationId) {
    if (!this.socket || !this.isConnected || !this.isAuthenticated) {
      return;
    }

    // Clear existing timeout
    if (this.typingTimeouts.has(conversationId)) {
      clearTimeout(this.typingTimeouts.get(conversationId));
    }

    // Send typing event
    this.socket.emit('typing', { conversationId });

    // Set timeout to send stop typing event
    const timeout = setTimeout(() => {
      this.sendStopTypingIndicator(conversationId);
      this.typingTimeouts.delete(conversationId);
    }, 3000);

    this.typingTimeouts.set(conversationId, timeout);
  }

  /**
   * Send stop typing indicator
   * @param {String} conversationId - Conversation ID
   */
  sendStopTypingIndicator(conversationId) {
    if (!this.socket || !this.isConnected || !this.isAuthenticated) {
      return;
    }

    this.socket.emit('stop_typing', { conversationId });
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;
