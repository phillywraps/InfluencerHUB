# InfluencerHUB Files Manifest

This document provides a description of the essential files in this package and their purpose for deployment.

## Core Configuration Files

| File | Purpose |
|------|---------|
| `docker-compose.yml` | Main configuration file for Docker containers |
| `.env` | Environment variables for configuration |
| `deploy.sh` | Deployment script to simplify setup |
| `README.md` | Documentation and instructions |

## Frontend Files

| Directory/File | Purpose |
|----------------|---------|
| `client/Dockerfile` | Container configuration for the React frontend |
| `client/package.json` | NPM dependencies for the frontend |
| `client/nginx/nginx.conf` | Nginx web server configuration |
| `client/nginx/env.sh` | Script to inject environment variables into Nginx |
| `client/public/` | Static assets and HTML template |
| `client/src/` | React application source code |

## Backend Files

| Directory/File | Purpose |
|----------------|---------|
| `server/Dockerfile` | Container configuration for the Node.js backend |
| `server/server.js` | Main entry point for the API server |
| `server/package.json` | NPM dependencies for the backend |
| `server/config/` | Server configuration modules |
| `server/controllers/` | API request handlers |
| `server/middleware/` | Request processing middleware |
| `server/models/` | MongoDB data models |
| `server/routes/` | API endpoint definitions |
| `server/utils/` | Utility functions and services |

## Database Files

| Directory/File | Purpose |
|----------------|---------|
| `mongo-init/init-mongo.js` | MongoDB initialization script |

## CI/CD Configuration

| Directory/File | Purpose |
|----------------|---------|
| `.github/workflows/` | GitHub Actions workflows for CI/CD |

## Deployment Flow

The deployment process follows this sequence:

1. Set up environment variables in `.env`
2. Run the deployment script: `./deploy.sh`
3. Choose development or production mode
4. The script will start all necessary containers
5. Access the application through the specified endpoints

## Key Features

This deployment package includes all necessary files to run:

- React frontend with responsive UI
- Node.js backend API
- MongoDB database
- Redis for caching and sessions
- WebSocket for real-time features
- Nginx for serving the frontend and proxying API requests
- Complete authentication system
- Payment integration with multiple providers
- TikTok API integration
- Analytics and reporting systems
