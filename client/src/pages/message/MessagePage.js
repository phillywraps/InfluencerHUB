import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import socketService from '../../services/socketService';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  IconButton,
  Badge,
  InputAdornment,
  CircularProgress,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PersonIcon from '@mui/icons-material/Person';
import MessageIcon from '@mui/icons-material/Message';
import {
  getConversations,
  getMessages,
  sendMessage,
  markAsRead,
} from '../../redux/slices/messageSlice';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';

const MessagePage = () => {
  const { userId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const {
    conversations,
    messages,
    currentConversation,
    loading,
    error,
    sendingMessage,
  } = useSelector((state) => state.message);
  const { user } = useSelector((state) => state.auth);

  const [messageText, setMessageText] = useState('');
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [typingUsers, setTypingUsers] = useState({});
  const typingTimeoutRef = useRef(null);

  // Load conversations on component mount
  useEffect(() => {
    dispatch(getConversations());
  }, [dispatch]);

  // Load messages when a conversation is selected
  useEffect(() => {
    if (userId) {
      dispatch(getMessages(userId))
        .unwrap()
        .then(() => {
          // Mark messages as read
          dispatch(markAsRead(userId));
          
          // Join conversation room for real-time updates
          if (currentConversation) {
            socketService.joinConversation(currentConversation._id);
          }
        });
    }
    
    // Clean up when leaving the conversation
    return () => {
      if (currentConversation) {
        socketService.leaveConversation(currentConversation._id);
      }
    };
  }, [dispatch, userId, currentConversation]);

  // Set selected conversation when userId changes
  useEffect(() => {
    if (userId && conversations.length > 0) {
      const conversation = conversations.find(
        (conv) => conv.participant._id === userId
      );
      setSelectedConversation(conversation || null);
    }
  }, [userId, conversations]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Set up socket event listeners for typing indicators
  useEffect(() => {
    // Handle typing indicator
    const handleTyping = (data) => {
      if (data.conversationId === currentConversation?._id) {
        setTypingUsers((prev) => ({
          ...prev,
          [data.userId]: true,
        }));
      }
    };
    
    // Handle stop typing indicator
    const handleStopTyping = (data) => {
      if (data.conversationId === currentConversation?._id) {
        setTypingUsers((prev) => {
          const newTypingUsers = { ...prev };
          delete newTypingUsers[data.userId];
          return newTypingUsers;
        });
      }
    };
    
    // Add event listeners
    window.addEventListener('user_typing', handleTyping);
    window.addEventListener('user_stop_typing', handleStopTyping);
    
    // Clean up
    return () => {
      window.removeEventListener('user_typing', handleTyping);
      window.removeEventListener('user_stop_typing', handleStopTyping);
    };
  }, [currentConversation]);

  // Handle send message
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    dispatch(sendMessage({ recipientId: userId, content: messageText }))
      .unwrap()
      .then(() => {
        setMessageText('');
      });
  };
  
  // Handle typing indicator
  const handleTyping = () => {
    if (currentConversation && messageText.trim()) {
      socketService.sendTypingIndicator(currentConversation._id);
    }
  };

  // Handle conversation click
  const handleConversationClick = (conversationUserId) => {
    navigate(`/messages/${conversationUserId}`);
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  // Show loading spinner if data is being loaded
  if (loading && !conversations.length) {
    return <LoadingSpinner />;
  }

  // Show error message if there's an error
  if (error && !conversations.length) {
    return (
      <ErrorMessage
        message="Failed to load messages"
        error={error}
        showRetryButton
        onRetry={() => {
          dispatch(getConversations());
        }}
      />
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ height: 'calc(100vh - 200px)', display: 'flex' }}>
        {/* Conversations List */}
        <Box
          sx={{
            width: 300,
            borderRight: 1,
            borderColor: 'divider',
            display: { xs: userId ? 'none' : 'block', md: 'block' },
          }}
        >
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="h6">Messages</Typography>
          </Box>
          <List sx={{ overflowY: 'auto', height: 'calc(100% - 56px)' }}>
            {conversations.length > 0 ? (
              conversations.map((conversation) => (
                <ListItem
                  key={conversation._id}
                  button
                  selected={userId === conversation.participant._id}
                  onClick={() => handleConversationClick(conversation.participant._id)}
                  divider
                >
                  <ListItemAvatar>
                    <Badge
                      color="primary"
                      variant="dot"
                      invisible={!conversation.unreadCount}
                    >
                      <Avatar src={conversation.participant.profile?.avatar}>
                        {conversation.participant.username.charAt(0).toUpperCase()}
                      </Avatar>
                    </Badge>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontWeight: conversation.unreadCount ? 'bold' : 'normal',
                        }}
                      >
                        {conversation.participant.profile?.name || conversation.participant.username}
                      </Typography>
                    }
                    secondary={
                      <Typography
                        variant="body2"
                        noWrap
                        sx={{
                          color: conversation.unreadCount ? 'text.primary' : 'text.secondary',
                          fontWeight: conversation.unreadCount ? 'medium' : 'normal',
                        }}
                      >
                        {conversation.lastMessage?.content || 'No messages yet'}
                      </Typography>
                    }
                  />
                  <Typography variant="caption" color="text.secondary">
                    {conversation.lastMessage
                      ? formatTimestamp(conversation.lastMessage.createdAt)
                      : ''}
                  </Typography>
                </ListItem>
              ))
            ) : (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <PersonIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
                <Typography variant="body1" color="text.secondary">
                  No conversations yet
                </Typography>
              </Box>
            )}
          </List>
        </Box>

        {/* Messages Area */}
        <Box
          sx={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            ...(userId
              ? { display: 'flex' }
              : { display: { xs: 'none', md: 'flex' } }),
          }}
        >
          {userId ? (
            <>
              {/* Conversation Header */}
              <Box
                sx={{
                  p: 2,
                  borderBottom: 1,
                  borderColor: 'divider',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <IconButton
                  sx={{ display: { xs: 'inline-flex', md: 'none' }, mr: 1 }}
                  onClick={() => navigate('/messages')}
                >
                  <ArrowBackIcon />
                </IconButton>
                {selectedConversation && (
                  <>
                    <Avatar
                      src={selectedConversation.participant.profile?.avatar}
                      sx={{ mr: 2 }}
                    >
                      {selectedConversation.participant.username.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1">
                        {selectedConversation.participant.profile?.name ||
                          selectedConversation.participant.username}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {selectedConversation.participant.userType === 'influencer'
                          ? 'Influencer'
                          : 'Advertiser'}
                      </Typography>
                    </Box>
                  </>
                )}
              </Box>

              {/* Messages List */}
              <Box
                sx={{
                  flexGrow: 1,
                  overflowY: 'auto',
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {messages.length > 0 ? (
                  messages.map((message, index) => {
                    const isCurrentUser = message.sender._id === user._id;
                    const showAvatar =
                      index === 0 ||
                      messages[index - 1].sender._id !== message.sender._id;

                    return (
                      <Box
                        key={message._id}
                        sx={{
                          display: 'flex',
                          justifyContent: isCurrentUser ? 'flex-end' : 'flex-start',
                          mb: 1,
                        }}
                      >
                        {!isCurrentUser && showAvatar && (
                          <Avatar
                            src={message.sender.profile?.avatar}
                            sx={{ mr: 1, width: 32, height: 32 }}
                          >
                            {message.sender.username.charAt(0).toUpperCase()}
                          </Avatar>
                        )}
                        <Box
                          sx={{
                            maxWidth: '70%',
                            ...(isCurrentUser
                              ? {
                                  bgcolor: 'primary.main',
                                  color: 'white',
                                  borderRadius: '16px 16px 0 16px',
                                }
                              : {
                                  bgcolor: 'grey.100',
                                  borderRadius: '16px 16px 16px 0',
                                }),
                            p: 2,
                            ...(showAvatar ? {} : { ml: isCurrentUser ? 0 : 5 }),
                          }}
                        >
                          <Typography variant="body1">{message.content}</Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              display: 'block',
                              textAlign: 'right',
                              mt: 0.5,
                              color: isCurrentUser ? 'rgba(255,255,255,0.7)' : 'text.secondary',
                            }}
                          >
                            {formatTimestamp(message.createdAt)}
                          </Typography>
                        </Box>
                        {isCurrentUser && showAvatar && (
                          <Avatar
                            src={message.sender.profile?.avatar}
                            sx={{ ml: 1, width: 32, height: 32 }}
                          >
                            {message.sender.username.charAt(0).toUpperCase()}
                          </Avatar>
                        )}
                      </Box>
                    );
                  })
                ) : (
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '100%',
                    }}
                  >
                    <MessageIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      No Messages Yet
                    </Typography>
                    <Typography variant="body1" color="text.secondary" align="center">
                      Send a message to start the conversation with{' '}
                      {selectedConversation?.participant.username}
                    </Typography>
                  </Box>
                )}
                <div ref={messagesEndRef} />
              </Box>

              {/* Typing Indicator */}
              {Object.keys(typingUsers).length > 0 && (
                <Box sx={{ px: 2, pb: 1 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    {selectedConversation?.participant.username} is typing...
                  </Typography>
                </Box>
              )}
              
              {/* Message Input */}
              <Box
                component="form"
                onSubmit={handleSendMessage}
                sx={{
                  p: 2,
                  borderTop: 1,
                  borderColor: 'divider',
                  display: 'flex',
                }}
              >
                <TextField
                  fullWidth
                  placeholder="Type a message..."
                  variant="outlined"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={handleTyping}
                  disabled={sendingMessage}
                  InputProps={{
                    endAdornment: sendingMessage && (
                      <InputAdornment position="end">
                        <CircularProgress size={20} />
                      </InputAdornment>
                    ),
                  }}
                />
                <Button
                  type="submit"
                  variant="contained"
                  sx={{ ml: 1 }}
                  disabled={!messageText.trim() || sendingMessage}
                >
                  <SendIcon />
                </Button>
              </Box>
            </>
          ) : (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
              }}
            >
              <MessageIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                Your Messages
              </Typography>
              <Typography variant="body1" color="text.secondary" align="center" sx={{ maxWidth: 400 }}>
                Select a conversation from the list to view messages or start a new conversation from
                an influencer or advertiser profile.
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default MessagePage;
