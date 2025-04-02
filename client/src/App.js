import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Container } from '@mui/material';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import socketService from './services/socketService';
import ThemeProvider from './theme/ThemeContext';
import lazyLoad, { prefetchComponents } from './utils/lazyLoad';
import { AccessibilityProvider } from './utils/accessibilityContext';
import { LiveAnnouncementProvider } from './utils/liveAnnouncementUtils';
import { SkipNavigation } from './components/ui';
import AccessibilitySettings from './components/common/AccessibilitySettings';

// Layout components
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import LoadingPage from './components/common/LoadingPage';
import ErrorBoundary from './components/common/ErrorBoundary';

// Core pages - not lazy loaded for better initial experience
import HomePage from './pages/HomePage';
import NotFoundPage from './pages/NotFoundPage';

// Redux actions
import { checkAuth } from './redux/slices/authSlice';

// Lazy loaded page components grouped by feature with enhanced loading
// Auth pages
const LoginPage = lazyLoad(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazyLoad(() => import('./pages/auth/RegisterPage'));
const VerifyEmailPage = lazyLoad(() => import('./pages/auth/VerifyEmailPage'));
const ForgotPasswordPage = lazyLoad(() => import('./pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazyLoad(() => import('./pages/auth/ResetPasswordPage'));
const SecuritySettingsPage = lazyLoad(() => import('./pages/auth/SecuritySettingsPage'));

// Example pages
const ErrorHandlingExamplePage = lazyLoad(() => import('./pages/examples/ErrorHandlingExamplePage'));

// Profile pages
const ProfilePage = lazyLoad(() => import('./pages/profile/ProfilePage'));
const ApiKeySecurityPage = lazyLoad(() => import('./pages/profile/ApiKeySecurityPage'), {
  prefetch: true // Prefetch for better UX in API key settings
});

// Dashboard pages
const InfluencerDashboard = lazyLoad(() => import('./pages/dashboard/InfluencerDashboard'));
const AdvertiserDashboard = lazyLoad(() => import('./pages/dashboard/AdvertiserDashboard'));

// Influencer pages
const InfluencerListPage = lazyLoad(() => import('./pages/influencer/InfluencerListPage'));
const InfluencerDetailPage = lazyLoad(() => import('./pages/influencer/InfluencerDetailPage'));

// Advertiser specific pages
const InfluencerBrowsePage = lazyLoad(() => import('./pages/advertiser/InfluencerBrowsePage'));

// Rental pages
const RentalListPage = lazyLoad(() => import('./pages/rental/RentalListPage'));
const RentalDetailPage = lazyLoad(() => import('./pages/rental/RentalDetailPage'));

// Campaign pages
const CampaignManagementPage = lazyLoad(() => import('./pages/campaign/CampaignManagementPage'));
const CampaignDetailPage = lazyLoad(() => import('./pages/campaign/CampaignDetailPage'));

// Messaging pages
const MessagePage = lazyLoad(() => import('./pages/message/MessagePage'));

// Payment pages
const PaymentMethodsPage = lazyLoad(() => import('./pages/payment/PaymentMethodsPage'));
const PayoutManagementPage = lazyLoad(() => import('./pages/payment/PayoutManagementPage'));
const TransactionHistoryPage = lazyLoad(() => import('./pages/payment/TransactionHistoryPage'));
const SubscriptionManagementPage = lazyLoad(() => import('./pages/payment/SubscriptionManagementPage'));

// Other pages
const NotificationsPage = lazyLoad(() => import('./pages/notification/NotificationsPage'));
const VerificationPage = lazyLoad(() => import('./pages/verification/VerificationPage'));
const VerificationManagementPage = lazyLoad(() => import('./pages/admin/VerificationManagementPage'));

// Initialize Stripe with your publishable key
// In a real app, this would come from an environment variable
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || 'pk_test_your_stripe_publishable_key');

// Protected route component
const ProtectedRoute = ({ children, userTypes = [] }) => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (userTypes.length > 0 && !userTypes.includes(user.userType)) {
    return <Navigate to="/" />;
  }

  return children;
};

const App = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  // Check if user is authenticated on app load
  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);
  
  // Initialize socket connection when user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      // Connect to socket server
      socketService.connect();
      
      // Clean up on unmount
      return () => {
        socketService.disconnect();
      };
    }
  }, [isAuthenticated]);

  // Prefetch critical pages that users are likely to navigate to
  useEffect(() => {
    // These will be loaded in the background after the app mounts
    const criticalPages = {
      login: () => import('./pages/auth/LoginPage'),
      register: () => import('./pages/auth/RegisterPage'),
      influencerDashboard: () => import('./pages/dashboard/InfluencerDashboard'),
      advertiserDashboard: () => import('./pages/dashboard/AdvertiserDashboard')
    };
    
    prefetchComponents(criticalPages);
  }, []);

  return (
    <ThemeProvider>
      <AccessibilityProvider>
        <LiveAnnouncementProvider>
        {/* Global error boundary for the entire application */}
        <ErrorBoundary fallbackMessage="Oops! Something went wrong with the application">
          {/* Skip navigation for keyboard users */}
          <SkipNavigation
            showTitle={true}
            titleText="Skip to section:"
            links={[
              {
                targetId: 'main-content',
                text: 'Skip to main content'
              },
              {
                targetId: 'navigation',
                text: 'Skip to navigation'
              },
              {
                targetId: 'search',
                text: 'Skip to search'
              },
              {
                targetId: 'footer',
                text: 'Skip to footer'
              }
            ]}
          />
          
          <Header />
          <Container maxWidth="lg" sx={{ py: 4, minHeight: 'calc(100vh - 128px)' }} id="main-content">
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/examples/error-handling" element={<ErrorHandlingExamplePage />} />
              <Route path="/verify-email" element={<VerifyEmailPage />} />
              <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
              <Route path="/influencers" element={<InfluencerListPage />} />
              <Route path="/influencers/:id" element={<InfluencerDetailPage />} />

              {/* Protected routes for all authenticated users */}
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/rentals"
                element={
                  <ProtectedRoute>
                    <RentalListPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/rentals/:id"
                element={
                  <ProtectedRoute>
                    <RentalDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/messages"
                element={
                  <ProtectedRoute>
                    <MessagePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/messages/:userId"
                element={
                  <ProtectedRoute>
                    <MessagePage />
                  </ProtectedRoute>
                }
              />

              {/* Influencer-specific routes */}
              <Route
                path="/dashboard/influencer"
                element={
                  <ProtectedRoute userTypes={['influencer']}>
                    <InfluencerDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/verification"
                element={
                  <ProtectedRoute userTypes={['influencer']}>
                    <VerificationPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/api-key-security"
                element={
                  <ProtectedRoute userTypes={['influencer']}>
                    <ApiKeySecurityPage />
                  </ProtectedRoute>
                }
              />

              {/* Advertiser-specific routes */}
              <Route
                path="/dashboard/advertiser"
                element={
                  <ProtectedRoute userTypes={['advertiser']}>
                    <AdvertiserDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/campaigns"
                element={
                  <ProtectedRoute userTypes={['advertiser']}>
                    <CampaignManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/campaigns/:campaignId"
                element={
                  <ProtectedRoute userTypes={['advertiser']}>
                    <CampaignDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/browse-influencers"
                element={
                  <ProtectedRoute userTypes={['advertiser']}>
                    <InfluencerBrowsePage />
                  </ProtectedRoute>
                }
              />
              
              {/* Payment routes */}
              <Route
                path="/payment-methods"
                element={
                  <ProtectedRoute userTypes={['advertiser']}>
                    <PaymentMethodsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/transactions"
                element={
                  <ProtectedRoute>
                    <TransactionHistoryPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/subscriptions"
                element={
                  <ProtectedRoute userTypes={['advertiser']}>
                    <SubscriptionManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/payouts"
                element={
                  <ProtectedRoute userTypes={['influencer']}>
                    <PayoutManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/notifications"
                element={
                  <ProtectedRoute>
                    <NotificationsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/security-settings"
                element={
                  <ProtectedRoute>
                    <SecuritySettingsPage />
                  </ProtectedRoute>
                }
              />

              {/* Admin routes */}
              <Route
                path="/admin/verifications"
                element={
                  <ProtectedRoute userTypes={['admin']}>
                    <VerificationManagementPage />
                  </ProtectedRoute>
                }
              />

              {/* Redirect to appropriate dashboard if logged in */}
              <Route
                path="/dashboard"
                element={
                  isAuthenticated ? (
                    user.userType === 'influencer' ? (
                      <Navigate to="/dashboard/influencer" />
                    ) : (
                      <Navigate to="/dashboard/advertiser" />
                    )
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />

              {/* 404 route */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Container>
          <Footer />
          
          {/* Accessibility settings button and panel */}
          <AccessibilitySettings buttonPosition="bottom-right" />
        </ErrorBoundary>
        </LiveAnnouncementProvider>
      </AccessibilityProvider>
    </ThemeProvider>
  );
};

export default App;
