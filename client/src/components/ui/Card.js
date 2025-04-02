/**
 * Enhanced Card component that follows the design system
 * 
 * This component extends MUI Card with consistent styling, hover effects,
 * responsive behavior, and accessibility features according to our design system.
 */

import React from 'react';
import PropTypes from 'prop-types';
import {
  Card as MuiCard,
  CardActions,
  CardContent,
  CardHeader,
  CardMedia,
  Typography,
  Divider,
  Box,
  alpha,
} from '@mui/material';
import { styled } from '@mui/material/styles';

// Styled Card component with hover effects and accessibility improvements
const StyledCard = styled(MuiCard)(({ theme, elevation, hoverable, variant, isInteractive }) => ({
  position: 'relative',
  transition: theme.transitions.create(['transform', 'box-shadow'], {
    duration: theme.transitions.duration.standard,
  }),
  borderRadius: theme.shape.borderRadius,
  overflow: 'hidden',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: variant === 'outlined' ? theme.palette.background.paper : undefined,
  boxShadow: variant === 'outlined' ? 'none' : theme.shadows[elevation],
  border: variant === 'outlined' ? `1px solid ${theme.palette.divider}` : 'none',
  ...(hoverable && {
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: theme.shadows[elevation + 2],
      ...(variant === 'outlined' && {
        borderColor: theme.palette.primary.main,
      }),
    },
  }),
  // Improve focus styles for keyboard navigation
  ...(isInteractive && {
    '&:focus-visible, &.Mui-focusVisible': {
      outline: `2px solid ${theme.palette.primary.main}`,
      outlineOffset: '2px',
    },
  }),
}));

// Styled CardHeader with proper spacing and typography
const StyledCardHeader = styled(CardHeader)(({ theme, textAlign }) => ({
  padding: theme.spacing(2, 3),
  '.MuiCardHeader-title': {
    ...theme.typography.h6,
    textAlign,
  },
  '.MuiCardHeader-subheader': {
    textAlign,
  },
}));

// Styled CardContent with padding control
const StyledCardContent = styled(CardContent)(({ theme, noPadding }) => ({
  padding: noPadding ? 0 : theme.spacing(3),
  flex: '1 1 auto',
  '&:last-child': {
    paddingBottom: noPadding ? 0 : theme.spacing(3),
  },
}));

// Styled CardActions with proper spacing
const StyledCardActions = styled(CardActions)(({ theme, alignRight }) => ({
  padding: theme.spacing(2, 3),
  justifyContent: alignRight ? 'flex-end' : 'flex-start',
}));

/**
 * Enhanced Card component with consistent styling, behavior, and accessibility
 * 
 * @param {Object} props
 * @param {string} props.title - Card title
 * @param {string|node} props.subtitle - Card subtitle
 * @param {node} props.avatar - Avatar component for the card header
 * @param {node} props.action - Action component for the card header
 * @param {node} props.media - Media content (image/video)
 * @param {number} props.mediaHeight - Height for the media component
 * @param {string} props.mediaAlt - Alt text for media if it's an image
 * @param {node} props.children - Card content
 * @param {node} props.footer - Card actions/footer content
 * @param {boolean} props.noPadding - Remove padding from card content
 * @param {boolean} props.hoverable - Enable hover effects
 * @param {number} props.elevation - Shadow elevation (0-24)
 * @param {string} props.variant - 'outlined' or 'elevation'
 * @param {boolean} props.dividers - Show dividers between sections
 * @param {string} props.textAlign - Alignment for title and subtitle
 * @param {boolean} props.alignFooterRight - Right align footer actions
 * @param {boolean} props.clickable - Makes the entire card clickable
 * @param {function} props.onClick - Click handler for the card
 * @param {string} props.role - ARIA role for the card
 * @param {string} props.ariaLabel - Accessible label for the card
 * @param {string} props.ariaDescribedBy - ID of element that describes the card
 * @param {string} props.ariaLabelledBy - ID of element that labels the card
 * @param {Object} props.sx - Additional MUI sx styles
 */
const Card = ({
  title,
  subtitle,
  avatar,
  action,
  media,
  mediaHeight = 200,
  mediaAlt,
  children,
  footer,
  noPadding = false,
  hoverable = true,
  elevation = 2,
  variant = 'elevation',
  dividers = false,
  textAlign = 'left',
  alignFooterRight = true,
  clickable = false,
  onClick,
  role,
  ariaLabel,
  ariaLabelledBy,
  ariaDescribedBy,
  sx = {},
  ...rest
}) => {
  // Determine if card is interactive for accessibility purposes
  const isInteractive = clickable || onClick;
  
  // Prepare props for the card
  const cardProps = {
    elevation,
    hoverable,
    variant,
    isInteractive,
    sx,
    ...rest,
    // Accessibility props
    'aria-label': rest['aria-label'] || ariaLabel,
    'aria-labelledby': rest['aria-labelledby'] || ariaLabelledBy,
    'aria-describedby': rest['aria-describedby'] || ariaDescribedBy,
    role: isInteractive ? (role || 'button') : role,
    // Interactive props
    ...(isInteractive && {
      tabIndex: 0, // Make focusable
      onClick, // Click handler
      onKeyDown: (e) => {
        // Handle keyboard interaction for Enter/Space
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick && onClick(e);
        }
      },
    }),
  };

  // Generate a unique ID for the header if needed for aria-labelledby
  const headerId = title && !cardProps['aria-labelledby'] && !cardProps['aria-label'] ? 
    `card-header-${Math.random().toString(36).substring(2, 9)}` : undefined;
  
  if (headerId) {
    cardProps['aria-labelledby'] = headerId;
  }

  return (
    <StyledCard {...cardProps}>
      {/* Card Header */}
      {(title || subtitle || avatar || action) && (
        <>
          <StyledCardHeader
            title={title}
            titleTypographyProps={{ id: headerId }}
            subheader={subtitle}
            avatar={avatar}
            action={action}
            textAlign={textAlign}
          />
          {dividers && <Divider />}
        </>
      )}
      
      {/* Card Media */}
      {media && (
        <CardMedia
          sx={{ height: mediaHeight }}
          image={typeof media === 'string' ? media : undefined}
          // Add alt text for accessibility
          {...(typeof media === 'string' && { alt: mediaAlt || title || "Card image" })}
        >
          {typeof media !== 'string' && media}
        </CardMedia>
      )}
      
      {/* Card Content */}
      <StyledCardContent noPadding={noPadding}>
        {children}
      </StyledCardContent>
      
      {/* Card Footer */}
      {footer && (
        <>
          {dividers && <Divider />}
          <StyledCardActions alignRight={alignFooterRight}>
            {footer}
          </StyledCardActions>
        </>
      )}
    </StyledCard>
  );
};

Card.propTypes = {
  title: PropTypes.node,
  subtitle: PropTypes.node,
  avatar: PropTypes.node,
  action: PropTypes.node,
  media: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  mediaHeight: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  mediaAlt: PropTypes.string,
  children: PropTypes.node,
  footer: PropTypes.node,
  noPadding: PropTypes.bool,
  hoverable: PropTypes.bool,
  elevation: PropTypes.number,
  variant: PropTypes.oneOf(['elevation', 'outlined']),
  dividers: PropTypes.bool,
  textAlign: PropTypes.oneOf(['left', 'center', 'right']),
  alignFooterRight: PropTypes.bool,
  clickable: PropTypes.bool,
  onClick: PropTypes.func,
  // Accessibility props
  role: PropTypes.string,
  ariaLabel: PropTypes.string,
  ariaLabelledBy: PropTypes.string,
  ariaDescribedBy: PropTypes.string,
  'aria-label': PropTypes.string,
  'aria-labelledby': PropTypes.string,
  'aria-describedby': PropTypes.string,
  sx: PropTypes.object,
};

export default Card;
