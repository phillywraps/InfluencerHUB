const cron = require('node-cron');
const path = require('path');
const { spawn } = require('child_process');
const logger = require('./logger');

/**
 * Configure and start cron jobs for the application
 */
const configureCronJobs = () => {
  // Run API key rotation check daily at 2:00 AM
  cron.schedule('0 2 * * *', () => {
    logger.info('Running scheduled API key rotation check');
    
    const scriptPath = path.join(__dirname, '../scripts/rotateApiKeys.js');
    const child = spawn('node', [scriptPath], {
      stdio: 'inherit',
      env: process.env
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        logger.info('API key rotation check completed successfully');
      } else {
        logger.error(`API key rotation check failed with code ${code}`);
      }
    });
  });
  
  // Run renewal notifications check daily at 9:00 AM
  cron.schedule('0 9 * * *', () => {
    logger.info('Running scheduled renewal notifications check');
    
    const scriptPath = path.join(__dirname, '../scripts/generateRenewalNotifications.js');
    const child = spawn('node', [scriptPath], {
      stdio: 'inherit',
      env: process.env
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        logger.info('Renewal notifications check completed successfully');
      } else {
        logger.error(`Renewal notifications check failed with code ${code}`);
      }
    });
  });
  
  logger.info('Cron jobs configured and started');
};

module.exports = { configureCronJobs };
