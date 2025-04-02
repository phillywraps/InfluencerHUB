# This is a simplified, reliable Dockerfile for Render.com deployment
FROM node:16-alpine

# Set working directory
WORKDIR /app

# Install build dependencies
RUN apk --no-cache add python3 make g++

# Copy the entire application to ensure all files are available
COPY . .

# Install server dependencies
WORKDIR /app/server
RUN npm install

# Set environment variables for server
ENV NODE_ENV=production
ENV PORT=5000
EXPOSE 5000
ENV RENDER_HEALTHCHECK_PATH=/api/health

# Command to run the server
CMD ["node", "server.js"]
