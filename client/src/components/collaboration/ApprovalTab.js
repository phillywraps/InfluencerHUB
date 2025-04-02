import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  Button,
  Paper,
  CircularProgress,
  Tabs,
  Tab,
  Card,
  CardContent,
  CardActionArea,
  CardActions,
  Chip,
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Tooltip,
  IconButton,
  Menu,
  ListItemIcon,
  ListItemText,
  Divider,
  Snackbar,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FilterList as FilterListIcon,
  MoreVert as MoreVertIcon,
  Refresh as RefreshIcon,
  Approval as ApprovalIcon,
  ContentCopy as ContentCopyIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Schedule as ScheduleIcon,
  FormatListBulleted as ListIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import teamService from '../../services/teamServiceExtended';
import ContentApprovalWorkflow from './ContentApprovalWorkflow';

/**
 * Approval Tab Component
 * 
 * A comprehensive interface for managing content approvals within a collaboration space, including:
 * - Content creation
 * - Content listing with filtering
 * - Access to the approval workflow
 */
const ApprovalTab = ({ teamId, spaceId }) => {
  // State
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [contentData, setContentData] = useState({ title: '', description: '', contentType: 'post' });
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [selectedContentId, setSelectedContentId] = useState(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [contentDialogOpen, setContentDialogOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [filterMenuAnchorEl, setFilterMenuAnchorEl] = useState(null);

  // Content types and statuses for filtering
  const contentTypes = [
    { value: 'post', label: 'Post' },
    { value: 'campaign', label: 'Campaign' },
    { value: 'story', label: 'Story' },
    { value: 'video', label: 'Video' },
    { value: 'reel', label: 'Reel' },
    { value: 'tweet', label: 'Tweet' },
    { value: 'other', label: 'Other' }
  ];

  const statuses = [
    { value: 'draft', label: 'Draft', color: 'default' },
    { value: 'review', label: 'Under Review', color: 'primary' },
    { value: 'revisions', label: 'Revisions Needed', color: 'warning' },
    { value: 'approval', label: 'Final Approval', color: 'info' },
    { value: 'approved', label: 'Approved', color: 'success' },
    { value: 'published', label: 'Published', color: 'success' },
    { value: 'archived', label: 'Archived', color: 'default' }
  ];

  // Load content on mount
  useEffect(() => {
    if (teamId && spaceId) {
      loadContents();
    }
  }, [teamId, spaceId, filterStatus, filterType]);

  // Function to load content items
  const loadContents = async () => {
    setLoading(true);
    try {
      const contentsData = await teamService.getContents(teamId, spaceId);
      setContents(contentsData);
    } catch (error) {
      console.error('Error loading content items:', error);
      showSnackbar('Failed to load content items', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Create content dialog handlers
  const handleCreateDialogOpen = () => {
    setContentData({ title: '', description: '', contentType: 'post' });
    setCreateDialogOpen(true);
  };

  const handleCreateDialogClose = () => {
    setCreateDialogOpen(false);
  };

  const handleCreateContent = async () => {
    try {
      await teamService.createContent(teamId, spaceId, contentData);
      setCreateDialogOpen(false);
      loadContents();
      showSnackbar('Content created successfully', 'success');
    } catch (error) {
      console.error('Error creating content:', error);
      showSnackbar('Failed to create content', 'error');
    }
  };

  // Menu handlers
  const handleMenuOpen = (event, contentId) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedContentId(contentId);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedContentId(null);
  };

  // Content dialog handlers
  const handleContentDialogOpen = (content) => {
    setSelectedContent(content);
    setContentDialogOpen(true);
  };

  const handleContentDialogClose = () => {
    setContentDialogOpen(false);
    loadContents(); // Reload to reflect any changes
  };

  // Filter menu handlers
  const handleFilterMenuOpen = (event) => {
    setFilterMenuAnchorEl(event.currentTarget);
  };

  const handleFilterMenuClose = () => {
    setFilterMenuAnchorEl(null);
  };

  // Function to delete content
  const handleDeleteContent = async () => {
    if (!selectedContentId) return;

    try {
      await teamService.deleteContent(teamId, spaceId, selectedContentId);
      loadContents();
      handleMenuClose();
      showSnackbar('Content deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting content:', error);
      showSnackbar('Failed to delete content', 'error');
    }
  };

  // Confirmation dialog handlers
  const handleOpenConfirmDialog = () => {
    setConfirmDialogOpen(true);
    handleMenuClose();
  };

  const handleCloseConfirmDialog = () => {
    setConfirmDialogOpen(false);
  };

  // Snackbar handlers
  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Filter content items
  const filteredContents = contents.filter(content => {
    const matchesStatus = filterStatus === 'all' || content.status === filterStatus;
    const matchesType = filterType === 'all' || content.contentType === filterType;
    const matchesSearch = content.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (content.description && content.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesStatus && matchesType && matchesSearch;
  });

  // Helper functions
  const getStatusLabel = (status) => {
    const statusItem = statuses.find(s => s.value === status);
    return statusItem ? statusItem.label : status;
  };

  const getStatusColor = (status) => {
    const statusItem = statuses.find(s => s.value === status);
    return statusItem ? statusItem.color : 'default';
  };

  const formatTimestamp = (timestamp) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (e) {
      return 'Invalid date';
    }
  };

  // Render the content grid
  const renderContentGrid = () => (
    <Grid container spacing={3}>
      {filteredContents.length === 0 ? (
        <Grid item xs={12}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body1" color="textSecondary">
              No content items found
            </Typography>
          </Paper>
        </Grid>
      ) : (
        filteredContents.map(content => (
          <Grid item xs={12} sm={6} md={4} key={content._id}>
            <Card variant="outlined">
              <CardActionArea onClick={() => handleContentDialogOpen(content)}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Chip 
                      label={getStatusLabel(content.status)}
                      color={getStatusColor(content.status)}
                      size="small"
                    />
                    <Chip 
                      label={content.contentType}
                      variant="outlined"
                      size="small"
                    />
                  </Box>
                  <Typography variant="h6" component="h2" noWrap>
                    {content.title}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ 
                    mt: 1, 
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    height: '3em'
                  }}>
                    {content.description || 'No description'}
                  </Typography>
                </CardContent>
              </CardActionArea>
              <Divider />
              <CardActions sx={{ justifyContent: 'space-between' }}>
                <Typography variant="caption" color="textSecondary">
                  Created {formatTimestamp(content.createdAt)}
                </Typography>
                <IconButton 
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMenuOpen(e, content._id);
                  }}
                >
                  <MoreVertIcon />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))
      )}
    </Grid>
  );

  // Main render
  return (
    <Box>
      {/* Header with actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Content & Approvals</Typography>
        <Box>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleCreateDialogOpen}
            sx={{ mr: 1 }}
          >
            Create Content
          </Button>
          <Button
            variant="outlined"
            startIcon={<FilterListIcon />}
            onClick={handleFilterMenuOpen}
            sx={{ mr: 1 }}
          >
            Filter
          </Button>
          <IconButton 
            onClick={loadContents}
            color="primary"
          >
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Search bar */}
      <TextField
        fullWidth
        variant="outlined"
        placeholder="Search content..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        sx={{ mb: 3 }}
      />

      {/* Status filters */}
      <Tabs
        value={filterStatus === 'all' ? 'all' : filterStatus}
        onChange={(e, newValue) => setFilterStatus(newValue)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 3 }}
      >
        <Tab label="All" value="all" />
        {statuses.map(status => (
          <Tab 
            key={status.value}
            label={status.label}
            value={status.value}
            icon={
              status.value === 'draft' ? <EditIcon fontSize="small" /> :
              status.value === 'review' ? <ApprovalIcon fontSize="small" /> :
              status.value === 'revisions' ? <WarningIcon fontSize="small" /> :
              status.value === 'approval' ? <ApprovalIcon fontSize="small" /> :
              status.value === 'approved' ? <CheckCircleIcon fontSize="small" /> :
              status.value === 'published' ? <ContentCopyIcon fontSize="small" /> :
              <ListIcon fontSize="small" />
            }
            iconPosition="start"
          />
        ))}
      </Tabs>

      {/* Content grid */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        renderContentGrid()
      )}

      {/* Filter menu */}
      <Menu
        anchorEl={filterMenuAnchorEl}
        open={Boolean(filterMenuAnchorEl)}
        onClose={handleFilterMenuClose}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            Content Type
          </Typography>
          <FormControl fullWidth size="small" sx={{ mb: 2, minWidth: 200 }}>
            <InputLabel id="filter-type-label">Content Type</InputLabel>
            <Select
              labelId="filter-type-label"
              value={filterType}
              label="Content Type"
              onChange={(e) => setFilterType(e.target.value)}
            >
              <MenuItem value="all">All Types</MenuItem>
              {contentTypes.map(type => (
                <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Menu>

      {/* Content options menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          const content = contents.find(c => c._id === selectedContentId);
          handleContentDialogOpen(content);
          handleMenuClose();
        }}>
          <ListItemIcon>
            <ApprovalIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Workflow</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleOpenConfirmDialog}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText primary="Delete" sx={{ color: 'error.main' }} />
        </MenuItem>
      </Menu>

      {/* Create content dialog */}
      <Dialog open={createDialogOpen} onClose={handleCreateDialogClose}>
        <DialogTitle>Create Content</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Create new content to send through the approval workflow.
          </DialogContentText>
          
          <TextField
            autoFocus
            margin="dense"
            label="Title"
            fullWidth
            value={contentData.title}
            onChange={(e) => setContentData({ ...contentData, title: e.target.value })}
            sx={{ mb: 2 }}
          />
          
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={4}
            value={contentData.description}
            onChange={(e) => setContentData({ ...contentData, description: e.target.value })}
            sx={{ mb: 2 }}
          />
          
          <FormControl fullWidth margin="dense">
            <InputLabel id="content-type-label">Content Type</InputLabel>
            <Select
              labelId="content-type-label"
              value={contentData.contentType}
              label="Content Type"
              onChange={(e) => setContentData({ ...contentData, contentType: e.target.value })}
            >
              {contentTypes.map(type => (
                <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCreateDialogClose}>Cancel</Button>
          <Button 
            onClick={handleCreateContent} 
            variant="contained" 
            color="primary"
            disabled={!contentData.title}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm delete dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={handleCloseConfirmDialog}
      >
        <DialogTitle>Delete Content</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this content? This cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmDialog}>Cancel</Button>
          <Button 
            onClick={() => {
              handleDeleteContent();
              handleCloseConfirmDialog();
            }} 
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Content workflow dialog */}
      <Dialog
        open={contentDialogOpen}
        onClose={handleContentDialogClose}
        maxWidth="md"
        fullWidth
      >
        <DialogContent>
          {selectedContent && (
            <ContentApprovalWorkflow 
              contentId={selectedContent._id}
              contentType={selectedContent.contentType}
              spaceId={spaceId}
              teamId={teamId}
              onStatusChange={() => {
                // If status changes, we'll reload the content when the dialog closes
              }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleContentDialogClose}>Close</Button>
        </DialogActions>
      </Dialog>

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

ApprovalTab.propTypes = {
  teamId: PropTypes.string,
  spaceId: PropTypes.string
};

export default ApprovalTab;
