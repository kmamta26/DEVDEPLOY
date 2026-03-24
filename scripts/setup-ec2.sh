#!/bin/bash
# setup-ec2.sh
# Run this on a fresh Ubuntu 22.04 / 24.04 EC2 instance to prepare it for DevDeploy.

set -e

echo "============================================="
echo "   Setting up DevDeploy Environment on EC2   "
echo "============================================="

# 1. Update and Upgrade
echo "[1/6] Updating system packages..."
sudo apt update && sudo apt upgrade -y

# 2. Install Node.js & npm
echo "[2/6] Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v

# 3. Install Docker
echo "[3/6] Installing Docker..."
sudo apt-get install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch="$(dpkg --print-architecture)" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  "$(. /etc/os-release && echo "$VERSION_CODENAME")" stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Add current user to docker group
sudo usermod -aG docker $USER
echo "  Note: You might need to log out and log back in for docker group changes to take effect."

# 4. Install NGINX
echo "[4/6] Installing NGINX..."
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx

# 5. Create necessary directories for DevDeploy
echo "[5/6] Creating deployment directories..."
sudo mkdir -p /var/devdeploy/projects
sudo chown -R $USER:$USER /var/devdeploy

# Ensure nginx can read our custom configs
echo "[6/6] Configuring NGINX wildcard inclusion..."
# the default /etc/nginx/nginx.conf usually has "include /etc/nginx/sites-enabled/*;"
# Let's ensure sites-enabled exists and we will instruct backend to write there.

echo "============================================="
echo "   Setup Complete!                           "
echo "============================================="
echo ""
echo "Next Steps:"
echo "1. Log out and log back in to apply Docker permissions: exit"
echo "2. Clone your DevDeploy backend code."
echo "3. Run 'npm install' inside the backend folder."
echo "4. Copy .env.example to .env and configure MONGO_URI and HOST_IP."
echo "5. For production, run backend using PM2: pm2 start server.js"
echo "6. Ensure AWS Security Group allows ports 80, 443, and 5000 (if exposing backend directly)."
