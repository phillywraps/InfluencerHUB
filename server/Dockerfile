# Use Node.js LTS as base image
FROM node:16-alpine

# Set working directory
WORKDIR /app

# Install build dependencies
RUN apk --no-cache add python3 make g++

# Copy package.json and package-lock.json for efficient layer caching
COPY package*.json ./

# Install dependencies
RUN npm ci --production

# Copy the rest of the application code
COPY . .

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Expose the port the app will run on
EXPOSE 5000

# Health check configuration
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:5000/api/health || exit 1

# Run the application
CMD ["node", "server.js"]
