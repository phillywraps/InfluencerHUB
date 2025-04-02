# InfluencerHUB Render.com Deployment Guide

This guide explains how to deploy the InfluencerHUB platform on Render.com.

## Prerequisites

1. A GitHub account with the InfluencerHUB repository
2. A Render.com account
3. Required API keys and environment variables (see `render-env.yaml`)

## Deployment Steps

### 1. Connect Your GitHub Repository

1. Log in to your Render.com account
2. Navigate to the Dashboard
3. Click "New +" and select "Blueprint"
4. Connect your GitHub account if you haven't already
5. Select the `phillywraps/InfluencerHUB` repository
6. Click "Approve" to allow Render to access your repository

### 2. Configure Your Blueprint

The repository includes a `render.yaml` file that defines the services to be deployed:

- `influencerhub-api`: Backend Node.js API server
- `influencerhub`: Frontend React application
- MongoDB database
- Redis cache

Review the configuration and proceed with deployment.

### 3. Set Environment Variables

After creating the services, you'll need to set environment variables:

1. Navigate to each service in the Render dashboard
2. Go to the "Environment" tab
3. Add all required environment variables as listed in `render-env.yaml`
4. Be sure to use secure values for secrets and API keys

### 4. Database Setup

Render will automatically provision the MongoDB and Redis databases. Note the connection strings for:

- MongoDB: Use this for the `MONGO_URI` environment variable
- Redis: Use this for the `REDIS_URI` environment variable

### 5. Deploy Services

Once the environment variables are set:

1. Navigate to each service
2. Click the "Manual Deploy" button and select "Deploy latest commit"
3. Wait for the deployment to complete

## Verifying Deployment

After deployment:

1. The frontend will be available at: `https://influencerhub.onrender.com`
2. The backend API will be available at: `https://influencerhub-api.onrender.com`
3. Test the endpoints to ensure everything is working correctly

## CI/CD Setup

To set up continuous deployment:

1. Each service is already configured to automatically deploy when changes are pushed to the `main` branch
2. You can disable auto-deployment in the Render dashboard if needed

## Troubleshooting

- **Health Check Failures**: Ensure the health check endpoints are correctly implemented
- **Environment Variable Issues**: Verify all required variables are set correctly
- **Database Connection Errors**: Check the database connection strings
- **Build Failures**: Review build logs in the Render dashboard

## Monitoring & Scaling

- Use the Render dashboard to monitor service health and logs
- Scale services up or down based on traffic needs
- Consider upgrading to paid plans for production workloads

## Support

If you encounter issues with deployment, consult:

- Render.com documentation: https://render.com/docs
- GitHub repository issues: https://github.com/phillywraps/InfluencerHUB/issues
