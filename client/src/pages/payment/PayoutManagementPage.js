import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { Container, Typography, Box, Breadcrumbs, Link } from '@mui/material';
import { Home as HomeIcon, Payment as PaymentIcon } from '@mui/icons-material';
import PayoutManagement from '../../components/payment/PayoutManagement';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';

const PayoutManagementPage = () => {
  const { user, loading: authLoading } = useSelector((state) => state.auth);
  
  // Check if user is authenticated and is an influencer
  if (authLoading) {
    return <LoadingSpinner />;
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  if (user.role !== 'influencer') {
    return <ErrorMessage message="Only influencers can access this page" />;
  }
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
        <Link
          underline="hover"
          color="inherit"
          href="/"
          sx={{ display: 'flex', alignItems: 'center' }}
        >
          <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Home
        </Link>
        <Link
          underline="hover"
          color="inherit"
          href="/dashboard"
          sx={{ display: 'flex', alignItems: 'center' }}
        >
          Dashboard
        </Link>
        <Typography
          color="text.primary"
          sx={{ display: 'flex', alignItems: 'center' }}
        >
          <PaymentIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Payout Management
        </Typography>
      </Breadcrumbs>
      
      {/* Page Title */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Payout Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your earnings, request payouts, and configure your payout preferences.
        </Typography>
      </Box>
      
      {/* Payout Management Component */}
      <PayoutManagement />
    </Container>
  );
};

export default PayoutManagementPage;
