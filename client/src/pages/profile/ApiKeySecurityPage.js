import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  Grid,
  Button,
  Tabs,
  Tab,
  Divider,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import SecurityIcon from '@mui/icons-material/Security';
import KeyIcon from '@mui/icons-material/Key';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import HistoryIcon from '@mui/icons-material/History';
import WarningIcon from '@mui/icons-material/Warning';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import NotificationsIcon from '@mui/icons-material/Notifications';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';

import apiKeyRotationService from '../../services/apiKeyRotationService';
import ApiKeyRotationSettings from '../../components/profile/ApiKeyRotationSettings';
import { getInfluencerProfile } from '../../redux/slices/influencerSlice';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';

// Tab Panel component for tabbed content
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`security-tabpanel-${index}`}
      aria-labelledby={`security-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const ApiKeySecurityPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { profile, loading: profileLoading, error: profileError } = useSelector(
    (state) => state.influencer
  );
  const { user } = useSelector((state) => state.auth);
  
  // State for tab navigation
  const [tabValue, setTabValue] = useState(0);
  
  // State for rotation settings
  const [rotationSettings, setRotationSettings] = useState({});
  const [globalSettings, setGlobalSettings] = useState({
    enabled: true,
    frequency: 30,
    notifyBefore: 7,
    autoRotate: false,
    notifyOnRotation: true,
  });
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsError, setSettingsError] = useState(null);
  
  // State for API key history
  const [rotationHistory, setRotationHistory] = useState({});
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState(null);
  
  // State for upcoming rotations
  const [upcomingRotations, setUpcomingRotations] = useState([]);
  const [upcomingLoading, setUpcomingLoading] = useState(true);
  
  // State for global preferences
  const [applyToAllPlatforms, setApplyToAllPlatforms] = useState(false);
  
  // Load the influencer profile data
  useEffect(() => {
    dispatch(getInfluencerProfile());
  }, [dispatch]);
  
  // Load rotation settings for all platforms
  useEffect(() => {
    const loadRotationSettings = async () => {
      if (!profile?.socialAccounts) return;
      
      setSettingsLoading(true);
      setSettingsError(null);
      
      try {
        const settingsMap = {};
        
        // In a real implementation, this would be a batch request
        // For now, we'll use mock data for demonstration
        for (const account of profile.socialAccounts) {
          // For demo purposes using mock data
          const settings = apiKeyRotationService.getMockRotationSettings(account._id);
          settingsMap[account._id] = settings;
        }
        
        setRotationSettings(settingsMap);
      } catch (error) {
        setSettingsError(error.message || 'Failed to load rotation settings');
      } finally {
        setSettingsLoading(false);
      }
    };
    
    loadRotationSettings();
  }, [profile]);
  
  // Load rotation history for all platforms
  useEffect(() => {
    const loadRotationHistory = async () => {
      if (!profile?.socialAccounts) return;
      
      setHistoryLoading(true);
      setHistoryError(null);
      
      try {
        const historyMap = {};
        
        // In a real implementation, this would be a batch request
        // For now, we'll use mock data for demonstration
        for (const account of profile.socialAccounts) {
          // For demo purposes using mock data
          const history = apiKeyRotationService.getMockRotationHistory(account._id);
          historyMap[account._id] = history;
        }
        
        setRotationHistory(historyMap);
      } catch (error) {
        setHistoryError(error.message || 'Failed to load rotation history');
      } finally {
        setHistoryLoading(false);
      }
    };
    
    loadRotationHistory();
  }, [profile]);
  
  // Load upcoming rotations
  useEffect(() => {
    const loadUpcomingRotations = async () => {
      if (!profile?.socialAccounts) return;
      
      setUpcomingLoading(true);
      
      try {
        // For demo purposes, generate some upcoming rotations
        const upcoming = profile.socialAccounts.map(account => {
          const daysUntil = Math.floor(Math.random() * 30) + 1;
          const date = new Date();
          date.setDate(date.getDate() + daysUntil);
          
          return {
            platformId: account._id,
            platform: account.platform,
            date: date.toISOString(),
            daysUntil,
          };
        });
        
        // Sort by days until rotation
        upcoming.sort((a, b) => a.daysUntil - b.daysUntil);
        
        setUpcomingRotations(upcoming);
      } catch (error) {
        console.error('Failed to load upcoming rotations:', error);
      } finally {
        setUpcomingLoading(false);
      }
    };
    
    loadUpcomingRotations();
  }, [profile]);
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  // Handle saving rotation settings for a specific platform
  const handleSaveRotationSettings = async (platformId, settings) => {
    try {
      // In a real implementation, this would call the API
      // For demo purposes, just update the local state
      setRotationSettings({
        ...rotationSettings,
        [platformId]: {
          ...settings,
          lastRotated: settings.lastRotated || new Date().toISOString(),
        },
      });
      
      return true;
    } catch (error) {
      console.error('Failed to save rotation settings:', error);
      throw error;
    }
  };
  
  // Handle applying global settings to all platforms
  const handleApplyToAll = async () => {
    try {
      // In a real implementation, this would call the API
      // For demo purposes, just update the local state
      const updatedSettings = {};
      
      for (const platformId in rotationSettings) {
        updatedSettings[platformId] = {
          ...rotationSettings[platformId],
          enabled: globalSettings.enabled,
          frequency: globalSettings.frequency,
          notifyBefore: globalSettings.notifyBefore,
          autoRotate: globalSettings.autoRotate,
          notifyOnRotation: globalSettings.notifyOnRotation,
        };
      }
      
      setRotationSettings(updatedSettings);
      
      // Show some feedback to the user
      alert('Global settings applied to all platforms');
    } catch (error) {
      console.error('Failed to apply global settings:', error);
    }
  };
  
  // Handle toggling apply to all platforms
  const handleApplyToAllToggle = (event) => {
    setApplyToAllPlatforms(event.target.checked);
  };
  
  // Calculate the status for each platform
  const getApiKeyStatus = (platformId) => {
    const settings = rotationSettings[platformId];
    
    if (!settings || !settings.enabled) {
      return {
        status: 'disabled',
        label: 'Disabled',
        color: 'default',
        icon: <ErrorIcon />,
      };
    }
    
    if (!settings.lastRotated) {
      return {
        status: 'never_rotated',
        label: 'Never Rotated',
        color: 'warning',
        icon: <WarningIcon />,
      };
    }
    
    const lastRotated = new Date(settings.lastRotated);
    const now = new Date();
    const daysSinceRotation = Math.floor((now - lastRotated) / (1000 * 60 * 60 * 24));
    
    if (daysSinceRotation >= settings.frequency) {
      return {
        status: 'needs_rotation',
        label: 'Needs Rotation',
        color: 'error',
        icon: <WarningIcon />,
      };
    }
    
    if (daysSinceRotation >= settings.frequency - settings.notifyBefore) {
      return {
        status: 'upcoming',
        label: 'Rotation Soon',
        color: 'warning',
        icon: <AutorenewIcon />,
      };
    }
    
    return {
      status: 'good',
      label: 'Good',
      color: 'success',
      icon: <CheckCircleIcon />,
    };
  };
  
  // Format a date from ISO string to a readable format
  const formatDate = (isoDate) => {
    if (!isoDate) return 'N/A';
    
    const date = new Date(isoDate);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };
  
  // Redirect if not authenticated or not an influencer
  useEffect(() => {
    if (user && user.userType !== 'influencer') {
      navigate('/dashboard');
    } else if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Show loading spinner if data is being loaded
  if (profileLoading || (settingsLoading && !Object.keys(rotationSettings).length)) {
    return <LoadingSpinner />;
  }

  // Show error message if there's an error
  if (profileError) {
    return (
      <ErrorMessage
        message="Failed to load profile data"
        error={profileError}
        showRetryButton
        onRetry={() => dispatch(getInfluencerProfile())}
      />
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        API Key Security Settings
      </Typography>
      
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <SecurityIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h5">
            Manage API Key Rotation
          </Typography>
        </Box>
        
        <Alert severity="info" sx={{ mb: 3 }}>
          API key rotation is a security best practice that helps protect your accounts by periodically generating new keys. 
          This invalidates any potentially leaked or compromised keys, reducing the risk of unauthorized access.
        </Alert>
        
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          sx={{ mb: 2 }}
        >
          <Tab label="Platform Settings" icon={<KeyIcon />} iconPosition="start" />
          <Tab label="Global Settings" icon={<SecurityIcon />} iconPosition="start" />
          <Tab label="Rotation History" icon={<HistoryIcon />} iconPosition="start" />
        </Tabs>
        
        <Divider />
        
        {/* Platform Settings Tab */}
        <TabPanel value={tabValue} index={0}>
          {profile?.socialAccounts?.length > 0 ? (
            <>
              {/* Upcoming Rotations Section */}
              {upcomingRotations.length > 0 && (
                <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: 'background.default' }}>
                  <Typography variant="h6" gutterBottom>
                    Upcoming Key Rotations
                  </Typography>
                  <List>
                    {upcomingRotations.map((rotation) => (
                      <ListItem key={rotation.platformId}>
                        <ListItemIcon>
                          <AutorenewIcon color={rotation.daysUntil <= 7 ? 'warning' : 'action'} />
                        </ListItemIcon>
                        <ListItemText
                          primary={`${rotation.platform} - ${formatDate(rotation.date)}`}
                          secondary={`${rotation.daysUntil} days until rotation`}
                        />
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleSaveRotationSettings(
                            rotation.platformId,
                            {
                              ...rotationSettings[rotation.platformId],
                              lastRotated: new Date().toISOString(),
                            }
                          )}
                        >
                          Rotate Now
                        </Button>
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              )}
              
              {/* Individual Platform Settings */}
              {profile.socialAccounts.map((account) => (
                <Box key={account._id} sx={{ mb: 4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                      {account.platform} Account ({account.username})
                    </Typography>
                    {rotationSettings[account._id] && (
                      <Chip
                        icon={getApiKeyStatus(account._id).icon}
                        label={getApiKeyStatus(account._id).label}
                        color={getApiKeyStatus(account._id).color}
                        size="small"
                        sx={{ ml: 2 }}
                      />
                    )}
                  </Box>
                  
                  <ApiKeyRotationSettings
                    platformId={account._id}
                    platformName={account.platform}
                    initialSettings={rotationSettings[account._id]}
                    onSave={handleSaveRotationSettings}
                  />
                </Box>
              ))}
            </>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary" gutterBottom>
                You haven't added any social media accounts yet.
              </Typography>
              <Button
                variant="contained"
                onClick={() => navigate('/profile')}
                sx={{ mt: 2 }}
              >
                Add Accounts
              </Button>
            </Box>
          )}
        </TabPanel>
        
        {/* Global Settings Tab */}
        <TabPanel value={tabValue} index={1}>
          <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Global Rotation Settings
            </Typography>
            
            <Alert severity="info" sx={{ mb: 3 }}>
              These settings can be applied to all your platforms at once. Individual platform settings can still be customized afterward.
            </Alert>
            
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={globalSettings.enabled}
                      onChange={(e) => setGlobalSettings({
                        ...globalSettings,
                        enabled: e.target.checked,
                      })}
                      color="primary"
                    />
                  }
                  label="Enable API Key Rotation for all platforms"
                />
              </Grid>
              
              {globalSettings.enabled && (
                <>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Rotation Frequency
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        {[7, 30, 90, 180, 365].map((days) => (
                          <Button
                            key={days}
                            variant={globalSettings.frequency === days ? 'contained' : 'outlined'}
                            size="small"
                            onClick={() => setGlobalSettings({
                              ...globalSettings,
                              frequency: days,
                            })}
                          >
                            {days === 7 ? 'Weekly' :
                             days === 30 ? 'Monthly' :
                             days === 90 ? 'Quarterly' :
                             days === 180 ? 'Semi-Annually' : 'Annually'}
                          </Button>
                        ))}
                      </Box>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Notify Before
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        {[1, 3, 7, 14].map((days) => (
                          <Button
                            key={days}
                            variant={globalSettings.notifyBefore === days ? 'contained' : 'outlined'}
                            size="small"
                            disabled={days >= globalSettings.frequency}
                            onClick={() => setGlobalSettings({
                              ...globalSettings,
                              notifyBefore: days,
                            })}
                          >
                            {days} {days === 1 ? 'day' : 'days'}
                          </Button>
                        ))}
                      </Box>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={globalSettings.autoRotate}
                          onChange={(e) => setGlobalSettings({
                            ...globalSettings,
                            autoRotate: e.target.checked,
                          })}
                          color="primary"
                        />
                      }
                      label="Automatically rotate keys"
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={globalSettings.notifyOnRotation}
                          onChange={(e) => setGlobalSettings({
                            ...globalSettings,
                            notifyOnRotation: e.target.checked,
                          })}
                          color="primary"
                        />
                      }
                      label="Notify me when keys are rotated"
                    />
                  </Grid>
                </>
              )}
              
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={applyToAllPlatforms}
                        onChange={handleApplyToAllToggle}
                        color="primary"
                      />
                    }
                    label="Apply these settings to all platforms"
                  />
                  
                  <Button
                    variant="contained"
                    color="primary"
                    disabled={!applyToAllPlatforms}
                    onClick={handleApplyToAll}
                  >
                    Apply Settings
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Paper>
          
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Rotation Notification Settings
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={true}
                      color="primary"
                    />
                  }
                  label="Email notifications"
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={true}
                      color="primary"
                    />
                  }
                  label="In-app notifications"
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={false}
                      color="primary"
                    />
                  }
                  label="SMS notifications"
                />
              </Grid>
            </Grid>
          </Paper>
        </TabPanel>
        
        {/* Rotation History Tab */}
        <TabPanel value={tabValue} index={2}>
          {historyLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : historyError ? (
            <Alert severity="error" sx={{ mb: 3 }}>
              {historyError}
            </Alert>
          ) : (
            <>
              {profile?.socialAccounts?.length > 0 ? (
                profile.socialAccounts.map((account) => {
                  const history = rotationHistory[account._id] || [];
                  
                  return (
                    <Accordion key={account._id} defaultExpanded={true} sx={{ mb: 2 }}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="h6">
                          {account.platform} ({account.username}) History
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        {history.length > 0 ? (
                          <TableContainer>
                            <Table>
                              <TableHead>
                                <TableRow>
                                  <TableCell>Date</TableCell>
                                  <TableCell>Reason</TableCell>
                                  <TableCell>Initiated By</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {history.map((record) => (
                                  <TableRow key={record.id}>
                                    <TableCell>{formatDate(record.date)}</TableCell>
                                    <TableCell>{record.reason}</TableCell>
                                    <TableCell>
                                      {record.initiatedBy === 'user' ? 'You' : 'System'}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            No rotation history available for this platform.
                          </Typography>
                        )}
                      </AccordionDetails>
                    </Accordion>
                  );
                })
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1" color="text.secondary" gutterBottom>
                    You haven't added any social media accounts yet.
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={() => navigate('/profile')}
                    sx={{ mt: 2 }}
                  >
                    Add Accounts
                  </Button>
                </Box>
              )}
            </>
          )}
        </TabPanel>
      </Paper>
      
      {/* Tips and Best Practices */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          API Key Security Best Practices
        </Typography>
        
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12} md={4}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Regular Rotation
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Regularly rotate your API keys to minimize the risk from leaked or compromised keys.
                  Monthly rotation is recommended for most accounts.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Immediate Rotation
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  If you suspect your API key has been compromised, immediately rotate it to prevent unauthorized access.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Notification Settings
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Enable notifications so you're aware when keys are about to expire or have been rotated.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default ApiKeySecurityPage;
