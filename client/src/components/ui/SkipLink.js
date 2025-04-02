/**
 * SkipLink Component
 *
 * An accessibility component that allows keyboard users to bypass navigation
 * and jump directly to the main content. The link remains visually hidden
 * until it receives focus, making it unobtrusive for mouse users while
 * being crucial for keyboard navigation.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { styled } from '@mui/material/styles';
import { Link } from '@mui/material';

const StyledSkipLink = styled(Link)(({ theme }) => ({
  position: 'absolute',
  top: -50,
  left: 0,
  padding: theme.spacing(1, 2),
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  zIndex: 9999,
  borderRadius: '0 0 4px 0',
  fontWeight: 500,
  textDecoration: 'none',
  boxShadow: theme.shadows[4],
  transition: 'top 0.2s ease-in-out',
  '&:focus': {
    top: 0,
    outline: 'none',
    boxShadow: `0 0 0 2px ${theme.palette.background.paper}, 0 0 0 4px ${theme.palette.primary.main}`,
  },
}));

/**
 * SkipLink Component
 *
 * @param {Object} props
 * @param {string} props.targetId - ID of the element to skip to (usually main content area)
 * @param {string} props.text - Text to display in the skip link
 */
const SkipLink = ({ targetId, text }) => {
  const handleClick = (e) => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    
    if (target) {
      // Set tabindex to make the element focusable
      target.setAttribute('tabindex', '-1');
      target.focus();
      
      // Remove tabindex after focus to avoid changing the normal tab order
      // We use a timeout to ensure the focus happens before removing the attribute
      setTimeout(() => {
        target.removeAttribute('tabindex');
      }, 100);
    }
  };

  return (
    <StyledSkipLink 
      href={`#${targetId}`}
      onClick={handleClick}
      aria-label={text} 
    >
      {text}
    </StyledSkipLink>
  );
};

SkipLink.propTypes = {
  targetId: PropTypes.string.isRequired,
  text: PropTypes.string,
};

SkipLink.defaultProps = {
  text: 'Skip to main content',
};

export default SkipLink;
