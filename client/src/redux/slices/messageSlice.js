import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { messageAPI } from '../../services/api';

// Get all conversations
export const getConversations = createAsyncThunk(
  'message/getConversations',
  async (_, { rejectWithValue }) => {
    try {
      const response = await messageAPI.getConversations();
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get conversations');
    }
  }
);

// Get or create conversation with a user
export const getOrCreateConversation = createAsyncThunk(
  'message/getOrCreateConversation',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await messageAPI.getOrCreateConversation(userId);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get conversation');
    }
  }
);

// Get messages in a conversation
export const getMessages = createAsyncThunk(
  'message/getMessages',
  async ({ conversationId, params }, { rejectWithValue }) => {
    try {
      const response = await messageAPI.getMessages(conversationId, params);
      return {
        conversationId,
        ...response.data,
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get messages');
    }
  }
);

// Send a message
export const sendMessage = createAsyncThunk(
  'message/sendMessage',
  async ({ conversationId, messageData }, { rejectWithValue }) => {
    try {
      const response = await messageAPI.sendMessage(conversationId, messageData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to send message');
    }
  }
);

// Mark message as read
export const markMessageAsRead = createAsyncThunk(
  'message/markMessageAsRead',
  async (messageId, { rejectWithValue }) => {
    try {
      const response = await messageAPI.markMessageAsRead(messageId);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to mark message as read');
    }
  }
);

const initialState = {
  conversations: [],
  currentConversation: null,
  messages: [],
  loading: false,
  error: null,
  totalPages: 0,
  currentPage: 1,
};

const messageSlice = createSlice({
  name: 'message',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentConversation: (state) => {
      state.currentConversation = null;
      state.messages = [];
    },
    addMessage: (state, action) => {
      state.messages.unshift(action.payload);
      
      // Update the last message in the current conversation
      if (state.currentConversation && state.currentConversation._id === action.payload.conversationId) {
        state.currentConversation.lastMessage = {
          content: action.payload.content,
          senderId: action.payload.senderId,
          timestamp: action.payload.createdAt,
        };
      }
      
      // Update the last message in the conversations list
      const conversationIndex = state.conversations.findIndex(
        (conversation) => conversation._id === action.payload.conversationId
      );
      
      if (conversationIndex !== -1) {
        state.conversations[conversationIndex].lastMessage = {
          content: action.payload.content,
          senderId: action.payload.senderId,
          timestamp: action.payload.createdAt,
        };
        
        // Move the conversation to the top of the list
        const conversation = state.conversations[conversationIndex];
        state.conversations.splice(conversationIndex, 1);
        state.conversations.unshift(conversation);
      }
    },
    resetPagination: (state) => {
      state.currentPage = 1;
      state.messages = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Get Conversations
      .addCase(getConversations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getConversations.fulfilled, (state, action) => {
        state.loading = false;
        state.conversations = action.payload;
      })
      .addCase(getConversations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Get or Create Conversation
      .addCase(getOrCreateConversation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getOrCreateConversation.fulfilled, (state, action) => {
        state.loading = false;
        state.currentConversation = action.payload;
        
        // Check if conversation already exists in the list
        const conversationExists = state.conversations.some(
          (conversation) => conversation._id === action.payload._id
        );
        
        if (!conversationExists) {
          state.conversations.unshift(action.payload);
        }
      })
      .addCase(getOrCreateConversation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Get Messages
      .addCase(getMessages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getMessages.fulfilled, (state, action) => {
        state.loading = false;
        
        // If it's the first page, replace messages, otherwise append
        if (action.payload.currentPage === 1) {
          state.messages = action.payload.data;
        } else {
          state.messages = [...state.messages, ...action.payload.data];
        }
        
        state.totalPages = action.payload.totalPages;
        state.currentPage = action.payload.currentPage;
        
        // Mark conversation as read in the list
        const conversationIndex = state.conversations.findIndex(
          (conversation) => conversation._id === action.payload.conversationId
        );
        
        if (conversationIndex !== -1) {
          state.conversations[conversationIndex].isRead = true;
        }
      })
      .addCase(getMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Send Message
      .addCase(sendMessage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.loading = false;
        state.messages.unshift(action.payload);
        
        // Update the last message in the current conversation
        if (state.currentConversation) {
          state.currentConversation.lastMessage = {
            content: action.payload.content,
            senderId: action.payload.senderId,
            timestamp: action.payload.createdAt,
          };
        }
        
        // Update the last message in the conversations list
        const conversationIndex = state.conversations.findIndex(
          (conversation) => conversation._id === action.payload.conversationId
        );
        
        if (conversationIndex !== -1) {
          state.conversations[conversationIndex].lastMessage = {
            content: action.payload.content,
            senderId: action.payload.senderId,
            timestamp: action.payload.createdAt,
          };
          
          // Move the conversation to the top of the list
          const conversation = state.conversations[conversationIndex];
          state.conversations.splice(conversationIndex, 1);
          state.conversations.unshift(conversation);
        }
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Mark Message as Read
      .addCase(markMessageAsRead.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(markMessageAsRead.fulfilled, (state, action) => {
        state.loading = false;
        
        // Update the message in the messages list
        const messageIndex = state.messages.findIndex(
          (message) => message._id === action.payload._id
        );
        
        if (messageIndex !== -1) {
          state.messages[messageIndex].readStatus = action.payload.readStatus;
        }
      })
      .addCase(markMessageAsRead.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearCurrentConversation, addMessage, resetPagination } =
  messageSlice.actions;

export default messageSlice.reducer;
