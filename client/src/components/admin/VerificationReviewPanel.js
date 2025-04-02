import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  CircularProgress,
  Alert,
  Divider,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Chip,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import PendingIcon from '@mui/icons-material/Pending';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import {
  getPendingVerifications,
  getVerificationById,
  reviewIdentityVerification,
} from '../../redux/slices/verificationSlice';

/**
 * Component for admin verification review panel
 */
const VerificationReviewPanel = () => {
  const dispatch = useDispatch();
  const { pendingVerifications, currentVerification, loading, error, pagination } = useSelector(
    (state) => state.verification
  );

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [selectedVerificationId, setSelectedVerificationId] = useState(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState('approved');
  const [rejectionReason, setRejectionReason] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');
  const [previewImage, setPreviewImage] = useState(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);

  // Load pending verifications on component mount and page change
  useEffect(() => {
    dispatch(getPendingVerifications({ page, limit }));
  }, [dispatch, page, limit]);

  // Handle page change
  const handlePageChange = (event, value) => {
    setPage(value);
  };

  // Handle verification selection
  const handleSelectVerification = (id) => {
    setSelectedVerificationId(id);
    dispatch(getVerificationById(id));
    setReviewDialogOpen(true);
  };

  // Handle approval status change
  const handleApprovalStatusChange = (event) => {
    setApprovalStatus(event.target.value);
  };

  // Handle review submission
  const handleSubmitReview = () => {
    if (selectedVerificationId) {
      dispatch(
        reviewIdentityVerification({
          id: selectedVerificationId,
          approved: approvalStatus === 'approved',
          notes: approvalStatus === 'approved' ? reviewNotes : rejectionReason,
        })
      ).then((result) => {
        if (!result.error) {
          // Close dialog and refresh list
          setReviewDialogOpen(false);
          setSelectedVerificationId(null);
          setApprovalStatus('approved');
          setRejectionReason('');
          setReviewNotes('');
          dispatch(getPendingVerifications({ page, limit }));
        }
      });
    }
  };

  // Handle preview image
  const handlePreviewImage = (imageUrl) => {
    setPreviewImage(imageUrl);
    setPreviewDialogOpen(true);
  };

  // Handle close preview dialog
  const handleClosePreviewDialog = () => {
    setPreviewDialogOpen(false);
    setPreviewImage(null);
  };

  // Handle close review dialog
  const handleCloseReviewDialog = () => {
    setReviewDialogOpen(false);
    setSelectedVerificationId(null);
    setApprovalStatus('approved');
    setRejectionReason('');
    setReviewNotes('');
  };

  // Get verification type display name
  const getVerificationType = (type) => {
    switch (type) {
      case 'identity':
        return 'Identity Verification';
      case 'social_account':
        return 'Social Account Verification';
      case 'professional':
        return 'Professional Verification';
      default:
        return type;
    }
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <VerifiedUserIcon color="primary" sx={{ mr: 1 }} />
        <Typography variant="h6">Verification Review Panel</Typography>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading && !pendingVerifications.length ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : pendingVerifications.length === 0 ? (
        <Alert severity="info">No pending verification requests found.</Alert>
      ) : (
        <>
          <Typography variant="subtitle1" gutterBottom>
            Pending Verification Requests ({pagination?.total || 0})
          </Typography>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            {pendingVerifications.map((verification) => (
              <Grid item xs={12} md={6} key={verification._id}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="subtitle1">
                        {getVerificationType(verification.type)}
                      </Typography>
                      <Chip
                        label={verification.status}
                        color={
                          verification.status === 'approved'
                            ? 'success'
                            : verification.status === 'rejected'
                            ? 'error'
                            : 'warning'
                        }
                        size="small"
                        icon={
                          verification.status === 'approved' ? (
                            <CheckCircleIcon />
                          ) : verification.status === 'rejected' ? (
                            <CancelIcon />
                          ) : (
                            <PendingIcon />
                          )
                        }
                      />
                    </Box>

                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Submitted: {new Date(verification.createdAt).toLocaleString()}
                    </Typography>

                    <Typography variant="body2" gutterBottom>
                      Influencer: {verification.influencerId?.userId?.username || 'Unknown'}
                    </Typography>

                    {verification.documents && verification.documents.length > 0 && (
                      <Typography variant="body2" gutterBottom>
                        Documents: {verification.documents.length}
                      </Typography>
                    )}
                  </CardContent>
                  <CardActions>
                    <Button
                      size="small"
                      color="primary"
                      onClick={() => handleSelectVerification(verification._id)}
                    >
                      Review
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>

          {pagination && pagination.pages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Pagination
                count={pagination.pages}
                page={page}
                onChange={handlePageChange}
                color="primary"
              />
            </Box>
          )}
        </>
      )}

      {/* Review Dialog */}
      <Dialog
        open={reviewDialogOpen}
        onClose={handleCloseReviewDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Review Verification Request</DialogTitle>
        <DialogContent>
          {loading && !currentVerification ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : currentVerification ? (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                {getVerificationType(currentVerification.type)}
              </Typography>

              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2">
                    <strong>Influencer:</strong>{' '}
                    {currentVerification.influencerId?.userId?.username || 'Unknown'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2">
                    <strong>Email:</strong>{' '}
                    {currentVerification.influencerId?.userId?.email || 'Unknown'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2">
                    <strong>Submitted:</strong>{' '}
                    {new Date(currentVerification.createdAt).toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2">
                    <strong>Status:</strong> {currentVerification.status}
                  </Typography>
                </Grid>
              </Grid>

              {currentVerification.documents && currentVerification.documents.length > 0 && (
                <>
                  <Typography variant="subtitle1" gutterBottom>
                    Submitted Documents
                  </Typography>
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    {currentVerification.documents.map((doc, index) => (
                      <Grid item xs={12} sm={6} md={4} key={index}>
                        <Card>
                          <CardMedia
                            component="img"
                            height="140"
                            image={doc.url}
                            alt={`Document ${index + 1}`}
                            sx={{ cursor: 'pointer' }}
                            onClick={() => handlePreviewImage(doc.url)}
                          />
                          <CardContent sx={{ py: 1 }}>
                            <Typography variant="body2" noWrap>
                              {doc.name}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </>
              )}

              <Divider sx={{ my: 3 }} />

              <Typography variant="subtitle1" gutterBottom>
                Review Decision
              </Typography>

              <FormControl component="fieldset" sx={{ mb: 2 }}>
                <FormLabel component="legend">Approval Status</FormLabel>
                <RadioGroup
                  aria-label="approval-status"
                  name="approval-status"
                  value={approvalStatus}
                  onChange={handleApprovalStatusChange}
                >
                  <FormControlLabel value="approved" control={<Radio />} label="Approve" />
                  <FormControlLabel value="rejected" control={<Radio />} label="Reject" />
                </RadioGroup>
              </FormControl>

              {approvalStatus === 'approved' ? (
                <TextField
                  fullWidth
                  label="Review Notes (Optional)"
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  multiline
                  rows={3}
                  sx={{ mb: 2 }}
                />
              ) : (
                <TextField
                  fullWidth
                  label="Rejection Reason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  multiline
                  rows={3}
                  required
                  error={approvalStatus === 'rejected' && !rejectionReason}
                  helperText={
                    approvalStatus === 'rejected' && !rejectionReason
                      ? 'Please provide a reason for rejection'
                      : ''
                  }
                  sx={{ mb: 2 }}
                />
              )}
            </Box>
          ) : (
            <Alert severity="error">Failed to load verification details.</Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseReviewDialog}>Cancel</Button>
          <Button
            onClick={handleSubmitReview}
            variant="contained"
            color={approvalStatus === 'approved' ? 'success' : 'error'}
            disabled={
              loading ||
              !currentVerification ||
              (approvalStatus === 'rejected' && !rejectionReason)
            }
          >
            {approvalStatus === 'approved' ? 'Approve' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Image Preview Dialog */}
      <Dialog open={previewDialogOpen} onClose={handleClosePreviewDialog} maxWidth="lg">
        <DialogContent>
          {previewImage && (
            <img
              src={previewImage}
              alt="Document Preview"
              style={{ maxWidth: '100%', maxHeight: '80vh' }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePreviewDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default VerificationReviewPanel;
