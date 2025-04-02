import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tooltip,
  Typography,
  MenuItem,
  Menu,
  ListItemIcon,
  ListItemText,
  Badge,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Pause as PauseIcon,
  PlayArrow as PlayIcon,
  History as HistoryIcon,
  Schedule as ScheduleIcon,
  MoreVert as MoreVertIcon,
  Mail as MailIcon,
  AccessTime as AccessTimeIcon,
  Refresh as RefreshIcon,
  Description as DescriptionIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { format, formatDistanceToNow, isPast, addDays } from 'date-fns';

/**
 * Scheduled Reports Table Component
 * Displays a list of scheduled reports with actions
 */
const ScheduledReportsTable = ({ reports, onCancel, onEdit, onPause, onResume, onViewHistory }) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [reportToCancel, setReportToCancel] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  
  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Handle report cancellation
  const handleCancel = (report) => {
    setReportToCancel(report);
    setCancelDialogOpen(true);
  };
  
  // Confirm report cancellation
  const confirmCancel = () => {
    if (reportToCancel && onCancel) {
      onCancel(reportToCancel.id);
    }
    setCancelDialogOpen(false);
    setReportToCancel(null);
  };
  
  // Handle menu open
  const handleMenuOpen = (event, report) => {
    setAnchorEl(event.currentTarget);
    setSelectedReport(report);
  };
  
  // Handle menu close
  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedReport(null);
  };
  
  // Handle pause action
  const handlePause = (report) => {
    if (onPause) {
      onPause(report.id);
    }
    handleMenuClose();
  };
  
  // Handle resume action
  const handleResume = (report) => {
    if (onResume) {
      onResume(report.id);
    }
    handleMenuClose();
  };
  
  // Handle edit action
  const handleEdit = (report) => {
    if (onEdit) {
      onEdit(report);
    }
    handleMenuClose();
  };
  
  // Handle view history action
  const handleViewHistory = (report) => {
    if (onViewHistory) {
      onViewHistory(report.id);
    }
    handleMenuClose();
  };
  
  // Format frequency
  const formatFrequency = (frequency) => {
    switch (frequency) {
      case 'daily':
        return 'Daily';
      case 'weekly':
        return 'Weekly';
      case 'monthly':
        return 'Monthly';
      case 'quarterly':
        return 'Quarterly';
      default:
        return frequency.charAt(0).toUpperCase() + frequency.slice(1);
    }
  };
  
  // Format recipients
  const formatRecipients = (recipients) => {
    if (!recipients || recipients.length === 0) {
      return 'None';
    }
    
    if (recipients.length === 1) {
      return recipients[0];
    }
    
    return `${recipients[0]} +${recipients.length - 1} more`;
  };
  
  // Format next delivery
  const formatNextDelivery = (date) => {
    if (!date) return 'N/A';
    
    const nextDate = new Date(date);
    return isPast(nextDate) 
      ? 'Overdue'
      : formatDistanceToNow(nextDate, { addSuffix: true });
  };
  
  // Render status chip
  const renderStatusChip = (status) => {
    switch (status) {
      case 'active':
        return (
          <Chip 
            label="Active" 
            color="success" 
            size="small"
            icon={<PlayIcon />}
          />
        );
      case 'paused':
        return (
          <Chip 
            label="Paused" 
            color="warning" 
            size="small"
            icon={<PauseIcon />}
          />
        );
      case 'completed':
        return (
          <Chip 
            label="Completed" 
            color="info" 
            size="small"
            icon={<CheckCircleIcon />}
          />
        );
      case 'failed':
        return (
          <Chip 
            label="Failed" 
            color="error" 
            size="small"
            icon={<ErrorIcon />}
          />
        );
      default:
        return (
          <Chip 
            label={status || 'Unknown'} 
            size="small"
          />
        );
    }
  };
  
  return (
    <Card>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Report Name</TableCell>
              <TableCell>Frequency</TableCell>
              <TableCell>Recipients</TableCell>
              <TableCell>Next Delivery</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {reports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Box sx={{ py: 3 }}>
                    <ScheduleIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                    <Typography variant="body1" color="textSecondary">
                      No scheduled reports found
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Schedule reports to receive them periodically by email
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              reports
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((report) => (
                  <TableRow key={report.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body1">
                          {report.name || report.templateName}
                        </Typography>
                        {report.deliveries && report.deliveries.length > 0 && (
                          <Tooltip title={`${report.deliveries.length} previous deliveries`}>
                            <Badge 
                              badgeContent={report.deliveries.length} 
                              color="primary"
                              sx={{ ml: 1 }}
                            >
                              <HistoryIcon fontSize="small" color="action" />
                            </Badge>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={<AccessTimeIcon />}
                        label={formatFrequency(report.frequency)}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title={report.recipients ? report.recipients.join(', ') : 'No recipients'}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <MailIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                          <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                            {formatRecipients(report.recipients)}
                          </Typography>
                        </Box>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Tooltip title={report.nextDelivery ? format(new Date(report.nextDelivery), 'PPpp') : 'N/A'}>
                        <Typography 
                          variant="body2" 
                          color={report.nextDelivery && isPast(new Date(report.nextDelivery)) ? 'error.main' : 'textPrimary'}
                        >
                          {formatNextDelivery(report.nextDelivery)}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      {renderStatusChip(report.status)}
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        {report.status === 'active' ? (
                          <Tooltip title="Pause">
                            <IconButton size="small" onClick={() => handlePause(report)}>
                              <PauseIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        ) : report.status === 'paused' ? (
                          <Tooltip title="Resume">
                            <IconButton size="small" onClick={() => handleResume(report)}>
                              <PlayIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        ) : null}
                        
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => handleEdit(report)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="More Options">
                          <IconButton 
                            size="small" 
                            onClick={(e) => handleMenuOpen(e, report)}
                            aria-label="more options"
                          >
                            <MoreVertIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
      {reports.length > 0 && (
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={reports.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      )}
      
      {/* Cancel Confirmation Dialog */}
      <Dialog
        open={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
      >
        <DialogTitle>Confirm Cancellation</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to cancel the scheduled report 
            "{reportToCancel?.name || reportToCancel?.templateName}"? 
            This will permanently remove the schedule and stop future deliveries.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)}>
            Keep Schedule
          </Button>
          <Button 
            onClick={confirmCancel} 
            color="error" 
            variant="contained"
          >
            Cancel Schedule
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        {selectedReport?.status === 'active' ? (
          <MenuItem onClick={() => handlePause(selectedReport)}>
            <ListItemIcon>
              <PauseIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Pause Schedule</ListItemText>
          </MenuItem>
        ) : selectedReport?.status === 'paused' ? (
          <MenuItem onClick={() => handleResume(selectedReport)}>
            <ListItemIcon>
              <PlayIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Resume Schedule</ListItemText>
          </MenuItem>
        ) : null}
        
        <MenuItem onClick={() => handleViewHistory(selectedReport)}>
          <ListItemIcon>
            <HistoryIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Delivery History</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => handleEdit(selectedReport)}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit Schedule</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => handleCancel(selectedReport)}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText sx={{ color: 'error.main' }}>Cancel Schedule</ListItemText>
        </MenuItem>
      </Menu>
    </Card>
  );
};

export default ScheduledReportsTable;
