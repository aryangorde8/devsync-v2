#!/bin/bash
###############################################################################
# SonarQube EC2 bootstrap
#  - Required kernel tuning (Elasticsearch under the hood)
#  - Docker
#  - SonarQube LTS Community via Docker
###############################################################################
set -euxo pipefail
exec > >(tee /var/log/user-data.log | logger -t user-data) 2>&1

apt-get update
apt-get upgrade -y

# ---- Kernel tuning (SonarQube/ES requirement) --------------------------------
sysctl -w vm.max_map_count=524288
sysctl -w fs.file-max=131072
echo "vm.max_map_count=524288" >> /etc/sysctl.conf
echo "fs.file-max=131072"     >> /etc/sysctl.conf

# ---- ulimits -----------------------------------------------------------------
cat >> /etc/security/limits.conf <<'EOF'
sonarqube   -   nofile   131072
sonarqube   -   nproc    8192
EOF

# ---- Docker ------------------------------------------------------------------
curl -fsSL https://get.docker.com | sh
usermod -aG docker ubuntu

# ---- SonarQube container -----------------------------------------------------
docker volume create sonarqube_data
docker volume create sonarqube_logs
docker volume create sonarqube_extensions

docker run -d \
  --name sonarqube \
  --restart unless-stopped \
  -p 9000:9000 \
  -v sonarqube_data:/opt/sonarqube/data \
  -v sonarqube_logs:/opt/sonarqube/logs \
  -v sonarqube_extensions:/opt/sonarqube/extensions \
  sonarqube:lts-community

echo "SonarQube bootstrap complete. UI will be available on port 9000 in ~2-3 minutes."
echo "Default login: admin / admin"
