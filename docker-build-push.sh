#!/bin/bash

# This script builds and pushes Docker images for InfluencerHUB to Docker Hub
# Usage: ./docker-build-push.sh [your-dockerhub-username]

DOCKER_USERNAME=${1:-"phillywraps"}
IMAGE_PREFIX="${DOCKER_USERNAME}/influencerhub"

echo "Building and pushing Docker images to Docker Hub as ${DOCKER_USERNAME}"
echo "Make sure you're logged in to Docker Hub with: docker login -u ${DOCKER_USERNAME}"

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

# Push images to Docker Hub
echo "Pushing images to Docker Hub..."
docker push ${IMAGE_PREFIX}-server:latest
docker push ${IMAGE_PREFIX}-client:latest

echo "Done! Images are now available on Docker Hub:"
echo "- ${IMAGE_PREFIX}-server:latest"
echo "- ${IMAGE_PREFIX}-client:latest"
