import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  CircularProgress,
  Alert,
  Divider,
  Grid,
  Card,
  CardContent,
  Chip,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EmailIcon from '@mui/icons-material/Email';
import {
  initiateSocialAccountVerification,
  verifySocialAccount,
  resendVerificationCode,
} from '../../redux/slices/verificationSlice';

/**
 * Component for social account verification process
 */
const SocialAccountVerificationForm = ({ socialAccountId, onComplete }) => {
  const dispatch = useDispatch();
  const { currentVerification, loading, error } = useSelector((state) => state.verification);
  const { profile } = useSelector((state) => state.influencer);

  const [verificationCode, setVerificationCode] = useState('');
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Find the social account from the profile
  const socialAccount = profile?.socialAccounts?.find(
    (account) => account._id === socialAccountId
  );

  // Start countdown timer when code is sent
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Handle send verification code
  const handleSendCode = () => {
    dispatch(initiateSocialAccountVerification(socialAccountId))
      .unwrap()
      .then((result) => {
        setIsCodeSent(true);
        setCountdown(60); // 60 seconds countdown for resend
      })
      .catch((error) => {
        console.error('Failed to send verification code:', error);
      });
  };

  // Handle resend verification code
  const handleResendCode = () => {
    if (currentVerification) {
      dispatch(resendVerificationCode(currentVerification.verificationId))
        .unwrap()
        .then(() => {
          setCountdown(60); // Reset countdown
        })
        .catch((error) => {
          console.error('Failed to resend verification code:', error);
        });
    } else {
      // If no current verification, initiate a new one
      handleSendCode();
    }
  };

  // Handle verify code
  const handleVerifyCode = () => {
    if (currentVerification && verificationCode) {
      dispatch(
        verifySocialAccount({
          verificationId: currentVerification.verificationId,
          code: verificationCode,
        })
      )
        .unwrap()
        .then(() => {
          setIsVerified(true);
          if (onComplete) {
            onComplete();
          }
        })
        .catch((error) => {
          console.error('Failed to verify social account:', error);
        });
    }
  };

  if (!socialAccount) {
    return (
      <Paper sx={{ p: 3, mb: 3 }}>
        <Alert severity="error">Social account not found</Alert>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Verify Your {socialAccount.platform} Account
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {isVerified ? (
        <Box sx={{ textAlign: 'center', py: 3 }}>
          <CheckCircleIcon color="success" sx={{ fontSize: 60, mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Account Verified Successfully
          </Typography>
          <Typography variant="body1">
            Your {socialAccount.platform} account has been successfully verified.
          </Typography>
          <Button variant="contained" color="primary" onClick={onComplete} sx={{ mt: 3 }}>
            Return to Profile
          </Button>
        </Box>
      ) : (
        <>
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={8}>
                  <Typography variant="subtitle1">{socialAccount.platform}</Typography>
                  <Typography variant="body1" gutterBottom>
                    @{socialAccount.username}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Added on {new Date(socialAccount.createdAt).toLocaleDateString()}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4} sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                  <Chip
                    label={socialAccount.isVerified ? 'Verified' : 'Not Verified'}
                    color={socialAccount.isVerified ? 'success' : 'default'}
                    icon={socialAccount.isVerified ? <CheckCircleIcon /> : undefined}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Divider sx={{ mb: 3 }} />

          {!isCodeSent ? (
            <Box>
              <Typography variant="body1" paragraph>
                To verify your {socialAccount.platform} account, we'll send a verification code to your
                email address. Please click the button below to receive the code.
              </Typography>
              <Button
                variant="contained"
                color="primary"
                startIcon={<EmailIcon />}
                onClick={handleSendCode}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Send Verification Code'}
              </Button>
            </Box>
          ) : (
            <Box>
              <Typography variant="body1" paragraph>
                We've sent a verification code to your email address. Please enter the code below to
                verify your {socialAccount.platform} account.
              </Typography>
              <TextField
                fullWidth
                label="Verification Code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="Enter 6-digit code"
                margin="normal"
                inputProps={{ maxLength: 6 }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                <Button
                  variant="text"
                  onClick={handleResendCode}
                  disabled={countdown > 0 || loading}
                >
                  {countdown > 0 ? `Resend Code (${countdown}s)` : 'Resend Code'}
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleVerifyCode}
                  disabled={!verificationCode || verificationCode.length < 6 || loading}
                >
                  {loading ? <CircularProgress size={24} /> : 'Verify Account'}
                </Button>
              </Box>
            </Box>
          )}
        </>
      )}
    </Paper>
  );
};

export default SocialAccountVerificationForm;
