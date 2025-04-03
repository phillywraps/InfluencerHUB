# Simplified Dockerfile for Render.com deployment
FROM node:16-alpine

# Set working directory
WORKDIR /app

# Install build dependencies
RUN apk --no-cache add python3 make g++

# Copy package files for both root and server
COPY package*.json ./
COPY server/package*.json ./server/

# Install dependencies at both levels
RUN npm install --omit=dev
# Install server dependencies, ensuring winston-daily-rotate-file is included
WORKDIR /app/server
RUN npm install --omit=dev winston-daily-rotate-file
WORKDIR /app

# Copy the entire application
COPY . .

# Create logs directory for the logging system with proper permissions
USER root
RUN mkdir -p /app/server/logs/general /app/server/logs/error /app/server/logs/http && \
    chmod -R 777 /app/server/logs

# Environment variables
ENV NODE_ENV=production
ENV PORT=5000
ENV RENDER_HEALTHCHECK_PATH=/api/health

# Expose the port
EXPOSE 5000

# Make the startup script executable
RUN chmod +x /app/server/startup.sh

# Use the startup script to ensure log directories exist and have proper permissions
CMD ["/app/server/startup.sh"]
