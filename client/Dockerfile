# Stage 1: Build the React application
FROM node:16-alpine as build

# Set working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy application code
COPY . .

# Set environment variables based on build args
ARG REACT_APP_API_URL=https://influencerhub-api.onrender.com
ARG REACT_APP_SOCKET_URL=wss://influencerhub-api.onrender.com
ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV REACT_APP_SOCKET_URL=$REACT_APP_SOCKET_URL

# Build the application
RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:alpine

# Copy custom Nginx config
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files from the build stage
COPY --from=build /app/build /usr/share/nginx/html

# Add runtime configuration script
COPY nginx/env.sh /docker-entrypoint.d/40-env.sh
RUN chmod +x /docker-entrypoint.d/40-env.sh

# Set environment variable for Render.com
ENV PORT=80

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost/ || exit 1

# Expose port
EXPOSE 80

# Command to run
CMD ["nginx", "-g", "daemon off;"]
