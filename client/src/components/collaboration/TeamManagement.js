import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Card,
  Button,
  Tabs,
  Tab,
  Typography,
  CircularProgress,
  Divider,
  Box,
  Paper,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Avatar,
  Chip,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Grid,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Group as GroupIcon,
  Mail as MailIcon,
  PersonAdd as PersonAddIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { 
  fetchUserTeams, 
  createTeam, 
  updateTeam, 
  deleteTeam, 
  inviteTeamMember, 
  removeTeamMember, 
  updateTeamMemberRole,
  fetchTeamRoles,
  setCurrentTeam,
  selectAllTeams,
  selectCurrentTeam,
  selectTeamMembers,
  selectTeamInvitations,
  selectAllRoles,
  selectTeamStatus,
  selectTeamError,
} from '../../redux/slices/teamSlice';
import teamService from '../../services/teamService';
import permissionService from '../../services/permissionService';

/**
 * Team Management Component
 * 
 * A comprehensive interface for managing teams, including:
 * - Team creation and settings
 * - Member management and role assignment
 * - Invitation handling
 */
const TeamManagement = () => {
  const dispatch = useDispatch();
  
  // Redux state
  const teams = useSelector(selectAllTeams);
  const currentTeam = useSelector(selectCurrentTeam);
  const roles = useSelector(selectAllRoles);
  const status = useSelector(selectTeamStatus);
  const error = useSelector(selectTeamError);
  
  // Local state
  const [tabValue, setTabValue] = useState(0);
  const [createTeamOpen, setCreateTeamOpen] = useState(false);
  const [editTeamOpen, setEditTeamOpen] = useState(false);
  const [deleteTeamOpen, setDeleteTeamOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [newTeam, setNewTeam] = useState({ name: '', description: '' });
  const [editingTeam, setEditingTeam] = useState(null);
  const [invitation, setInvitation] = useState({ email: '', roleId: '' });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [canManageMembers, setCanManageMembers] = useState(false);
  const [canManageSettings, setCanManageSettings] = useState(false);
  
  // Get members and invitations for the current team
  const members = useSelector(state => 
    currentTeam ? selectTeamMembers(state, currentTeam.id) : []
  );
  
  const invitations = useSelector(state => 
    currentTeam ? selectTeamInvitations(state, currentTeam.id) : []
  );

  // Load teams on component mount
  useEffect(() => {
    dispatch(fetchUserTeams());
    dispatch(fetchTeamRoles());
  }, [dispatch]);
  
  // Check permissions whenever the current team changes
  useEffect(() => {
    if (currentTeam) {
      checkTeamPermissions();
    }
  }, [currentTeam]);
  
  // Function to check user permissions for the current team
  const checkTeamPermissions = async () => {
    if (!currentTeam) return;
    
    const [canManageMembers, canManageSettings] = await Promise.all([
      permissionService.canManageTeamMembers(currentTeam.id),
      permissionService.canManageTeamSettings(currentTeam.id),
    ]);
    
    setCanManageMembers(canManageMembers);
    setCanManageSettings(canManageSettings);
  };
  
  // Tab change handler
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  // Team selection handler
  const handleTeamSelect = (team) => {
    dispatch(setCurrentTeam(team));
    setTabValue(0); // Switch to members tab
  };
  
  // Create team dialog handlers
  const handleCreateTeamOpen = () => {
    setNewTeam({ name: '', description: '' });
    setCreateTeamOpen(true);
  };
  
  const handleCreateTeamClose = () => {
    setCreateTeamOpen(false);
  };
  
  const handleCreateTeamSubmit = () => {
    dispatch(createTeam(newTeam))
      .unwrap()
      .then(() => {
        setCreateTeamOpen(false);
        showSnackbar('Team created successfully', 'success');
      })
      .catch((err) => {
        showSnackbar(`Failed to create team: ${err.message}`, 'error');
      });
  };
  
  // Edit team dialog handlers
  const handleEditTeamOpen = () => {
    if (!currentTeam) return;
    
    setEditingTeam({
      id: currentTeam.id,
      name: currentTeam.name,
      description: currentTeam.description || '',
    });
    
    setEditTeamOpen(true);
  };
  
  const handleEditTeamClose = () => {
    setEditTeamOpen(false);
  };
  
  const handleEditTeamSubmit = () => {
    if (!editingTeam) return;
    
    dispatch(updateTeam({ teamId: editingTeam.id, teamData: editingTeam }))
      .unwrap()
      .then(() => {
        setEditTeamOpen(false);
        showSnackbar('Team updated successfully', 'success');
      })
      .catch((err) => {
        showSnackbar(`Failed to update team: ${err.message}`, 'error');
      });
  };
  
  // Delete team dialog handlers
  const handleDeleteTeamOpen = () => {
    setDeleteTeamOpen(true);
  };
  
  const handleDeleteTeamClose = () => {
    setDeleteTeamOpen(false);
  };
  
  const handleDeleteTeamConfirm = () => {
    if (!currentTeam) return;
    
    dispatch(deleteTeam(currentTeam.id))
      .unwrap()
      .then(() => {
        setDeleteTeamOpen(false);
        showSnackbar('Team deleted successfully', 'success');
      })
      .catch((err) => {
        showSnackbar(`Failed to delete team: ${err.message}`, 'error');
      });
  };
  
  // Invite member dialog handlers
  const handleInviteOpen = () => {
    setInvitation({ email: '', roleId: roles.length > 0 ? roles[0].id : '' });
    setInviteOpen(true);
  };
  
  const handleInviteClose = () => {
    setInviteOpen(false);
  };
  
  const handleInviteSubmit = () => {
    if (!currentTeam) return;
    
    dispatch(inviteTeamMember({ teamId: currentTeam.id, invitation }))
      .unwrap()
      .then(() => {
        setInviteOpen(false);
        showSnackbar('Invitation sent successfully', 'success');
      })
      .catch((err) => {
        showSnackbar(`Failed to send invitation: ${err.message}`, 'error');
      });
  };
  
  // Handle removing a team member
  const handleRemoveMember = (memberId) => {
    if (!currentTeam) return;
    
    dispatch(removeTeamMember({ teamId: currentTeam.id, memberId }))
      .unwrap()
      .then(() => {
        showSnackbar('Member removed successfully', 'success');
      })
      .catch((err) => {
        showSnackbar(`Failed to remove member: ${err.message}`, 'error');
      });
  };
  
  // Handle updating a member's role
  const handleUpdateMemberRole = (memberId, roleId) => {
    if (!currentTeam) return;
    
    dispatch(updateTeamMemberRole({ teamId: currentTeam.id, memberId, roleId }))
      .unwrap()
      .then(() => {
        showSnackbar('Member role updated successfully', 'success');
      })
      .catch((err) => {
        showSnackbar(`Failed to update member role: ${err.message}`, 'error');
      });
  };
  
  // Snackbar handlers
  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };
  
  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };
  
  // Render the team sidebar
  const renderTeamSidebar = () => (
    <Paper sx={{ p: 2, height: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Your Teams</Typography>
        <Button
          variant="contained"
          color="primary"
          size="small"
          startIcon={<AddIcon />}
          onClick={handleCreateTeamOpen}
        >
          New Team
        </Button>
      </Box>
      
      <Divider sx={{ mb: 2 }} />
      
      {teams.length === 0 ? (
        <Typography variant="body2" color="textSecondary" align="center">
          You don't have any teams yet
        </Typography>
      ) : (
        <List>
          {teams.map((team) => (
            <ListItem
              key={team.id}
              button
              selected={currentTeam && currentTeam.id === team.id}
              onClick={() => handleTeamSelect(team)}
            >
              <ListItemText
                primary={team.name}
                secondary={`${team.members?.length || 0} members`}
              />
            </ListItem>
          ))}
        </List>
      )}
    </Paper>
  );
  
  // Render the team members tab
  const renderMembersTab = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Team Members</Typography>
        {canManageMembers && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<PersonAddIcon />}
            onClick={handleInviteOpen}
          >
            Invite Member
          </Button>
        )}
      </Box>
      
      {members.length === 0 ? (
        <Typography variant="body1" color="textSecondary" align="center" sx={{ my: 4 }}>
          No members in this team yet
        </Typography>
      ) : (
        <List>
          {members.map((member) => {
            const role = roles.find(r => r.id === member.roleId);
            
            return (
              <ListItem key={member.id} divider>
                <Avatar 
                  src={member.profileImage} 
                  alt={member.name}
                  sx={{ mr: 2 }}
                />
                <ListItemText
                  primary={
                    <Box>
                      {member.name}
                      {member.isOwner && (
                        <Chip 
                          label="Owner" 
                          size="small" 
                          color="primary" 
                          sx={{ ml: 1 }}
                        />
                      )}
                    </Box>
                  }
                  secondary={member.email}
                />
                
                {canManageMembers && !member.isOwner && (
                  <ListItemSecondaryAction>
                    <FormControl size="small" sx={{ minWidth: 120, mr: 1 }}>
                      <InputLabel id={`role-select-label-${member.id}`}>Role</InputLabel>
                      <Select
                        labelId={`role-select-label-${member.id}`}
                        value={member.roleId || ''}
                        label="Role"
                        onChange={(e) => handleUpdateMemberRole(member.id, e.target.value)}
                      >
                        {roles.map((role) => (
                          <MenuItem key={role.id} value={role.id}>
                            {role.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    
                    <IconButton 
                      edge="end" 
                      color="error"
                      onClick={() => handleRemoveMember(member.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                )}
              </ListItem>
            );
          })}
        </List>
      )}
      
      {invitations.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Pending Invitations</Typography>
          
          <List>
            {invitations.map((invitation) => {
              const role = roles.find(r => r.id === invitation.roleId);
              
              return (
                <ListItem key={invitation.id} divider>
                  <ListItemText
                    primary={invitation.email}
                    secondary={`Role: ${role ? role.name : 'Unknown'} • Sent: ${new Date(invitation.createdAt).toLocaleDateString()}`}
                  />
                  
                  {canManageMembers && (
                    <ListItemSecondaryAction>
                      <IconButton 
                        edge="end" 
                        color="error"
                        onClick={() => {
                          teamService.cancelInvitation(currentTeam.id, invitation.id)
                            .then(() => {
                              dispatch(fetchUserTeams());
                              showSnackbar('Invitation cancelled successfully', 'success');
                            })
                            .catch((err) => {
                              showSnackbar(`Failed to cancel invitation: ${err.message}`, 'error');
                            });
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  )}
                </ListItem>
              );
            })}
          </List>
        </Box>
      )}
    </Box>
  );
  
  // Render the team settings tab
  const renderSettingsTab = () => (
    <Box>
      <Typography variant="h6" sx={{ mb: 3 }}>Team Settings</Typography>
      
      <Card sx={{ mb: 3, p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h6">{currentTeam?.name}</Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              {currentTeam?.description || 'No description provided'}
            </Typography>
          </Box>
          
          {canManageSettings && (
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={handleEditTeamOpen}
            >
              Edit
            </Button>
          )}
        </Box>
      </Card>
      
      {canManageSettings && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" color="error" sx={{ mb: 2 }}>Danger Zone</Typography>
          
          <Card sx={{ p: 3, bgcolor: 'error.light' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="subtitle1" color="error.dark">Delete this team</Typography>
                <Typography variant="body2" color="error.dark">
                  Once deleted, this team and all its data will be permanently removed.
                </Typography>
              </Box>
              
              <Button
                variant="contained"
                color="error"
                onClick={handleDeleteTeamOpen}
              >
                Delete Team
              </Button>
            </Box>
          </Card>
        </Box>
      )}
    </Box>
  );
  
  // Main render
  return (
    <Box sx={{ flexGrow: 1 }}>
      {status === 'loading' ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {/* Team Sidebar */}
          <Grid item xs={12} sm={4} md={3}>
            {renderTeamSidebar()}
          </Grid>
          
          {/* Team Content */}
          <Grid item xs={12} sm={8} md={9}>
            {currentTeam ? (
              <Paper sx={{ p: 3 }}>
                <Tabs
                  value={tabValue}
                  onChange={handleTabChange}
                  sx={{ mb: 3 }}
                >
                  <Tab icon={<GroupIcon />} label="Members" />
                  <Tab icon={<SettingsIcon />} label="Settings" />
                </Tabs>
                
                {tabValue === 0 && renderMembersTab()}
                {tabValue === 1 && renderSettingsTab()}
              </Paper>
            ) : (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h6" color="textSecondary" gutterBottom>
                  Select a team or create a new one
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={handleCreateTeamOpen}
                  sx={{ mt: 2 }}
                >
                  Create Team
                </Button>
              </Paper>
            )}
          </Grid>
        </Grid>
      )}
      
      {/* Create Team Dialog */}
      <Dialog open={createTeamOpen} onClose={handleCreateTeamClose}>
        <DialogTitle>Create New Team</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Create a new team to collaborate with other users.
          </DialogContentText>
          
          <TextField
            autoFocus
            margin="dense"
            label="Team Name"
            fullWidth
            value={newTeam.name}
            onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
            sx={{ mb: 2 }}
          />
          
          <TextField
            margin="dense"
            label="Description (optional)"
            fullWidth
            multiline
            rows={3}
            value={newTeam.description}
            onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCreateTeamClose}>Cancel</Button>
          <Button 
            onClick={handleCreateTeamSubmit} 
            variant="contained" 
            color="primary"
            disabled={!newTeam.name}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Edit Team Dialog */}
      <Dialog open={editTeamOpen} onClose={handleEditTeamClose}>
        <DialogTitle>Edit Team</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Team Name"
            fullWidth
            value={editingTeam?.name || ''}
            onChange={(e) => setEditingTeam({ ...editingTeam, name: e.target.value })}
            sx={{ mb: 2 }}
          />
          
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={3}
            value={editingTeam?.description || ''}
            onChange={(e) => setEditingTeam({ ...editingTeam, description: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditTeamClose}>Cancel</Button>
          <Button 
            onClick={handleEditTeamSubmit} 
            variant="contained" 
            color="primary"
            disabled={!editingTeam?.name}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Team Confirmation Dialog */}
      <Dialog open={deleteTeamOpen} onClose={handleDeleteTeamClose}>
        <DialogTitle>Delete Team?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the team "{currentTeam?.name}"? This action cannot be undone,
            and all team data, including members, spaces, and content will be permanently deleted.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteTeamClose}>Cancel</Button>
          <Button onClick={handleDeleteTeamConfirm} variant="contained" color="error">
            Delete Team
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Invite Member Dialog */}
      <Dialog open={inviteOpen} onClose={handleInviteClose}>
        <DialogTitle>Invite Team Member</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Send an invitation to add a new member to your team.
          </DialogContentText>
          
          <TextField
            autoFocus
            margin="dense"
            label="Email Address"
            type="email"
            fullWidth
            value={invitation.email}
            onChange={(e) => setInvitation({ ...invitation, email: e.target.value })}
            sx={{ mb: 2 }}
          />
          
          <FormControl fullWidth>
            <InputLabel id="invite-role-select-label">Role</InputLabel>
            <Select
              labelId="invite-role-select-label"
              value={invitation.roleId}
              label="Role"
              onChange={(e) => setInvitation({ ...invitation, roleId: e.target.value })}
            >
              {roles.map((role) => (
                <MenuItem key={role.id} value={role.id}>
                  {role.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleInviteClose}>Cancel</Button>
          <Button 
            onClick={handleInviteSubmit} 
            variant="contained" 
            color="primary"
            disabled={!invitation.email || !invitation.roleId}
          >
            Send Invitation
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

export default TeamManagement;
