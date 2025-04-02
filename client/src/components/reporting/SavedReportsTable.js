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
} from '@mui/material';
import {
  Delete as DeleteIcon,
  GetApp as DownloadIcon,
  Visibility as ViewIcon,
  MoreVert as MoreVertIcon,
  Share as ShareIcon,
  Edit as EditIcon,
  FileCopy as DuplicateIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';

/**
 * Saved Reports Table Component
 * Displays a list of saved reports with actions
 */
const SavedReportsTable = ({ reports, onDelete, onView, onExport, onDuplicate }) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState(null);
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
  
  // Handle report deletion
  const handleDelete = (report) => {
    setReportToDelete(report);
    setDeleteDialogOpen(true);
  };
  
  // Confirm report deletion
  const confirmDelete = () => {
    if (reportToDelete && onDelete) {
      onDelete(reportToDelete.id);
    }
    setDeleteDialogOpen(false);
    setReportToDelete(null);
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
  
  // Handle export action
  const handleExport = (report) => {
    if (onExport) {
      onExport(report);
    }
    handleMenuClose();
  };
  
  // Handle view action
  const handleView = (report) => {
    if (onView) {
      onView(report);
    }
    handleMenuClose();
  };
  
  // Handle duplicate action
  const handleDuplicate = (report) => {
    if (onDuplicate) {
      onDuplicate(report);
    }
    handleMenuClose();
  };
  
  return (
    <Card>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Report Name</TableCell>
              <TableCell>Template</TableCell>
              <TableCell>Date Range</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Type</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {reports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Box sx={{ py: 3 }}>
                    <DescriptionIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                    <Typography variant="body1" color="textSecondary">
                      No saved reports found
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Generate and save reports to see them here
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
                      <Typography variant="body1">
                        {report.name}
                      </Typography>
                    </TableCell>
                    <TableCell>{report.templateName}</TableCell>
                    <TableCell>
                      {report.dateRange ? (
                        `${format(new Date(report.dateRange.startDate), 'MMM d, yyyy')} - ${format(
                          new Date(report.dateRange.endDate),
                          'MMM d, yyyy'
                        )}`
                      ) : (
                        'Custom Range'
                      )}
                    </TableCell>
                    <TableCell>
                      {report.createdAt 
                        ? format(new Date(report.createdAt), 'MMM d, yyyy') 
                        : 'Unknown'}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={report.type || 'General'} 
                        size="small" 
                        color={report.type === 'custom' ? 'primary' : 'default'}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Tooltip title="View">
                          <IconButton size="small" onClick={() => handleView(report)}>
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Download">
                          <IconButton size="small" onClick={() => handleExport(report)}>
                            <DownloadIcon fontSize="small" />
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
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the report "{reportToDelete?.name}"? 
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={confirmDelete} 
            color="error" 
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleView(selectedReport)}>
          <ListItemIcon>
            <ViewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Report</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleExport(selectedReport)}>
          <ListItemIcon>
            <DownloadIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Export Report</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleDuplicate(selectedReport)}>
          <ListItemIcon>
            <DuplicateIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Duplicate</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleDelete(selectedReport)}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText sx={{ color: 'error.main' }}>Delete</ListItemText>
        </MenuItem>
      </Menu>
    </Card>
  );
};

export default SavedReportsTable;
