# This is a wrapper Dockerfile for Render.com deployment
# It will detect the service to build based on the environment variable

ARG SERVICE=server

# Build the server service by default
FROM node:16-alpine AS server-builder
WORKDIR /app
COPY ./server ./
RUN if [ "$SERVICE" = "server" ]; then \
        echo "Building server..." && \
        if [ -f "package.json" ]; then \
            npm install --production; \
        fi \
    fi
ENV NODE_ENV=production
ENV PORT=5000
EXPOSE 5000
ENV RENDER_HEALTHCHECK_PATH=/api/health
CMD ["node", "server.js"]

# Or build the client service
FROM node:16-alpine AS client-builder
WORKDIR /app
COPY ./client ./
RUN if [ "$SERVICE" = "client" ]; then \
        echo "Building client..." && \
        if [ -f "package.json" ]; then \
            npm ci && \
            npm run build; \
        fi \
    fi

# Final stage - select the appropriate service
FROM server-builder AS server
FROM client-builder AS client
FROM ${SERVICE}
