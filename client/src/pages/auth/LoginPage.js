import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import api from '../../services/api';
import {
  Avatar,
  Button,
  TextField,
  Link,
  Grid,
  Box,
  Typography,
  Container,
  Paper,
  InputAdornment,
  IconButton,
  Alert,
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { login } from '../../redux/slices/authSlice';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import TwoFactorVerification from '../../components/auth/TwoFactorVerification';

const LoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, loading, error } = useSelector((state) => state.auth);
  const [showPassword, setShowPassword] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [showVerificationAlert, setShowVerificationAlert] = useState(false);
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [twoFactorTempToken, setTwoFactorTempToken] = useState('');

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  // Handle verification email error
  useEffect(() => {
    if (error && typeof error === 'object' && error.requiresVerification) {
      setVerificationEmail(error.email || '');
      setShowVerificationAlert(true);
      setRequiresTwoFactor(false);
    } else {
      setShowVerificationAlert(false);
    }
  }, [error]);

  // Form validation schema
  const validationSchema = Yup.object({
    email: Yup.string()
      .email('Enter a valid email')
      .required('Email is required'),
    password: Yup.string()
      .min(6, 'Password should be of minimum 6 characters length')
      .required('Password is required'),
  });

  // Formik setup
  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      try {
        // First attempt login
        const response = await api.post('/api/users/login', values);
        
        // Check if 2FA is required
        if (response.data.requiresTwoFactor) {
          setRequiresTwoFactor(true);
          setTwoFactorTempToken(response.data.tempToken);
        } else {
          // Normal login flow
          dispatch(login(response.data.data));
        }
      } catch (error) {
        // Let the error be handled by the auth slice
        dispatch(login(values));
      }
    },
  });

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleCancelTwoFactor = () => {
    setRequiresTwoFactor(false);
    setTwoFactorTempToken('');
  };

  if (loading) {
    return <LoadingSpinner message="Logging in..." />;
  }

  // Show 2FA verification if required
  if (requiresTwoFactor) {
    return (
      <TwoFactorVerification 
        tempToken={twoFactorTempToken} 
        onCancel={handleCancelTwoFactor} 
      />
    );
  }

  return (
    <Container component="main" maxWidth="xs">
      <Paper elevation={3} sx={{ p: 4, mt: 8 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}>
            <LockOutlinedIcon />
          </Avatar>
          <Typography component="h1" variant="h5">
            Sign in
          </Typography>

          {error && !showVerificationAlert && (
            <Alert severity="error" sx={{ width: '100%', mt: 2 }}>
              {typeof error === 'object' ? error.message : error}
            </Alert>
          )}

          {showVerificationAlert && (
            <Alert 
              severity="warning" 
              sx={{ width: '100%', mt: 2 }}
              action={
                <Button 
                  color="inherit" 
                  size="small"
                  component={RouterLink}
                  to={`/verify-email`}
                  state={{ email: verificationEmail }}
                >
                  Verify Now
                </Button>
              }
            >
              Your email is not verified. Please verify your email to continue.
            </Alert>
          )}

          <Box component="form" onSubmit={formik.handleSubmit} noValidate sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.email && Boolean(formik.errors.email)}
              helperText={formik.touched.email && formik.errors.email}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="current-password"
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.password && Boolean(formik.errors.password)}
              helperText={formik.touched.password && formik.errors.password}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleTogglePasswordVisibility}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              Sign In
            </Button>
            <Grid container>
              <Grid item xs>
                <Link component={RouterLink} to="/forgot-password" variant="body2">
                  Forgot password?
                </Link>
              </Grid>
              <Grid item>
                <Link component={RouterLink} to="/register" variant="body2">
                  {"Don't have an account? Sign Up"}
                </Link>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default LoginPage;
