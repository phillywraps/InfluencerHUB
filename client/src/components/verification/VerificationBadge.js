import React from 'react';
import { Tooltip, Box, Typography, Badge } from '@mui/material';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import PendingIcon from '@mui/icons-material/Pending';

/**
 * Component to display verification badge for influencers
 * @param {Object} props
 * @param {boolean} props.isVerified - Whether the influencer is fully verified
 * @param {boolean} props.isIdentityVerified - Whether the influencer's identity is verified
 * @param {number} props.verifiedSocialAccounts - Number of verified social accounts
 * @param {number} props.totalSocialAccounts - Total number of social accounts
 * @param {string} props.size - Size of the badge ('small', 'medium', 'large')
 * @param {boolean} props.showDetails - Whether to show verification details
 * @param {string} props.placement - Tooltip placement
 */
const VerificationBadge = ({
  isVerified = false,
  isIdentityVerified = false,
  verifiedSocialAccounts = 0,
  totalSocialAccounts = 0,
  size = 'medium',
  showDetails = false,
  placement = 'top',
}) => {
  // Determine icon size based on the size prop
  const getIconSize = () => {
    switch (size) {
      case 'small':
        return { fontSize: 16 };
      case 'large':
        return { fontSize: 28 };
      case 'medium':
      default:
        return { fontSize: 20 };
    }
  };

  // Determine badge color based on verification status
  const getBadgeColor = () => {
    if (isVerified) return 'success';
    if (isIdentityVerified || verifiedSocialAccounts > 0) return 'warning';
    return 'default';
  };

  // Get verification status text
  const getVerificationStatusText = () => {
    if (isVerified) return 'Fully Verified';
    if (isIdentityVerified && verifiedSocialAccounts > 0)
      return 'Partially Verified';
    if (isIdentityVerified) return 'Identity Verified';
    if (verifiedSocialAccounts > 0) return 'Social Accounts Verified';
    return 'Not Verified';
  };

  // Render verification details
  const renderVerificationDetails = () => {
    return (
      <Box sx={{ p: 1 }}>
        <Typography variant="subtitle2" gutterBottom>
          {getVerificationStatusText()}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
          {isIdentityVerified ? (
            <CheckCircleIcon color="success" fontSize="small" sx={{ mr: 0.5 }} />
          ) : (
            <CancelIcon color="error" fontSize="small" sx={{ mr: 0.5 }} />
          )}
          <Typography variant="body2">Identity Verification</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {verifiedSocialAccounts === totalSocialAccounts && totalSocialAccounts > 0 ? (
            <CheckCircleIcon color="success" fontSize="small" sx={{ mr: 0.5 }} />
          ) : verifiedSocialAccounts > 0 ? (
            <PendingIcon color="warning" fontSize="small" sx={{ mr: 0.5 }} />
          ) : (
            <CancelIcon color="error" fontSize="small" sx={{ mr: 0.5 }} />
          )}
          <Typography variant="body2">
            Social Accounts: {verifiedSocialAccounts}/{totalSocialAccounts} verified
          </Typography>
        </Box>
      </Box>
    );
  };

  return (
    <Tooltip
      title={showDetails ? renderVerificationDetails() : getVerificationStatusText()}
      placement={placement}
      arrow
    >
      <Badge
        color={getBadgeColor()}
        variant="dot"
        overlap="circular"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <VerifiedUserIcon
          color={isVerified ? 'primary' : 'disabled'}
          sx={getIconSize()}
        />
      </Badge>
    </Tooltip>
  );
};

export default VerificationBadge;
