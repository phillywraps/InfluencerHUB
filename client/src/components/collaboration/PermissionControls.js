import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  Typography,
  Checkbox,
  Switch,
  FormGroup,
  FormControlLabel,
  Button,
  CircularProgress,
  Divider,
  Grid,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tabs,
  Tab,
  Tooltip,
  IconButton,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Save as SaveIcon,
  Info as InfoIcon,
  LockOpen as LockOpenIcon,
  Lock as LockIcon,
  Help as HelpIcon,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTeamRoles, selectAllRoles, selectTeamStatus } from '../../redux/slices/teamSlice';
import permissionService from '../../services/permissionService';
import teamService from '../../services/teamService';

/**
 * Role and Permission Management Component
 * 
 * Provides an interface for viewing and managing role-based permissions.
 * Allows administrators to configure what actions different roles can perform.
 */
const PermissionControls = ({ teamId }) => {
  const dispatch = useDispatch();
  
  // Redux state
  const roles = useSelector(selectAllRoles);
  const status = useSelector(selectTeamStatus);
  
  // Local state
  const [selectedRole, setSelectedRole] = useState(null);
  const [permissions, setPermissions] = useState({});
  const [permissionGroups, setPermissionGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [canManageRoles, setCanManageRoles] = useState(false);
  
  // Fetch roles on component mount
  useEffect(() => {
    if (!roles || roles.length === 0) {
      dispatch(fetchTeamRoles());
    } else if (!selectedRole && roles.length > 0) {
      setSelectedRole(roles[0]);
    }
  }, [dispatch, roles]);
  
  // Check permissions whenever teamId changes
  useEffect(() => {
    if (teamId) {
      checkRoleManagementPermission();
    }
  }, [teamId]);
  
  // Load permissions when selected role changes
  useEffect(() => {
    if (selectedRole) {
      loadRolePermissions(selectedRole.id);
    }
  }, [selectedRole]);
  
  // Function to check if user can manage roles
  const checkRoleManagementPermission = async () => {
    const canManage = await permissionService.hasPermission('team:manage_roles', 'team', teamId);
    setCanManageRoles(canManage);
  };
  
  // Load permissions for a role
  const loadRolePermissions = async (roleId) => {
    setLoading(true);
    
    try {
      const permissionData = await permissionService.getRolePermissions(roleId);
      
      // Organize permissions into groups
      const permissionsByGroup = {};
      const groups = [];
      
      permissionData.forEach(permission => {
        const [group] = permission.name.split(':');
        
        if (!permissionsByGroup[group]) {
          permissionsByGroup[group] = [];
          groups.push(group);
        }
        
        permissionsByGroup[group].push(permission);
      });
      
      // Create a simpler permissions object for checkboxes
      const permissionsState = {};
      permissionData.forEach(permission => {
        permissionsState[permission.name] = permission.granted;
      });
      
      setPermissionGroups(groups.sort());
      setPermissions({ byGroup: permissionsByGroup, state: permissionsState });
    } catch (error) {
      console.error('Error loading permissions:', error);
      showSnackbar('Failed to load permissions', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle role selection
  const handleRoleChange = (event, newRoleId) => {
    const role = roles.find(r => r.id === newRoleId);
    if (role) {
      setSelectedRole(role);
    }
  };
  
  // Handle permission change
  const handlePermissionChange = (event) => {
    const { name, checked } = event.target;
    
    setPermissions(prev => ({
      ...prev,
      state: {
        ...prev.state,
        [name]: checked
      }
    }));
  };
  
  // Handle group permission change (toggle all permissions in a group)
  const handleGroupPermissionChange = (group, checked) => {
    const updatedState = { ...permissions.state };
    
    permissions.byGroup[group].forEach(permission => {
      updatedState[permission.name] = checked;
    });
    
    setPermissions(prev => ({
      ...prev,
      state: updatedState
    }));
  };
  
  // Check if all permissions in a group are enabled
  const isGroupEnabled = (group) => {
    if (!permissions.byGroup || !permissions.byGroup[group]) return false;
    
    return permissions.byGroup[group].every(permission => 
      permissions.state[permission.name]
    );
  };
  
  // Check if some (but not all) permissions in a group are enabled
  const isGroupIndeterminate = (group) => {
    if (!permissions.byGroup || !permissions.byGroup[group]) return false;
    
    const enabled = permissions.byGroup[group].filter(permission => 
      permissions.state[permission.name]
    );
    
    return enabled.length > 0 && enabled.length < permissions.byGroup[group].length;
  };
  
  // Save updated permissions
  const savePermissions = async () => {
    if (!selectedRole) return;
    
    setSaveLoading(true);
    
    try {
      // Format permissions for API
      const permissionsToUpdate = Object.entries(permissions.state).map(([name, granted]) => ({
        name,
        granted
      }));
      
      await teamService.updateRolePermissions(selectedRole.id, permissionsToUpdate);
      showSnackbar('Permissions updated successfully', 'success');
    } catch (error) {
      console.error('Error saving permissions:', error);
      showSnackbar('Failed to update permissions', 'error');
    } finally {
      setSaveLoading(false);
    }
  };
  
  // Snackbar handlers
  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };
  
  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };
  
  // Get description for a permission
  const getPermissionDescription = (permission) => {
    const descriptions = {
      'team:view': 'View team details and members',
      'team:edit': 'Edit team details and settings',
      'team:delete': 'Delete the team',
      'team:manage_members': 'Add, remove, and manage team members',
      'team:manage_roles': 'Manage role permissions',
      'team:create_spaces': 'Create collaboration spaces',
      'team:owner': 'Full control over the team',
      'team:admin': 'Administrative access to most team features',
      
      'content:view': 'View content within collaboration spaces',
      'content:create': 'Create new content',
      'content:edit': 'Edit content',
      'content:delete': 'Delete content',
      'content:approve': 'Approve content for publishing',
      'content:publish': 'Publish approved content',
      'content:comment': 'Comment on content',
      
      'space:view': 'View collaboration spaces',
      'space:create': 'Create new collaboration spaces',
      'space:edit': 'Edit collaboration space details',
      'space:delete': 'Delete collaboration spaces',
      'space:manage': 'Manage collaboration space settings',
      'space:invite': 'Invite users to collaboration spaces',
      
      'analytics:view': 'View analytics data',
      'analytics:export': 'Export analytics data',
      'analytics:share': 'Share analytics reports',
      
      'message:send': 'Send messages within the team',
      'message:view': 'View messages',
      
      'file:upload': 'Upload files',
      'file:download': 'Download files',
      'file:delete': 'Delete files',
    };
    
    return descriptions[permission] || 'No description available';
  };
  
  // Render role tabs
  const renderRoleTabs = () => (
    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
      <Tabs
        value={selectedRole?.id}
        onChange={handleRoleChange}
        variant="scrollable"
        scrollButtons="auto"
      >
        {roles.map(role => (
          <Tab 
            key={role.id} 
            label={role.name} 
            value={role.id}
            icon={role.isSystem ? <LockIcon fontSize="small" /> : <LockOpenIcon fontSize="small" />}
            iconPosition="start"
          />
        ))}
      </Tabs>
    </Box>
  );
  
  // Render permission groups
  const renderPermissionGroups = () => (
    <Box sx={{ mt: 3 }}>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {permissionGroups.map(group => (
            <Accordion key={group}>
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{ 
                  bgcolor: isGroupEnabled(group) 
                    ? 'success.light' 
                    : isGroupIndeterminate(group) 
                      ? 'warning.light' 
                      : 'background.paper'
                }}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={isGroupEnabled(group)}
                      indeterminate={isGroupIndeterminate(group)}
                      onChange={(e) => handleGroupPermissionChange(group, e.target.checked)}
                      disabled={!canManageRoles || (selectedRole && selectedRole.isSystem)}
                    />
                  }
                  label={
                    <Typography variant="subtitle1" sx={{ textTransform: 'capitalize' }}>
                      {group} Permissions
                    </Typography>
                  }
                  onClick={(e) => e.stopPropagation()}
                />
              </AccordionSummary>
              
              <AccordionDetails>
                <FormGroup>
                  {permissions.byGroup[group]?.map(permission => (
                    <Box key={permission.name} sx={{ display: 'flex', alignItems: 'center' }}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            name={permission.name}
                            checked={permissions.state[permission.name] || false}
                            onChange={handlePermissionChange}
                            disabled={!canManageRoles || (selectedRole && selectedRole.isSystem)}
                          />
                        }
                        label={permission.displayName || permission.name.split(':')[1]}
                      />
                      
                      <Tooltip title={getPermissionDescription(permission.name)}>
                        <IconButton size="small">
                          <HelpIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  ))}
                </FormGroup>
              </AccordionDetails>
            </Accordion>
          ))}
          
          {canManageRoles && selectedRole && !selectedRole.isSystem && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
                onClick={savePermissions}
                disabled={saveLoading}
              >
                {saveLoading ? <CircularProgress size={24} /> : 'Save Changes'}
              </Button>
            </Box>
          )}
          
          {selectedRole && selectedRole.isSystem && (
            <Alert severity="info" sx={{ mt: 3 }}>
              System roles cannot be modified. They provide predefined sets of permissions 
              for common team roles.
            </Alert>
          )}
          
          {!canManageRoles && (
            <Alert severity="warning" sx={{ mt: 3 }}>
              You do not have permission to manage roles. Contact a team administrator
              for help with permission changes.
            </Alert>
          )}
        </>
      )}
    </Box>
  );
  
  return (
    <Box>
      <Card sx={{ mb: 3 }}>
        <Box sx={{ p: 2 }}>
          <Typography variant="h6">Role Permissions</Typography>
          <Typography variant="body2" color="textSecondary">
            Configure what each role in your team can do
          </Typography>
        </Box>
        
        <Divider />
        
        {roles && roles.length > 0 ? (
          <>
            {renderRoleTabs()}
            {renderPermissionGroups()}
          </>
        ) : status === 'loading' ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body1" color="textSecondary">
              No roles available
            </Typography>
          </Box>
        )}
      </Card>
      
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

export default PermissionControls;
