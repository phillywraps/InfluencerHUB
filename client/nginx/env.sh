#!/bin/sh

# This script replaces environment variables in the Nginx config

# Replace API_URL in the Nginx configuration
if [ -n "$API_URL" ]; then
  echo "Setting API_URL to: $API_URL"
  sed -i "s|\${API_URL}|$API_URL|g" /etc/nginx/conf.d/default.conf
else
  echo "Warning: API_URL is not set. Using default."
  sed -i "s|\${API_URL}|http://api:5000|g" /etc/nginx/conf.d/default.conf
fi

# Replace SOCKET_URL in the Nginx configuration
if [ -n "$SOCKET_URL" ]; then
  echo "Setting SOCKET_URL to: $SOCKET_URL"
  sed -i "s|\${SOCKET_URL}|$SOCKET_URL|g" /etc/nginx/conf.d/default.conf
else
  echo "Warning: SOCKET_URL is not set. Using default."
  sed -i "s|\${SOCKET_URL}|http://api:5000|g" /etc/nginx/conf.d/default.conf
fi

# Replace environment variables in the JavaScript files
# Find all JS files in the application that contain "__REACT_APP_"
JSFILES=$(find /usr/share/nginx/html -type f -name "*.js" -exec grep -l "__REACT_APP_" {} \;)

echo "Injecting environment variables into JS files..."
for FILE in $JSFILES
do
  echo "Processing file: $FILE"
  
  # Replace env placeholders with actual values from environment variables
  # Example: __REACT_APP_API_URL__ -> actual API URL
  for ENV_VAR in $(env | grep -o "REACT_APP_[^=]*")
  do
    ENV_VALUE=$(eval echo \$$ENV_VAR)
    search="__${ENV_VAR}__"
    echo "  Replacing $search with $ENV_VALUE"
    sed -i "s|$search|$ENV_VALUE|g" $FILE
  done
done

echo "Environment variable substitution complete"
