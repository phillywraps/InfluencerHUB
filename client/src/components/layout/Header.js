import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  Container,
  Avatar,
  Button,
  Tooltip,
  MenuItem,
  Badge,
  useMediaQuery,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import MailIcon from '@mui/icons-material/Mail';
import ThemeSwitcher from '../theme/ThemeSwitcher';
import NotificationDropdown from '../notification/NotificationDropdown';
import { logout } from '../../redux/slices/authSlice';
import { useTheme } from '../../theme/ThemeContext';

const Header = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const { conversations } = useSelector((state) => state.message);

  const [anchorElNav, setAnchorElNav] = useState(null);
  const [anchorElUser, setAnchorElUser] = useState(null);

  // Count unread messages
  const unreadMessages = conversations.filter((conversation) => !conversation.isRead).length;

  // Navigation items based on authentication status and user type
  const getPages = () => {
    if (!isAuthenticated) {
      return [
        { name: 'Home', path: '/' },
        { name: 'Influencers', path: '/influencers' },
      ];
    }

    if (user.userType === 'influencer') {
      return [
        { name: 'Dashboard', path: '/dashboard/influencer' },
        { name: 'Influencers', path: '/influencers' },
        { name: 'Rentals', path: '/rentals' },
        { name: 'Verification', path: '/verification' },
        { name: 'Payouts', path: '/payouts' },
        { name: 'Transactions', path: '/transactions' },
      ];
    }

    return [
      { name: 'Dashboard', path: '/dashboard/advertiser' },
      { name: 'Campaigns', path: '/campaigns' },
      { name: 'Influencers', path: '/influencers' },
      { name: 'Browse Marketplace', path: '/browse-influencers' },
      { name: 'Rentals', path: '/rentals' },
      { name: 'Payment Methods', path: '/payment-methods' },
      { name: 'Subscriptions', path: '/subscriptions' },
      { name: 'Transactions', path: '/transactions' },
    ];
  };

  // User menu items based on authentication status
  const getUserMenuItems = () => {
    if (!isAuthenticated) {
      return [
        { name: 'Login', action: () => navigate('/login') },
        { name: 'Register', action: () => navigate('/register') },
      ];
    }

    const commonItems = [
      { name: 'Profile', action: () => navigate('/profile') },
      { name: 'Dashboard', action: () => navigate('/dashboard') },
      { name: 'Messages', action: () => navigate('/messages') },
      { name: 'Transactions', action: () => navigate('/transactions') },
      { name: 'Reviews', action: () => navigate('/reviews') },
      { name: 'Logout', action: () => handleLogout() },
    ];

    // Add user type-specific options
    if (user.userType === 'advertiser') {
      return [
        ...commonItems.slice(0, 2),
        { name: 'Campaigns', action: () => navigate('/campaigns') },
        { name: 'Payment Methods', action: () => navigate('/payment-methods') },
        { name: 'Subscriptions', action: () => navigate('/subscriptions') },
        ...commonItems.slice(2),
      ];
    } else if (user.userType === 'influencer') {
      return [
        ...commonItems.slice(0, 2),
        { name: 'Verification', action: () => navigate('/verification') },
        { name: 'Payouts', action: () => navigate('/payouts') },
        ...commonItems.slice(2),
      ];
    }

    return commonItems;
  };

  const handleOpenNavMenu = (event) => {
    setAnchorElNav(event.currentTarget);
  };

  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
    handleCloseUserMenu();
  };

  return (
    <AppBar position="static">
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          {/* Logo for larger screens */}
          <Typography
            variant="h6"
            noWrap
            component={RouterLink}
            to="/"
            sx={{
              mr: 2,
              display: { xs: 'none', md: 'flex' },
              fontWeight: 700,
              color: 'inherit',
              textDecoration: 'none',
            }}
          >
            InfluencerAPI
          </Typography>

          {/* Mobile menu */}
          <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleOpenNavMenu}
              color="inherit"
            >
              <MenuIcon />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorElNav}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
              open={Boolean(anchorElNav)}
              onClose={handleCloseNavMenu}
              sx={{
                display: { xs: 'block', md: 'none' },
              }}
            >
              {getPages().map((page) => (
                <MenuItem
                  key={page.name}
                  onClick={() => {
                    navigate(page.path);
                    handleCloseNavMenu();
                  }}
                >
                  <Typography textAlign="center">{page.name}</Typography>
                </MenuItem>
              ))}
            </Menu>
          </Box>

          {/* Logo for mobile screens */}
          <Typography
            variant="h5"
            noWrap
            component={RouterLink}
            to="/"
            sx={{
              mr: 2,
              display: { xs: 'flex', md: 'none' },
              flexGrow: 1,
              fontWeight: 700,
              color: 'inherit',
              textDecoration: 'none',
            }}
          >
            InfluencerAPI
          </Typography>

          {/* Desktop menu */}
          <Box 
            sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}
            id="navigation"
            role="navigation"
            aria-label="Main navigation"
          >
            {getPages().map((page) => (
              <Button
                key={page.name}
                component={RouterLink}
                to={page.path}
                onClick={handleCloseNavMenu}
                sx={{ my: 2, color: 'white', display: 'block' }}
              >
                {page.name}
              </Button>
            ))}
          </Box>

          {/* Search component */}
          <Box 
            id="search"
            component="form" 
            sx={{ 
              display: 'flex', 
              alignItems: 'center',
              '& .MuiInputBase-root': {
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                borderRadius: 1,
                px: 1,
                py: 0.5,
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.25)',
                },
                '&:focus-within': {
                  backgroundColor: 'rgba(255, 255, 255, 0.3)',
                  outline: '2px solid white',
                },
              }
            }}
            role="search"
          >
            <input
              type="search"
              placeholder="Search..."
              aria-label="Search platform"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'inherit',
                padding: '4px 8px',
                outline: 'none',
                width: '120px',
              }}
            />
          </Box>

          {/* Dark mode toggle */}
          <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
            <ThemeSwitcher />
          </Box>

          {/* Notification icons */}
          {isAuthenticated && (
            <Box sx={{ display: 'flex' }}>
              <IconButton
                size="large"
                aria-label="show new messages"
                color="inherit"
                onClick={() => navigate('/messages')}
              >
                <Badge badgeContent={unreadMessages} color="error">
                  <MailIcon />
                </Badge>
              </IconButton>
              <NotificationDropdown />
            </Box>
          )}

          {/* User menu */}
          <Box sx={{ flexGrow: 0, ml: 2 }}>
            <Tooltip title="Open settings">
              <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                <Avatar
                  alt={user?.username || 'Guest'}
                  src={user?.profile?.avatar || '/static/images/avatar/default.jpg'}
                />
              </IconButton>
            </Tooltip>
            <Menu
              sx={{ mt: '45px' }}
              id="menu-appbar"
              anchorEl={anchorElUser}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorElUser)}
              onClose={handleCloseUserMenu}
            >
              {getUserMenuItems().map((item) => (
                <MenuItem key={item.name} onClick={item.action}>
                  <Typography textAlign="center">{item.name}</Typography>
                </MenuItem>
              ))}
            </Menu>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Header;
