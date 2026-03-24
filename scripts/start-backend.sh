#!/bin/bash
# start-backend.sh
# Starts the DevDeploy backend using PM2 process manager.

set -e

BACKEND_DIR="$(dirname "$0")/../backend"

echo "🚀 Starting DevDeploy Backend..."

# Ensure PM2 is installed
if ! command -v pm2 &> /dev/null; then
  echo "Installing PM2..."
  sudo npm install -g pm2
fi

cd "$BACKEND_DIR"

# Install dependencies
npm install --production

# Stop existing instance if running
pm2 delete devdeploy-backend 2>/dev/null || true

# Start with PM2
pm2 start server.js --name devdeploy-backend

# Save PM2 config so it restarts on reboot
pm2 save
pm2 startup

echo "✅ Backend is running. Check status with: pm2 status"
