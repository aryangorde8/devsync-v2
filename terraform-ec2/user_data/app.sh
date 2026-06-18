#!/bin/bash
###############################################################################
# App EC2 bootstrap
#  - Docker + Docker Compose plugin
#  - App directory at /opt/devsync (owned by ubuntu)
#  - Git (in case you want to git pull instead of scp)
###############################################################################
set -euxo pipefail
exec > >(tee /var/log/user-data.log | logger -t user-data) 2>&1

apt-get update
apt-get upgrade -y

# ---- Docker + Compose plugin -------------------------------------------------
curl -fsSL https://get.docker.com | sh
usermod -aG docker ubuntu
apt-get install -y docker-compose-plugin git

# ---- App directory -----------------------------------------------------------
mkdir -p /opt/devsync
chown ubuntu:ubuntu /opt/devsync

# ---- Optional: install certbot for SSL --------------------------------------
apt-get install -y certbot python3-certbot-nginx

echo "App server bootstrap complete. Waiting for Jenkins to deploy."
