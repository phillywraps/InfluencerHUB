import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { verifyEmail, resendVerification, clearError } from '../../redux/slices/authSlice';
import { Box, Typography, Button, Paper, CircularProgress, Alert } from '@mui/material';
import { CheckCircle, Error } from '@mui/icons-material';

const VerifyEmailPage = () => {
  const { token } = useParams();
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);
  const [verified, setVerified] = useState(false);
  const [email, setEmail] = useState(location.state?.email || '');
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    // If token is provided, verify email
    if (token) {
      dispatch(verifyEmail(token))
        .unwrap()
        .then(() => {
          setVerified(true);
          // Redirect to dashboard after 3 seconds
          setTimeout(() => {
            navigate('/dashboard');
          }, 3000);
        })
        .catch(() => {
          // Error will be handled by the component
        });
    }
  }, [token, dispatch, navigate]);

  const handleResendVerification = () => {
    if (!email) return;

    dispatch(resendVerification(email))
      .unwrap()
      .then(() => {
        setResendSuccess(true);
        // Clear success message after 5 seconds
        setTimeout(() => {
          setResendSuccess(false);
        }, 5000);
      })
      .catch(() => {
        // Error will be handled by the component
      });
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (error) {
      dispatch(clearError());
    }
  };

  // If token is provided, show verification status
  if (token) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 'calc(100vh - 64px)',
          p: 3,
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            maxWidth: 500,
            width: '100%',
          }}
        >
          {loading ? (
            <>
              <CircularProgress size={60} sx={{ mb: 3 }} />
              <Typography variant="h5" gutterBottom>
                Verifying your email...
              </Typography>
            </>
          ) : verified ? (
            <>
              <CheckCircle color="success" sx={{ fontSize: 60, mb: 3 }} />
              <Typography variant="h5" gutterBottom>
                Email Verified Successfully!
              </Typography>
              <Typography variant="body1" align="center" sx={{ mb: 3 }}>
                Your email has been verified. You will be redirected to your dashboard in a few seconds.
              </Typography>
              <Button
                variant="contained"
                color="primary"
                component={Link}
                to="/dashboard"
                sx={{ mt: 2 }}
              >
                Go to Dashboard
              </Button>
            </>
          ) : (
            <>
              <Error color="error" sx={{ fontSize: 60, mb: 3 }} />
              <Typography variant="h5" gutterBottom>
                Verification Failed
              </Typography>
              <Typography variant="body1" align="center" sx={{ mb: 3 }}>
                {error || 'The verification link is invalid or has expired.'}
              </Typography>
              <Typography variant="body2" align="center" sx={{ mb: 3 }}>
                Please enter your email to receive a new verification link:
              </Typography>
              <Box
                component="form"
                sx={{
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                }}
              >
                <input
                  type="email"
                  placeholder="Your email address"
                  value={email}
                  onChange={handleEmailChange}
                  style={{
                    padding: '10px',
                    fontSize: '16px',
                    borderRadius: '4px',
                    border: '1px solid #ccc',
                  }}
                />
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleResendVerification}
                  disabled={!email || loading}
                >
                  {loading ? <CircularProgress size={24} /> : 'Resend Verification Email'}
                </Button>
              </Box>
            </>
          )}
        </Paper>
      </Box>
    );
  }

  // If no token is provided, show resend verification form
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - 64px)',
        p: 3,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          maxWidth: 500,
          width: '100%',
        }}
      >
        <Typography variant="h5" gutterBottom>
          Verify Your Email
        </Typography>
        <Typography variant="body1" align="center" sx={{ mb: 3 }}>
          Please enter your email address to receive a verification link:
        </Typography>

        {error && (
          <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
            {error}
          </Alert>
        )}

        {resendSuccess && (
          <Alert severity="success" sx={{ width: '100%', mb: 2 }}>
            Verification email sent successfully. Please check your inbox.
          </Alert>
        )}

        <Box
          component="form"
          sx={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          <input
            type="email"
            placeholder="Your email address"
            value={email}
            onChange={handleEmailChange}
            style={{
              padding: '10px',
              fontSize: '16px',
              borderRadius: '4px',
              border: '1px solid #ccc',
            }}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={handleResendVerification}
            disabled={!email || loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Send Verification Email'}
          </Button>
        </Box>

        <Box sx={{ mt: 3 }}>
          <Typography variant="body2">
            Already verified?{' '}
            <Link to="/login" style={{ color: '#1976d2', textDecoration: 'none' }}>
              Login here
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default VerifyEmailPage;
