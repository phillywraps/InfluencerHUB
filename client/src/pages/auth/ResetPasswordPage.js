import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { resetPassword, clearError } from '../../redux/slices/authSlice';
import { Box, Typography, Button, Paper, CircularProgress, Alert, TextField } from '@mui/material';
import { LockReset, CheckCircle } from '@mui/icons-material';

const ResetPasswordPage = () => {
  const { token } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  const validatePassword = (value) => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(value)) {
      return 'Password must be at least 8 characters long and include uppercase, lowercase, number, and special character';
    }
    return '';
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    setPasswordError(validatePassword(value));
    if (error) {
      dispatch(clearError());
    }
  };

  const handleConfirmPasswordChange = (e) => {
    setConfirmPassword(e.target.value);
    if (error) {
      dispatch(clearError());
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate password
    const validationError = validatePassword(password);
    if (validationError) {
      setPasswordError(validationError);
      return;
    }
    
    // Check if passwords match
    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    
    // Reset password
    dispatch(resetPassword({ token, password }))
      .unwrap()
      .then(() => {
        setResetSuccess(true);
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      })
      .catch(() => {
        // Error will be handled by the component
      });
  };

  if (resetSuccess) {
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
          <CheckCircle color="success" sx={{ fontSize: 60, mb: 3 }} />
          <Typography variant="h5" gutterBottom>
            Password Reset Successful!
          </Typography>
          <Typography variant="body1" align="center" sx={{ mb: 3 }}>
            Your password has been reset successfully. You will be redirected to the login page in a few seconds.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            component={Link}
            to="/login"
            sx={{ mt: 2 }}
          >
            Go to Login
          </Button>
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
        <LockReset color="primary" sx={{ fontSize: 60, mb: 3 }} />
        <Typography variant="h5" gutterBottom>
          Reset Your Password
        </Typography>
        <Typography variant="body1" align="center" sx={{ mb: 3 }}>
          Please enter your new password below.
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
          <TextField
            type="password"
            label="New Password"
            variant="outlined"
            fullWidth
            value={password}
            onChange={handlePasswordChange}
            error={!!passwordError}
            helperText={passwordError}
            required
          />
          <TextField
            type="password"
            label="Confirm Password"
            variant="outlined"
            fullWidth
            value={confirmPassword}
            onChange={handleConfirmPasswordChange}
            error={password !== confirmPassword && confirmPassword !== ''}
            helperText={
              password !== confirmPassword && confirmPassword !== ''
                ? 'Passwords do not match'
                : ''
            }
            required
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={
              loading ||
              !password ||
              !confirmPassword ||
              !!passwordError ||
              password !== confirmPassword
            }
            sx={{ mt: 2 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Reset Password'}
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

export default ResetPasswordPage;
