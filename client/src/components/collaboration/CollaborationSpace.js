import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  Tabs,
  Tab,
  Typography,
  Button,
  CircularProgress,
  Divider,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Chip,
  Menu,
  MenuItem,
  Snackbar,
  Alert,
  Tooltip,
  Avatar,
  AvatarGroup,
  FormControl,
  Select,
  InputLabel,
} from '@mui/material';
import {
  Description as DescriptionIcon,
  AssignmentTurnedIn as AssignmentTurnedInIcon,
  Forum as ForumIcon,
  AttachFile as AttachFileIcon,
  CalendarToday as CalendarTodayIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Share as ShareIcon,
  MoreVert as MoreVertIcon,
  PeopleAlt as PeopleAltIcon,
  Dashboard as DashboardIcon,
  InsertDriveFile as InsertDriveFileIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Comment as CommentIcon,
  RadioButtonUnchecked as CircleIcon,
  Approval as ApprovalIcon,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { selectCurrentTeam } from '../../redux/slices/teamSlice';
import teamService from '../../services/teamService';
import permissionService from '../../services/permissionService';
import ApprovalTab from './ApprovalTab';

/**
 * Collaboration Space Component
 * 
 * A comprehensive interface for brand-influencer collaboration, including:
 * - Campaign briefs
 * - Content guidelines
 * - Deliverable tracking
 * - Team collaboration tools
 */
const CollaborationSpace = () => {
  const { spaceId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Redux state
  const currentTeam = useSelector(selectCurrentTeam);
  
  // Local state
  const [space, setSpace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [briefs, setBriefs] = useState([]);
  const [deliverables, setDeliverables] = useState([]);
  const [guidelines, setGuidelines] = useState([]);
  const [discussions, setDiscussions] = useState([]);
  const [members, setMembers] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [createBriefOpen, setCreateBriefOpen] = useState(false);
  const [createDeliverableOpen, setCreateDeliverableOpen] = useState(false);
  const [createGuidelineOpen, setCreateGuidelineOpen] = useState(false);
  const [briefData, setBriefData] = useState({ title: '', description: '', dueDate: '' });
  const [deliverableData, setDeliverableData] = useState({ title: '', description: '', dueDate: '', assignedToId: '' });
  const [guidelineData, setGuidelineData] = useState({ title: '', content: '' });
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [itemType, setItemType] = useState(null);
  const [permissions, setPermissions] = useState({
    canEdit: false,
    canDelete: false,
    canCreateContent: false,
    canApprove: false,
  });
  
  // Load collaboration space data on mount
  useEffect(() => {
    if (spaceId && currentTeam) {
      loadCollaborationSpace();
      checkPermissions();
    }
  }, [spaceId, currentTeam]);
  
  // Function to load collaboration space data
  const loadCollaborationSpace = async () => {
    setLoading(true);
    
    try {
      // Get space details
      const spaceData = await teamService.getCollaborationSpace(currentTeam.id, spaceId);
      setSpace(spaceData);
      
      // Load related data
      const [briefs, deliverables, guidelines, discussions, members] = await Promise.all([
        teamService.getCollaborationBriefs(currentTeam.id, spaceId),
        teamService.getCollaborationDeliverables(currentTeam.id, spaceId),
        teamService.getCollaborationGuidelines(currentTeam.id, spaceId),
        teamService.getCollaborationDiscussions(currentTeam.id, spaceId),
        teamService.getCollaborationSpaceMembers(currentTeam.id, spaceId),
      ]);
      
      setBriefs(briefs);
      setDeliverables(deliverables);
      setGuidelines(guidelines);
      setDiscussions(discussions);
      setMembers(members);
    } catch (error) {
      console.error('Error loading collaboration space:', error);
      showSnackbar('Failed to load collaboration space', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // Check user permissions for this space
  const checkPermissions = async () => {
    if (!currentTeam || !spaceId) return;
    
    try {
      const [canEdit, canDelete, canCreateContent, canApprove] = await Promise.all([
        permissionService.hasPermission('space:edit', 'space', spaceId),
        permissionService.hasPermission('space:delete', 'space', spaceId),
        permissionService.hasPermission('content:create', 'space', spaceId),
        permissionService.hasPermission('content:approve', 'space', spaceId),
      ]);
      
      setPermissions({
        canEdit,
        canDelete,
        canCreateContent,
        canApprove,
      });
    } catch (error) {
      console.error('Error checking permissions:', error);
    }
  };
  
  // Tab change handler
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  // Menu handlers
  const handleMenuOpen = (event, itemId, type) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedItemId(itemId);
    setItemType(type);
  };
  
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedItemId(null);
    setItemType(null);
  };
  
  // Brief dialog handlers
  const handleCreateBriefOpen = () => {
    setBriefData({ title: '', description: '', dueDate: '' });
    setCreateBriefOpen(true);
  };
  
  const handleCreateBriefClose = () => {
    setCreateBriefOpen(false);
  };
  
  const handleCreateBriefSubmit = async () => {
    if (!currentTeam || !spaceId) return;
    
    try {
      const newBrief = await teamService.createCollaborationBrief(
        currentTeam.id, 
        spaceId, 
        briefData
      );
      
      setBriefs([...briefs, newBrief]);
      setCreateBriefOpen(false);
      showSnackbar('Campaign brief created successfully', 'success');
    } catch (error) {
      console.error('Error creating brief:', error);
      showSnackbar('Failed to create brief', 'error');
    }
  };
  
  // Deliverable dialog handlers
  const handleCreateDeliverableOpen = () => {
    setDeliverableData({ title: '', description: '', dueDate: '', assignedToId: '' });
    setCreateDeliverableOpen(true);
  };
  
  const handleCreateDeliverableClose = () => {
    setCreateDeliverableOpen(false);
  };
  
  const handleCreateDeliverableSubmit = async () => {
    if (!currentTeam || !spaceId) return;
    
    try {
      const newDeliverable = await teamService.createCollaborationDeliverable(
        currentTeam.id, 
        spaceId, 
        deliverableData
      );
      
      setDeliverables([...deliverables, newDeliverable]);
      setCreateDeliverableOpen(false);
      showSnackbar('Deliverable created successfully', 'success');
    } catch (error) {
      console.error('Error creating deliverable:', error);
      showSnackbar('Failed to create deliverable', 'error');
    }
  };
  
  // Guideline dialog handlers
  const handleCreateGuidelineOpen = () => {
    setGuidelineData({ title: '', content: '' });
    setCreateGuidelineOpen(true);
  };
  
  const handleCreateGuidelineClose = () => {
    setCreateGuidelineOpen(false);
  };
  
  const handleCreateGuidelineSubmit = async () => {
    if (!currentTeam || !spaceId) return;
    
    try {
      const newGuideline = await teamService.createCollaborationGuideline(
        currentTeam.id, 
        spaceId, 
        guidelineData
      );
      
      setGuidelines([...guidelines, newGuideline]);
      setCreateGuidelineOpen(false);
      showSnackbar('Guideline created successfully', 'success');
    } catch (error) {
      console.error('Error creating guideline:', error);
      showSnackbar('Failed to create guideline', 'error');
    }
  };
  
  // Handle item deletion
  const handleDeleteItem = async () => {
    if (!currentTeam || !spaceId || !selectedItemId || !itemType) return;
    
    try {
      switch (itemType) {
        case 'brief':
          await teamService.deleteCollaborationBrief(currentTeam.id, spaceId, selectedItemId);
          setBriefs(briefs.filter(brief => brief.id !== selectedItemId));
          showSnackbar('Brief deleted successfully', 'success');
          break;
          
        case 'deliverable':
          await teamService.deleteCollaborationDeliverable(currentTeam.id, spaceId, selectedItemId);
          setDeliverables(deliverables.filter(del => del.id !== selectedItemId));
          showSnackbar('Deliverable deleted successfully', 'success');
          break;
          
        case 'guideline':
          await teamService.deleteCollaborationGuideline(currentTeam.id, spaceId, selectedItemId);
          setGuidelines(guidelines.filter(guide => guide.id !== selectedItemId));
          showSnackbar('Guideline deleted successfully', 'success');
          break;
          
        case 'discussion':
          await teamService.deleteCollaborationDiscussion(currentTeam.id, spaceId, selectedItemId);
          setDiscussions(discussions.filter(disc => disc.id !== selectedItemId));
          showSnackbar('Discussion deleted successfully', 'success');
          break;
      }
    } catch (error) {
      console.error(`Error deleting ${itemType}:`, error);
      showSnackbar(`Failed to delete ${itemType}`, 'error');
    } finally {
      handleMenuClose();
    }
  };
  
  // Handle deliverable status toggle
  const handleToggleDeliverableStatus = async (deliverableId, isCompleted) => {
    if (!currentTeam || !spaceId) return;
    
    try {
      await teamService.updateDeliverableStatus(currentTeam.id, spaceId, deliverableId, { isCompleted });
      
      // Update local state
      setDeliverables(deliverables.map(del => 
        del.id === deliverableId ? { ...del, isCompleted } : del
      ));
      
      showSnackbar(`Deliverable marked as ${isCompleted ? 'completed' : 'incomplete'}`, 'success');
    } catch (error) {
      console.error('Error updating deliverable status:', error);
      showSnackbar('Failed to update deliverable status', 'error');
    }
  };
  
  // Snackbar handlers
  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };
  
  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };
  
  // Get the assigned member name for a deliverable
  const getAssignedMemberName = (assignedToId) => {
    const member = members.find(m => m.id === assignedToId);
    return member ? member.name : 'Unassigned';
  };
  
  // Format date to a readable string
  const formatDate = (dateString) => {
    if (!dateString) return 'No date';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  // Get status chip based on due date and completion status
  const getStatusChip = (dueDate, isCompleted) => {
    if (isCompleted) {
      return <Chip label="Completed" color="success" size="small" />;
    }
    
    if (!dueDate) return <Chip label="No deadline" color="default" size="small" />;
    
    const today = new Date();
    const due = new Date(dueDate);
    
    if (due < today) {
      return <Chip label="Overdue" color="error" size="small" />;
    } else {
      // Due date is within the next 3 days
      const threeDays = 3 * 24 * 60 * 60 * 1000; // 3 days in milliseconds
      if (due - today < threeDays) {
        return <Chip label="Due soon" color="warning" size="small" />;
      } else {
        return <Chip label="On track" color="info" size="small" />;
      }
    }
  };
  
  // Render campaign briefs tab
  const renderBriefsTab = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Campaign Briefs</Typography>
        {permissions.canCreateContent && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleCreateBriefOpen}
          >
            Create Brief
          </Button>
        )}
      </Box>
      
      {briefs.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="textSecondary">
            No campaign briefs available
          </Typography>
          {permissions.canCreateContent && (
            <Button
              variant="outlined"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleCreateBriefOpen}
              sx={{ mt: 2 }}
            >
              Create First Brief
            </Button>
          )}
        </Paper>
      ) : (
        <List>
          {briefs.map(brief => (
            <Card key={brief.id} sx={{ mb: 2 }}>
              <ListItem
                secondaryAction={
                  permissions.canEdit && (
                    <IconButton
                      edge="end"
                      onClick={(e) => handleMenuOpen(e, brief.id, 'brief')}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  )
                }
              >
                <ListItemIcon>
                  <DescriptionIcon />
                </ListItemIcon>
                <ListItemText
                  primary={brief.title}
                  secondary={
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                        {brief.description}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                        {brief.dueDate && (
                          <Chip 
                            icon={<CalendarTodayIcon />} 
                            label={`Due: ${formatDate(brief.dueDate)}`} 
                            size="small" 
                            color="primary"
                            variant="outlined"
                          />
                        )}
                        {brief.createdBy && (
                          <Chip 
                            label={`Created by: ${brief.createdBy.name}`} 
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    </Box>
                  }
                />
              </ListItem>
            </Card>
          ))}
        </List>
      )}
    </Box>
  );
  
  // Render deliverables tab
  const renderDeliverablesTab = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Deliverables</Typography>
        {permissions.canCreateContent && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleCreateDeliverableOpen}
          >
            Add Deliverable
          </Button>
        )}
      </Box>
      
      {deliverables.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="textSecondary">
            No deliverables available
          </Typography>
          {permissions.canCreateContent && (
            <Button
              variant="outlined"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleCreateDeliverableOpen}
              sx={{ mt: 2 }}
            >
              Add First Deliverable
            </Button>
          )}
        </Paper>
      ) : (
        <List>
          {deliverables.map(deliverable => (
            <Card key={deliverable.id} sx={{ mb: 2 }}>
              <ListItem
                secondaryAction={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Tooltip title={deliverable.isCompleted ? 'Mark as incomplete' : 'Mark as complete'}>
                      <IconButton
                        edge="end"
                        color={deliverable.isCompleted ? 'success' : 'default'}
                        onClick={() => handleToggleDeliverableStatus(deliverable.id, !deliverable.isCompleted)}
                      >
                        {deliverable.isCompleted ? <CheckIcon /> : <CircleIcon sx={{ opacity: 0.5 }} />}
                      </IconButton>
                    </Tooltip>
                    
                    {permissions.canEdit && (
                      <IconButton
                        edge="end"
                        onClick={(e) => handleMenuOpen(e, deliverable.id, 'deliverable')}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    )}
                  </Box>
                }
              >
                <ListItemIcon>
                  <AssignmentTurnedInIcon />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography
                        variant="subtitle1"
                        sx={{
                          textDecoration: deliverable.isCompleted ? 'line-through' : 'none',
                          opacity: deliverable.isCompleted ? 0.7 : 1,
                          mr: 1
                        }}
                      >
                        {deliverable.title}
                      </Typography>
                      {getStatusChip(deliverable.dueDate, deliverable.isCompleted)}
                    </Box>
                  }
                  secondary={
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                        {deliverable.description}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                        {deliverable.dueDate && (
                          <Chip 
                            icon={<CalendarTodayIcon />} 
                            label={`Due: ${formatDate(deliverable.dueDate)}`} 
                            size="small" 
                            variant="outlined"
                          />
                        )}
                        {deliverable.assignedToId && (
                          <Chip 
                            icon={<PeopleAltIcon />}
                            label={`Assigned to: ${getAssignedMemberName(deliverable.assignedToId)}`} 
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    </Box>
                  }
                />
              </ListItem>
            </Card>
          ))}
        </List>
      )}
    </Box>
  );
  
  // Render guidelines tab
  const renderGuidelinesTab = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Content Guidelines</Typography>
        {permissions.canCreateContent && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleCreateGuidelineOpen}
          >
            Add Guideline
          </Button>
        )}
      </Box>
      
      {guidelines.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="textSecondary">
            No content guidelines available
          </Typography>
          {permissions.canCreateContent && (
            <Button
              variant="outlined"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleCreateGuidelineOpen}
              sx={{ mt: 2 }}
            >
              Add First Guideline
            </Button>
          )}
        </Paper>
      ) : (
        <List>
          {guidelines.map(guideline => (
            <Card key={guideline.id} sx={{ mb: 2 }}>
              <ListItem
                secondaryAction={
                  permissions.canEdit && (
                    <IconButton
                      edge="end"
                      onClick={(e) => handleMenuOpen(e, guideline.id, 'guideline')}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  )
                }
              >
                <ListItemIcon>
                  <InsertDriveFileIcon />
                </ListItemIcon>
                <ListItemText
                  primary={guideline.title}
                  secondary={
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="body2" color="textSecondary" sx={{ whiteSpace: 'pre-wrap' }}>
                        {guideline.content}
                      </Typography>
                      {guideline.createdBy && (
                        <Box sx={{ mt: 1 }}>
                          <Chip 
                            label={`Created by: ${guideline.createdBy.name}`} 
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                      )}
                    </Box>
                  }
                />
              </ListItem>
            </Card>
          ))}
        </List>
      )}
    </Box>
  );
  
  // Render discussions tab
  const renderDiscussionsTab = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Discussions</Typography>
        {permissions.canCreateContent && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => {
              // Navigate to the discussions page or open a dialog
              showSnackbar('Discussion functionality coming soon', 'info');
            }}
          >
            Start Discussion
          </Button>
        )}
      </Box>
      
      {discussions.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="textSecondary">
            No discussions yet
          </Typography>
          {permissions.canCreateContent && (
            <Button
              variant="outlined"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => {
                showSnackbar('Discussion functionality coming soon', 'info');
              }}
              sx={{ mt: 2 }}
            >
              Start First Discussion
            </Button>
          )}
        </Paper>
      ) : (
        <Typography variant="body1" color="textSecondary" align="center" sx={{ p: 2 }}>
          Discussion functionality coming soon
        </Typography>
      )}
    </Box>
  );
  
  // Render the team members tab
  const renderTeamTab = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Team Members</Typography>
        {permissions.canEdit && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => {
              // Navigate to the member invitation page or show a dialog
              showSnackbar('Member invitation coming soon', 'info');
            }}
          >
            Invite Member
          </Button>
        )}
      </Box>
      
      {members.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="textSecondary">
            No team members available
          </Typography>
        </Paper>
      ) : (
        <List>
          {members.map(member => (
            <ListItem key={member.id} divider>
              <Avatar 
                src={member.profileImage} 
                alt={member.name}
                sx={{ mr: 2 }}
              />
              <ListItemText
                primary={member.name}
                secondary={member.email}
              />
              <Chip 
                label={member.role.name} 
                size="small" 
                color={member.role.name === 'Owner' ? 'primary' : 'default'}
              />
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
  
  // Main render
  return (
    <Box sx={{ flexGrow: 1 }}>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : space ? (
        <>
          {/* Space Header */}
          <Card sx={{ mb: 3 }}>
            <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography variant="h5">{space.name}</Typography>
                {space.description && (
                  <Typography variant="body1" color="textSecondary" sx={{ mt: 1 }}>
                    {space.description}
                  </Typography>
                )}
                
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                  <AvatarGroup max={5} sx={{ mr: 1 }}>
                    {members.map(member => (
                      <Tooltip key={member.id} title={member.name}>
                        <Avatar src={member.profileImage} alt={member.name} />
                      </Tooltip>
                    ))}
                  </AvatarGroup>
                  <Typography variant="body2" color="textSecondary">
                    {members.length} team members
                  </Typography>
                </Box>
              </Box>
              
              {permissions.canEdit && (
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={() => {
                    // Navigate to edit space page or show a dialog
                    showSnackbar('Space editing coming soon', 'info');
                  }}
                >
                  Edit Space
                </Button>
              )}
            </Box>
          </Card>
          
          {/* Tabs */}
          <Card>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab icon={<DescriptionIcon />} label="Briefs" />
              <Tab icon={<AssignmentTurnedInIcon />} label="Deliverables" />
              <Tab icon={<InsertDriveFileIcon />} label="Guidelines" />
              <Tab icon={<ForumIcon />} label="Discussions" />
              <Tab icon={<PeopleAltIcon />} label="Team" />
              <Tab icon={<ApprovalIcon />} label="Content & Approvals" />
            </Tabs>
            
            <Box sx={{ p: 3 }}>
              {tabValue === 0 && renderBriefsTab()}
              {tabValue === 1 && renderDeliverablesTab()}
              {tabValue === 2 && renderGuidelinesTab()}
              {tabValue === 3 && renderDiscussionsTab()}
              {tabValue === 4 && renderTeamTab()}
              {tabValue === 5 && <ApprovalTab teamId={currentTeam?.id} spaceId={spaceId} />}
            </Box>
          </Card>
        </>
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="textSecondary" gutterBottom>
            Collaboration space not found
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate('/team')}
            sx={{ mt: 2 }}
          >
            Back to Teams
          </Button>
        </Paper>
      )}
      
      {/* Item Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Edit" />
        </MenuItem>
        <MenuItem onClick={handleDeleteItem}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText primary="Delete" sx={{ color: 'error.main' }} />
        </MenuItem>
      </Menu>
      
      {/* Create Brief Dialog */}
      <Dialog open={createBriefOpen} onClose={handleCreateBriefClose}>
        <DialogTitle>Create Campaign Brief</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Create a campaign brief to outline requirements and expectations.
          </DialogContentText>
          
          <TextField
            autoFocus
            margin="dense"
            label="Title"
            fullWidth
            value={briefData.title}
            onChange={(e) => setBriefData({ ...briefData, title: e.target.value })}
            sx={{ mb: 2 }}
          />
          
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={4}
            value={briefData.description}
            onChange={(e) => setBriefData({ ...briefData, description: e.target.value })}
            sx={{ mb: 2 }}
          />
          
          <TextField
            margin="dense"
            label="Due Date"
            type="date"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={briefData.dueDate}
            onChange={(e) => setBriefData({ ...briefData, dueDate: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCreateBriefClose}>Cancel</Button>
          <Button 
            onClick={handleCreateBriefSubmit} 
            variant="contained" 
            color="primary"
            disabled={!briefData.title}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Create Deliverable Dialog */}
      <Dialog open={createDeliverableOpen} onClose={handleCreateDeliverableClose}>
        <DialogTitle>Add Deliverable</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Add a new deliverable to track campaign progress.
          </DialogContentText>
          
          <TextField
            autoFocus
            margin="dense"
            label="Title"
            fullWidth
            value={deliverableData.title}
            onChange={(e) => setDeliverableData({ ...deliverableData, title: e.target.value })}
            sx={{ mb: 2 }}
          />
          
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={3}
            value={deliverableData.description}
            onChange={(e) => setDeliverableData({ ...deliverableData, description: e.target.value })}
            sx={{ mb: 2 }}
          />
          
          <TextField
            margin="dense"
            label="Due Date"
            type="date"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={deliverableData.dueDate}
            onChange={(e) => setDeliverableData({ ...deliverableData, dueDate: e.target.value })}
            sx={{ mb: 2 }}
          />
          
          <FormControl fullWidth>
            <InputLabel id="assignee-select-label">Assigned To</InputLabel>
            <Select
              labelId="assignee-select-label"
              value={deliverableData.assignedToId}
              label="Assigned To"
              onChange={(e) => setDeliverableData({ ...deliverableData, assignedToId: e.target.value })}
            >
              <MenuItem value="">
                <em>Unassigned</em>
              </MenuItem>
              {members.map(member => (
                <MenuItem key={member.id} value={member.id}>
                  {member.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCreateDeliverableClose}>Cancel</Button>
          <Button 
            onClick={handleCreateDeliverableSubmit} 
            variant="contained" 
            color="primary"
            disabled={!deliverableData.title}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Create Guideline Dialog */}
      <Dialog open={createGuidelineOpen} onClose={handleCreateGuidelineClose}>
        <DialogTitle>Add Content Guideline</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Add content guidelines to ensure brand consistency.
          </DialogContentText>
          
          <TextField
            autoFocus
            margin="dense"
            label="Title"
            fullWidth
            value={guidelineData.title}
            onChange={(e) => setGuidelineData({ ...guidelineData, title: e.target.value })}
            sx={{ mb: 2 }}
          />
          
          <TextField
            margin="dense"
            label="Content"
            fullWidth
            multiline
            rows={6}
            value={guidelineData.content}
            onChange={(e) => setGuidelineData({ ...guidelineData, content: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCreateGuidelineClose}>Cancel</Button>
          <Button 
            onClick={handleCreateGuidelineSubmit} 
            variant="contained" 
            color="primary"
            disabled={!guidelineData.title || !guidelineData.content}
          >
            Add
          </Button>
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

export default CollaborationSpace;
