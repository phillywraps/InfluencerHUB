/**
 * Simple Express Server Test Script
 * 
 * This is a minimal Express server that can be used to test deployment settings.
 * It doesn't include any complex dependencies or database connections.
 */

const express = require('express');
const cors = require('cors');
const http = require('http');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Apply basic middleware
app.use(cors());
app.use(express.json());

// Health check route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Server is running correctly',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Root route for basic info
app.get('/', (req, res) => {
  res.json({
    app: 'InfluencerHUB API',
    version: '1.0.0',
    healthCheck: '/api/health',
    message: 'This is a simplified server for testing deployment'
  });
});

// Define port and start server
const PORT = process.env.PORT || 5001;  // Using port 5001 to avoid conflicts

server.listen(PORT, () => {
  console.log(`✅ Test server running on port ${PORT}`);
  console.log(`Health check available at: http://localhost:${PORT}/api/health`);
});
