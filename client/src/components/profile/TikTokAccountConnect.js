import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  CardHeader,
  Chip,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  LinearProgress,
  List,
  ListItem,
  ListItemAvatar,
  ListItemIcon,
  ListItemText,
  Switch,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  ExpandMore as ExpandMoreIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  Link as LinkIcon,
  LinkOff as LinkOffIcon,
  VideoCameraBack as VideoCameraBackIcon
} from '@mui/icons-material';
import tiktokService from '../../services/tiktokService';
import { useDispatch, useSelector } from 'react-redux';
import { setAlert } from '../../redux/slices/alertSlice';
import withApiHandler from '../common/withApiHandler';
import moment from 'moment';

/**
 * TikTokAccountConnect component
 * 
 * Allows users to connect/disconnect their TikTok account
 * and displays account information when connected
 */
const TikTokAccountConnect = ({ onAccountUpdate }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  
  // State
  const [loading, setLoading] = useState(true);
  const [authUrl, setAuthUrl] = useState('');
  const [accountConnected, setAccountConnected] = useState(false);
  const [accountInfo, setAccountInfo] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Check connection status on component mount
  useEffect(() => {
    checkConnectionStatus();
  }, []);
  
  // Fetch auth URL if not connected
  useEffect(() => {
    if (!accountConnected && !authUrl) {
      fetchAuthUrl();
    }
  }, [accountConnected]);
  
  // Check if TikTok account is connected and fetch account info
  const checkConnectionStatus = async () => {
    try {
      setLoading(true);
      const isConnected = await tiktokService.isAccountConnected();
      setAccountConnected(isConnected);
      
      if (isConnected) {
        const accountDetails = await tiktokService.getAccountDetails();
        setAccountInfo(accountDetails);
      }
    } catch (error) {
      console.error('Error checking TikTok connection status:', error);
      dispatch(setAlert({
        message: 'Error checking TikTok account connection status',
        severity: 'error'
      }));
      setAccountConnected(false);
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch TikTok auth URL
  const fetchAuthUrl = async () => {
    try {
      const { url } = await tiktokService.getAuthUrl();
      setAuthUrl(url);
    } catch (error) {
      console.error('Error fetching TikTok auth URL:', error);
      dispatch(setAlert({
        message: 'Error preparing TikTok authentication',
        severity: 'error'
      }));
    }
  };
  
  // Handle account connection
  const handleConnect = () => {
    if (authUrl) {
      // Open TikTok auth page in a new window
      const authWindow = window.open(authUrl, 'tiktokAuthWindow', 'width=600,height=700');
      
      // Poll for auth completion
      const checkInterval = setInterval(() => {
        if (authWindow.closed) {
          clearInterval(checkInterval);
          checkConnectionStatus();
          
          if (onAccountUpdate) {
            onAccountUpdate();
          }
        }
      }, 1000);
    } else {
      dispatch(setAlert({
        message: 'Authentication URL not available',
        severity: 'error'
      }));
    }
  };
  
  // Handle account disconnection
  const handleDisconnect = async () => {
    try {
      setRefreshing(true);
      await tiktokService.disconnectAccount();
      
      setAccountConnected(false);
      setAccountInfo(null);
      setConfirmDisconnect(false);
      
      dispatch(setAlert({
        message: 'TikTok account disconnected successfully',
        severity: 'success'
      }));
      
      if (onAccountUpdate) {
        onAccountUpdate();
      }
      
      fetchAuthUrl();
    } catch (error) {
      console.error('Error disconnecting TikTok account:', error);
      dispatch(setAlert({
        message: 'Error disconnecting TikTok account',
        severity: 'error'
      }));
    } finally {
      setRefreshing(false);
    }
  };
  
  // Refresh account information
  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      const accountDetails = await tiktokService.getAccountDetails();
      setAccountInfo(accountDetails);
      
      dispatch(setAlert({
        message: 'TikTok account information refreshed',
        severity: 'success'
      }));
    } catch (error) {
      console.error('Error refreshing TikTok account information:', error);
      dispatch(setAlert({
        message: 'Error refreshing account information',
        severity: 'error'
      }));
    } finally {
      setRefreshing(false);
    }
  };
  
  // Toggle expanded view
  const handleExpandClick = () => {
    setExpanded(!expanded);
  };
  
  // Render account details
  const renderAccountDetails = () => {
    if (!accountInfo) return null;
    
    const {
      username,
      displayName,
      followerCount,
      followingCount,
      videoCount,
      profileImageUrl,
      verifiedStatus,
      accountType,
      bio,
      connectedAt,
      lastUpdated
    } = accountInfo;
    
    return (
      <>
        <Grid container spacing={2} alignItems="center">
          <Grid item>
            {profileImageUrl ? (
              <Box
                component="img"
                src={profileImageUrl}
                alt={username}
                sx={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  border: `2px solid ${theme.palette.primary.main}`
                }}
              />
            ) : (
              <VideoCameraBackIcon
                sx={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  p: 1,
                  border: `2px solid ${theme.palette.primary.main}`,
                  color: theme.palette.primary.main
                }}
              />
            )}
          </Grid>
          <Grid item xs>
            <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
              {displayName}
              {verifiedStatus && (
                <CheckCircleIcon
                  fontSize="small"
                  color="primary"
                  sx={{ ml: 0.5, verticalAlign: 'middle' }}
                />
              )}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              @{username} · {accountType || 'Creator'}
            </Typography>
            {bio && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                {bio}
              </Typography>
            )}
          </Grid>
        </Grid>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6">{followerCount.toLocaleString()}</Typography>
            <Typography variant="body2" color="textSecondary">Followers</Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6">{followingCount.toLocaleString()}</Typography>
            <Typography variant="body2" color="textSecondary">Following</Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6">{videoCount.toLocaleString()}</Typography>
            <Typography variant="body2" color="textSecondary">Videos</Typography>
          </Box>
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" color="textSecondary">
            Connected: {moment(connectedAt).format('MMM D, YYYY')}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Last Updated: {moment(lastUpdated).fromNow()}
          </Typography>
        </Box>
      </>
    );
  };
  
  return (
    <Card variant="outlined">
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <VideoCameraBackIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="h6">TikTok Account</Typography>
          </Box>
        }
        action={
          accountConnected && (
            <IconButton
              onClick={handleRefresh}
              disabled={refreshing}
              aria-label="refresh"
              size="small"
              sx={{ mr: 1 }}
            >
              {refreshing ? (
                <CircularProgress size={20} />
              ) : (
                <RefreshIcon fontSize="small" />
              )}
            </IconButton>
          )
        }
      />
      
      {loading ? (
        <CardContent>
          <LinearProgress />
          <Typography variant="body2" align="center" sx={{ mt: 2 }}>
            Checking TikTok account status...
          </Typography>
        </CardContent>
      ) : (
        <>
          <CardContent>
            {accountConnected ? (
              <>
                {renderAccountDetails()}
                
                <CardActions disableSpacing sx={{ p: 0, mt: 2 }}>
                  <Button
                    size="small"
                    onClick={handleExpandClick}
                    endIcon={<ExpandMoreIcon
                      sx={{
                        transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: theme.transitions.create('transform', {
                          duration: theme.transitions.duration.standard,
                        }),
                      }}
                    />}
                  >
                    {expanded ? 'Hide Options' : 'Show Options'}
                  </Button>
                </CardActions>
                
                <Collapse in={expanded} timeout="auto" unmountOnExit>
                  <Box sx={{ mt: 2 }}>
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<LinkOffIcon />}
                      onClick={() => setConfirmDisconnect(true)}
                      fullWidth
                    >
                      Disconnect TikTok Account
                    </Button>
                  </Box>
                </Collapse>
              </>
            ) : (
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body1" paragraph>
                  Connect your TikTok account to access analytics, schedule content,
                  and manage your profile all in one place.
                </Typography>
                
                <Typography variant="body2" color="textSecondary" paragraph>
                  We'll never post without your permission.
                </Typography>
                
                <Button
                  variant="contained"
                  startIcon={<LinkIcon />}
                  onClick={handleConnect}
                  disabled={!authUrl}
                >
                  Connect TikTok Account
                </Button>
              </Box>
            )}
          </CardContent>
        </>
      )}
      
      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDisconnect}
        onClose={() => setConfirmDisconnect(false)}
      >
        <DialogTitle>Disconnect TikTok Account?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to disconnect your TikTok account? You will lose access to 
            analytics and scheduling features for this platform.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDisconnect(false)}>Cancel</Button>
          <Button onClick={handleDisconnect} color="error" disabled={refreshing}>
            {refreshing ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
            Disconnect
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default withApiHandler(TikTokAccountConnect);
