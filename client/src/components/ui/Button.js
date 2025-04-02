/**
 * Enhanced Button component that follows the design system
 * 
 * This component extends MUI Button with consistent styling, animations,
 * and additional variants according to our design system with accessibility improvements.
 */

import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import { 
  Button as MuiButton, 
  CircularProgress, 
  Box, 
  IconButton as MuiIconButton,
  Tooltip,
  alpha,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { Link } from 'react-router-dom';

// Styled Button component with enhanced styling and accessibility
const StyledButton = styled(MuiButton)(({ theme, square, fullWidth, size, variant }) => ({
  borderRadius: square ? 4 : 'inherit',
  position: 'relative',
  fontWeight: theme.typography.fontWeightMedium,
  textTransform: 'none',
  padding: variant === 'text' ? theme.spacing(1, 2) : '',
  boxShadow: variant === 'contained' ? theme.shadows[2] : 'none',
  transition: theme.transitions.create(
    ['background-color', 'box-shadow', 'border-color', 'color', 'transform'],
    { duration: theme.transitions.duration.short }
  ),
  '&:hover': {
    transform: variant !== 'text' ? 'translateY(-2px)' : 'none',
    boxShadow: variant === 'contained' ? theme.shadows[4] : 'none',
  },
  '&:active': {
    transform: variant !== 'text' ? 'translateY(0)' : 'none',
    boxShadow: variant === 'contained' ? theme.shadows[3] : 'none',
  },
  // Improved focus styles for accessibility
  '&.Mui-focusVisible': {
    outline: `3px solid ${alpha(theme.palette.primary.main, 0.5)}`,
    outlineOffset: '2px',
  },
  width: fullWidth ? '100%' : 'auto',
  // Adjust sizes
  ...(size === 'small' && {
    padding: variant === 'text' ? theme.spacing(0.5, 1.5) : '',
    fontSize: theme.typography.pxToRem(13),
  }),
  ...(size === 'large' && {
    padding: variant === 'text' ? theme.spacing(1.5, 3) : '',
    fontSize: theme.typography.pxToRem(16),
  }),
}));

// Styled icon button with consistent styling and accessibility improvements
const StyledIconButton = styled(MuiIconButton)(({ theme, size, color }) => ({
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(1),
  transition: theme.transitions.create(['background-color', 'transform']),
  '&:hover': {
    transform: 'translateY(-2px)',
    backgroundColor: 
      color === 'default' 
        ? alpha(theme.palette.action.hover, 0.15)
        : alpha(theme.palette[color].main, 0.15),
  },
  // Improved focus styles for accessibility
  '&.Mui-focusVisible': {
    outline: `3px solid ${alpha(theme.palette.primary.main, 0.5)}`,
    outlineOffset: '2px',
  },
  // Adjust sizes
  ...(size === 'small' && {
    padding: theme.spacing(0.5),
    '& .MuiSvgIcon-root': {
      fontSize: theme.typography.pxToRem(16),
    },
  }),
  ...(size === 'large' && {
    padding: theme.spacing(1.5),
    '& .MuiSvgIcon-root': {
      fontSize: theme.typography.pxToRem(24),
    },
  }),
}));

/**
 * Enhanced Button component with consistent styling, behavior, and accessibility
 * 
 * @param {Object} props
 * @param {node} props.children - Button content
 * @param {boolean} props.loading - Show loading spinner
 * @param {boolean} props.square - Use square corners instead of rounded
 * @param {string} props.to - React Router path (converts button to Link)
 * @param {string} props.href - External URL (converts button to anchor tag)
 * @param {string} props.target - Target for href links
 * @param {string} props.tooltipText - Text to show in tooltip
 * @param {string} props.tooltipPlacement - Placement of tooltip
 * @param {node} props.startIcon - Icon to show at start of button
 * @param {node} props.endIcon - Icon to show at end of button
 * @param {string} props.loadingPosition - Position of loading spinner
 * @param {string} props.ariaLabel - Accessible label for the button
 * @param {string} props.ariaLabelledBy - ID of element that labels the button
 * @param {string} props.ariaDescribedBy - ID of element that describes the button
 * @param {Object} props.sx - Additional MUI sx styles
 */
const Button = forwardRef(({
  children,
  loading = false,
  square = false,
  to,
  href,
  target,
  tooltipText,
  tooltipPlacement = 'top',
  startIcon,
  endIcon,
  loadingPosition = 'center',
  color = 'primary',
  size = 'medium',
  variant = 'contained',
  iconButton = false,
  ariaLabel,
  ariaLabelledBy,
  ariaDescribedBy,
  sx = {},
  ...rest
}, ref) => {
  // Create component props
  const buttonProps = {
    ...rest,
    ref,
    square,
    size,
    variant: iconButton ? undefined : variant,
    color,
    sx,
    disabled: rest.disabled || loading,
    startIcon: startIcon && loadingPosition !== 'start' ? startIcon : undefined,
    endIcon: endIcon && loadingPosition !== 'end' ? endIcon : undefined,
    // Accessibility attributes
    'aria-label': rest['aria-label'] || ariaLabel,
    'aria-labelledby': rest['aria-labelledby'] || ariaLabelledBy,
    'aria-describedby': rest['aria-describedby'] || ariaDescribedBy, 
    'aria-busy': loading ? true : undefined,
    // Add focus visible styling
    focusVisibleClassName: 'Mui-focusVisible',
  };

  // For React Router links
  if (to) {
    buttonProps.component = Link;
    buttonProps.to = to;
  }

  // For external links
  if (href) {
    buttonProps.component = 'a';
    buttonProps.href = href;
    buttonProps.target = target;
    buttonProps.rel = target === '_blank' ? 'noopener noreferrer' : undefined;
  }

  // Loading indicator
  const loadingIndicator = loading && (
    <CircularProgress
      size={24}
      thickness={5}
      sx={{
        color: 'inherit',
        position: loadingPosition === 'center' ? 'absolute' : 'static',
        top: '50%',
        left: '50%',
        marginTop: '-12px',
        marginLeft: '-12px',
      }}
      // Accessibility improvement
      aria-label="Loading"
    />
  );

  // Create the button with appropriate styling
  const button = iconButton ? (
    <StyledIconButton 
      {...buttonProps}
      // Ensure aria-hidden true when only decorative (icon with tooltip)
      aria-hidden={tooltipText && !buttonProps['aria-label'] ? true : undefined}
    >
      {loadingIndicator || children}
    </StyledIconButton>
  ) : (
    <StyledButton {...buttonProps}>
      {loadingPosition === 'start' && loadingIndicator}
      {loading && loadingPosition === 'center' ? (
        <Box sx={{ opacity: 0 }} aria-hidden="true">{children}</Box>
      ) : (
        children
      )}
      {loadingPosition === 'end' && loadingIndicator}
    </StyledButton>
  );

  // Wrap with tooltip if tooltipText is provided
  if (tooltipText) {
    return (
      <Tooltip 
        title={tooltipText} 
        placement={tooltipPlacement}
        // Accessibility improvements for tooltip
        enterTouchDelay={50}
        leaveTouchDelay={1500}
        arrow
      >
        {button}
      </Tooltip>
    );
  }

  return button;
});

Button.propTypes = {
  children: PropTypes.node,
  loading: PropTypes.bool,
  square: PropTypes.bool,
  to: PropTypes.string,
  href: PropTypes.string,
  target: PropTypes.string,
  tooltipText: PropTypes.string,
  tooltipPlacement: PropTypes.string,
  startIcon: PropTypes.node,
  endIcon: PropTypes.node,
  loadingPosition: PropTypes.oneOf(['start', 'center', 'end']),
  color: PropTypes.oneOf([
    'primary',
    'secondary',
    'success',
    'error',
    'info',
    'warning',
    'inherit',
    'default',
  ]),
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  variant: PropTypes.oneOf(['text', 'contained', 'outlined']),
  iconButton: PropTypes.bool,
  sx: PropTypes.object,
  // Accessibility props
  ariaLabel: PropTypes.string,
  ariaLabelledBy: PropTypes.string,
  ariaDescribedBy: PropTypes.string,
  'aria-label': PropTypes.string,
  'aria-labelledby': PropTypes.string,
  'aria-describedby': PropTypes.string,
};

Button.displayName = 'Button';

export default Button;
