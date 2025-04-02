#!/bin/bash
# Welcome script for InfluencerHUB
# Displays a welcome banner and provides quick access to important information

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
RED='\033[0;31m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

clear

# ASCII Art Banner
echo -e "${BLUE}====================================================${NC}"
echo -e "${CYAN}  _____        __ _                                 ${NC}"
echo -e "${CYAN} |_   _|      / _| |                                ${NC}"
echo -e "${CYAN}   | |  _ __ | |_| |_   _  ___ _ __   ___ ___ _ __  ${NC}"
echo -e "${CYAN}   | | | '_ \|  _| | | | |/ _ \ '_ \ / __/ _ \ '__| ${NC}"
echo -e "${CYAN}  _| |_| | | | | | | |_| |  __/ | | | (_|  __/ |    ${NC}"
echo -e "${CYAN} |_____|_| |_|_| |_|\__,_|\___|_| |_|\___\___|_|    ${NC}"
echo -e "${CYAN}   _   _       _____   _____ _                      ${NC}"
echo -e "${CYAN}  | | | |     |  __ \ / ____| |                     ${NC}"
echo -e "${CYAN}  | |_| |_   _| |__) | (___ | |__                   ${NC}"
echo -e "${CYAN}  |  _  | | | |  ___/ \___ \| '_ \                  ${NC}"
echo -e "${CYAN}  | | | | |_| | |     ____) | |_) |                 ${NC}"
echo -e "${CYAN}  |_| |_|\__,_|_|    |_____/|_.__/                  ${NC}"
echo -e "${BLUE}====================================================${NC}"

echo -e "\n${YELLOW}Welcome to the InfluencerHUB Deployment Package!${NC}"
echo -e "This package contains all essential files to deploy the InfluencerHUB platform.\n"

# Display key information
echo -e "${GREEN}Ready to Deploy?${NC}"
echo -e "1. Verify all files are present:  ${BLUE}./verify_files.sh${NC}"
echo -e "2. Deploy the application:        ${BLUE}./deploy.sh${NC}"
echo -e "3. Read documentation:            ${BLUE}less README.md${NC}"
echo -e "4. View file manifest:            ${BLUE}less FILE_MANIFEST.md${NC}"

# Display System Information
echo -e "\n${GREEN}System Information:${NC}"
echo -e "• Current directory: ${YELLOW}$(pwd)${NC}"
echo -e "• Date and time:     ${YELLOW}$(date)${NC}"
echo -e "• Docker status:     ${YELLOW}$(which docker >/dev/null && echo "Installed" || echo "Not installed")${NC}"
echo -e "• Docker Compose:    ${YELLOW}$(which docker-compose >/dev/null && echo "Installed" || echo "Not installed")${NC}"

echo -e "\n${BLUE}====================================================${NC}"
echo -e "${GREEN}Type a command to get started or 'exit' to quit.${NC}"
echo -e "${BLUE}====================================================${NC}"
