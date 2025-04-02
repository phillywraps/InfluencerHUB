import React from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Divider,
  Breadcrumbs,
  Link as MuiLink,
  Alert
} from '@mui/material';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import TwoFactorSetup from '../../components/auth/TwoFactorSetup';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';

const SecuritySettingsPage = () => {
  const { user, loading, error, isAuthenticated } = useSelector((state) => state.auth);

  // Redirect if not authenticated
  if (!loading && !isAuthenticated) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="warning">
          You must be logged in to access security settings.
          Please <MuiLink component={Link} to="/login">log in</MuiLink> to continue.
        </Alert>
      </Container>
    );
  }

  // Show loading spinner while checking auth status
  if (loading) {
    return <LoadingSpinner />;
  }

  // Show error message if there's an error
  if (error) {
    return <ErrorMessage message="Failed to load security settings" error={error} />;
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <MuiLink component={Link} to="/" color="inherit">
          Home
        </MuiLink>
        <MuiLink component={Link} to="/profile" color="inherit">
          Profile
        </MuiLink>
        <Typography color="text.primary">Security Settings</Typography>
      </Breadcrumbs>

      {/* Page Title */}
      <Typography variant="h4" component="h1" gutterBottom>
        Security Settings
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Manage your account security settings and authentication methods.
      </Typography>

      {/* Two-Factor Authentication Section */}
      <Paper sx={{ mb: 4 }}>
        <Box sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Two-Factor Authentication
          </Typography>
          <Typography variant="body1" paragraph>
            Two-factor authentication adds an extra layer of security to your account by requiring
            a verification code in addition to your password when you log in.
          </Typography>
          <Divider sx={{ my: 2 }} />
          <TwoFactorSetup />
        </Box>
      </Paper>

      {/* Password Security Section */}
      <Paper>
        <Box sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Password Security
          </Typography>
          <Typography variant="body1" paragraph>
            A strong password is essential for keeping your account secure.
          </Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            Your password should be at least 8 characters long and include uppercase letters,
            lowercase letters, numbers, and special characters.
          </Alert>
          <MuiLink component={Link} to="/change-password">
            Change Password
          </MuiLink>
        </Box>
      </Paper>
    </Container>
  );
};

export default SecuritySettingsPage;
