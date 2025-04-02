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
RUN cd server && npm install --omit=dev

# Copy the entire application
COPY . .

# Create logs directory for the logging system
RUN mkdir -p /app/server/logs/general /app/server/logs/error /app/server/logs/http

# Environment variables
ENV NODE_ENV=production
ENV PORT=5000
ENV RENDER_HEALTHCHECK_PATH=/api/health

# Expose the port
EXPOSE 5000

# Use a startup script that checks whether to run the full server or the simple test
CMD ["node", "server/server.js"]
