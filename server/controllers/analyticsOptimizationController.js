/**
 * Analytics Optimization Controller
 * 
 * Controller that provides optimized access to analytics data for dashboards
 * and reports. Uses the analytics optimization service to implement caching,
 * batch loading, and efficient query patterns.
 */

const analyticsOptimizationService = require('../services/analyticsOptimizationService');
const logger = require('../config/logger');
const { 
  wrap, 
  createResourceNotFoundError, 
  createValidationError,
  createAuthorizationError,
  createThirdPartyApiError,
  ErrorTypes
} = require('../middleware/errorMiddleware');

/**
 * @desc    Get optimized dashboard data
 * @route   GET /api/analytics/dashboard
 * @access  Private
 */
const getDashboardData = wrap(async (req, res) => {
  const userId = req.user._id;
  const userType = req.user.role || 'influencer'; // Default to influencer if role not specified
  const { timeFrame = 'month', dateRange = 'Last 30 Days', refresh = false } = req.query;

  try {
    // Use analytics optimization service to get dashboard data
    const dashboardData = await analyticsOptimizationService.getDashboardData({
      userId,
      userType,
      timeFrame,
      dateRange,
      forceRefresh: refresh === 'true'
    });

    return res.json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    logger.error(`Error fetching dashboard data: ${error.message}`, { userId, error });
    throw createThirdPartyApiError(
      'Analytics Service', 
      'Failed to fetch dashboard data', 
      { userId, userType, timeFrame, dateRange },
      error
    );
  }
});

/**
 * @desc    Get platform distribution data
 * @route   GET /api/analytics/platforms
 * @access  Private
 */
const getPlatformData = wrap(async (req, res) => {
  const userId = req.user._id;
  const userType = req.user.role || 'influencer';
  const { dateRange = 'Last 30 Days', refresh = false } = req.query;

  try {
    // Calculate date range
    const { startDate, endDate } = calculateDateRange(dateRange);

    // Get platform data
    const platformData = await analyticsOptimizationService.getPlatformData(
      userId,
      userType,
      startDate,
      endDate,
      refresh === 'true'
    );

    return res.json({
      success: true,
      data: platformData
    });
  } catch (error) {
    logger.error(`Error fetching platform data: ${error.message}`, { userId, error });
    throw createThirdPartyApiError(
      'Analytics Service', 
      'Failed to fetch platform data', 
      { userId, userType, dateRange },
      error
    );
  }
});

/**
 * @desc    Get earnings/spending data
 * @route   GET /api/analytics/earnings
 * @access  Private
 */
const getEarningsData = wrap(async (req, res) => {
  const userId = req.user._id;
  const userType = req.user.role || 'influencer';
  const { timeFrame = 'month', dateRange = 'Last 30 Days', refresh = false } = req.query;

  try {
    // Calculate date range
    const { startDate, endDate } = calculateDateRange(dateRange);

    // Get earnings data
    const earningsData = await analyticsOptimizationService.getEarningsData(
      userId,
      userType,
      startDate,
      endDate,
      timeFrame,
      refresh === 'true'
    );

    // Calculate total amount
    const totalAmount = earningsData.reduce((sum, item) => sum + (item.amount || 0), 0);

    return res.json({
      success: true,
      data: {
        earningsData,
        totalAmount: totalAmount.toFixed(2)
      }
    });
  } catch (error) {
    logger.error(`Error fetching earnings data: ${error.message}`, { userId, error });
    throw createThirdPartyApiError(
      'Analytics Service', 
      'Failed to fetch earnings data', 
      { userId, userType, timeFrame, dateRange },
      error
    );
  }
});

/**
 * @desc    Get performance insights
 * @route   GET /api/analytics/insights
 * @access  Private
 */
const getPerformanceInsights = wrap(async (req, res) => {
  const userId = req.user._id;
  const userType = req.user.role || 'influencer';
  const { dateRange = 'Last 30 Days', refresh = false } = req.query;

  try {
    // Calculate date range
    const { startDate, endDate } = calculateDateRange(dateRange);

    // Get insights
    const insights = await analyticsOptimizationService.getPerformanceInsights(
      userId,
      userType,
      startDate,
      endDate,
      refresh === 'true'
    );

    return res.json({
      success: true,
      data: insights
    });
  } catch (error) {
    logger.error(`Error fetching performance insights: ${error.message}`, { userId, error });
    throw createThirdPartyApiError(
      'Analytics Service', 
      'Failed to fetch performance insights', 
      { userId, userType, dateRange },
      error
    );
  }
});

/**
 * @desc    Preload dashboard data
 * @route   POST /api/analytics/preload
 * @access  Private
 */
const preloadDashboardData = wrap(async (req, res) => {
  const userId = req.user._id;
  const userType = req.user.role || 'influencer';

  try {
    // Preload common dashboard data
    const success = await analyticsOptimizationService.preloadDashboardData(userId, userType);

    return res.json({
      success,
      message: success ? 
        'Dashboard data preloaded successfully' : 
        'Failed to preload dashboard data'
    });
  } catch (error) {
    logger.error(`Error preloading dashboard data: ${error.message}`, { userId, error });
    throw createThirdPartyApiError(
      'Analytics Service', 
      'Failed to preload dashboard data', 
      { userId, userType },
      error
    );
  }
});

/**
 * @desc    Clear dashboard cache
 * @route   DELETE /api/analytics/cache
 * @access  Private
 */
const clearDashboardCache = wrap(async (req, res) => {
  const userId = req.user._id;

  try {
    // Clear cache
    const clearedEntries = await analyticsOptimizationService.clearDashboardCache(userId);

    return res.json({
      success: true,
      message: `Cleared ${clearedEntries} cached entries`,
      clearedEntries
    });
  } catch (error) {
    logger.error(`Error clearing dashboard cache: ${error.message}`, { userId, error });
    throw createThirdPartyApiError(
      'Analytics Service', 
      'Failed to clear dashboard cache', 
      { userId },
      error
    );
  }
});

/**
 * Helper function to calculate date range from a string description
 * This duplicates the function in the service to avoid unnecessary imports in frontend code
 */
const calculateDateRange = (dateRange) => {
  const now = new Date();
  let startDate = new Date();
  const endDate = new Date();
  
  // Zero out time portion for consistent ranges
  endDate.setHours(23, 59, 59, 999);
  
  switch (dateRange) {
    case 'Last 7 Days':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case 'Last 30 Days':
      startDate.setDate(startDate.getDate() - 30);
      break;
    case 'Last Quarter':
      startDate.setMonth(startDate.getMonth() - 3);
      break;
    case 'Year to Date':
      startDate = new Date(now.getFullYear(), 0, 1); // Jan 1st of current year
      break;
    case 'All Time':
      startDate = new Date(2020, 0, 1); // Beginning of platform
      break;
    default:
      startDate.setDate(startDate.getDate() - 30); // Default to 30 days
  }
  
  // Zero out time portion for consistent ranges
  startDate.setHours(0, 0, 0, 0);
  
  return { startDate, endDate };
};

module.exports = {
  getDashboardData,
  getPlatformData,
  getEarningsData,
  getPerformanceInsights,
  preloadDashboardData,
  clearDashboardCache
};
