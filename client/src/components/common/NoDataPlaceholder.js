import React from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, Button, useTheme } from '@mui/material';
import { SentimentDissatisfied as SadIcon } from '@mui/icons-material';

/**
 * NoDataPlaceholder - A reusable component for displaying when no data is available
 * 
 * @param {Object} props - Component props
 * @param {string} props.title - The main title to display
 * @param {string} props.description - Descriptive text explaining the empty state
 * @param {React.ReactNode} props.icon - Icon to display (defaults to SadIcon)
 * @param {string} props.actionText - Text for the action button
 * @param {Function} props.onAction - Callback function for when action button is clicked
 * @param {Object} props.sx - Additional MUI sx props for styling
 */
const NoDataPlaceholder = ({
  title,
  description,
  icon: Icon = <SadIcon sx={{ fontSize: 64 }} />,
  actionText,
  onAction,
  sx = {}
}) => {
  const theme = useTheme();
  
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: 4,
        my: 2,
        ...sx
      }}
    >
      <Box
        sx={{
          color: theme.palette.text.secondary,
          opacity: 0.7,
          mb: 2
        }}
      >
        {Icon}
      </Box>
      
      <Typography
        variant="h6"
        component="h3"
        gutterBottom
        sx={{ color: theme.palette.text.primary }}
      >
        {title}
      </Typography>
      
      {description && (
        <Typography
          variant="body1"
          color="textSecondary"
          sx={{ 
            maxWidth: 450,
            mb: actionText ? 3 : 0
          }}
        >
          {description}
        </Typography>
      )}
      
      {actionText && onAction && (
        <Button
          variant="contained"
          color="primary"
          onClick={onAction}
          sx={{ mt: 2 }}
        >
          {actionText}
        </Button>
      )}
    </Box>
  );
};

NoDataPlaceholder.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  icon: PropTypes.node,
  actionText: PropTypes.string,
  onAction: PropTypes.func,
  sx: PropTypes.object
};

export default NoDataPlaceholder;
