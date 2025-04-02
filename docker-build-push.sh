#!/bin/bash

# This script builds and pushes Docker images for InfluencerHUB to Docker Hub
# Usage: ./docker-build-push.sh [your-dockerhub-username] [--build-only]

DOCKER_USERNAME="phillywraps"
BUILD_ONLY=false

# Parse arguments
for arg in "$@"; do
  if [[ "$arg" == "--build-only" ]]; then
    BUILD_ONLY=true
  elif [[ "$arg" != -* ]]; then
    DOCKER_USERNAME="$arg"
  fi
done

IMAGE_PREFIX="${DOCKER_USERNAME}/influencerhub"

echo "Building Docker images for InfluencerHUB as ${DOCKER_USERNAME}"

# Build the server image
echo "Building server image..."
docker build \
  --build-arg SERVICE=server \
  -t ${IMAGE_PREFIX}-server:latest \
  -f Dockerfile .

# Build the client image
echo "Building client image..."
docker build \
  --build-arg SERVICE=client \
  -t ${IMAGE_PREFIX}-client:latest \
  -f Dockerfile .

# Push images to Docker Hub if not build-only
if [ "$BUILD_ONLY" = false ]; then
  echo "Pushing images to Docker Hub..."
  echo "Make sure you're logged in to Docker Hub with: docker login -u ${DOCKER_USERNAME}"
  
  docker push ${IMAGE_PREFIX}-server:latest
  docker push ${IMAGE_PREFIX}-client:latest
  
  echo "Done! Images are now available on Docker Hub:"
else
  echo "Build completed successfully. Images available locally:"
fi

echo "- ${IMAGE_PREFIX}-server:latest"
echo "- ${IMAGE_PREFIX}-client:latest"
