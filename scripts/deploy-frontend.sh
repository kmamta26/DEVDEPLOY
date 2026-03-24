#!/bin/bash
# deploy-frontend.sh
# Copies the DevDeploy frontend files into the NGINX web root on the EC2 instance.

set -e

FRONTEND_SRC="$(dirname "$0")/../frontend"
WEB_ROOT="/var/www/devdeploy-frontend"

echo "🌐 Deploying DevDeploy Frontend..."

# Create web root if it doesn't exist
sudo mkdir -p "$WEB_ROOT"

# Copy frontend files
sudo cp -r "$FRONTEND_SRC"/* "$WEB_ROOT"/

echo "✅ Frontend files copied to $WEB_ROOT"
echo "   NGINX should already be configured to serve from this path."
