#!/bin/bash
# cleanup.sh
# Removes stopped Docker containers and dangling images to free disk space.

set -e

echo "🧹 Cleaning up Docker resources..."

# Remove stopped containers
docker container prune -f

# Remove dangling images
docker image prune -f

# Remove unused volumes
docker volume prune -f

echo "✅ Cleanup complete."
docker system df
