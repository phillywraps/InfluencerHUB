# InfluencerHUB Deployment Files

This folder contains all the essential files needed to deploy the InfluencerHUB platform. The project is structured as a full-stack application with React frontend, Node.js backend, MongoDB database, and Redis for caching.

## File Structure

```
InfluencerHUB Files/
├── .env                  # Environment variables
├── docker-compose.yml    # Docker Compose configuration
├── client/               # Frontend React application
│   ├── Dockerfile        # Frontend container configuration
│   ├── nginx/            # Nginx web server configuration
│   ├── public/           # Static assets
│   └── src/              # React source code
├── server/               # Backend Node.js API
│   ├── Dockerfile        # Backend container configuration
│   ├── server.js         # Main server entry point
│   ├── config/           # Server configuration
│   ├── controllers/      # API controllers
│   ├── middleware/       # Request processing middleware
│   ├── models/           # Database models
│   ├── routes/           # API routes
│   └── utils/            # Utility functions
└── mongo-init/           # MongoDB initialization scripts
```

## Deployment Instructions

### Prerequisites

- Docker and Docker Compose
- Node.js v16 or higher (for local development)
- MongoDB (optional for local development)
- A domain name (for production deployment)

### Environment Setup

1. Create a `.env` file in the root directory with the following variables:

```
# JWT Authentication
JWT_SECRET=your_jwt_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret

# MongoDB
MONGO_ROOT_USER=admin
MONGO_ROOT_PASSWORD=secure_password

# Redis
REDIS_PASSWORD=secure_redis_password

# Stripe Payment
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# TikTok Integration
TIKTOK_CLIENT_KEY=your_tiktok_client_key
TIKTOK_CLIENT_SECRET=your_tiktok_client_secret

# CORS Configuration
CORS_ORIGIN=https://your-domain.com

# Other Settings
SLACK_WEBHOOK=your_slack_webhook_url
```

### Local Development Deployment

Run the application locally using Docker Compose:

```bash
docker-compose up
```

This will start:
- Frontend on http://localhost:3000
- Backend API on http://localhost:5000
- MongoDB on port 27017
- Redis on port 6379

### Production Deployment

1. Update the `.env` file with production settings
2. Enable the production profiles in docker-compose.yml:

```bash
docker-compose --profile prod up -d
```

For production deployment, the setup includes:
- Nginx reverse proxy
- SSL/TLS certificate management with Let's Encrypt
- Enhanced security settings
- Production-optimized containers

### CI/CD Pipeline

The included GitHub Actions workflows can be used to set up automated deployment:

1. Set up the required secrets in your GitHub repository
2. Push the code to GitHub
3. The CI/CD pipeline will automatically build, test, and deploy the application

## Monitoring and Maintenance

- Access the server health status at: `/api/health`
- MongoDB admin UI (development only): http://localhost:8081
- Application logs are stored in the `server/logs` directory

## Additional Resources

- For detailed API documentation, refer to the API endpoints defined in the server/routes directory
- For frontend component documentation, check the React component code in client/src/components
