/**
 * Script to test the server setup before deployment
 * This will help verify that all dependencies are properly installed
 * Run with: node test-server-setup.js
 */

console.log('Starting InfluencerHUB server configuration test...');

try {
  // Test loading of critical dependencies
  console.log('Testing dependencies...');
  
  const express = require('express');
  console.log('✅ express loaded successfully');
  
  const mongoose = require('mongoose');
  console.log('✅ mongoose loaded successfully');
  
  const cors = require('cors');
  console.log('✅ cors loaded successfully');
  
  const dotenv = require('dotenv');
  console.log('✅ dotenv loaded successfully');
  
  const helmet = require('helmet');
  console.log('✅ helmet loaded successfully');
  
  // Create minimal express app
  const app = express();
  console.log('✅ express app created successfully');
  
  // Test middleware
  app.use(cors());
  app.use(express.json());
  app.use(helmet());
  console.log('✅ middleware loaded successfully');
  
  // Create minimal route
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
  });
  console.log('✅ test route created successfully');
  
  // Test server creation
  const http = require('http');
  const server = http.createServer(app);
  console.log('✅ server created successfully');
  
  console.log('\nAll dependency tests passed! The server configuration is valid.');
  console.log('Your app should deploy correctly to Render.com with the updated configuration.');
  
  // Don't actually start the server, just verify everything loads
} catch (error) {
  console.error('\n❌ TEST FAILED:');
  console.error(`Error: ${error.message}`);
  console.error('Stack trace:');
  console.error(error.stack);
  console.error('\nPlease fix the issues above before deploying to Render.com');
}
