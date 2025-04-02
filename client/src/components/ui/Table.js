/**
 * Accessible Table component that follows the design system
 * 
 * This component extends MUI Table with enhanced accessibility features
 * and consistent styling according to best practices.
 */

import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Table as MuiTable,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TablePagination,
  Paper,
  Typography,
  Checkbox,
  Tooltip,
  IconButton,
  Skeleton,
  useTheme,
  visuallyHidden,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import MoreVertIcon from '@mui/icons-material/MoreVert';

// Styled components for consistent design
const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[1],
  overflow: 'hidden',
}));

const StyledTable = styled(MuiTable)(({ theme }) => ({
  '& .MuiTableCell-root': {
    padding: theme.spacing(1.5, 2),
  },
  '& .MuiTableCell-head': {
    backgroundColor: theme.palette.background.default,
    color: theme.palette.text.primary,
    fontWeight: 600,
  },
  '& .MuiTableRow-root:hover': {
    backgroundColor: theme.palette.action.hover,
  },
  '& .MuiTableRow-root.Mui-selected': {
    backgroundColor: `${theme.palette.primary.light}20`, // 20% opacity
  },
  '& .MuiTableRow-root.Mui-selected:hover': {
    backgroundColor: `${theme.palette.primary.light}30`, // 30% opacity
  },
}));

const TableHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: theme.spacing(2),
  backgroundColor: theme.palette.background.paper,
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const TableActions = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
}));

const TableLoadingOverlay = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(255, 255, 255, 0.7)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1,
}));

/**
 * Accessible table component with sorting, pagination, and selection
 * 
 * @param {Object} props
 * @param {Array} props.columns - Array of column definitions
 * @param {Array} props.data - Array of data objects
 * @param {string} props.title - Table title
 * @param {node} props.actions - Custom action buttons
 * @param {function} props.onRowClick - Callback when a row is clicked
 * @param {boolean} props.selectable - Whether rows can be selected
 * @param {Array} props.selected - Array of selected row IDs
 * @param {function} props.onSelectChange - Callback when selection changes
 * @param {boolean} props.sortable - Whether columns can be sorted
 * @param {Object} props.initialSort - Initial sort configuration { column, direction }
 * @param {function} props.onSortChange - Callback when sort changes
 * @param {boolean} props.paginated - Whether to show pagination
 * @param {number} props.initialPage - Initial page index
 * @param {number} props.initialRowsPerPage - Initial rows per page
 * @param {Array} props.rowsPerPageOptions - Options for rows per page
 * @param {function} props.onPageChange - Callback when page changes
 * @param {function} props.onRowsPerPageChange - Callback when rows per page changes
 * @param {boolean} props.loading - Whether the table is loading
 * @param {function} props.getRowId - Function to get unique ID from row data
 * @param {boolean} props.dense - Whether to use dense padding
 * @param {string} props.emptyMessage - Message to display when no data
 * @param {node} props.emptyContent - Custom content to display when no data
 * @param {Object} props.sx - Additional MUI sx styling
 */
const Table = ({
  columns = [],
  data = [],
  title,
  actions,
  onRowClick,
  selectable = false,
  selected = [],
  onSelectChange,
  sortable = true,
  initialSort = { column: '', direction: 'asc' },
  onSortChange,
  paginated = true,
  initialPage = 0,
  initialRowsPerPage = 10,
  rowsPerPageOptions = [5, 10, 25, 50],
  onPageChange,
  onRowsPerPageChange,
  loading = false,
  getRowId = (row) => row.id,
  dense = false,
  emptyMessage = 'No data to display',
  emptyContent,
  sx = {},
}) => {
  const theme = useTheme();
  
  // State for internal sorting if no external control
  const [sort, setSort] = useState(initialSort);
  const [page, setPage] = useState(initialPage);
  const [rowsPerPage, setRowsPerPage] = useState(initialRowsPerPage);
  
  // Generate a unique ID for accessibility
  const tableId = useRef(`table-${Math.random().toString(36).substr(2, 9)}`);
  
  // Update state if props change
  useEffect(() => {
    if (initialSort.column !== sort.column || initialSort.direction !== sort.direction) {
      setSort(initialSort);
    }
  }, [initialSort, sort.column, sort.direction]);
  
  useEffect(() => {
    if (initialPage !== page) {
      setPage(initialPage);
    }
  }, [initialPage, page]);
  
  useEffect(() => {
    if (initialRowsPerPage !== rowsPerPage) {
      setRowsPerPage(initialRowsPerPage);
    }
  }, [initialRowsPerPage, rowsPerPage]);
  
  // Handle sort request
  const handleRequestSort = (column) => {
    const isAsc = sort.column === column && sort.direction === 'asc';
    const newSort = {
      column,
      direction: isAsc ? 'desc' : 'asc',
    };
    
    if (onSortChange) {
      onSortChange(newSort);
    } else {
      setSort(newSort);
    }
  };
  
  // Handle select all click
  const handleSelectAllClick = (event) => {
    if (onSelectChange) {
      if (event.target.checked) {
        const newSelected = data.map(getRowId);
        onSelectChange(newSelected);
      } else {
        onSelectChange([]);
      }
    }
  };
  
  // Handle row selection
  const handleRowSelect = (id) => {
    if (onSelectChange) {
      const selectedIndex = selected.indexOf(id);
      let newSelected = [];
      
      if (selectedIndex === -1) {
        newSelected = [...selected, id];
      } else {
        newSelected = selected.filter((item) => item !== id);
      }
      
      onSelectChange(newSelected);
    }
  };
  
  // Handle page change
  const handleChangePage = (event, newPage) => {
    if (onPageChange) {
      onPageChange(newPage);
    } else {
      setPage(newPage);
    }
  };
  
  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    const value = parseInt(event.target.value, 10);
    if (onRowsPerPageChange) {
      onRowsPerPageChange(value);
      if (onPageChange) {
        onPageChange(0);
      }
    } else {
      setRowsPerPage(value);
      setPage(0);
    }
  };
  
  // Get sorted and paginated data
  const getSortedData = () => {
    let sortedData = [...data];
    
    if (sort.column) {
      const column = columns.find((col) => col.id === sort.column);
      if (column && column.sortable !== false) {
        sortedData.sort((a, b) => {
          const valueA = column.accessor ? column.accessor(a) : a[column.id];
          const valueB = column.accessor ? column.accessor(b) : b[column.id];
          
          if (valueA === valueB) return 0;
          
          const result = typeof valueA === 'string'
            ? valueA.localeCompare(valueB, undefined, { sensitivity: 'base' })
            : valueA < valueB ? -1 : 1;
          
          return sort.direction === 'asc' ? result : -result;
        });
      }
    }
    
    return sortedData;
  };
  
  const sortedData = getSortedData();
  const paginatedData = paginated
    ? sortedData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
    : sortedData;
  
  // Helper for determining if a row is selected
  const isSelected = (id) => selected.indexOf(id) !== -1;
  
  // Generate a unique ID for each row
  const getRowKey = (row, index) => {
    try {
      return getRowId(row);
    } catch (e) {
      return index;
    }
  };
  
  return (
    <Box sx={{ position: 'relative', ...sx }}>
      {/* Table title and actions */}
      {(title || actions) && (
        <TableHeader>
          {title && (
            <Typography 
              variant="h6" 
              component="h2"
              id={`${tableId.current}-caption`}
            >
              {title}
            </Typography>
          )}
          
          {actions && (
            <TableActions>
              {actions}
            </TableActions>
          )}
        </TableHeader>
      )}
      
      {/* Loading overlay */}
      {loading && (
        <TableLoadingOverlay
          role="status"
          aria-label="Loading table data"
        >
          <Typography>Loading...</Typography>
        </TableLoadingOverlay>
      )}
      
      {/* Table container */}
      <StyledTableContainer component={Paper}>
        <StyledTable
          aria-labelledby={title ? `${tableId.current}-caption` : undefined}
          size={dense ? 'small' : 'medium'}
          aria-busy={loading}
          id={tableId.current}
        >
          {/* Table head */}
          <TableHead>
            <TableRow>
              {/* Checkbox column */}
              {selectable && (
                <TableCell padding="checkbox">
                  <Checkbox
                    color="primary"
                    indeterminate={selected.length > 0 && selected.length < data.length}
                    checked={data.length > 0 && selected.length === data.length}
                    onChange={handleSelectAllClick}
                    inputProps={{
                      'aria-label': 'select all items',
                      'aria-controls': tableId.current,
                    }}
                  />
                </TableCell>
              )}
              
              {/* Column headers */}
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align || 'left'}
                  padding={column.disablePadding ? 'none' : 'normal'}
                  sortDirection={sort.column === column.id ? sort.direction : false}
                  aria-sort={
                    sort.column === column.id 
                      ? (sort.direction === 'asc' ? 'ascending' : 'descending')
                      : 'none'
                  }
                  sx={{ 
                    minWidth: column.minWidth,
                    width: column.width,
                    maxWidth: column.maxWidth,
                  }}
                >
                  {sortable && column.sortable !== false ? (
                    <TableSortLabel
                      active={sort.column === column.id}
                      direction={sort.column === column.id ? sort.direction : 'asc'}
                      onClick={() => handleRequestSort(column.id)}
                      aria-label={`Sort by ${column.label}`}
                    >
                      {column.label}
                      {sort.column === column.id && (
                        <Box component="span" sx={visuallyHidden}>
                          {sort.direction === 'desc' ? 'sorted descending' : 'sorted ascending'}
                        </Box>
                      )}
                    </TableSortLabel>
                  ) : (
                    column.label
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          
          {/* Table body */}
          <TableBody>
            {loading ? (
              // Loading skeleton
              Array.from(new Array(rowsPerPage)).map((_, index) => (
                <TableRow key={`skeleton-${index}`} role="row" aria-hidden="true">
                  {selectable && (
                    <TableCell padding="checkbox">
                      <Skeleton variant="rectangular" width={24} height={24} />
                    </TableCell>
                  )}
                  {columns.map((column, colIndex) => (
                    <TableCell key={`skeleton-cell-${colIndex}`} align={column.align || 'left'}>
                      <Skeleton variant="text" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : paginatedData.length > 0 ? (
              // Data rows
              paginatedData.map((row, index) => {
                const rowId = getRowKey(row, index);
                const isItemSelected = selectable && isSelected(rowId);
                
                return (
                  <TableRow
                    hover
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    role={onRowClick ? 'button' : 'row'}
                    aria-selected={isItemSelected}
                    tabIndex={onRowClick ? 0 : undefined}
                    key={rowId}
                    selected={isItemSelected}
                    sx={{ cursor: onRowClick ? 'pointer' : 'default' }}
                  >
                    {selectable && (
                      <TableCell padding="checkbox">
                        <Checkbox
                          color="primary"
                          checked={isItemSelected}
                          onClick={(event) => {
                            event.stopPropagation();
                            handleRowSelect(rowId);
                          }}
                          inputProps={{
                            'aria-labelledby': `${tableId.current}-${rowId}`,
                          }}
                        />
                      </TableCell>
                    )}
                    
                    {columns.map((column) => {
                      const value = column.accessor 
                        ? column.accessor(row) 
                        : row[column.id];
                      
                      return (
                        <TableCell 
                          key={`${rowId}-${column.id}`}
                          align={column.align || 'left'}
                          aria-label={`${column.label}: ${value}`}
                        >
                          {column.render ? column.render(value, row) : value}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })
            ) : (
              // Empty state
              <TableRow>
                <TableCell
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  align="center"
                  padding="normal"
                  sx={{ py: 4 }}
                >
                  {emptyContent || (
                    <Typography variant="body1" color="text.secondary">
                      {emptyMessage}
                    </Typography>
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </StyledTable>
      </StyledTableContainer>
      
      {/* Pagination */}
      {paginated && data.length > 0 && (
        <TablePagination
          rowsPerPageOptions={rowsPerPageOptions}
          component="div"
          count={data.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} of ${count}`}
          labelRowsPerPage="Rows per page:"
          SelectProps={{
            inputProps: { 'aria-label': 'rows per page' },
          }}
          backIconButtonProps={{
            'aria-label': 'previous page',
          }}
          nextIconButtonProps={{
            'aria-label': 'next page',
          }}
        />
      )}
    </Box>
  );
};

Table.propTypes = {
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.node.isRequired,
      accessor: PropTypes.func,
      render: PropTypes.func,
      align: PropTypes.oneOf(['left', 'right', 'center']),
      sortable: PropTypes.bool,
      width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      minWidth: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      maxWidth: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      disablePadding: PropTypes.bool,
    })
  ).isRequired,
  data: PropTypes.array.isRequired,
  title: PropTypes.node,
  actions: PropTypes.node,
  onRowClick: PropTypes.func,
  selectable: PropTypes.bool,
  selected: PropTypes.array,
  onSelectChange: PropTypes.func,
  sortable: PropTypes.bool,
  initialSort: PropTypes.shape({
    column: PropTypes.string,
    direction: PropTypes.oneOf(['asc', 'desc']),
  }),
  onSortChange: PropTypes.func,
  paginated: PropTypes.bool,
  initialPage: PropTypes.number,
  initialRowsPerPage: PropTypes.number,
  rowsPerPageOptions: PropTypes.array,
  onPageChange: PropTypes.func,
  onRowsPerPageChange: PropTypes.func,
  loading: PropTypes.bool,
  getRowId: PropTypes.func,
  dense: PropTypes.bool,
  emptyMessage: PropTypes.string,
  emptyContent: PropTypes.node,
  sx: PropTypes.object,
};

export default Table;
