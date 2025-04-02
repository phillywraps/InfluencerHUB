#!/bin/bash

# This script generates Docker Hub repository URLs for the InfluencerHUB images

DOCKER_USERNAME="phillywraps"
SERVER_IMAGE="${DOCKER_USERNAME}/influencerhub-server:latest"
CLIENT_IMAGE="${DOCKER_USERNAME}/influencerhub-client:latest"

echo "Docker Hub Repository URLs:"
echo ""
echo "Server Image: docker pull ${SERVER_IMAGE}"
echo "Client Image: docker pull ${CLIENT_IMAGE}"
echo ""
echo "Docker Hub Web URLs:"
echo ""
echo "Server Image: https://hub.docker.com/r/${DOCKER_USERNAME}/influencerhub-server"
echo "Client Image: https://hub.docker.com/r/${DOCKER_USERNAME}/influencerhub-client"
echo ""
echo "To push these images to Docker Hub, you need to log in first:"
echo "docker login -u ${DOCKER_USERNAME}"
echo ""
echo "Then push the images:"
echo "docker push ${SERVER_IMAGE}"
echo "docker push ${CLIENT_IMAGE}"
