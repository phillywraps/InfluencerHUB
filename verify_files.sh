#!/bin/bash
# Script to verify that all essential files for deployment are present

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}====================================${NC}"
echo -e "${BLUE}  InfluencerHUB File Verification  ${NC}"
echo -e "${BLUE}====================================${NC}"

echo -e "\nChecking for essential deployment files..."

# Arrays of essential files and directories
CORE_FILES=(
  ".env"
  "docker-compose.yml"
  "deploy.sh"
  "README.md"
  "FILE_MANIFEST.md"
)

CLIENT_FILES=(
  "client/Dockerfile"
  "client/package.json"
  "client/nginx/nginx.conf"
  "client/nginx/env.sh"
  "client/public/index.html"
  "client/public/manifest.json"
  "client/src/App.js"
  "client/src/index.js"
)

SERVER_FILES=(
  "server/Dockerfile"
  "server/package.json"
  "server/server.js"
  "server/config"
  "server/controllers"
  "server/middleware"
  "server/models"
  "server/routes"
  "server/utils"
)

DB_FILES=(
  "mongo-init/init-mongo.js"
)

# Function to check files
check_files() {
  local category=$1
  local files=("${!2}")
  local missing=0
  local total=${#files[@]}
  local found=0
  
  echo -e "\n${YELLOW}Checking ${category} files:${NC}"
  
  for file in "${files[@]}"; do
    if [ -e "$file" ]; then
      echo -e "  ${GREEN}✓${NC} $file"
      ((found++))
    else
      echo -e "  ${RED}✗${NC} $file (missing)"
      ((missing++))
    fi
  done
  
  if [ $missing -eq 0 ]; then
    echo -e "${GREEN}All ${category} files present! ($found/$total)${NC}"
  else
    echo -e "${RED}Missing $missing ${category} files.${NC}"
  fi
  
  return $missing
}

# Track overall status
TOTAL_MISSING=0

# Check each category
check_files "core" CORE_FILES[@]
TOTAL_MISSING=$((TOTAL_MISSING + $?))

check_files "client" CLIENT_FILES[@]
TOTAL_MISSING=$((TOTAL_MISSING + $?))

check_files "server" SERVER_FILES[@]
TOTAL_MISSING=$((TOTAL_MISSING + $?))

check_files "database" DB_FILES[@]
TOTAL_MISSING=$((TOTAL_MISSING + $?))

# Check if directories have content
echo -e "\n${YELLOW}Checking key directories for content:${NC}"

IMPORTANT_DIRS=(
  "client/src/components"
  "server/routes"
  "server/controllers"
  "server/models"
)

for dir in "${IMPORTANT_DIRS[@]}"; do
  if [ -d "$dir" ]; then
    FILE_COUNT=$(find "$dir" -type f | wc -l)
    if [ "$FILE_COUNT" -gt 0 ]; then
      echo -e "  ${GREEN}✓${NC} $dir ($FILE_COUNT files)"
    else
      echo -e "  ${YELLOW}!${NC} $dir (directory exists but is empty)"
      ((TOTAL_MISSING++))
    fi
  else
    echo -e "  ${RED}✗${NC} $dir (directory missing)"
    ((TOTAL_MISSING++))
  fi
done

# Final summary
echo -e "\n${BLUE}====================================${NC}"
if [ $TOTAL_MISSING -eq 0 ]; then
  echo -e "${GREEN}All essential deployment files are present!${NC}"
  echo -e "You can proceed with deployment using ./deploy.sh"
else
  echo -e "${RED}Missing $TOTAL_MISSING essential files.${NC}"
  echo -e "Please ensure all required files are present before deployment."
  echo -e "See the ${BLUE}FILE_MANIFEST.md${NC} for details on each file's purpose."
fi
echo -e "${BLUE}====================================${NC}"
