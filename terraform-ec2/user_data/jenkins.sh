#!/bin/bash
###############################################################################
# Jenkins EC2 bootstrap
#  - Java 17 (Jenkins requirement)
#  - Jenkins LTS
#  - Docker (for building images & spinning up Postgres/Redis test containers)
#  - Python 3 + pip + venv (for backend tests)
#  - Node.js 20 (for frontend tests)
#  - sonar-scanner CLI
###############################################################################
set -euxo pipefail
exec > >(tee /var/log/user-data.log | logger -t user-data) 2>&1

apt-get update
apt-get upgrade -y

# ---- Java 17 -----------------------------------------------------------------
apt-get install -y openjdk-17-jdk

# ---- Jenkins LTS -------------------------------------------------------------
curl -fsSL https://pkg.jenkins.io/debian-stable/jenkins.io-2023.key \
  | tee /usr/share/keyrings/jenkins-keyring.asc > /dev/null
echo "deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc] https://pkg.jenkins.io/debian-stable binary/" \
  | tee /etc/apt/sources.list.d/jenkins.list > /dev/null
apt-get update
apt-get install -y jenkins

# ---- Docker ------------------------------------------------------------------
curl -fsSL https://get.docker.com | sh
usermod -aG docker jenkins
usermod -aG docker ubuntu

# ---- Python + Node -----------------------------------------------------------
apt-get install -y python3 python3-pip python3-venv git unzip curl

curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# ---- SonarQube scanner CLI ---------------------------------------------------
SONAR_VERSION=5.0.1.3006
curl -sSLo /tmp/sonar-scanner.zip \
  "https://binaries.sonarsource.com/Distribution/sonar-scanner-cli/sonar-scanner-cli-${SONAR_VERSION}-linux.zip"
unzip -q /tmp/sonar-scanner.zip -d /opt
ln -sf "/opt/sonar-scanner-${SONAR_VERSION}-linux/bin/sonar-scanner" /usr/local/bin/sonar-scanner
rm /tmp/sonar-scanner.zip

# ---- Generate SSH deploy key for Jenkins → App EC2 ---------------------------
sudo -u jenkins mkdir -p /var/lib/jenkins/.ssh
sudo -u jenkins ssh-keygen -t rsa -b 4096 -f /var/lib/jenkins/.ssh/devsync_deploy -N ""
chown -R jenkins:jenkins /var/lib/jenkins/.ssh
chmod 700 /var/lib/jenkins/.ssh
chmod 600 /var/lib/jenkins/.ssh/devsync_deploy

# ---- Start Jenkins -----------------------------------------------------------
systemctl enable jenkins
systemctl restart jenkins

# ---- Print initial admin password to log ------------------------------------
sleep 30
echo "=== Jenkins initial admin password ==="
cat /var/lib/jenkins/secrets/initialAdminPassword || echo "Not ready yet — check later"
echo "======================================"

echo "=== Jenkins deploy public key (add to App EC2 ~/.ssh/authorized_keys) ==="
cat /var/lib/jenkins/.ssh/devsync_deploy.pub
echo "========================================================================="

echo "Jenkins bootstrap complete."
