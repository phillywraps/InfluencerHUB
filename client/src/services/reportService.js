/**
 * Report Generation Service
 * Provides methods for generating, customizing, and exporting reports
 */

import api from './api';
import { saveAs } from 'file-saver';
import { format } from 'date-fns';

/**
 * Report Service for generating various analytics reports
 */
const reportService = {
  /**
   * Get available report templates
   * @returns {Promise<Array>} List of available report templates
   */
  getReportTemplates: async () => {
    try {
      const response = await api.get('/api/reports/templates');
      return response.data;
    } catch (error) {
      console.error('Error getting report templates:', error);
      throw error;
    }
  },

  /**
   * Generate a report based on template and filters
   * @param {string} templateId The ID of the report template
   * @param {Object} filters Filters to apply to the report
   * @returns {Promise<Object>} Generated report data
   */
  generateReport: async (templateId, filters = {}) => {
    try {
      const response = await api.post(`/api/reports/generate/${templateId}`, filters);
      return response.data;
    } catch (error) {
      console.error('Error generating report:', error);
      throw error;
    }
  },

  /**
   * Save a report for future reference
   * @param {string} name Report name
   * @param {string} templateId The ID of the report template
   * @param {Object} filters Filters applied to the report
   * @param {Object} data Generated report data
   * @returns {Promise<Object>} Saved report metadata
   */
  saveReport: async (name, templateId, filters, data) => {
    try {
      const response = await api.post('/api/reports/save', {
        name,
        templateId,
        filters,
        data,
        createdAt: new Date().toISOString()
      });
      return response.data;
    } catch (error) {
      console.error('Error saving report:', error);
      throw error;
    }
  },

  /**
   * Get saved reports
   * @param {Object} params Query parameters
   * @returns {Promise<Array>} List of saved reports
   */
  getSavedReports: async (params = {}) => {
    try {
      const response = await api.get('/api/reports/saved', { params });
      return response.data;
    } catch (error) {
      console.error('Error getting saved reports:', error);
      throw error;
    }
  },

  /**
   * Get a specific saved report
   * @param {string} reportId The ID of the saved report
   * @returns {Promise<Object>} Saved report with data
   */
  getSavedReport: async (reportId) => {
    try {
      const response = await api.get(`/api/reports/saved/${reportId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting saved report:', error);
      throw error;
    }
  },

  /**
   * Delete a saved report
   * @param {string} reportId The ID of the saved report
   * @returns {Promise<Object>} Deletion result
   */
  deleteSavedReport: async (reportId) => {
    try {
      const response = await api.delete(`/api/reports/saved/${reportId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting saved report:', error);
      throw error;
    }
  },

  /**
   * Schedule periodic report generation
   * @param {string} templateId The ID of the report template
   * @param {Object} filters Filters to apply to the report
   * @param {string} frequency Report generation frequency (daily, weekly, monthly)
   * @param {Array<string>} recipients Email addresses to send the report to
   * @returns {Promise<Object>} Scheduled report details
   */
  scheduleReport: async (templateId, filters, frequency, recipients) => {
    try {
      const response = await api.post('/api/reports/schedule', {
        templateId,
        filters,
        frequency,
        recipients
      });
      return response.data;
    } catch (error) {
      console.error('Error scheduling report:', error);
      throw error;
    }
  },

  /**
   * Get scheduled reports
   * @returns {Promise<Array>} List of scheduled reports
   */
  getScheduledReports: async () => {
    try {
      const response = await api.get('/api/reports/scheduled');
      return response.data;
    } catch (error) {
      console.error('Error getting scheduled reports:', error);
      throw error;
    }
  },

  /**
   * Cancel a scheduled report
   * @param {string} scheduleId The ID of the scheduled report
   * @returns {Promise<Object>} Cancellation result
   */
  cancelScheduledReport: async (scheduleId) => {
    try {
      const response = await api.delete(`/api/reports/scheduled/${scheduleId}`);
      return response.data;
    } catch (error) {
      console.error('Error canceling scheduled report:', error);
      throw error;
    }
  },

  /**
   * Export report to CSV format
   * @param {Object} reportData Report data to export
   * @param {string} filename Optional filename
   */
  exportToCsv: (reportData, filename = 'report') => {
    try {
      // Handle array of arrays (table format)
      if (Array.isArray(reportData) && reportData.length > 0 && Array.isArray(reportData[0])) {
        const csv = reportData.map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        saveAs(blob, `${filename}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
        return true;
      }
      
      // Handle array of objects (record format)
      if (Array.isArray(reportData) && reportData.length > 0 && typeof reportData[0] === 'object') {
        const headers = Object.keys(reportData[0]);
        const csv = [
          headers.join(','),
          ...reportData.map(row => 
            headers.map(fieldName => {
              // Handle values that need quoting (contains comma, newline, or quotes)
              let val = row[fieldName] !== null && row[fieldName] !== undefined ? row[fieldName].toString() : '';
              if (val.includes(',') || val.includes('\n') || val.includes('"')) {
                val = `"${val.replace(/"/g, '""')}"`;
              }
              return val;
            }).join(',')
          )
        ].join('\n');
        
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        saveAs(blob, `${filename}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
        return true;
      }
      
      console.error('Invalid data format for CSV export');
      return false;
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      throw error;
    }
  },

  /**
   * Export report to Excel format
   * @param {Object} reportData Report data to export
   * @param {string} filename Optional filename
   */
  exportToExcel: async (reportData, filename = 'report') => {
    try {
      const response = await api.post('/api/reports/export/excel', {
        data: reportData,
        filename
      }, { responseType: 'blob' });
      
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `${filename}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
      return true;
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      throw error;
    }
  },

  /**
   * Export report to PDF format
   * @param {Object} reportData Report data to export
   * @param {Object} options PDF generation options
   * @param {string} filename Optional filename
   */
  exportToPdf: async (reportData, options = {}, filename = 'report') => {
    try {
      const response = await api.post('/api/reports/export/pdf', {
        data: reportData,
        options,
        filename
      }, { responseType: 'blob' });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      saveAs(blob, `${filename}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      return true;
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      throw error;
    }
  },

  /**
   * Get report data for a specific date range and metrics
   * @param {string} type Report type (e.g., 'engagement', 'revenue', 'growth')
   * @param {string} startDate Start date in ISO format
   * @param {string} endDate End date in ISO format
   * @param {Array<string>} metrics Metrics to include in the report
   * @param {Object} filters Additional filters
   * @returns {Promise<Object>} Report data
   */
  getReportData: async (type, startDate, endDate, metrics, filters = {}) => {
    try {
      const response = await api.get(`/api/reports/data/${type}`, {
        params: {
          startDate,
          endDate,
          metrics: metrics.join(','),
          ...filters
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error getting report data:', error);
      throw error;
    }
  },

  /**
   * Get available metrics for a report type
   * @param {string} type Report type
   * @returns {Promise<Array>} List of available metrics
   */
  getAvailableMetrics: async (type) => {
    try {
      const response = await api.get(`/api/reports/metrics/${type}`);
      return response.data;
    } catch (error) {
      console.error('Error getting available metrics:', error);
      throw error;
    }
  },

  /**
   * Create a custom report template
   * @param {Object} template Template definition
   * @returns {Promise<Object>} Created template
   */
  createCustomTemplate: async (template) => {
    try {
      const response = await api.post('/api/reports/templates/custom', template);
      return response.data;
    } catch (error) {
      console.error('Error creating custom template:', error);
      throw error;
    }
  },

  /**
   * Update a custom report template
   * @param {string} templateId Template ID
   * @param {Object} updates Template updates
   * @returns {Promise<Object>} Updated template
   */
  updateCustomTemplate: async (templateId, updates) => {
    try {
      const response = await api.put(`/api/reports/templates/custom/${templateId}`, updates);
      return response.data;
    } catch (error) {
      console.error('Error updating custom template:', error);
      throw error;
    }
  },

  /**
   * Delete a custom report template
   * @param {string} templateId Template ID
   * @returns {Promise<Object>} Deletion result
   */
  deleteCustomTemplate: async (templateId) => {
    try {
      const response = await api.delete(`/api/reports/templates/custom/${templateId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting custom template:', error);
      throw error;
    }
  }
};

export default reportService;
