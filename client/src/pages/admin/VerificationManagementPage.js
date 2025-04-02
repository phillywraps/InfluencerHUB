import React from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Alert,
  Button,
  Breadcrumbs,
  Link,
  Paper,
  Tabs,
  Tab,
} from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import VerificationReviewPanel from '../../components/admin/VerificationReviewPanel';

/**
 * Admin page for verification management
 */
const VerificationManagementPage = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = React.useState(0);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Check if user is an admin
  if (user && user.role !== 'admin') {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">
          You do not have permission to access this page. This page is only available to
          administrators.
        </Alert>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate('/')}
          sx={{ mt: 2 }}
        >
          Go to Home
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 2 }}>
        <Link color="inherit" href="/" onClick={(e) => { e.preventDefault(); navigate('/'); }}>
          Home
        </Link>
        <Link color="inherit" href="/admin" onClick={(e) => { e.preventDefault(); navigate('/admin'); }}>
          Admin
        </Link>
        <Typography color="text.primary">Verification Management</Typography>
      </Breadcrumbs>

      {/* Page Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <AdminPanelSettingsIcon color="primary" sx={{ mr: 2, fontSize: 40 }} />
        <Typography variant="h4" component="h1">
          Verification Management
        </Typography>
      </Box>

      {/* Page Description */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Admin Verification Management
        </Typography>
        <Typography variant="body1" paragraph>
          This page allows administrators to review and manage verification requests from influencers.
          You can approve or reject identity verification requests, view verification history, and
          manage verification settings.
        </Typography>
        <Typography variant="body1">
          Use the tabs below to navigate between different verification management functions.
        </Typography>
      </Paper>

      {/* Tabs */}
      <Paper sx={{ mb: 4 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="Pending Verifications" />
          <Tab label="Verification History" />
          <Tab label="Verification Settings" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <Box sx={{ mb: 4 }}>
        {activeTab === 0 && <VerificationReviewPanel />}
        {activeTab === 1 && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Verification History
            </Typography>
            <Typography variant="body1">
              This feature will be implemented in a future update. It will show a history of all
              verification requests and their outcomes.
            </Typography>
          </Paper>
        )}
        {activeTab === 2 && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Verification Settings
            </Typography>
            <Typography variant="body1">
              This feature will be implemented in a future update. It will allow administrators to
              configure verification requirements, expiration periods, and other settings.
            </Typography>
          </Paper>
        )}
      </Box>
    </Container>
  );
};

export default VerificationManagementPage;
