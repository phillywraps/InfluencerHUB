/**
 * Database Monitor Routes
 * 
 * Routes for database monitoring and query optimization
 */

const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const databaseMonitorController = require('../controllers/databaseMonitorController');

// All routes are protected and require admin role
router.use(protect, admin);

// Get database query statistics
router.get('/stats', databaseMonitorController.getQueryStats);

// Clear query cache
router.post('/clear-cache', databaseMonitorController.clearCache);

// Reset query statistics
router.post('/reset-stats', databaseMonitorController.resetQueryStats);

// Get explain plan for a query
router.post('/explain', databaseMonitorController.explainQuery);

// Get slow queries
router.get('/slow-queries', databaseMonitorController.getSlowQueries);

// Check for missing indexes
router.get('/missing-indexes', databaseMonitorController.checkMissingIndexes);

module.exports = router;
