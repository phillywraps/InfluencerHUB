/**
 * Analytics Optimization Routes
 * 
 * Routes for optimized analytics data access for dashboards and reports.
 * These routes provide efficient access to analytics data with caching and
 * query optimization.
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const analyticsOptimizationController = require('../controllers/analyticsOptimizationController');

// All routes require authentication
router.use(protect);

// Get optimized dashboard data
router.get('/dashboard', analyticsOptimizationController.getDashboardData);

// Get platform distribution data
router.get('/platforms', analyticsOptimizationController.getPlatformData);

// Get earnings/spending data
router.get('/earnings', analyticsOptimizationController.getEarningsData);

// Get performance insights
router.get('/insights', analyticsOptimizationController.getPerformanceInsights);

// Preload dashboard data
router.post('/preload', analyticsOptimizationController.preloadDashboardData);

// Clear dashboard cache
router.delete('/cache', analyticsOptimizationController.clearDashboardCache);

module.exports = router;
