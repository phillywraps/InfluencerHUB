/**
 * Accessibility Settings Panel
 *
 * A component that provides users with controls to adjust accessibility
 * preferences including high contrast mode, reduced motion, and font scaling.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { styled } from '@mui/material/styles';
import {
  Box,
  Typography,
  Switch,
  Slider,
  Button,
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import AccessibilityNewIcon from '@mui/icons-material/AccessibilityNew';
import ContrastIcon from '@mui/icons-material/Contrast';
import TextIncreaseIcon from '@mui/icons-material/TextIncrease';
import AnimationIcon from '@mui/icons-material/Animation';
import CloseIcon from '@mui/icons-material/Close';
import ReplayIcon from '@mui/icons-material/Replay';
import { useAccessibility } from '../../utils/accessibilityContext';

// Styled components
const AccessibilityButton = styled(IconButton)(({ theme }) => ({
  position: 'fixed',
  bottom: theme.spacing(4),
  left: theme.spacing(4),
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  width: 56,
  height: 56,
  zIndex: 999,
  '&:hover': {
    backgroundColor: theme.palette.primary.dark,
  },
  '&:focus-visible': {
    outline: `3px solid ${theme.palette.secondary.main}`,
    outlineOffset: '2px',
  },
}));

const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: theme.spacing(2, 3),
}));

const SettingContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2, 0),
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const SettingLabel = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
}));

const SettingIcon = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  marginRight: theme.spacing(2),
  color: theme.palette.primary.main,
}));

const SettingRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
}));

const ControlContainer = styled(Box)(({ theme }) => ({
  minWidth: 120,
}));

/**
 * Accessibility Settings Dialog Component
 */
const AccessibilitySettings = ({ buttonPosition }) => {
  const [open, setOpen] = React.useState(false);
  const {
    highContrast,
    reduceMotion,
    fontScale,
    setHighContrast,
    setReduceMotion,
    setFontScale,
    resetSettings,
    announce,
  } = useAccessibility();

  // Open dialog and announce to screen readers
  const handleOpen = () => {
    setOpen(true);
    announce('Accessibility settings panel opened');
  };

  // Close dialog and announce to screen readers
  const handleClose = () => {
    setOpen(false);
    announce('Accessibility settings panel closed');
  };

  // Handle font scale changes
  const handleFontScaleChange = (event, newValue) => {
    setFontScale(newValue);
  };

  // Format font scale for display
  const fontScaleText = (value) => {
    return `${Math.round(value * 100)}%`;
  };

  // Reset all settings
  const handleReset = () => {
    resetSettings();
    announce('Accessibility settings have been reset to defaults');
  };

  // Position the accessibility button based on props
  const buttonStyles = {};
  if (buttonPosition === 'top-right') {
    buttonStyles.top = 16;
    buttonStyles.right = 16;
    buttonStyles.bottom = 'auto';
    buttonStyles.left = 'auto';
  } else if (buttonPosition === 'top-left') {
    buttonStyles.top = 16;
    buttonStyles.left = 16;
    buttonStyles.bottom = 'auto';
    buttonStyles.right = 'auto';
  } else if (buttonPosition === 'bottom-right') {
    buttonStyles.bottom = 16;
    buttonStyles.right = 16;
    buttonStyles.top = 'auto';
    buttonStyles.left = 'auto';
  } else {
    buttonStyles.bottom = 16;
    buttonStyles.left = 16;
    buttonStyles.top = 'auto';
    buttonStyles.right = 'auto';
  }

  return (
    <>
      <Tooltip title="Accessibility Settings" arrow>
        <AccessibilityButton
          onClick={handleOpen}
          aria-label="Open accessibility settings"
          sx={buttonStyles}
        >
          <AccessibilityNewIcon />
        </AccessibilityButton>
      </Tooltip>

      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="accessibility-settings-title"
        maxWidth="sm"
        fullWidth
      >
        <StyledDialogTitle id="accessibility-settings-title">
          <Typography variant="h6">Accessibility Settings</Typography>
          <IconButton
            aria-label="close"
            onClick={handleClose}
            size="large"
          >
            <CloseIcon />
          </IconButton>
        </StyledDialogTitle>

        <DialogContent dividers>
          {/* High Contrast Mode Setting */}
          <SettingContainer>
            <SettingRow>
              <SettingIcon>
                <ContrastIcon fontSize="large" />
              </SettingIcon>
              <SettingLabel>
                <Typography variant="subtitle1">High Contrast Mode</Typography>
                <Typography variant="body2" color="textSecondary">
                  Increases contrast for better text readability
                </Typography>
              </SettingLabel>
            </SettingRow>
            <ControlContainer>
              <Switch
                checked={highContrast}
                onChange={(e) => setHighContrast(e.target.checked)}
                inputProps={{
                  'aria-label': 'Toggle high contrast mode',
                }}
                color="primary"
              />
            </ControlContainer>
          </SettingContainer>

          {/* Reduce Motion Setting */}
          <SettingContainer>
            <SettingRow>
              <SettingIcon>
                <AnimationIcon fontSize="large" />
              </SettingIcon>
              <SettingLabel>
                <Typography variant="subtitle1">Reduce Motion</Typography>
                <Typography variant="body2" color="textSecondary">
                  Minimizes animations and transitions
                </Typography>
              </SettingLabel>
            </SettingRow>
            <ControlContainer>
              <Switch
                checked={reduceMotion}
                onChange={(e) => setReduceMotion(e.target.checked)}
                inputProps={{
                  'aria-label': 'Toggle reduce motion',
                }}
                color="primary"
              />
            </ControlContainer>
          </SettingContainer>

          {/* Font Scale Setting */}
          <SettingContainer sx={{ flexDirection: 'column', alignItems: 'flex-start' }}>
            <SettingRow sx={{ width: '100%', mb: 2 }}>
              <SettingIcon>
                <TextIncreaseIcon fontSize="large" />
              </SettingIcon>
              <SettingLabel>
                <Typography variant="subtitle1">Font Size</Typography>
                <Typography variant="body2" color="textSecondary">
                  Adjust the size of text throughout the application
                </Typography>
              </SettingLabel>
            </SettingRow>
            <Box sx={{ px: 2, width: '100%' }}>
              <Slider
                value={fontScale}
                min={0.8}
                max={1.5}
                step={0.1}
                onChange={handleFontScaleChange}
                valueLabelDisplay="auto"
                valueLabelFormat={fontScaleText}
                marks={[
                  { value: 0.8, label: 'Smaller' },
                  { value: 1, label: 'Default' },
                  { value: 1.5, label: 'Larger' },
                ]}
                aria-labelledby="font-size-slider"
              />
            </Box>
          </SettingContainer>
        </DialogContent>

        <DialogActions>
          <Button
            startIcon={<ReplayIcon />}
            onClick={handleReset}
            aria-label="Reset accessibility settings to default values"
          >
            Reset to Default
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleClose}
            aria-label="Close accessibility settings"
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

AccessibilitySettings.propTypes = {
  buttonPosition: PropTypes.oneOf(['top-left', 'top-right', 'bottom-left', 'bottom-right']),
};

AccessibilitySettings.defaultProps = {
  buttonPosition: 'bottom-left',
};

export default AccessibilitySettings;
