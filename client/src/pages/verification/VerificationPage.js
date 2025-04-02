import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Tabs,
  Tab,
  Paper,
  Button,
  Alert,
  Breadcrumbs,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import VerificationStatus from '../../components/verification/VerificationStatus';
import IdentityVerificationForm from '../../components/verification/IdentityVerificationForm';
import SocialAccountVerificationForm from '../../components/verification/SocialAccountVerificationForm';
import { getVerificationStatus } from '../../redux/slices/verificationSlice';
import { getInfluencerProfile } from '../../redux/slices/influencerSlice';

/**
 * Page for managing influencer verification
 */
const VerificationPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { profile } = useSelector((state) => state.influencer);
  const { verificationStatus, loading, error } = useSelector((state) => state.verification);

  const [activeTab, setActiveTab] = useState(0);
  const [showIdentityVerification, setShowIdentityVerification] = useState(false);
  const [selectedSocialAccountId, setSelectedSocialAccountId] = useState(null);

  useEffect(() => {
    // Load verification status and influencer profile
    dispatch(getVerificationStatus());
    dispatch(getInfluencerProfile());
  }, [dispatch]);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Handle initiating identity verification
  const handleInitiateIdentityVerification = () => {
    setShowIdentityVerification(true);
  };

  // Handle initiating social account verification
  const handleInitiateSocialVerification = (socialAccountId) => {
    setSelectedSocialAccountId(socialAccountId);
  };

  // Handle completion of verification process
  const handleVerificationComplete = () => {
    setShowIdentityVerification(false);
    setSelectedSocialAccountId(null);
    dispatch(getVerificationStatus());
    dispatch(getInfluencerProfile());
  };

  // Check if user is an influencer
  if (user && user.role !== 'influencer') {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="warning">
          This page is only available to influencers. Please create an influencer profile to access
          verification features.
        </Alert>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate('/profile')}
          sx={{ mt: 2 }}
        >
          Go to Profile
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
        <Link color="inherit" href="/dashboard" onClick={(e) => { e.preventDefault(); navigate('/dashboard'); }}>
          Dashboard
        </Link>
        <Typography color="text.primary">Verification</Typography>
      </Breadcrumbs>

      {/* Page Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <VerifiedUserIcon color="primary" sx={{ mr: 2, fontSize: 40 }} />
        <Typography variant="h4" component="h1">
          Account Verification
        </Typography>
      </Box>

      {/* Page Description */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Why Verify Your Account?
        </Typography>
        <Typography variant="body1" paragraph>
          Verification helps build trust with advertisers and increases your chances of getting
          selected for API key rentals. Verified influencers receive priority in search results and
          gain access to premium features.
        </Typography>
        <Typography variant="body1">
          Complete both identity verification and social account verification to become fully
          verified on our platform.
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
          <Tab label="Verification Status" />
          <Tab label="Verification History" />
          <Tab label="Verification FAQ" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <Box sx={{ mb: 4 }}>
        {activeTab === 0 && (
          <VerificationStatus
            onInitiateIdentityVerification={handleInitiateIdentityVerification}
            onInitiateSocialVerification={handleInitiateSocialVerification}
          />
        )}
        {activeTab === 1 && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Verification History
            </Typography>
            {verificationStatus?.verifications?.length > 0 ? (
              verificationStatus.verifications.map((verification) => (
                <Box key={verification._id} sx={{ mb: 2, p: 2, border: '1px solid #eee', borderRadius: 1 }}>
                  <Typography variant="subtitle1">
                    {verification.type === 'identity'
                      ? 'Identity Verification'
                      : `${verification.type.replace('_', ' ')} Verification`}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Status: {verification.status}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Submitted: {new Date(verification.createdAt).toLocaleDateString()}
                  </Typography>
                  {verification.verifiedAt && (
                    <Typography variant="body2" color="text.secondary">
                      Verified: {new Date(verification.verifiedAt).toLocaleDateString()}
                    </Typography>
                  )}
                </Box>
              ))
            ) : (
              <Typography variant="body1">No verification history found.</Typography>
            )}
          </Paper>
        )}
        {activeTab === 2 && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Frequently Asked Questions
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                What documents are accepted for identity verification?
              </Typography>
              <Typography variant="body2" paragraph>
                We accept government-issued photo IDs such as passports, driver's licenses, and
                national ID cards. The document must be valid and not expired.
              </Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                How long does verification take?
              </Typography>
              <Typography variant="body2" paragraph>
                Identity verification typically takes 1-2 business days. Social account verification
                is instant once you confirm the verification code.
              </Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                What happens if my verification is rejected?
              </Typography>
              <Typography variant="body2" paragraph>
                If your verification is rejected, you'll receive a notification with the reason. You
                can resubmit your verification with the correct information or documents.
              </Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Do I need to verify all my social accounts?
              </Typography>
              <Typography variant="body2" paragraph>
                You need to verify at least one social account to be considered partially verified.
                However, we recommend verifying all your social accounts for maximum credibility.
              </Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                How often do I need to renew my verification?
              </Typography>
              <Typography variant="body2" paragraph>
                Identity verification is valid for one year. You'll receive a notification when it's
                time to renew. Social account verifications do not expire unless you remove and
                re-add the account.
              </Typography>
            </Box>
          </Paper>
        )}
      </Box>

      {/* Identity Verification Dialog */}
      <Dialog
        open={showIdentityVerification}
        onClose={() => setShowIdentityVerification(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Identity Verification</DialogTitle>
        <DialogContent>
          <IdentityVerificationForm onComplete={handleVerificationComplete} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowIdentityVerification(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Social Account Verification Dialog */}
      <Dialog
        open={!!selectedSocialAccountId}
        onClose={() => setSelectedSocialAccountId(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Social Account Verification</DialogTitle>
        <DialogContent>
          {selectedSocialAccountId && (
            <SocialAccountVerificationForm
              socialAccountId={selectedSocialAccountId}
              onComplete={handleVerificationComplete}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedSocialAccountId(null)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default VerificationPage;
