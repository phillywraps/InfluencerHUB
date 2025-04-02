import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Paper,
  Button,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  Alert,
  TextField,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Grid,
  Card,
  CardContent,
  CardMedia,
  IconButton,
  Divider,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import {
  initiateIdentityVerification,
  uploadVerificationDocuments,
} from '../../redux/slices/verificationSlice';

/**
 * Component for identity verification process
 */
const IdentityVerificationForm = ({ onComplete }) => {
  const dispatch = useDispatch();
  const { currentVerification, loading, error } = useSelector((state) => state.verification);

  const [activeStep, setActiveStep] = useState(0);
  const [documentType, setDocumentType] = useState('passport');
  const [documents, setDocuments] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [fullName, setFullName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [address, setAddress] = useState('');

  // Steps in the verification process
  const steps = ['Select Document Type', 'Upload Documents', 'Review & Submit'];

  // Handle document type selection
  const handleDocumentTypeChange = (event) => {
    setDocumentType(event.target.value);
  };

  // Handle document upload
  const handleDocumentUpload = (event) => {
    const files = Array.from(event.target.files);
    
    // Create preview URLs for the uploaded files
    const newPreviewUrls = files.map((file) => URL.createObjectURL(file));
    
    // Convert files to base64 for storage and transmission
    const promises = files.map((file) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve({
            name: file.name,
            url: e.target.result,
            mimeType: file.type,
          });
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(promises).then((newDocuments) => {
      setDocuments([...documents, ...newDocuments]);
      setPreviewUrls([...previewUrls, ...newPreviewUrls]);
    });
  };

  // Handle document removal
  const handleRemoveDocument = (index) => {
    const newDocuments = [...documents];
    const newPreviewUrls = [...previewUrls];
    
    // Revoke the object URL to avoid memory leaks
    URL.revokeObjectURL(previewUrls[index]);
    
    newDocuments.splice(index, 1);
    newPreviewUrls.splice(index, 1);
    
    setDocuments(newDocuments);
    setPreviewUrls(newPreviewUrls);
  };

  // Handle next step
  const handleNext = () => {
    if (activeStep === 0) {
      // Initiate verification if not already done
      if (!currentVerification) {
        dispatch(initiateIdentityVerification());
      }
    } else if (activeStep === steps.length - 1) {
      // Submit verification documents
      if (currentVerification && documents.length > 0) {
        dispatch(
          uploadVerificationDocuments({
            id: currentVerification._id,
            documents,
          })
        ).then((result) => {
          if (!result.error) {
            // Call onComplete callback if provided
            if (onComplete) {
              onComplete();
            }
          }
        });
      }
    }
    
    setActiveStep((prevStep) => prevStep + 1);
  };

  // Handle back step
  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  // Check if the current step is valid and can proceed
  const isStepValid = () => {
    switch (activeStep) {
      case 0:
        return documentType !== '';
      case 1:
        return documents.length > 0;
      case 2:
        return fullName !== '' && dateOfBirth !== '' && address !== '';
      default:
        return true;
    }
  };

  // Render step content based on active step
  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Select the type of document you want to upload for verification
            </Typography>
            <FormControl component="fieldset" sx={{ mt: 2 }}>
              <FormLabel component="legend">Document Type</FormLabel>
              <RadioGroup
                aria-label="document-type"
                name="document-type"
                value={documentType}
                onChange={handleDocumentTypeChange}
              >
                <FormControlLabel value="passport" control={<Radio />} label="Passport" />
                <FormControlLabel
                  value="drivers_license"
                  control={<Radio />}
                  label="Driver's License"
                />
                <FormControlLabel
                  value="national_id"
                  control={<Radio />}
                  label="National ID Card"
                />
              </RadioGroup>
            </FormControl>
          </Box>
        );
      case 1:
        return (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Upload clear images of your {documentType.replace('_', ' ')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {documentType === 'passport'
                ? 'Upload a clear image of your passport photo page.'
                : documentType === 'drivers_license'
                ? 'Upload clear images of the front and back of your driver\'s license.'
                : 'Upload clear images of the front and back of your national ID card.'}
            </Typography>

            <Button
              variant="contained"
              component="label"
              startIcon={<CloudUploadIcon />}
              sx={{ mb: 3 }}
            >
              Upload Document
              <input
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={handleDocumentUpload}
              />
            </Button>

            {documents.length > 0 && (
              <Grid container spacing={2}>
                {documents.map((doc, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Card>
                      <CardMedia
                        component="img"
                        height="140"
                        image={previewUrls[index]}
                        alt={`Document ${index + 1}`}
                      />
                      <CardContent sx={{ py: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2" noWrap>
                            {doc.name}
                          </Typography>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleRemoveDocument(index)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        );
      case 2:
        return (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Please provide the following information
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              This information should match the details on your uploaded documents.
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Full Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Date of Birth"
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  multiline
                  rows={3}
                  required
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Typography variant="subtitle1" gutterBottom>
              Document Summary
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2">
                Document Type: {documentType.replace('_', ' ')}
              </Typography>
              <Typography variant="body2">
                Number of Documents: {documents.length}
              </Typography>
            </Box>

            <Alert severity="info" sx={{ mb: 2 }}>
              By submitting, you confirm that the information provided is accurate and the documents
              are authentic. Verification typically takes 1-2 business days.
            </Alert>
          </Box>
        );
      case 3:
        return (
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <CheckCircleIcon color="success" sx={{ fontSize: 60, mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Verification Submitted Successfully
            </Typography>
            <Typography variant="body1" paragraph>
              Your identity verification request has been submitted and is pending review.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              We'll notify you once the verification is complete. This typically takes 1-2 business
              days.
            </Typography>
          </Box>
        );
      default:
        return 'Unknown step';
    }
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Identity Verification
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {getStepContent(activeStep)}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button
              disabled={activeStep === 0 || activeStep === steps.length}
              onClick={handleBack}
            >
              Back
            </Button>
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={!isStepValid() || loading}
            >
              {activeStep === steps.length - 1 ? 'Submit' : 'Next'}
            </Button>
          </Box>
        </>
      )}
    </Paper>
  );
};

export default IdentityVerificationForm;
