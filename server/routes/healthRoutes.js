/**
 * Health Check Routes
 * 
 * These routes provide health check endpoints for monitoring the application's 
 * health and status in production environments.
 */

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const os = require('os');
const { version } = require('../package.json');

/**
 * @route   GET /api/health
 * @desc    Basic health check endpoint
 * @access  Public
 */
router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: Date.now()
  });
});

/**
 * @route   GET /api/health/db
 * @desc    Check database connectivity
 * @access  Public
 */
router.get('/db', async (req, res) => {
  try {
    // Check MongoDB connection state
    const state = mongoose.connection.readyState;
    const stateMap = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };

    // Check for valid connection
    if (state === 1) {
      // Perform a simple command to verify db is responding
      await mongoose.connection.db.admin().ping();
      
      res.json({
        status: 'ok',
        dbState: stateMap[state],
        timestamp: Date.now()
      });
    } else {
      res.status(503).json({
        status: 'error',
        dbState: stateMap[state],
        message: 'Database not connected',
        timestamp: Date.now()
      });
    }
  } catch (error) {
    res.status(503).json({
      status: 'error',
      message: 'Failed to connect to database',
      error: error.message,
      timestamp: Date.now()
    });
  }
});

// Import authentication middleware
const { protect, adminOnly } = require('../middleware/authMiddleware');

/**
 * @route   GET /api/health/detailed
 * @desc    Detailed system health information
 * @access  Private (Admin only)
 */
router.get('/detailed', protect, adminOnly, (req, res) => {
  // Secured with admin-level authentication
  const memoryUsage = process.memoryUsage();
  
  res.json({
    status: 'ok',
    version,
    uptime: process.uptime(),
    timestamp: Date.now(),
    memory: {
      rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
      heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
      external: `${Math.round(memoryUsage.external / 1024 / 1024)} MB`
    },
    cpu: {
      count: os.cpus().length,
      load: os.loadavg(),
      model: os.cpus()[0].model
    },
    system: {
      platform: os.platform(),
      release: os.release(),
      hostname: os.hostname(),
      uptime: os.uptime()
    },
    nodejs: {
      version: process.version,
      env: process.env.NODE_ENV
    }
  });
});

/**
 * @route   GET /api/health/readiness
 * @desc    Readiness check for Kubernetes/container orchestration
 * @access  Public
 */
router.get('/readiness', async (req, res) => {
  try {
    // Verify database connection
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        status: 'error',
        message: 'Database not connected',
        timestamp: Date.now()
      });
    }
    
    // Can add checks for other dependencies here (Redis, external APIs, etc.)
    
    res.json({
      status: 'ok',
      timestamp: Date.now()
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      message: error.message,
      timestamp: Date.now()
    });
  }
});

/**
 * @route   GET /api/health/liveness
 * @desc    Liveness check for Kubernetes/container orchestration
 * @access  Public
 */
router.get('/liveness', (req, res) => {
  // Simple check to verify the server is running and responding
  res.json({
    status: 'ok',
    timestamp: Date.now()
  });
});

module.exports = router;
