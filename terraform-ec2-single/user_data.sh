#!/bin/bash
###############################################################################
# DevSync v2 single-instance bootstrap (Python-only).
# Installs Docker, clones the repo, builds the Django image, and brings up the
# stack (Postgres + Redis + Django + Celery + Caddy) with automatic HTTPS for
# the domain. Then installs a systemd timer that pulls `main` every few minutes
# and redeploys on change — so pushes auto-deploy with no inbound SSH needed.
# Everything is logged to /var/log/user-data.log.
###############################################################################
set -euxo pipefail
exec > >(tee /var/log/user-data.log | logger -t user-data) 2>&1

# ---- Swap (helps Docker builds on a 4 GB box) -------------------------------
if ! swapon --show | grep -q '/swapfile'; then
  fallocate -l 4G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

export DEBIAN_FRONTEND=noninteractive
apt-get update

# ---- Docker + Compose plugin + git ------------------------------------------
curl -fsSL https://get.docker.com | sh
usermod -aG docker ubuntu
apt-get install -y docker-compose-plugin git

PUBLIC_IP="$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)"

# ---- Get the code ------------------------------------------------------------
cd /opt
git clone ${repo_url} devsync
cd devsync
chown -R ubuntu:ubuntu /opt/devsync

# ---- Generate environment ----------------------------------------------------
SECRET="$(openssl rand -hex 32)"
PGPASS="$(openssl rand -hex 16)"
cat > .env <<EOF
DJANGO_DEBUG=False
DJANGO_SECRET_KEY=$SECRET
DJANGO_ALLOWED_HOSTS=${domain},$PUBLIC_IP,localhost,127.0.0.1
DJANGO_CSRF_TRUSTED_ORIGINS=https://${domain}
CORS_ALLOWED_ORIGINS=https://${domain}
USE_POSTGRES=True
POSTGRES_DB=devsync_db
POSTGRES_USER=devsync_user
POSTGRES_PASSWORD=$PGPASS
POSTGRES_HOST=db
POSTGRES_PORT=5432
REDIS_URL=redis://redis:6379/0
USE_CELERY=True
CELERY_BROKER_URL=redis://redis:6379/1
CELERY_RESULT_BACKEND=redis://redis:6379/1
EOF

# ---- Build the Django image (no frontend anymore) ----------------------------
docker build -t devsync-backend:latest --target production ./backend

# ---- Launch (production profile: Caddy on :80/:443, no Nginx/frontend) --------
docker compose --profile production up -d

# ---- Migrate + collect static into the runtime volume (retry until ready) -----
for i in $(seq 1 30); do
  if docker compose exec -T backend python manage.py migrate --noinput; then
    break
  fi
  echo "backend not ready yet ($i) — retrying in 10s"
  sleep 10
done
docker compose exec -T backend python manage.py collectstatic --noinput || true

# ---- Pull-based continuous deploy: redeploy when main changes -----------------
cat > /usr/local/bin/devsync-redeploy.sh <<'SCRIPT'
#!/bin/bash
set -e
cd /opt/devsync
git fetch origin main
LOCAL="$(git rev-parse HEAD)"
REMOTE="$(git rev-parse origin/main)"
if [ "$LOCAL" = "$REMOTE" ]; then
  exit 0
fi
echo "New commit on main — redeploying..."
git reset --hard origin/main
docker build -t devsync-backend:latest --target production ./backend
docker compose --profile production up -d --remove-orphans
docker compose exec -T backend python manage.py migrate --noinput
docker compose exec -T backend python manage.py collectstatic --noinput || true
docker image prune -f || true
echo "Redeploy complete."
SCRIPT
chmod +x /usr/local/bin/devsync-redeploy.sh

cat > /etc/systemd/system/devsync-redeploy.service <<'UNIT'
[Unit]
Description=DevSync pull-based redeploy
After=docker.service
Wants=docker.service

[Service]
Type=oneshot
ExecStart=/usr/local/bin/devsync-redeploy.sh
UNIT

cat > /etc/systemd/system/devsync-redeploy.timer <<'TIMER'
[Unit]
Description=Check DevSync main and redeploy on change

[Timer]
OnBootSec=5min
OnUnitActiveSec=2min
Unit=devsync-redeploy.service

[Install]
WantedBy=timers.target
TIMER

systemctl daemon-reload
systemctl enable --now devsync-redeploy.timer

echo "DevSync v2 deploy complete -> https://${domain} (point DNS at $PUBLIC_IP)"
echo "Create an admin user with: docker compose exec backend python manage.py createsuperuser"
