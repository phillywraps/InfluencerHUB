# InfluencerHUB Render.com Deployment Guide

## Changes Made to Fix Deployment Issues

The following changes have been made to ensure successful deployment on Render.com:

1. **Simplified Dockerfile**: 
   - Removed multi-stage build complexity
   - Ensured proper copying of all server files
   - Set up explicit dependency installation

2. **Updated render.yaml**:
   - Removed build arguments that were causing issues
   - Simplified build command
   - Temporarily commented out client service to focus on server deployment first

3. **Added Environment Configuration**:
   - Created .env.example to document all required environment variables
   - Ensured MongoDB and Redis connections work with Render's managed services

4. **Added Test Script**:
   - Created test-server-setup.js to verify server configuration locally before deployment

## Deployment Steps

### 1. Test Your Server Locally

Before deploying to Render, run the test script to verify your server setup:

```bash
cd /path/to/your/project
node test-server-setup.js
```

This will check that all dependencies can be loaded properly.

### 2. Deploy to GitHub

Make sure your changes are committed and pushed to your GitHub repository:

```bash
git add .
git commit -m "Fix Render deployment configuration"
git push origin main
```

### 3. Set Up Render Web Service

1. Log in to your Render.com account
2. Navigate to the Dashboard
3. Click "New +" and select "Web Service"
4. Connect your GitHub repository (or use "Build and deploy from Git" if already connected)
5. Select the repository: `phillywraps/InfluencerHUB`
6. Configure the service:
   - **Name**: influencerhub-api
   - **Environment**: Docker
   - **Branch**: main
   - **Root Directory**: (leave blank)
   - **Docker Command**: (leave blank, it's in the Dockerfile)

### 4. Set Environment Variables

In the Render dashboard for your service, under "Environment":

1. Click "Add Environment Variable" for each variable in your .env.example file
2. For database connections, use the variables provided by Render for managed databases
3. For secrets (JWT_SECRET, etc.), use strong random values

### 5. Set Up Databases

In the Render dashboard:

1. Create a MongoDB database:
   - Click "New +" and select "PostgreSQL" (or "Redis" for Redis)
   - Name it "influencerhub-db"
   - After creation, copy the connection URL to use in your environment variables

2. Create a Redis database:
   - Click "New +" and select "Redis"
   - Name it "influencerhub-redis"
   - After creation, copy the connection URL to use in your environment variables

### 6. Deploy Your Service

1. Click "Create Web Service" to start the deployment
2. Monitor the deployment logs for any issues
3. Once deployed, your API will be available at the URL provided by Render

### 7. Verify Deployment

1. Visit your API's health endpoint: `https://your-app-name.onrender.com/api/health`
2. It should return a JSON response with status "ok"

## Troubleshooting

### Common Issues:

1. **"Module not found" errors**:
   - Check the Render logs to see what module is missing
   - Verify it's listed in your server's package.json
   - Ensure your Dockerfile is correctly installing dependencies

2. **Database connection issues**:
   - Verify your MONGO_URI and REDIS_URI environment variables
   - Make sure MongoDB and Redis services are running
   - Check for network policy restrictions

3. **Build failures**:
   - Review the build logs for specific errors
   - Ensure all required files are being copied correctly

### Getting Help:

If you continue to experience issues:
1. Review the Render logs for specific error messages
2. Consult Render documentation: https://render.com/docs
3. Check GitHub issues for similar problems

## Next Steps

Once your server is deployed successfully:

1. Uncomment the client service in render.yaml
2. Push changes to GitHub
3. Set up the client service on Render
4. Configure environment variables for the client
5. Deploy the client service

---

This guide addresses the specific issues you were facing with Express dependency errors. The changes focus on reliable, consistent deployment of your application to Render.com.
