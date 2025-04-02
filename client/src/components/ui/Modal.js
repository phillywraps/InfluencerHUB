/**
 * Accessible Modal component that follows the design system
 * 
 * This component extends MUI Dialog with consistent styling, accessibility features,
 * and proper focus management according to WAI-ARIA best practices.
 * 
 * Enhanced with focusTrapUtils to ensure keyboard focus is properly trapped within
 * the dialog according to WCAG 2.1 compliance requirements.
 */

import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useFocusTrap } from '../../utils/focusTrapUtils';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
  Box,
  Fade,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';

// Styled Dialog component with custom styling
const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: theme.shape.borderRadius,
    boxShadow: theme.shadows[10],
    padding: theme.spacing(2),
    [theme.breakpoints.up('sm')]: {
      padding: theme.spacing(3),
    },
  },
  // Focus visible styling for accessibility
  '& .MuiButtonBase-root:focus-visible': {
    outline: `2px solid ${theme.palette.primary.main}`,
    outlineOffset: '2px',
  },
}));

// Styled DialogTitle with consistent styling
const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
  padding: theme.spacing(0, 0, 2, 0),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: theme.spacing(2),
}));

// Styled DialogContent with custom styling
const StyledDialogContent = styled(DialogContent)(({ theme }) => ({
  padding: theme.spacing(2, 0),
  '&.MuiDialogContent-dividers': {
    borderTop: `1px solid ${theme.palette.divider}`,
    borderBottom: `1px solid ${theme.palette.divider}`,
    paddingTop: theme.spacing(2),
    paddingBottom: theme.spacing(2),
  },
}));

// Styled DialogActions with consistent spacing
const StyledDialogActions = styled(DialogActions)(({ theme, align }) => ({
  padding: theme.spacing(2, 0, 0, 0),
  display: 'flex',
  justifyContent: align === 'right' ? 'flex-end' : 
                 align === 'left' ? 'flex-start' : 
                 align === 'center' ? 'center' : 'space-between',
  gap: theme.spacing(2),
}));

/**
 * Accessible Modal component with proper focus management
 * 
 * @param {Object} props
 * @param {boolean} props.open - Whether the modal is open
 * @param {function} props.onClose - Close handler function
 * @param {string} props.title - Modal title
 * @param {node} props.children - Modal content
 * @param {node} props.actions - Modal action buttons
 * @param {string} props.align - Alignment for action buttons ('left'|'right'|'center'|'between')
 * @param {boolean} props.fullWidth - Whether the dialog should take up the full width of its container
 * @param {string} props.maxWidth - Max width of the dialog ('xs'|'sm'|'md'|'lg'|'xl')
 * @param {boolean} props.dividers - Whether to show dividers between title, content, and actions
 * @param {string} props.ariaDescribedBy - ID of the element that describes the modal
 * @param {string} props.ariaLabelledBy - ID of the element that labels the modal
 * @param {string} props.closeButtonLabel - Accessible label for the close button
 * @param {object} props.sx - Additional MUI sx styling
 */
const Modal = ({
  open,
  onClose,
  title,
  children,
  actions,
  align = 'right',
  fullWidth = true,
  maxWidth = 'sm',
  dividers = false,
  ariaDescribedBy,
  ariaLabelledBy,
  closeButtonLabel = 'Close modal',
  sx = {},
  ...rest
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Refs for focus management
  const closeButtonRef = useRef(null);
  const dialogRef = useRef(null);
  
  // Generate IDs for accessibility if not provided
  const titleId = useRef(`modal-title-${Math.random().toString(36).substring(2, 9)}`);
  const contentId = useRef(`modal-content-${Math.random().toString(36).substring(2, 9)}`);
  
  // Use the focus trap hook for proper keyboard navigation
  const focusTrap = useFocusTrap(dialogRef, {
    enabled: open,
    onEscape: onClose,
    autoFocus: true,
    initialFocus: () => closeButtonRef.current
  });

  // Initialize focus trap when modal opens, cleanup when it closes
  useEffect(() => {
    if (open) {
      // Initialize focus trap after the modal is rendered
      setTimeout(() => {
        focusTrap.initialize();
      }, 50);
    }

    return () => {
      focusTrap.cleanup();
    };
  }, [open, focusTrap]);

  // Set initial focus on the close button when it becomes available
  useEffect(() => {
    if (open && closeButtonRef.current) {
      setTimeout(() => {
        closeButtonRef.current.focus();
      }, 50);
    }
  }, [open, closeButtonRef.current]);

  return (
    <StyledDialog
      open={open}
      onClose={onClose}
      fullWidth={fullWidth}
      maxWidth={maxWidth}
      aria-describedby={ariaDescribedBy || contentId.current}
      aria-labelledby={ariaLabelledBy || (title ? titleId.current : undefined)}
      scroll="paper"
      TransitionComponent={Fade}
      transitionDuration={{
        enter: theme.transitions.duration.enteringScreen,
        exit: theme.transitions.duration.leavingScreen,
      }}
      sx={sx}
      ref={dialogRef}
      aria-modal="true"
      role="dialog"
      {...rest}
    >
      {/* Modal Header */}
      {title && (
        <StyledDialogTitle id={titleId.current} disableTypography>
          <Typography variant="h6" component="h2">
            {title}
          </Typography>
          <IconButton
            ref={closeButtonRef}
            edge="end"
            color="inherit"
            onClick={onClose}
            aria-label={closeButtonLabel}
            size={isMobile ? 'small' : 'medium'}
          >
            <CloseIcon />
          </IconButton>
        </StyledDialogTitle>
      )}
      
      {/* Modal Content */}
      <StyledDialogContent 
        id={contentId.current}
        dividers={dividers}
      >
        <Box sx={{ minHeight: theme.spacing(3) }}>
          {children}
        </Box>
      </StyledDialogContent>
      
      {/* Modal Actions */}
      {actions && (
        <StyledDialogActions align={align}>
          {actions}
        </StyledDialogActions>
      )}
    </StyledDialog>
  );
};

Modal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.node,
  children: PropTypes.node,
  actions: PropTypes.node,
  align: PropTypes.oneOf(['left', 'right', 'center', 'between']),
  fullWidth: PropTypes.bool,
  maxWidth: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']),
  dividers: PropTypes.bool,
  ariaDescribedBy: PropTypes.string,
  ariaLabelledBy: PropTypes.string,
  closeButtonLabel: PropTypes.string,
  sx: PropTypes.object,
};

export default Modal;
