import React, { useState, useRef } from 'react';
import { useAccessibility } from '../../utils/accessibilityContext';
import { useFocusTrap } from '../../utils/focusTrapUtils';
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardActions,
  CardContent,
  CardMedia,
  Chip,
  Grid,
  IconButton,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tooltip,
  Skeleton,
  useTheme,
} from '@mui/material';
import {
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  ShowChart as LineChartIcon,
  TableChart as TableChartIcon,
  StarOutline as StarOutlineIcon,
  Star as StarIcon,
  Info as InfoIcon,
  FilterList as FilterListIcon,
  Timeline as TimelineIcon,
  Category as CategoryIcon,
  Description as DescriptionIcon,
  Add as AddIcon,
} from '@mui/icons-material';

/**
 * Report Template Selector Component
 * Displays a grid of available report templates for selection
 * Enhanced with accessibility features including keyboard navigation and focus management
 */
const ReportTemplateSelector = ({ templates, loading, onSelect, onCreateCustom }) => {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [customDialogOpen, setCustomDialogOpen] = useState(false);
  const [customTemplate, setCustomTemplate] = useState({
    name: '',
    description: '',
    type: 'performance',
  });
  const theme = useTheme();
  
  // Access accessibility context
  const { isScreenReaderEnabled, announce } = useAccessibility();
  
  // Refs for focus management
  const detailsDialogRef = useRef(null);
  const customDialogRef = useRef(null);
  const lastFocusedElementRef = useRef(null);
  const createCustomButtonRef = useRef(null);
  
  // Use focus trap for details dialog
  const detailsFocusTrap = useFocusTrap(detailsDialogRef, {
    enabled: detailsOpen,
    onEscape: () => setDetailsOpen(false),
    autoFocus: true
  });
  
  // Use focus trap for custom template dialog
  const customFocusTrap = useFocusTrap(customDialogRef, {
    enabled: customDialogOpen,
    onEscape: () => setCustomDialogOpen(false),
    autoFocus: true
  });
  
  // Handle template selection
  const handleSelect = (template) => {
    setSelectedTemplate(template);
    onSelect(template);
    
    // Announce to screen readers
    if (isScreenReaderEnabled) {
      announce(`Selected template: ${template.name}`, 'polite');
    }
  };
  
  // Handle view details
  const handleViewDetails = (template, event) => {
    event.stopPropagation();
    setSelectedTemplate(template);
    lastFocusedElementRef.current = event.currentTarget;
    setDetailsOpen(true);
  };
  
  // Initialize focus trap when details dialog opens, cleanup when it closes
  React.useEffect(() => {
    if (detailsOpen) {
      // Initialize focus trap after the dialog is rendered
      setTimeout(() => {
        detailsFocusTrap.initialize();
        
        // Announce to screen readers
        if (isScreenReaderEnabled) {
          announce(`Viewing details for template: ${selectedTemplate.name}`, 'polite');
        }
      }, 50);
    } else if (lastFocusedElementRef.current) {
      // Return focus when dialog closes
      setTimeout(() => {
        lastFocusedElementRef.current.focus();
      }, 50);
    }
    
    return () => {
      detailsFocusTrap.cleanup();
    };
  }, [detailsOpen, detailsFocusTrap]);
  
  // Initialize focus trap when custom dialog opens, cleanup when it closes
  React.useEffect(() => {
    if (customDialogOpen) {
      // Initialize focus trap after the dialog is rendered
      setTimeout(() => {
        customFocusTrap.initialize();
        
        // Announce to screen readers
        if (isScreenReaderEnabled) {
          announce('Create custom report template dialog opened', 'polite');
        }
      }, 50);
    } else if (createCustomButtonRef.current) {
      // Return focus when dialog closes
      setTimeout(() => {
        createCustomButtonRef.current.focus();
      }, 50);
    }
    
    return () => {
      customFocusTrap.cleanup();
    };
  }, [customDialogOpen, customFocusTrap]);
  
  // Handle custom template creation
  const handleCreateCustom = () => {
    onCreateCustom(customTemplate);
    setCustomDialogOpen(false);
    setCustomTemplate({
      name: '',
      description: '',
      type: 'performance',
    });
    
    // Announce to screen readers
    if (isScreenReaderEnabled) {
      announce('Custom template created successfully', 'polite');
    }
  };
  
  // Handle keyboard navigation for template cards
  const handleCardKeyDown = (event, template) => {
    // Select template on Enter or Space
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleSelect(template);
    }
  };
  
  // Handle keyboard navigation for details button
  const handleDetailsKeyDown = (event, template) => {
    // Open details on Enter or Space
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      event.stopPropagation();
      handleViewDetails(template, event);
    }
  };
  
  // Get icon for report type
  const getReportTypeIcon = (type) => {
    switch (type) {
      case 'performance':
        return <LineChartIcon />;
      case 'demographics':
        return <PieChartIcon />;
      case 'engagement':
        return <BarChartIcon />;
      case 'financial':
        return <TimelineIcon />;
      case 'categorical':
        return <CategoryIcon />;
      default:
        return <DescriptionIcon />;
    }
  };
  
  // Render loading skeletons
  const renderSkeletons = () => {
    return Array(6).fill(0).map((_, index) => (
      <Grid item xs={12} sm={6} md={4} key={`skeleton-${index}`}>
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Skeleton variant="rectangular" width={40} height={40} sx={{ mb: 2 }} />
            <Skeleton variant="text" width="80%" height={28} sx={{ mb: 1 }} />
            <Skeleton variant="text" width="100%" height={20} />
            <Skeleton variant="text" width="90%" height={20} />
          </CardContent>
          <CardActions>
            <Skeleton variant="rectangular" width={80} height={30} />
            <Box sx={{ flexGrow: 1 }} />
            <Skeleton variant="circular" width={30} height={30} sx={{ mr: 1 }} />
            <Skeleton variant="circular" width={30} height={30} />
          </CardActions>
        </Card>
      </Grid>
    ));
  };
  
  return (
    <Box>
      <Grid container spacing={3}>
        {/* Create Custom Template Card */}
        <Grid item xs={12} sm={6} md={4}>
          <Card 
            sx={{ 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column',
              border: `1px dashed ${theme.palette.primary.main}`,
              backgroundColor: 'rgba(0, 0, 0, 0.02)',
              transition: 'all 0.2s',
              '&:hover': {
                borderColor: theme.palette.primary.dark,
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
              },
              '&:focus-visible': {
                outline: `2px solid ${theme.palette.primary.main}`,
                outlineOffset: '2px',
              },
            }}
          >
            <CardActionArea 
              onClick={() => setCustomDialogOpen(true)}
              sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}
              ref={createCustomButtonRef}
              aria-label="Create custom report template"
              role="button"
            >
              <AddIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" align="center">
                Create Custom Report
              </Typography>
              <Typography variant="body2" color="textSecondary" align="center" sx={{ px: 2, mt: 1 }}>
                Build your own report template with specific metrics and visualizations
              </Typography>
            </CardActionArea>
          </Card>
        </Grid>
        
        {/* Template Cards */}
        {loading ? (
          renderSkeletons()
        ) : (
          templates.map((template) => (
            <Grid item xs={12} sm={6} md={4} key={template.id}>
              <Card 
                sx={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    boxShadow: 3,
                    transform: 'translateY(-4px)',
                  },
                  '&:focus-visible': {
                    outline: `2px solid ${theme.palette.primary.main}`,
                    outlineOffset: '2px',
                    boxShadow: 3,
                  },
                }}
                onClick={() => handleSelect(template)}
                onKeyDown={(e) => handleCardKeyDown(e, template)}
                tabIndex="0"
                role="button"
                aria-label={`Select ${template.name} template`}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Box 
                      sx={{ 
                        mr: 1.5, 
                        color: 'primary.main',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {getReportTypeIcon(template.type)}
                    </Box>
                    <Typography variant="h6" component="div">
                      {template.name}
                    </Typography>
                  </Box>
                  
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                    {template.description}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 'auto' }}>
                    {template.tags && template.tags.map((tag) => (
                      <Chip
                        key={tag}
                        label={tag}
                        size="small"
                        sx={{ fontSize: '0.75rem' }}
                      />
                    ))}
                    
                    {template.custom && (
                      <Chip
                        label="Custom"
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{ fontSize: '0.75rem' }}
                      />
                    )}
                  </Box>
                </CardContent>
                
                <CardActions>
                  <Button size="small" onClick={() => handleSelect(template)}>
                    Select
                  </Button>
                  <Box sx={{ flexGrow: 1 }} />
                  <Tooltip title="Favorite">
                    <IconButton size="small">
                      {template.favorite ? (
                        <StarIcon fontSize="small" color="primary" />
                      ) : (
                        <StarOutlineIcon fontSize="small" />
                      )}
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="View Details">
                    <IconButton 
                      size="small" 
                      onClick={(e) => handleViewDetails(template, e)}
                      onKeyDown={(e) => handleDetailsKeyDown(e, template)}
                      aria-label={`View details for ${template.name}`}
                    >
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </CardActions>
              </Card>
            </Grid>
          ))
        )}
      </Grid>
      
      {/* Template Details Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="sm"
        fullWidth
        aria-labelledby="template-details-title"
        aria-describedby="template-details-description"
        PaperProps={{
          ref: detailsDialogRef,
          sx: {
            '& *:focus-visible': {
              outline: `2px solid ${theme.palette.primary.main}`,
              outlineOffset: '2px',
            },
          },
        }}
      >
        {selectedTemplate && (
          <>
            <DialogTitle id="template-details-title">
              {selectedTemplate.name}
            </DialogTitle>
            <DialogContent dividers>
              <Typography id="template-details-description" variant="body1" paragraph>
                {selectedTemplate.description}
              </Typography>
              
              <Typography variant="subtitle2" gutterBottom>
                Report Type
              </Typography>
              <Chip 
                icon={getReportTypeIcon(selectedTemplate.type)} 
                label={selectedTemplate.type?.charAt(0).toUpperCase() + selectedTemplate.type?.slice(1)}
                sx={{ mb: 2 }}
              />
              
              {selectedTemplate.metrics && selectedTemplate.metrics.length > 0 && (
                <>
                  <Typography variant="subtitle2" gutterBottom>
                    Default Metrics
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                    {selectedTemplate.metrics.map((metric) => (
                      <Chip
                        key={metric.id}
                        label={metric.name}
                        size="small"
                      />
                    ))}
                  </Box>
                </>
              )}
              
              {selectedTemplate.filters && selectedTemplate.filters.length > 0 && (
                <>
                  <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <FilterListIcon fontSize="small" sx={{ mr: 0.5 }} />
                    Available Filters
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                    {selectedTemplate.filters.map((filter) => (
                      <Chip
                        key={filter.id}
                        label={filter.name}
                        size="small"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </>
              )}
              
              {selectedTemplate.tags && selectedTemplate.tags.length > 0 && (
                <>
                  <Typography variant="subtitle2" gutterBottom>
                    Tags
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selectedTemplate.tags.map((tag) => (
                      <Chip
                        key={tag}
                        label={tag}
                        size="small"
                      />
                    ))}
                  </Box>
                </>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDetailsOpen(false)}>
                Close
              </Button>
              <Button 
                onClick={() => {
                  setDetailsOpen(false);
                  handleSelect(selectedTemplate);
                }} 
                color="primary" 
                variant="contained"
              >
                Use This Template
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
      
      {/* Create Custom Template Dialog */}
      <Dialog
        open={customDialogOpen}
        onClose={() => setCustomDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        aria-labelledby="custom-template-title"
        aria-describedby="custom-template-description"
        PaperProps={{
          ref: customDialogRef,
          sx: {
            '& *:focus-visible': {
              outline: `2px solid ${theme.palette.primary.main}`,
              outlineOffset: '2px',
            },
          },
        }}
      >
        <DialogTitle id="custom-template-title">
          Create Custom Report Template
        </DialogTitle>
        <DialogContent dividers id="custom-template-description">
          <TextField
            label="Template Name"
            fullWidth
            margin="normal"
            value={customTemplate.name}
            onChange={(e) => setCustomTemplate({ ...customTemplate, name: e.target.value })}
            aria-required="true"
            inputProps={{
              'aria-label': 'Template name',
            }}
          />
          
          <TextField
            label="Description"
            fullWidth
            margin="normal"
            multiline
            rows={3}
            value={customTemplate.description}
            onChange={(e) => setCustomTemplate({ ...customTemplate, description: e.target.value })}
            aria-required="true"
            inputProps={{
              'aria-label': 'Template description',
            }}
          />
          
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Report Type
            </Typography>
            <Grid container spacing={1}>
              {['performance', 'engagement', 'demographics', 'financial'].map((type) => (
              <Grid item key={type}>
                <Chip
                  icon={getReportTypeIcon(type)}
                  label={type.charAt(0).toUpperCase() + type.slice(1)}
                  onClick={() => setCustomTemplate({ ...customTemplate, type })}
                  color={customTemplate.type === type ? 'primary' : 'default'}
                  variant={customTemplate.type === type ? 'filled' : 'outlined'}
                  sx={{ mb: 1 }}
                  role="radio"
                  aria-checked={customTemplate.type === type}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setCustomTemplate({ ...customTemplate, type });
                    }
                  }}
                />
              </Grid>
              ))}
            </Grid>
          </Box>
          
          <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
            You'll be able to select specific metrics and filters in the next step.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCustomDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreateCustom} 
            color="primary" 
            variant="contained"
            disabled={!customTemplate.name.trim() || !customTemplate.description.trim()}
          >
            Create Template
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ReportTemplateSelector;
