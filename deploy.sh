#!/bin/bash
# InfluencerHUB Deployment Script
# This script helps deploy the InfluencerHUB platform in different environments

# Text colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Display banner
echo -e "${BLUE}===================================================${NC}"
echo -e "${BLUE}        InfluencerHUB Deployment Assistant        ${NC}"
echo -e "${BLUE}===================================================${NC}"

# Check if docker is installed
if ! [ -x "$(command -v docker)" ]; then
  echo -e "${RED}Error: Docker is not installed.${NC}" >&2
  echo -e "Please install Docker and Docker Compose before proceeding."
  exit 1
fi

# Check if docker-compose is installed
if ! [ -x "$(command -v docker-compose)" ]; then
  echo -e "${RED}Error: Docker Compose is not installed.${NC}" >&2
  echo -e "Please install Docker Compose before proceeding."
  exit 1
fi

# Check for .env file
if [ ! -f ".env" ]; then
  echo -e "${YELLOW}Warning: No .env file found.${NC}"
  echo -e "Creating a sample .env file. Please edit it with your actual values before deployment."
  
  cat > .env << EOL
# JWT Authentication
JWT_SECRET=change_this_to_a_secure_random_string
REFRESH_TOKEN_SECRET=change_this_to_another_secure_random_string

# MongoDB
MONGO_ROOT_USER=admin
MONGO_ROOT_PASSWORD=change_this_password

# Redis
REDIS_PASSWORD=change_this_redis_password

# Stripe Payment
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# TikTok Integration
TIKTOK_CLIENT_KEY=your_tiktok_client_key
TIKTOK_CLIENT_SECRET=your_tiktok_client_secret

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# Other Settings
SLACK_WEBHOOK=your_slack_webhook_url
EOL

  echo -e "${GREEN}Sample .env file created.${NC}"
  echo -e "Please edit it with your actual values before deployment."
fi

# Function to deploy for development
deploy_development() {
  echo -e "\n${YELLOW}Starting development deployment...${NC}"
  
  # Run Docker Compose
  docker-compose up -d
  
  if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}Development deployment successful!${NC}"
    echo -e "Frontend: ${BLUE}http://localhost:3000${NC}"
    echo -e "Backend API: ${BLUE}http://localhost:5000${NC}"
    echo -e "MongoDB Admin: ${BLUE}http://localhost:8081${NC}"
    echo -e "\nTo view logs: ${YELLOW}docker-compose logs -f${NC}"
    echo -e "To stop: ${YELLOW}docker-compose down${NC}"
  else
    echo -e "\n${RED}Development deployment failed.${NC}"
    echo -e "Please check the error messages above."
  fi
}

# Function to deploy for production
deploy_production() {
  echo -e "\n${YELLOW}Starting production deployment...${NC}"
  
  # Check if the .env file has production settings
  if grep -q "CORS_ORIGIN=http://localhost" .env; then
    echo -e "${RED}Warning: Your .env file appears to have development settings.${NC}"
    echo -e "Please update CORS_ORIGIN and other settings for production before deploying."
    read -p "Continue anyway? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      echo -e "${YELLOW}Deployment canceled.${NC}"
      return 1
    fi
  fi
  
  # Run Docker Compose with production profile
  docker-compose --profile prod up -d
  
  if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}Production deployment successful!${NC}"
    echo -e "Your application should now be running at your configured domain."
    echo -e "\nTo view logs: ${YELLOW}docker-compose logs -f${NC}"
    echo -e "To stop: ${YELLOW}docker-compose --profile prod down${NC}"
  else
    echo -e "\n${RED}Production deployment failed.${NC}"
    echo -e "Please check the error messages above."
  fi
}

# Main menu
echo -e "\n${YELLOW}Please select deployment environment:${NC}"
echo -e "1) Development (local)"
echo -e "2) Production"
echo -e "3) Exit"

read -p "Enter your choice (1-3): " choice

case $choice in
  1)
    deploy_development
    ;;
  2)
    deploy_production
    ;;
  3)
    echo -e "${BLUE}Exiting deployment script.${NC}"
    exit 0
    ;;
  *)
    echo -e "${RED}Invalid choice. Exiting.${NC}"
    exit 1
    ;;
esac
