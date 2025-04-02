import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  Link,
  MenuItem,
  Paper,
  Select,
  Stepper,
  Step,
  StepLabel,
  Switch,
  Tab,
  Tabs,
  TextField,
  Typography,
  Tooltip,
  CircularProgress,
  Alert,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Add as AddIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  CalendarToday as CalendarTodayIcon,
  Close as CloseIcon,
  CloudDownload as CloudDownloadIcon,
  Description as DescriptionIcon,
  ExpandMore as ExpandMoreIcon,
  Favorite as FavoriteIcon,
  FilterList as FilterListIcon,
  GetApp as GetAppIcon,
  History as HistoryIcon,
  PictureAsPdf as PictureAsPdfIcon,
  Refresh as RefreshIcon,
  Save as SaveIcon,
  Schedule as ScheduleIcon,
  Settings as SettingsIcon,
  Share as ShareIcon,
  TableChart as TableChartIcon,
} from '@mui/icons-material';
import { DateRangePicker } from '@mui/lab';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { format, subDays, startOfMonth, endOfMonth, isAfter, isBefore } from 'date-fns';

import reportService from '../../services/reportService';
import ReportViewer from './ReportViewer';
import ReportTemplateSelector from './ReportTemplateSelector';
import SavedReportsTable from './SavedReportsTable';
import ScheduledReportsTable from './ScheduledReportsTable';

/**
 * Report Generator Component
 * Allows users to generate, customize, and export reports
 */
const ReportGenerator = () => {
  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [reportTemplates, setReportTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [dateRange, setDateRange] = useState([
    subDays(new Date(), 30),
    new Date(),
  ]);
  const [metrics, setMetrics] = useState([]);
  const [availableMetrics, setAvailableMetrics] = useState([]);
  const [filters, setFilters] = useState({});
  const [reportData, setReportData] = useState(null);
  const [savedReports, setSavedReports] = useState([]);
  const [scheduledReports, setScheduledReports] = useState([]);
  const [saveReportDialogOpen, setSaveReportDialogOpen] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [reportName, setReportName] = useState('');
  const [scheduleFrequency, setScheduleFrequency] = useState('weekly');
  const [scheduleRecipients, setScheduleRecipients] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [scheduleSuccess, setScheduleSuccess] = useState(false);
  const [exportFormat, setExportFormat] = useState('pdf');
  
  // Steps for the stepper
  const steps = [
    'Select Report Template',
    'Configure Parameters',
    'View & Export Report',
  ];
  
  // Load report templates
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        setLoading(true);
        const templates = await reportService.getReportTemplates();
        setReportTemplates(templates);
        if (templates.length > 0) {
          setSelectedTemplate(templates[0]);
          loadAvailableMetrics(templates[0].type);
        }
      } catch (err) {
        setError(err.message || 'Failed to load report templates');
      } finally {
        setLoading(false);
      }
    };
    
    loadTemplates();
  }, []);
  
  // Load saved and scheduled reports when tab changes
  useEffect(() => {
    if (activeTab === 1) {
      loadSavedReports();
    } else if (activeTab === 2) {
      loadScheduledReports();
    }
  }, [activeTab]);
  
  // Load available metrics for a report type
  const loadAvailableMetrics = async (reportType) => {
    try {
      const metricsData = await reportService.getAvailableMetrics(reportType);
      setAvailableMetrics(metricsData);
      
      // Set default metrics (first 3)
      if (metricsData.length > 0) {
        setMetrics(metricsData.slice(0, 3).map(m => m.id));
      }
    } catch (err) {
      console.error('Error loading metrics:', err);
    }
  };
  
  // Load saved reports
  const loadSavedReports = async () => {
    try {
      setLoading(true);
      const reports = await reportService.getSavedReports();
      setSavedReports(reports);
    } catch (err) {
      setError(err.message || 'Failed to load saved reports');
    } finally {
      setLoading(false);
    }
  };
  
  // Load scheduled reports
  const loadScheduledReports = async () => {
    try {
      setLoading(true);
      const reports = await reportService.getScheduledReports();
      setScheduledReports(reports);
    } catch (err) {
      setError(err.message || 'Failed to load scheduled reports');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // Handle template selection
  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    loadAvailableMetrics(template.type);
    setActiveStep(1);
  };
  
  // Handle metric selection
  const handleMetricChange = (event) => {
    setMetrics(event.target.value);
  };
  
  // Handle filter change
  const handleFilterChange = (key, value) => {
    setFilters({
      ...filters,
      [key]: value,
    });
  };
  
  // Generate report
  const generateReport = async () => {
    if (!selectedTemplate) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const reportParams = {
        startDate: format(dateRange[0], 'yyyy-MM-dd'),
        endDate: format(dateRange[1], 'yyyy-MM-dd'),
        metrics,
        ...filters,
      };
      
      const data = await reportService.getReportData(
        selectedTemplate.type,
        reportParams.startDate,
        reportParams.endDate,
        metrics,
        filters
      );
      
      setReportData(data);
      setActiveStep(2);
    } catch (err) {
      setError(err.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };
  
  // Save report
  const saveReport = async () => {
    if (!reportName || !selectedTemplate || !reportData) return;
    
    try {
      setLoading(true);
      await reportService.saveReport(
        reportName,
        selectedTemplate.id,
        {
          startDate: format(dateRange[0], 'yyyy-MM-dd'),
          endDate: format(dateRange[1], 'yyyy-MM-dd'),
          metrics,
          ...filters,
        },
        reportData
      );
      
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setSaveReportDialogOpen(false);
      }, 2000);
      
      // Refresh saved reports if on that tab
      if (activeTab === 1) {
        loadSavedReports();
      }
    } catch (err) {
      setError(err.message || 'Failed to save report');
    } finally {
      setLoading(false);
    }
  };
  
  // Schedule report
  const scheduleReport = async () => {
    if (!selectedTemplate) return;
    
    try {
      setLoading(true);
      
      const recipientsList = scheduleRecipients
        .split(',')
        .map(email => email.trim())
        .filter(email => email !== '');
      
      await reportService.scheduleReport(
        selectedTemplate.id,
        {
          startDate: format(dateRange[0], 'yyyy-MM-dd'),
          endDate: format(dateRange[1], 'yyyy-MM-dd'),
          metrics,
          ...filters,
        },
        scheduleFrequency,
        recipientsList
      );
      
      setScheduleSuccess(true);
      setTimeout(() => {
        setScheduleSuccess(false);
        setScheduleDialogOpen(false);
      }, 2000);
      
      // Refresh scheduled reports if on that tab
      if (activeTab === 2) {
        loadScheduledReports();
      }
    } catch (err) {
      setError(err.message || 'Failed to schedule report');
    } finally {
      setLoading(false);
    }
  };
  
  // Export report data
  const exportReport = async () => {
    if (!reportData) return;
    
    try {
      setLoading(true);
      
      const filename = selectedTemplate 
        ? `${selectedTemplate.name}_${format(new Date(), 'yyyy-MM-dd')}`
        : `Report_${format(new Date(), 'yyyy-MM-dd')}`;
        
      switch (exportFormat) {
        case 'csv':
          await reportService.exportToCsv(reportData, filename);
          break;
        case 'excel':
          await reportService.exportToExcel(reportData, filename);
          break;
        case 'pdf':
          await reportService.exportToPdf(reportData, {}, filename);
          break;
        default:
          throw new Error('Unsupported export format');
      }
    } catch (err) {
      setError(err.message || 'Failed to export report');
    } finally {
      setLoading(false);
    }
  };
  
  // Delete saved report
  const deleteSavedReport = async (reportId) => {
    try {
      await reportService.deleteSavedReport(reportId);
      loadSavedReports();
    } catch (err) {
      setError(err.message || 'Failed to delete report');
    }
  };
  
  // Cancel scheduled report
  const cancelScheduledReport = async (scheduleId) => {
    try {
      await reportService.cancelScheduledReport(scheduleId);
      loadScheduledReports();
    } catch (err) {
      setError(err.message || 'Failed to cancel scheduled report');
    }
  };
  
  // Handle step back
  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };
  
  // Render date range picker
  const renderDateRangePicker = () => {
    return (
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Start Date
            </Typography>
            <TextField
              type="date"
              value={format(dateRange[0], 'yyyy-MM-dd')}
              onChange={(e) => {
                const date = new Date(e.target.value);
                setDateRange([date, dateRange[1]]);
              }}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              End Date
            </Typography>
            <TextField
              type="date"
              value={format(dateRange[1], 'yyyy-MM-dd')}
              onChange={(e) => {
                const date = new Date(e.target.value);
                setDateRange([dateRange[0], date]);
              }}
              fullWidth
            />
          </Grid>
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
              <Button
                size="small"
                onClick={() => {
                  const today = new Date();
                  setDateRange([subDays(today, 7), today]);
                }}
              >
                Last 7 Days
              </Button>
              <Button
                size="small"
                onClick={() => {
                  const today = new Date();
                  setDateRange([subDays(today, 30), today]);
                }}
              >
                Last 30 Days
              </Button>
              <Button
                size="small"
                onClick={() => {
                  const today = new Date();
                  setDateRange([startOfMonth(today), endOfMonth(today)]);
                }}
              >
                This Month
              </Button>
            </Box>
          </Grid>
        </Grid>
      </LocalizationProvider>
    );
  };
  
  // Render metrics selector
  const renderMetricsSelector = () => {
    return (
      <FormControl fullWidth>
        <InputLabel id="metrics-select-label">Select Metrics</InputLabel>
        <Select
          labelId="metrics-select-label"
          multiple
          value={metrics}
          onChange={handleMetricChange}
          renderValue={(selected) => (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {selected.map((value) => {
                const metric = availableMetrics.find(m => m.id === value);
                return (
                  <Chip 
                    key={value} 
                    label={metric ? metric.name : value} 
                    size="small" 
                  />
                );
              })}
            </Box>
          )}
          MenuProps={{
            PaperProps: {
              style: {
                maxHeight: 48 * 4.5,
                width: 250,
              },
            },
          }}
        >
          {availableMetrics.map((metric) => (
            <MenuItem key={metric.id} value={metric.id}>
              {metric.name}
            </MenuItem>
          ))}
        </Select>
        <FormHelperText>
          Select the metrics you want to include in your report
        </FormHelperText>
      </FormControl>
    );
  };
  
  // Render filter options
  const renderFilterOptions = () => {
    if (!selectedTemplate || !selectedTemplate.filters) {
      return null;
    }
    
    return (
      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Filters
        </Typography>
        <Grid container spacing={2}>
          {selectedTemplate.filters.map((filter) => (
            <Grid item xs={12} sm={6} key={filter.id}>
              {filter.type === 'select' ? (
                <FormControl fullWidth>
                  <InputLabel id={`filter-${filter.id}-label`}>
                    {filter.name}
                  </InputLabel>
                  <Select
                    labelId={`filter-${filter.id}-label`}
                    value={filters[filter.id] || ''}
                    onChange={(e) => handleFilterChange(filter.id, e.target.value)}
                  >
                    <MenuItem value="">All</MenuItem>
                    {filter.options.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ) : filter.type === 'boolean' ? (
                <FormControlLabel
                  control={
                    <Switch
                      checked={!!filters[filter.id]}
                      onChange={(e) => handleFilterChange(filter.id, e.target.checked)}
                      color="primary"
                    />
                  }
                  label={filter.name}
                />
              ) : (
                <TextField
                  label={filter.name}
                  value={filters[filter.id] || ''}
                  onChange={(e) => handleFilterChange(filter.id, e.target.value)}
                  fullWidth
                  placeholder={filter.placeholder || ''}
                />
              )}
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  };
  
  return (
    <Card>
      <CardContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            <DescriptionIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
            Advanced Reporting
          </Typography>
          
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="Generate New Report" />
            <Tab label="Saved Reports" />
            <Tab label="Scheduled Reports" />
          </Tabs>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {/* Generate New Report Tab */}
        {activeTab === 0 && (
          <Box>
            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
            
            {/* Step 1: Select Template */}
            {activeStep === 0 && (
              <Box>
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress />
                  </Box>
                ) : reportTemplates.length === 0 ? (
                  <Alert severity="info">
                    No report templates found. Please contact an administrator.
                  </Alert>
                ) : (
                  <Grid container spacing={3}>
                    {reportTemplates.map((template) => (
                      <Grid item xs={12} sm={6} md={4} key={template.id}>
                        <Card 
                          variant="outlined" 
                          sx={{ 
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            '&:hover': {
                              boxShadow: 3,
                              transform: 'translateY(-4px)',
                            },
                            height: '100%',
                          }}
                          onClick={() => handleTemplateSelect(template)}
                        >
                          <CardContent>
                            <Typography variant="h6" gutterBottom>
                              {template.name}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              {template.description}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </Box>
            )}
            
            {/* Step 2: Configure Parameters */}
            {activeStep === 1 && selectedTemplate && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  {selectedTemplate.name}
                </Typography>
                <Typography variant="body2" color="textSecondary" paragraph>
                  {selectedTemplate.description}
                </Typography>
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="subtitle1" gutterBottom>
                  Date Range
                </Typography>
                {renderDateRangePicker()}
                
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Metrics
                  </Typography>
                  {renderMetricsSelector()}
                </Box>
                
                {renderFilterOptions()}
                
                <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
                  <Button
                    onClick={handleBack}
                    startIcon={<ArrowBackIcon />}
                  >
                    Back
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={generateReport}
                    disabled={loading || metrics.length === 0}
                    startIcon={loading ? <CircularProgress size={20} /> : <ArrowForwardIcon />}
                  >
                    {loading ? 'Generating...' : 'Generate Report'}
                  </Button>
                </Box>
              </Box>
            )}
            
            {/* Step 3: View & Export Report */}
            {activeStep === 2 && reportData && (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                  <Button
                    onClick={handleBack}
                    startIcon={<ArrowBackIcon />}
                  >
                    Back
                  </Button>
                  <Box>
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={() => setSaveReportDialogOpen(true)}
                      startIcon={<SaveIcon />}
                      sx={{ mr: 1 }}
                    >
                      Save Report
                    </Button>
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={() => setScheduleDialogOpen(true)}
                      startIcon={<ScheduleIcon />}
                      sx={{ mr: 1 }}
                    >
                      Schedule Report
                    </Button>
                    
                    <FormControl variant="outlined" size="small" sx={{ minWidth: 120, mr: 1 }}>
                      <Select
                        value={exportFormat}
                        onChange={(e) => setExportFormat(e.target.value)}
                        displayEmpty
                        inputProps={{ 'aria-label': 'Export format' }}
                      >
                        <MenuItem value="pdf">PDF</MenuItem>
                        <MenuItem value="excel">Excel</MenuItem>
                        <MenuItem value="csv">CSV</MenuItem>
                      </Select>
                    </FormControl>
                    
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={exportReport}
                      disabled={loading}
                      startIcon={loading ? <CircularProgress size={20} /> : <GetAppIcon />}
                    >
                      Export
                    </Button>
                  </Box>
                </Box>
                
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    {selectedTemplate ? selectedTemplate.name : 'Report Results'}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {`Date Range: ${format(dateRange[0], 'MMM d, yyyy')} - ${format(dateRange[1], 'MMM d, yyyy')}`}
                  </Typography>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  {/* Here you would render your actual report content */}
                  <Box sx={{ mt: 2 }}>
                    {/* This would be replaced with your actual report visualization component */}
                    {/* For example: <ReportViewer data={reportData} metrics={metrics} template={selectedTemplate} /> */}
                    <Alert severity="info">
                      This is where the report visualization would be rendered based on the data.
                    </Alert>
                    
                    <Typography variant="subtitle2" sx={{ mt: 2 }}>
                      Report Data Preview:
                    </Typography>
                    <Box
                      component="pre"
                      sx={{
                        mt: 1,
                        p: 2,
                        backgroundColor: 'background.default',
                        borderRadius: 1,
                        overflowX: 'auto',
                        fontSize: '0.875rem',
                      }}
                    >
                      {JSON.stringify(reportData, null, 2)}
                    </Box>
                  </Box>
                </Paper>
              </Box>
            )}
          </Box>
        )}
        
        {/* Saved Reports Tab */}
        {activeTab === 1 && (
          <Box>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : savedReports.length === 0 ? (
              <Alert severity="info">
                No saved reports found. Generate a report and save it for future reference.
              </Alert>
            ) : (
              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  Your Saved Reports
                </Typography>
                
                {/* Here you would use your SavedReportsTable component */}
                <Paper variant="outlined">
                  <Box sx={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th style={{ padding: '16px', textAlign: 'left' }}>Name</th>
                          <th style={{ padding: '16px', textAlign: 'left' }}>Template</th>
                          <th style={{ padding: '16px', textAlign: 'left' }}>Date Created</th>
                          <th style={{ padding: '16px', textAlign: 'left' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {savedReports.map((report) => (
                          <tr key={report.id}>
                            <td style={{ padding: '16px' }}>{report.name}</td>
                            <td style={{ padding: '16px' }}>{report.templateName}</td>
                            <td style={{ padding: '16px' }}>
                              {format(new Date(report.createdAt), 'MMM d, yyyy')}
                            </td>
                            <td style={{ padding: '16px' }}>
                              <Button
                                size="small"
                                startIcon={<CloudDownloadIcon />}
                                sx={{ mr: 1 }}
                              >
                                Export
                              </Button>
                              <Button
                                size="small"
                                color="secondary"
                                startIcon={<CloseIcon />}
                                onClick={() => deleteSavedReport(report.id)}
                              >
                                Delete
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </Box>
                </Paper>
              </Box>
            )}
          </Box>
        )}
        
        {/* Scheduled Reports Tab */}
        {activeTab === 2 && (
          <Box>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : scheduledReports.length === 0 ? (
              <Alert severity="info">
                No scheduled reports found. Schedule a report to receive it periodically.
              </Alert>
            ) : (
              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  Your Scheduled Reports
                </Typography>
                
                {/* Here you would use your ScheduledReportsTable component */}
                <Paper variant="outlined">
                  <Box sx={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th style={{ padding: '16px', textAlign: 'left' }}>Template</th>
                          <th style={{ padding: '16px', textAlign: 'left' }}>Frequency</th>
                          <th style={{ padding: '16px', textAlign: 'left' }}>Recipients</th>
                          <th style={{ padding: '16px', textAlign: 'left' }}>Next Delivery</th>
                          <th style={{ padding: '16px', textAlign: 'left' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {scheduledReports.map((report) => (
                          <tr key={report.id}>
                            <td style={{ padding: '16px' }}>{report.templateName}</td>
                            <td style={{ padding: '16px' }}>
                              {report.frequency.charAt(0).toUpperCase() + report.frequency.slice(1)}
                            </td>
                            <td style={{ padding: '16px' }}>
                              {report.recipients.join(', ')}
                            </td>
                            <td style={{ padding: '16px' }}>
                              {report.nextDelivery
                                ? format(new Date(report.nextDelivery), 'MMM d, yyyy')
                                : 'N/A'}
                            </td>
                            <td style={{ padding: '16px' }}>
                              <Button
                                size="small"
                                color="secondary"
                                startIcon={<CloseIcon />}
                                onClick={() => cancelScheduledReport(report.id)}
                              >
                                Cancel
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </Box>
                </Paper>
              </Box>
            )}
          </Box>
        )}
      </CardContent>
      
      {/* Save Report Dialog */}
      <Dialog
        open={saveReportDialogOpen}
        onClose={() => setSaveReportDialogOpen(false)}
        aria-labelledby="save-report-dialog-title"
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle id="save-report-dialog-title">Save Report</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="report-name"
            label="Report Name"
            type="text"
            fullWidth
            value={reportName}
            onChange={(e) => setReportName(e.target.value)}
            sx={{ mb: 2 }}
          />
          
          {saveSuccess && (
            <Alert severity="success" sx={{ mt: 2 }}>
              Report saved successfully!
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveReportDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={saveReport} 
            color="primary"
            disabled={!reportName.trim() || loading}
          >
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Schedule Report Dialog */}
      <Dialog
        open={scheduleDialogOpen}
        onClose={() => setScheduleDialogOpen(false)}
        aria-labelledby="schedule-report-dialog-title"
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle id="schedule-report-dialog-title">Schedule Report</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="dense">
            <InputLabel id="frequency-label">Frequency</InputLabel>
            <Select
              labelId="frequency-label"
              value={scheduleFrequency}
              onChange={(e) => setScheduleFrequency(e.target.value)}
              label="Frequency"
            >
              <MenuItem value="daily">Daily</MenuItem>
              <MenuItem value="weekly">Weekly</MenuItem>
              <MenuItem value="monthly">Monthly</MenuItem>
            </Select>
          </FormControl>
          
          <TextField
            margin="dense"
            id="recipients"
            label="Recipients (comma separated)"
            type="text"
            fullWidth
            value={scheduleRecipients}
            onChange={(e) => setScheduleRecipients(e.target.value)}
            placeholder="email1@example.com, email2@example.com"
            sx={{ mt: 2 }}
          />
          
          {scheduleSuccess && (
            <Alert severity="success" sx={{ mt: 2 }}>
              Report scheduled successfully!
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setScheduleDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={scheduleReport} 
            color="primary"
            disabled={!scheduleRecipients.trim() || loading}
          >
            {loading ? 'Scheduling...' : 'Schedule'}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default ReportGenerator;
