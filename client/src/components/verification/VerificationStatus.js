import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import PendingIcon from '@mui/icons-material/Pending';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import { getVerificationStatus } from '../../redux/slices/verificationSlice';

/**
 * Component to display verification status for influencers
 */
const VerificationStatus = ({ onInitiateIdentityVerification, onInitiateSocialVerification }) => {
  const dispatch = useDispatch();
  const { verificationStatus, loading, error } = useSelector((state) => state.verification);
  const { profile } = useSelector((state) => state.influencer);

  useEffect(() => {
    dispatch(getVerificationStatus());
  }, [dispatch]);

  if (loading && !verificationStatus) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !verificationStatus) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!verificationStatus) {
    return (
      <Alert severity="info" sx={{ mb: 2 }}>
        Loading verification status...
      </Alert>
    );
  }

  const { isIdentityVerified, verifiedSocialAccounts, totalSocialAccounts, isFullyVerified } =
    verificationStatus;

  // Get unverified social accounts
  const unverifiedSocialAccounts = profile?.socialAccounts?.filter(
    (account) => !account.isVerified
  ) || [];

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <VerifiedUserIcon color="primary" sx={{ mr: 1 }} />
        <Typography variant="h6">Verification Status</Typography>
        {isFullyVerified && (
          <Chip
            label="Fully Verified"
            color="success"
            icon={<CheckCircleIcon />}
            sx={{ ml: 2 }}
          />
        )}
      </Box>

      <Divider sx={{ mb: 3 }} />

      <Grid container spacing={3}>
        {/* Identity Verification Status */}
        <Grid item xs={12} md={6}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Identity Verification
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              {isIdentityVerified ? (
                <CheckCircleIcon color="success" sx={{ mr: 1 }} />
              ) : (
                <CancelIcon color="error" sx={{ mr: 1 }} />
              )}
              <Typography variant="body1">
                {isIdentityVerified ? 'Verified' : 'Not Verified'}
              </Typography>
            </Box>
            {!isIdentityVerified && (
              <Button
                variant="contained"
                color="primary"
                onClick={onInitiateIdentityVerification}
                sx={{ mt: 1 }}
              >
                Verify Identity
              </Button>
            )}
          </Box>
        </Grid>

        {/* Social Account Verification Status */}
        <Grid item xs={12} md={6}>
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Social Account Verification
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              {verifiedSocialAccounts === totalSocialAccounts && totalSocialAccounts > 0 ? (
                <CheckCircleIcon color="success" sx={{ mr: 1 }} />
              ) : verifiedSocialAccounts > 0 ? (
                <PendingIcon color="warning" sx={{ mr: 1 }} />
              ) : (
                <CancelIcon color="error" sx={{ mr: 1 }} />
              )}
              <Typography variant="body1">
                {verifiedSocialAccounts} of {totalSocialAccounts} accounts verified
              </Typography>
            </Box>
          </Box>
        </Grid>
      </Grid>

      {/* Unverified Social Accounts */}
      {unverifiedSocialAccounts.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Unverified Social Accounts
          </Typography>
          <List>
            {unverifiedSocialAccounts.map((account) => (
              <ListItem key={account._id}>
                <ListItemIcon>
                  <CancelIcon color="error" />
                </ListItemIcon>
                <ListItemText
                  primary={`${account.platform} - ${account.username}`}
                  secondary={`Added on ${new Date(account.createdAt).toLocaleDateString()}`}
                />
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => onInitiateSocialVerification(account._id)}
                >
                  Verify
                </Button>
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      {/* Verification Benefits */}
      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Benefits of Verification
        </Typography>
        <List dense>
          <ListItem>
            <ListItemIcon>
              <CheckCircleIcon color="success" />
            </ListItemIcon>
            <ListItemText primary="Increased trust with advertisers" />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <CheckCircleIcon color="success" />
            </ListItemIcon>
            <ListItemText primary="Verified badge on your profile" />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <CheckCircleIcon color="success" />
            </ListItemIcon>
            <ListItemText primary="Higher visibility in search results" />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <CheckCircleIcon color="success" />
            </ListItemIcon>
            <ListItemText primary="Access to premium features" />
          </ListItem>
        </List>
      </Box>
    </Paper>
  );
};

export default VerificationStatus;
