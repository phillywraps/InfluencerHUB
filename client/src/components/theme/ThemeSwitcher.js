import React, { useContext, useRef, useEffect } from 'react';
import { useAccessibility } from '../../utils/accessibilityContext';
import { useFocusTrap } from '../../utils/focusTrapUtils';
import { 
  Box, 
  IconButton, 
  Tooltip, 
  Menu, 
  MenuItem, 
  ListItemIcon, 
  ListItemText,
  Switch,
  Typography,
  useTheme,
  alpha
} from '@mui/material';
import {
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  BrightnessAuto as SystemModeIcon,
  MoreVert as MoreIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { ThemeContext } from '../../theme/ThemeContext';

/**
 * Theme Switcher Component
 * Allows users to toggle between light, dark, and system modes
 */
const ThemeSwitcher = ({ variant = 'icon', showLabel = false }) => {
  const theme = useTheme();
  const { mode, setMode } = useContext(ThemeContext);
  const [anchorEl, setAnchorEl] = React.useState(null);
  
  // Refs for focus management
  const menuRef = useRef(null);
  const themeButtonRef = useRef(null);
  
  // Access accessibility context
  const { isScreenReaderEnabled, announce } = useAccessibility();
  
  // Use focus trap for menu
  const focusTrap = useFocusTrap(menuRef, {
    enabled: Boolean(anchorEl),
    onEscape: () => setAnchorEl(null),
    autoFocus: true
  });
  
  // Initialize focus trap when menu opens, cleanup when it closes
  useEffect(() => {
    if (anchorEl) {
      // Initialize focus trap after the menu is rendered
      setTimeout(() => {
        focusTrap.initialize();
        
        // Announce to screen readers
        if (isScreenReaderEnabled) {
          announce('Theme settings menu opened', 'polite');
        }
      }, 50);
    }
    
    return () => {
      focusTrap.cleanup();
    };
  }, [anchorEl, focusTrap, isScreenReaderEnabled, announce]);

  const handleOpenMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    
    // Return focus to trigger button
    if (themeButtonRef.current) {
      setTimeout(() => {
        themeButtonRef.current.focus();
      }, 50);
    }
    
    // Announce to screen readers
    if (isScreenReaderEnabled) {
      announce('Theme settings menu closed', 'polite');
    }
  };

  const handleThemeChange = (newMode) => {
    setMode(newMode);
    handleCloseMenu();
  };

  // Toggle between light and dark directly if using the toggle variant
  const handleToggle = () => {
    setMode(mode === 'dark' ? 'light' : 'dark');
  };

  // Get appropriate icon for current mode
  const getModeIcon = () => {
    switch (mode) {
      case 'dark':
        return <DarkModeIcon />;
      case 'light':
        return <LightModeIcon />;
      case 'system':
        return <SystemModeIcon />;
      default:
        return <LightModeIcon />;
    }
  };

  // Render toggle switch variant
  if (variant === 'toggle') {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'center',
          p: showLabel ? 1 : 0,
          borderRadius: 1,
          '&:hover': {
            bgcolor: alpha(theme.palette.primary.main, 0.08),
          }
        }}
      >
        <LightModeIcon 
          fontSize="small" 
          sx={{ 
            mr: 1, 
            color: mode === 'light' ? 'primary.main' : 'text.secondary',
            transition: 'color 0.3s'
          }} 
        />
        
        <Switch
          checked={mode === 'dark'}
          onChange={handleToggle}
          color="primary"
          size="small"
          sx={{ mx: 0.5 }}
        />
        
        <DarkModeIcon 
          fontSize="small" 
          sx={{ 
            ml: 1, 
            color: mode === 'dark' ? 'primary.main' : 'text.secondary',
            transition: 'color 0.3s'
          }} 
        />
        
        {showLabel && (
          <Typography 
            variant="body2" 
            sx={{ ml: 1.5, userSelect: 'none' }}
          >
            {mode === 'dark' ? 'Dark Mode' : 'Light Mode'}
          </Typography>
        )}
      </Box>
    );
  }

  // Render menu variant
  if (variant === 'menu') {
    return (
      <>
        <Tooltip title="Theme settings">
          <IconButton
            onClick={handleOpenMenu}
            size="small"
            aria-label="theme settings"
            aria-haspopup="menu"
            aria-expanded={Boolean(anchorEl)}
            aria-controls={anchorEl ? 'theme-menu' : undefined}
            ref={themeButtonRef}
          >
            <SettingsIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        
        <Menu
          id="theme-menu"
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleCloseMenu}
          PaperProps={{
            sx: {
              // Improved focus outline
              '& *:focus-visible': {
                outline: '2px solid',
                outlineColor: 'primary.main',
                outlineOffset: '2px'
              }
            },
            ref: menuRef
          }}
          MenuListProps={{
            'aria-label': 'Theme options',
            role: 'menu'
          }}
        >
          <MenuItem 
            onClick={() => handleThemeChange('light')}
            selected={mode === 'light'}
            role="menuitem"
            aria-label="Light mode"
            aria-checked={mode === 'light'}
          >
            <ListItemIcon>
              <LightModeIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Light Mode</ListItemText>
          </MenuItem>
          
          <MenuItem 
            onClick={() => handleThemeChange('dark')}
            selected={mode === 'dark'}
            role="menuitem"
            aria-label="Dark mode"
            aria-checked={mode === 'dark'}
          >
            <ListItemIcon>
              <DarkModeIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Dark Mode</ListItemText>
          </MenuItem>
          
          <MenuItem 
            onClick={() => handleThemeChange('system')}
            selected={mode === 'system'}
            role="menuitem"
            aria-label="System default"
            aria-checked={mode === 'system'}
          >
            <ListItemIcon>
              <SystemModeIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>System Default</ListItemText>
          </MenuItem>
        </Menu>
      </>
    );
  }

  // Default icon variant
  return (
    <Tooltip 
      title={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <IconButton 
        color="inherit" 
        onClick={handleToggle}
        aria-label={`Toggle ${mode === 'dark' ? 'light' : 'dark'} mode`}
        aria-pressed={mode === 'dark'}
        sx={{
          transition: 'transform 0.3s',
          '&:hover': {
            transform: 'rotate(30deg)',
          },
        }}
      >
        {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
      </IconButton>
    </Tooltip>
  );
};

export default ThemeSwitcher;
