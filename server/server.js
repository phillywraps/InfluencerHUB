const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const path = require('path');
const helmet = require('helmet');
const { configureCronJobs } = require('./config/cron');
const logger = require('./config/logger');
const WebSocketService = require('./utils/webSocketService');

// Require models to ensure they're registered
require('./models/subscriptionModel');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Configure and start cron jobs
configureCronJobs();

// Import security middleware
const { corsOptions, applySecurityMiddleware } = require('./middleware/securityMiddleware');

// Apply basic middleware
app.use(cors(corsOptions()));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply comprehensive security middleware
applySecurityMiddleware(app);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/influencer-platform', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  // Enhanced security options
  ssl: process.env.NODE_ENV === 'production',
  sslValidate: process.env.NODE_ENV === 'production',
  retryWrites: true,
  w: 'majority',
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Import middleware
const { notFound, errorHandler, handleValidationError } = require('./middleware/errorMiddleware');

// Define routes
const userRoutes = require('./routes/userRoutes');
const influencerRoutes = require('./routes/influencerRoutes');
const advertiserRoutes = require('./routes/advertiserRoutes');
const rentalRoutes = require('./routes/rentalRoutes');
const messageRoutes = require('./routes/messageRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const payoutRoutes = require('./routes/payoutRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const subscriptionTierRoutes = require('./routes/subscriptionTierRoutes');
const apiKeyRoutes = require('./routes/apiKeyRoutes');
const verificationRoutes = require('./routes/verificationRoutes');
const tiktokRoutes = require('./routes/tiktokRoutes');
const tiktokPublishingRoutes = require('./routes/tiktokPublishingRoutes');
const alipayRoutes = require('./routes/alipayRoutes');
const cryptoRoutes = require('./routes/cryptoRoutes');
const contentRoutes = require('./routes/contentRoutes');
const databaseMonitorRoutes = require('./routes/databaseMonitorRoutes');
const analyticsOptimizationRoutes = require('./routes/analyticsOptimizationRoutes');

// Define health check routes
const healthRoutes = require('./routes/healthRoutes');

// Mount routes
app.use('/api/health', healthRoutes);
app.use('/api/users', userRoutes);
app.use('/api/influencers', influencerRoutes);
app.use('/api/advertisers', advertiserRoutes);
app.use('/api/rentals', rentalRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/subscription-tiers', subscriptionTierRoutes);
app.use('/api/payouts', payoutRoutes);
app.use('/api/api-keys', apiKeyRoutes);
app.use('/api/verifications', verificationRoutes);
app.use('/api/tiktok', tiktokRoutes);
app.use('/api/tiktok/publishing', tiktokPublishingRoutes);
app.use('/api/alipay', alipayRoutes);
app.use('/api/crypto', cryptoRoutes);
app.use('/api/teams/:teamId/collaborationSpaces/:spaceId/content', contentRoutes);
app.use('/api/admin/database', databaseMonitorRoutes);
app.use('/api/analytics/optimized', analyticsOptimizationRoutes);

// Special handling for Stripe webhook route
// This needs to come before the express.json() middleware for the webhook endpoint
app.use('/api/payments', paymentRoutes);

// Error handling middleware
app.use(handleValidationError);
app.use(notFound);
app.use(errorHandler);

// Initialize WebSocket service
const webSocketService = new WebSocketService(server);

// Initialize Query Optimizer monitoring
const queryOptimizer = require('./utils/queryOptimizer');
logger.info('Query Optimizer initialized and monitoring database performance');

// Initialize NotificationSocketService with the WebSocketService
const NotificationSocketService = require('./utils/notificationSocketService');
const notificationSocketService = new NotificationSocketService(webSocketService);

// Update controllers to use WebSocket service
const messageController = require('./controllers/messageController');
const rentalController = require('./controllers/rentalController');
const notificationController = require('./controllers/notificationController');
messageController.setSocketService(webSocketService);
rentalController.setSocketService(webSocketService);
notificationController.setSocketService(notificationSocketService);

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client/build', 'index.html'));
  });
}

// Define port
const PORT = process.env.PORT || 5000;

// Start server
server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
