/**
 * SkipNavigation Component
 *
 * An accessibility component that provides multiple skip links for keyboard users,
 * allowing them to bypass different sections of the page and navigate directly
 * to key content areas. These links remain visually hidden until they receive focus,
 * making them unobtrusive for mouse users while being crucial for keyboard navigation.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { styled, alpha } from '@mui/material/styles';
import { Box, Typography } from '@mui/material';
import SkipLink from './SkipLink';

const SkipNavContainer = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  zIndex: 9999,
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  '&:not(:focus-within)': {
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: 0,
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
    borderWidth: 0,
  },
}));

const LinkContainer = styled(Box)(({ theme }) => ({
  backgroundColor: alpha(theme.palette.background.paper, 0.95),
  padding: theme.spacing(1),
  borderBottom: `1px solid ${theme.palette.divider}`,
  width: '100%',
  textAlign: 'center',
  boxShadow: theme.shadows[4],
}));

const LinkTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 'bold',
  marginBottom: theme.spacing(1),
  color: theme.palette.text.primary,
}));

/**
 * SkipNavigation Component
 *
 * @param {Object} props
 * @param {Array} props.links - Array of link objects with targetId and text
 * @param {boolean} props.showTitle - Whether to show a title above the links
 * @param {string} props.titleText - Text for the title if showTitle is true
 */
const SkipNavigation = ({ links, showTitle, titleText, ...props }) => {
  return (
    <SkipNavContainer
      role="navigation"
      aria-label="Skip links navigation"
      tabIndex="-1"
      {...props}
    >
      <LinkContainer>
        {showTitle && (
          <LinkTitle variant="subtitle2">{titleText}</LinkTitle>
        )}
        {links.map((link) => (
          <SkipLink
            key={link.targetId}
            targetId={link.targetId}
            text={link.text}
          />
        ))}
      </LinkContainer>
    </SkipNavContainer>
  );
};

SkipNavigation.propTypes = {
  links: PropTypes.arrayOf(
    PropTypes.shape({
      targetId: PropTypes.string.isRequired,
      text: PropTypes.string.isRequired,
    })
  ).isRequired,
  showTitle: PropTypes.bool,
  titleText: PropTypes.string,
};

SkipNavigation.defaultProps = {
  showTitle: false,
  titleText: 'Skip to:',
  links: [
    {
      targetId: 'main-content',
      text: 'Skip to main content',
    },
  ],
};

export default SkipNavigation;
