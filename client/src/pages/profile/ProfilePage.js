import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import ApiKeyManagement from '../../components/profile/ApiKeyManagement';
import ApiKeySecuritySettings from '../../components/profile/ApiKeySecuritySettings';
import SubscriptionTierManagement from '../../components/profile/SubscriptionTierManagement';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Avatar,
  Button,
  TextField,
  Tabs,
  Tab,
  Divider,
  Alert,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import LockIcon from '@mui/icons-material/Lock';
import SecurityIcon from '@mui/icons-material/Security';
import { Link as RouterLink } from 'react-router-dom';
import { updateProfile, changePassword } from '../../redux/slices/authSlice';
import { getInfluencerProfile } from '../../redux/slices/influencerSlice';
import { getAdvertiserProfile } from '../../redux/slices/advertiserSlice';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';

// Tab Panel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const ProfilePage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, loading: authLoading, error: authError } = useSelector((state) => state.auth);
  const { profile: influencerProfile, loading: influencerLoading, error: influencerError } = useSelector(
    (state) => state.influencer
  );
  const { profile: advertiserProfile, loading: advertiserLoading, error: advertiserError } = useSelector(
    (state) => state.advertiser
  );

  const [tabValue, setTabValue] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [profileData, setProfileData] = useState({
    username: '',
    email: '',
    name: '',
    bio: '',
    location: '',
    avatar: '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');

  // Load user profile data
  useEffect(() => {
    if (user) {
      if (user.userType === 'influencer') {
        dispatch(getInfluencerProfile());
      } else if (user.userType === 'advertiser') {
        dispatch(getAdvertiserProfile());
      }

      // Set initial profile data
      setProfileData({
        username: user.username || '',
        email: user.email || '',
        name: user.profile?.name || '',
        bio: user.profile?.bio || '',
        location: user.profile?.location || '',
        avatar: user.profile?.avatar || '',
      });
    }
  }, [dispatch, user]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleEditToggle = () => {
    setEditMode(!editMode);
    // Reset form data if canceling edit
    if (editMode) {
      setProfileData({
        username: user.username || '',
        email: user.email || '',
        name: user.profile?.name || '',
        bio: user.profile?.bio || '',
        location: user.profile?.location || '',
        avatar: user.profile?.avatar || '',
      });
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    dispatch(updateProfile(profileData));
    setEditMode(false);
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    setPasswordError('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    dispatch(changePassword({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword,
    }));

    // Reset password fields
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
  };

  // Show loading spinner if data is being loaded
  if (authLoading || influencerLoading || advertiserLoading) {
    return <LoadingSpinner />;
  }

  // Show error message if there's an error
  if (authError || influencerError || advertiserError) {
    return (
      <ErrorMessage
        message="Failed to load profile"
        error={authError || influencerError || advertiserError}
        showRetryButton
        onRetry={() => {
          if (user.userType === 'influencer') {
            dispatch(getInfluencerProfile());
          } else if (user.userType === 'advertiser') {
            dispatch(getAdvertiserProfile());
          }
        }}
      />
    );
  }

  // Redirect if not authenticated
  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        {/* Profile Header */}
        <Grid item xs={12}>
          <Paper
            sx={{
              p: 3,
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { xs: 'center', sm: 'flex-start' },
              gap: 3,
            }}
          >
            <Avatar
              src={profileData.avatar || '/static/images/avatar/default.jpg'}
              alt={profileData.username}
              sx={{ width: 100, height: 100 }}
            />
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h4" gutterBottom>
                {profileData.name || profileData.username}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                @{profileData.username}
              </Typography>
              <Typography variant="body1" sx={{ mt: 1 }}>
                {profileData.bio || 'No bio provided'}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  {user.userType === 'influencer' ? 'Influencer' : 'Advertiser'}
                </Typography>
                {profileData.location && (
                  <>
                    <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      {profileData.location}
                    </Typography>
                  </>
                )}
              </Box>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1 }}>
              <Button
                variant={editMode ? 'outlined' : 'contained'}
                color={editMode ? 'error' : 'primary'}
                startIcon={editMode ? <CancelIcon /> : <EditIcon />}
                onClick={handleEditToggle}
                sx={{ mb: { xs: 1, sm: 0 } }}
              >
                {editMode ? 'Cancel' : 'Edit Profile'}
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<SecurityIcon />}
                component={RouterLink}
                to="/security-settings"
              >
                Security Settings
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Profile Tabs */}
        <Grid item xs={12}>
          <Paper sx={{ width: '100%' }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              centered
            >
              <Tab label="Profile Information" />
              <Tab label="Change Password" />
              {user.userType === 'influencer' && <Tab label="API Key Management" />}
              {user.userType === 'influencer' && <Tab label="API Key Security" />}
              {user.userType === 'influencer' && <Tab label="Subscription Tiers" />}
            </Tabs>

            {/* Profile Information Tab */}
            <TabPanel value={tabValue} index={0}>
              <Box component="form" onSubmit={handleProfileSubmit}>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Username"
                      name="username"
                      value={profileData.username}
                      onChange={handleProfileChange}
                      disabled={!editMode}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Email"
                      name="email"
                      type="email"
                      value={profileData.email}
                      onChange={handleProfileChange}
                      disabled={!editMode}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Name"
                      name="name"
                      value={profileData.name}
                      onChange={handleProfileChange}
                      disabled={!editMode}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Location"
                      name="location"
                      value={profileData.location}
                      onChange={handleProfileChange}
                      disabled={!editMode}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Bio"
                      name="bio"
                      multiline
                      rows={4}
                      value={profileData.bio}
                      onChange={handleProfileChange}
                      disabled={!editMode}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Avatar URL"
                      name="avatar"
                      value={profileData.avatar}
                      onChange={handleProfileChange}
                      disabled={!editMode}
                    />
                  </Grid>
                  {editMode && (
                    <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        startIcon={<SaveIcon />}
                      >
                        Save Changes
                      </Button>
                    </Grid>
                  )}
                </Grid>
              </Box>
            </TabPanel>

            {/* Change Password Tab */}
            <TabPanel value={tabValue} index={1}>
              <Box component="form" onSubmit={handlePasswordSubmit}>
                <Grid container spacing={3}>
                  {passwordError && (
                    <Grid item xs={12}>
                      <Alert severity="error">{passwordError}</Alert>
                    </Grid>
                  )}
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Current Password"
                      name="currentPassword"
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="New Password"
                      name="newPassword"
                      type="password"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Confirm New Password"
                      name="confirmPassword"
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      startIcon={<LockIcon />}
                    >
                      Change Password
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </TabPanel>

            {/* API Key Management Tab (Only for Influencers) */}
            {user.userType === 'influencer' && (
              <TabPanel value={tabValue} index={2}>
                <ApiKeyManagement />
              </TabPanel>
            )}
            
            {/* API Key Security Tab (Only for Influencers) */}
            {user.userType === 'influencer' && (
              <TabPanel value={tabValue} index={3}>
                {influencerProfile?.socialAccounts && influencerProfile.socialAccounts.length > 0 ? (
                  <ApiKeySecuritySettings socialAccountId={influencerProfile.socialAccounts[0]._id} />
                ) : (
                  <Alert severity="info">
                    You need to add a social media account first to manage API key security settings.
                  </Alert>
                )}
              </TabPanel>
            )}
            
            {/* Subscription Tiers Tab (Only for Influencers) */}
            {user.userType === 'influencer' && (
              <TabPanel value={tabValue} index={4}>
                <SubscriptionTierManagement 
                  platforms={influencerProfile?.platforms || []} 
                />
              </TabPanel>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ProfilePage;
