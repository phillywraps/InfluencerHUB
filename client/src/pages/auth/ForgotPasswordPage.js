import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { forgotPassword, clearError } from '../../redux/slices/authSlice';
import { Box, Typography, Button, Paper, CircularProgress, Alert } from '@mui/material';
import { Email } from '@mui/icons-material';

const ForgotPasswordPage = () => {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return;

    dispatch(forgotPassword(email))
      .unwrap()
      .then(() => {
        setSubmitted(true);
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

  if (submitted) {
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
          <Email color="primary" sx={{ fontSize: 60, mb: 3 }} />
          <Typography variant="h5" gutterBottom>
            Check Your Email
          </Typography>
          <Typography variant="body1" align="center" sx={{ mb: 3 }}>
            We've sent a password reset link to <strong>{email}</strong>. Please check your inbox
            and follow the instructions to reset your password.
          </Typography>
          <Typography variant="body2" align="center" sx={{ mb: 3 }}>
            If you don't receive an email within a few minutes, please check your spam folder or try
            again.
          </Typography>
          <Button
            variant="outlined"
            color="primary"
            onClick={() => {
              setSubmitted(false);
              setEmail('');
            }}
            sx={{ mt: 2 }}
          >
            Try Again
          </Button>
          <Box sx={{ mt: 3 }}>
            <Typography variant="body2">
              Remember your password?{' '}
              <Link to="/login" style={{ color: '#1976d2', textDecoration: 'none' }}>
                Login here
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Box>
    );
  }

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
          Forgot Password
        </Typography>
        <Typography variant="body1" align="center" sx={{ mb: 3 }}>
          Enter your email address and we'll send you a link to reset your password.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box
          component="form"
          onSubmit={handleSubmit}
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
            required
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={!email || loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Send Reset Link'}
          </Button>
        </Box>

        <Box sx={{ mt: 3 }}>
          <Typography variant="body2">
            Remember your password?{' '}
            <Link to="/login" style={{ color: '#1976d2', textDecoration: 'none' }}>
              Login here
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default ForgotPasswordPage;
