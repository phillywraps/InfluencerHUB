import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Paper,
  Typography,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Button,
  CircularProgress,
  TextField,
  Card,
  CardContent,
  CardActions,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  IconButton,
  Tooltip,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Menu,
  MenuItem,
  Snackbar,
  Alert,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';
import {
  Edit as EditIcon,
  Send as SendIcon,
  Delete as DeleteIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  ArrowForward as ArrowForwardIcon,
  ArrowBack as ArrowBackIcon,
  Comment as CommentIcon,
  MoreVert as MoreVertIcon,
  Assignment as AssignmentIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import teamService from '../../services/teamServiceExtended';

/**
 * Content Approval Workflow Component
 * 
 * A comprehensive interface for managing content approvals, including:
 * - Status progress tracking
 * - Comments and feedback
 * - Activity history
 * - Status transitions
 */
const ContentApprovalWorkflow = ({ 
  contentId,
  contentType,
  spaceId,
  teamId,
  onStatusChange 
}) => {
  // State
  const [content, setContent] = useState(null);
  const [comments, setComments] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeStep, setActiveStep] = useState(0);
  const [commentText, setCommentText] = useState('');
  const [commentType, setCommentType] = useState('general');
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [selectedCommentId, setSelectedCommentId] = useState(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmData, setConfirmData] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [viewMode, setViewMode] = useState('workflow'); // 'workflow', 'comments', 'history'

  // Steps in the workflow
  const steps = [
    { label: 'Draft', value: 'draft', description: 'Initial content creation' },
    { label: 'Under Review', value: 'review', description: 'Content submitted for team review' },
    { label: 'Revisions Needed', value: 'revisions', description: 'Content requires changes based on feedback' },
    { label: 'Final Approval', value: 'approval', description: 'Content awaiting final sign-off' },
    { label: 'Approved', value: 'approved', description: 'Content approved and ready for publishing' },
  ];

  // Load content on mount
  useEffect(() => {
    if (contentId && spaceId && teamId) {
      loadContent();
      loadComments();
      loadActivities();
    }
  }, [contentId, spaceId, teamId]);

  // Update the active step when content status changes
  useEffect(() => {
    if (content) {
      const stepIndex = steps.findIndex(step => step.value === content.status);
      setActiveStep(stepIndex >= 0 ? stepIndex : 0);
    }
  }, [content]);

  // Function to load content
  const loadContent = async () => {
    setLoading(true);
    try {
      const contentData = await teamService.getContent(teamId, spaceId, contentId);
      setContent(contentData);
    } catch (error) {
      console.error('Error loading content:', error);
      showSnackbar('Failed to load content', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Function to load comments
  const loadComments = async () => {
    try {
      const commentsData = await teamService.getContentComments(teamId, spaceId, contentId);
      setComments(commentsData);
    } catch (error) {
      console.error('Error loading comments:', error);
      showSnackbar('Failed to load comments', 'error');
    }
  };

  // Function to load activities
  const loadActivities = async () => {
    try {
      const activitiesData = await teamService.getContentActivities(teamId, spaceId, contentId);
      setActivities(activitiesData);
    } catch (error) {
      console.error('Error loading activities:', error);
      showSnackbar('Failed to load activities', 'error');
    }
  };

  // Function to handle status change
  const handleStatusChange = async (newStatus) => {
    try {
      await teamService.updateContentStatus(teamId, spaceId, contentId, newStatus);
      loadContent();
      loadActivities();
      showSnackbar(`Content status updated to ${getStatusLabel(newStatus)}`, 'success');
      
      if (onStatusChange) {
        onStatusChange(newStatus);
      }
    } catch (error) {
      console.error('Error updating content status:', error);
      showSnackbar('Failed to update content status', 'error');
    }
  };

  // Function to add a comment
  const handleAddComment = async () => {
    if (!commentText.trim()) return;

    try {
      await teamService.addContentComment(teamId, spaceId, contentId, {
        text: commentText,
        type: commentType
      });
      
      setCommentText('');
      setCommentType('general');
      loadComments();
      loadActivities();
      showSnackbar('Comment added successfully', 'success');
    } catch (error) {
      console.error('Error adding comment:', error);
      showSnackbar('Failed to add comment', 'error');
    }
  };

  // Function to delete a comment
  const handleDeleteComment = async (commentId) => {
    try {
      await teamService.deleteContentComment(teamId, spaceId, contentId, commentId);
      loadComments();
      loadActivities();
      showSnackbar('Comment deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting comment:', error);
      showSnackbar('Failed to delete comment', 'error');
    }
  };

  // Menu handlers
  const handleMenuOpen = (event, commentId) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedCommentId(commentId);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedCommentId(null);
  };

  // Confirmation dialog handlers
  const handleOpenConfirmDialog = (action, data) => {
    setConfirmAction(action);
    setConfirmData(data);
    setConfirmDialogOpen(true);
  };

  const handleCloseConfirmDialog = () => {
    setConfirmDialogOpen(false);
    setConfirmAction(null);
    setConfirmData(null);
  };

  const handleConfirmAction = async () => {
    if (confirmAction === 'deleteComment') {
      await handleDeleteComment(confirmData);
    } else if (confirmAction === 'updateStatus') {
      await handleStatusChange(confirmData);
    }
    
    handleCloseConfirmDialog();
  };

  // Snackbar handlers
  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Helper functions
  const getStatusLabel = (status) => {
    const step = steps.find(s => s.value === status);
    return step ? step.label : status;
  };
  
  const getCommentTypeLabel = (type) => {
    switch (type) {
      case 'general': return 'Comment';
      case 'revision': return 'Revision Request';
      case 'approval': return 'Approval';
      case 'rejection': return 'Rejection';
      default: return type;
    }
  };
  
  const getCommentTypeColor = (type) => {
    switch (type) {
      case 'general': return 'default';
      case 'revision': return 'warning';
      case 'approval': return 'success';
      case 'rejection': return 'error';
      default: return 'default';
    }
  };

  const getCommentTypeIcon = (type) => {
    switch (type) {
      case 'general': return <CommentIcon />;
      case 'revision': return <WarningIcon />;
      case 'approval': return <ThumbUpIcon />;
      case 'rejection': return <ThumbDownIcon />;
      default: return <CommentIcon />;
    }
  };

  const formatActivityText = (activity) => {
    switch (activity.type) {
      case 'status_change':
        return `Changed status from ${getStatusLabel(activity.data.fromStatus)} to ${getStatusLabel(activity.data.toStatus)}`;
      case 'comment_added':
        return `Added a ${getCommentTypeLabel(activity.data.commentType).toLowerCase()}`;
      case 'comment_deleted':
        return 'Deleted a comment';
      case 'content_updated':
        return 'Updated content';
      case 'content_created':
        return 'Created content';
      default:
        return activity.type;
    }
  };

  const formatTimestamp = (timestamp) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (e) {
      return 'Invalid date';
    }
  };

  // Render workflow stepper
  const renderWorkflow = () => (
    <Stepper activeStep={activeStep} orientation="vertical">
      {steps.map((step, index) => (
        <Step key={step.value}>
          <StepLabel>
            <Typography variant="subtitle1">{step.label}</Typography>
          </StepLabel>
          <StepContent>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              {step.description}
            </Typography>
            <Box sx={{ mb: 2, mt: 1 }}>
              <div>
                {/* Back button - only show if not at the first step */}
                {index > 0 && (
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => handleOpenConfirmDialog('updateStatus', steps[index - 1].value)}
                    startIcon={<ArrowBackIcon />}
                    sx={{ mr: 1, mb: 1 }}
                  >
                    Move to {steps[index - 1].label}
                  </Button>
                )}
                
                {/* Next button - only show if not at the last step */}
                {index < steps.length - 1 && (
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => handleOpenConfirmDialog('updateStatus', steps[index + 1].value)}
                    endIcon={<ArrowForwardIcon />}
                    sx={{ mr: 1, mb: 1 }}
                  >
                    Move to {steps[index + 1].label}
                  </Button>
                )}
                
                {/* Special buttons for specific states */}
                {step.value === 'draft' && (
                  <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    onClick={() => handleOpenConfirmDialog('updateStatus', 'review')}
                    sx={{ mb: 1 }}
                  >
                    Submit for Review
                  </Button>
                )}
                
                {step.value === 'review' && (
                  <>
                    <Button
                      variant="contained"
                      color="success"
                      size="small"
                      onClick={() => handleOpenConfirmDialog('updateStatus', 'approval')}
                      startIcon={<CheckCircleIcon />}
                      sx={{ mr: 1, mb: 1 }}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="contained"
                      color="warning"
                      size="small"
                      onClick={() => handleOpenConfirmDialog('updateStatus', 'revisions')}
                      startIcon={<WarningIcon />}
                      sx={{ mb: 1 }}
                    >
                      Request Revisions
                    </Button>
                  </>
                )}
                
                {step.value === 'revisions' && (
                  <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    onClick={() => handleOpenConfirmDialog('updateStatus', 'review')}
                    sx={{ mb: 1 }}
                  >
                    Resubmit for Review
                  </Button>
                )}
                
                {step.value === 'approval' && (
                  <>
                    <Button
                      variant="contained"
                      color="success"
                      size="small"
                      onClick={() => handleOpenConfirmDialog('updateStatus', 'approved')}
                      startIcon={<CheckCircleIcon />}
                      sx={{ mr: 1, mb: 1 }}
                    >
                      Final Approval
                    </Button>
                    <Button
                      variant="contained"
                      color="warning"
                      size="small"
                      onClick={() => handleOpenConfirmDialog('updateStatus', 'revisions')}
                      startIcon={<WarningIcon />}
                      sx={{ mb: 1 }}
                    >
                      Request Revisions
                    </Button>
                  </>
                )}
                
                {step.value === 'approved' && (
                  <Button
                    variant="contained"
                    color="success"
                    size="small"
                    onClick={() => alert('Publishing functionality coming soon')}
                    startIcon={<ScheduleIcon />}
                    sx={{ mb: 1 }}
                  >
                    Schedule Publishing
                  </Button>
                )}
              </div>
            </Box>
          </StepContent>
        </Step>
      ))}
    </Stepper>
  );

  // Render comments section
  const renderComments = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Comments and Feedback
      </Typography>
      
      {/* Comment form */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
            <FormControl size="small" sx={{ width: 180, mr: 2 }}>
              <InputLabel id="comment-type-label">Comment Type</InputLabel>
              <Select
                labelId="comment-type-label"
                value={commentType}
                label="Comment Type"
                onChange={(e) => setCommentType(e.target.value)}
              >
                <MenuItem value="general">General Comment</MenuItem>
                <MenuItem value="revision">Revision Request</MenuItem>
                <MenuItem value="approval">Approval</MenuItem>
                <MenuItem value="rejection">Rejection</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Add a comment"
              multiline
              rows={2}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              variant="outlined"
              placeholder="Enter your comment here..."
            />
          </Box>
        </CardContent>
        <CardActions>
          <Button
            variant="contained"
            endIcon={<SendIcon />}
            onClick={handleAddComment}
            disabled={!commentText.trim()}
          >
            Post Comment
          </Button>
        </CardActions>
      </Card>
      
      {/* Comments list */}
      {comments.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="textSecondary">
            No comments yet
          </Typography>
        </Paper>
      ) : (
        <List>
          {comments.map(comment => (
            <Card key={comment._id} sx={{ mb: 2 }}>
              <ListItem
                secondaryAction={
                  <IconButton
                    edge="end"
                    aria-label="comment actions"
                    onClick={(e) => handleMenuOpen(e, comment._id)}
                  >
                    <MoreVertIcon />
                  </IconButton>
                }
              >
                <ListItemAvatar>
                  <Avatar src={comment.user?.profileImage}>
                    {comment.user?.name?.[0] || '?'}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                      <Typography variant="subtitle1">
                        {comment.user?.name || 'Unknown User'}
                      </Typography>
                      <Chip 
                        size="small"
                        label={getCommentTypeLabel(comment.type)}
                        color={getCommentTypeColor(comment.type)}
                        icon={getCommentTypeIcon(comment.type)}
                      />
                      <Typography variant="caption" color="textSecondary">
                        {formatTimestamp(comment.timestamp)}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Typography
                      variant="body2"
                      color="textPrimary"
                      sx={{ mt: 1, whiteSpace: 'pre-wrap' }}
                    >
                      {comment.text}
                    </Typography>
                  }
                />
              </ListItem>
            </Card>
          ))}
        </List>
      )}
    </Box>
  );

  // Render activity history
  const renderActivityHistory = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Activity History
      </Typography>
      
      {activities.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="textSecondary">
            No activity recorded yet
          </Typography>
        </Paper>
      ) : (
        <List>
          {activities.map(activity => (
            <Card key={activity._id} sx={{ mb: 2 }}>
              <ListItem>
                <ListItemAvatar>
                  <Avatar src={activity.user?.profileImage}>
                    {activity.user?.name?.[0] || '?'}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                      <Typography variant="subtitle1">
                        {activity.user?.name || 'Unknown User'}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {formatTimestamp(activity.timestamp)}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Typography
                      variant="body2"
                      color="textPrimary"
                      sx={{ mt: 1 }}
                    >
                      {formatActivityText(activity)}
                    </Typography>
                  }
                />
              </ListItem>
            </Card>
          ))}
        </List>
      )}
    </Box>
  );

  // Main render
  return (
    <Box sx={{ mb: 4 }}>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : content ? (
        <>
          {/* Content header */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Chip 
                    label={getStatusLabel(content.status)}
                    color={
                      content.status === 'approved' ? 'success' :
                      content.status === 'revisions' ? 'warning' :
                      content.status === 'draft' ? 'default' : 'primary'
                    }
                    sx={{ mr: 1 }}
                  />
                  <Chip 
                    label={content.contentType}
                    variant="outlined"
                    size="small"
                  />
                </Box>
                <Typography variant="h5" gutterBottom>
                  {content.title}
                </Typography>
                {content.description && (
                  <Typography variant="body1" color="textSecondary" gutterBottom>
                    {content.description}
                  </Typography>
                )}
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <Typography variant="caption" color="textSecondary">
                    Created {formatTimestamp(content.createdAt)} by {content.creator?.name || 'Unknown'}
                  </Typography>
                </Box>
              </Box>
              <Box>
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={() => alert('Content editing coming soon')}
                >
                  Edit Content
                </Button>
              </Box>
            </Box>
          </Paper>
          
          {/* View mode selector */}
          <Box sx={{ display: 'flex', mb: 3 }}>
            <Button
              variant={viewMode === 'workflow' ? 'contained' : 'outlined'}
              startIcon={<AssignmentIcon />}
              onClick={() => setViewMode('workflow')}
              sx={{ mr: 1 }}
            >
              Workflow
            </Button>
            <Button
              variant={viewMode === 'comments' ? 'contained' : 'outlined'}
              startIcon={<CommentIcon />}
              onClick={() => setViewMode('comments')}
              sx={{ mr: 1 }}
            >
              Comments ({comments.length})
            </Button>
            <Button
              variant={viewMode === 'history' ? 'contained' : 'outlined'}
              startIcon={<HistoryIcon />}
              onClick={() => setViewMode('history')}
            >
              History
            </Button>
          </Box>
          
          {/* Content sections */}
          {viewMode === 'workflow' && renderWorkflow()}
          {viewMode === 'comments' && renderComments()}
          {viewMode === 'history' && renderActivityHistory()}
          
          {/* Comment menu */}
          <Menu
            anchorEl={menuAnchorEl}
            open={Boolean(menuAnchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={() => {
              handleOpenConfirmDialog('deleteComment', selectedCommentId);
              handleMenuClose();
            }}>
              <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
              Delete Comment
            </MenuItem>
          </Menu>
          
          {/* Confirmation dialog */}
          <Dialog
            open={confirmDialogOpen}
            onClose={handleCloseConfirmDialog}
          >
            <DialogTitle>
              {confirmAction === 'deleteComment' ? 'Delete Comment' : 'Change Status'}
            </DialogTitle>
            <DialogContent>
              <DialogContentText>
                {confirmAction === 'deleteComment' 
                  ? 'Are you sure you want to delete this comment? This cannot be undone.'
                  : `Are you sure you want to change the status to "${getStatusLabel(confirmData)}"?`
                }
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseConfirmDialog}>Cancel</Button>
              <Button 
                onClick={handleConfirmAction} 
                color={confirmAction === 'deleteComment' ? 'error' : 'primary'}
                variant="contained"
              >
                {confirmAction === 'deleteComment' ? 'Delete' : 'Confirm'}
              </Button>
            </DialogActions>
          </Dialog>
        </>
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="textSecondary" gutterBottom>
            Content not found
          </Typography>
        </Paper>
      )}
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

ContentApprovalWorkflow.propTypes = {
  contentId: PropTypes.string.isRequired,
  contentType: PropTypes.string,
  spaceId: PropTypes.string.isRequired,
  teamId: PropTypes.string.isRequired,
  onStatusChange: PropTypes.func
};

export default ContentApprovalWorkflow;
