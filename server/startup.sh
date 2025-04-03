#!/bin/sh
# Startup script for the server that ensures logs directory exists
# and permissions are properly set before starting the server

# Ensure logs directory exists with proper permissions
mkdir -p /app/server/logs/general /app/server/logs/error /app/server/logs/http
chmod -R 777 /app/server/logs

# Start the server
echo "Starting server with NODE_ENV=$NODE_ENV"
node /app/server/server.js
