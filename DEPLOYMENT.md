# DevSync Production Deployment Guide

This guide covers deploying DevSync to production using various platforms.

## 🚀 Quick Deploy Options

| Platform | Backend | Frontend | Database | Cost |
|----------|---------|----------|----------|------|
| **Render + Vercel** | Render (Free) | Vercel (Free) | Render PostgreSQL (Free) | $0/month |
| **Railway** | Railway | Railway | Railway PostgreSQL | ~$5/month |
| **Docker + VPS** | Self-hosted | Self-hosted | Self-hosted | ~$5/month |

---

## Option 1: Render (Backend) + Vercel (Frontend) - FREE

### Step 1: Deploy Backend to Render

1. **Fork/Push your repo to GitHub**

2. **Create Render Account**
   - Go to [render.com](https://render.com)
   - Sign up with GitHub

3. **Create PostgreSQL Database**
   - Dashboard → New → PostgreSQL
   - Name: `devsync-db`
   - Plan: Free
   - Copy the **Internal Database URL**

4. **Deploy Backend**
   - Dashboard → New → Web Service
   - Connect your GitHub repo
   - Configure:
     ```
     Name: devsync-api
     Root Directory: backend
     Runtime: Python 3
     Build Command: pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate
     Start Command: gunicorn config.wsgi:application --bind 0.0.0.0:$PORT
     ```
   - Add Environment Variables:
     ```
     DJANGO_DEBUG=False
     DJANGO_SECRET_KEY=<click Generate>
     DJANGO_ALLOWED_HOSTS=.onrender.com
     DJANGO_CSRF_TRUSTED_ORIGINS=https://your-app.onrender.com,https://your-frontend.vercel.app
     CORS_ALLOWED_ORIGINS=https://your-frontend.vercel.app
     DATABASE_URL=<paste Internal Database URL>
     ```

5. **Note your backend URL** (e.g., `https://devsync-api.onrender.com`)

### Step 2: Deploy Frontend to Vercel

1. **Create Vercel Account**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with GitHub

2. **Import Project**
   - New Project → Import your repo
   - Configure:
     ```
     Framework: Next.js
     Root Directory: frontend
     ```
   - Add Environment Variable:
     ```
     NEXT_PUBLIC_API_URL=https://your-backend.onrender.com/api/v1
     ```

3. **Deploy!**

### Step 3: Update CORS

Go back to Render and update:
```
CORS_ALLOWED_ORIGINS=https://your-app.vercel.app
DJANGO_CSRF_TRUSTED_ORIGINS=https://your-backend.onrender.com,https://your-app.vercel.app
```

---

## Option 2: Railway - Simple & Affordable

### One-Click Deploy

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new)

1. **Create Railway Account** at [railway.app](https://railway.app)

2. **Create New Project**
   - New Project → Deploy from GitHub repo

3. **Add PostgreSQL**
   - New → Database → PostgreSQL

4. **Configure Backend Service**
   ```
   Root Directory: backend
   Start Command: gunicorn config.wsgi:application --bind 0.0.0.0:$PORT
   ```
   
   Environment Variables:
   ```
   DJANGO_DEBUG=False
   DJANGO_SECRET_KEY=${{SECRET}}
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   DJANGO_ALLOWED_HOSTS=.railway.app
   ```

5. **Configure Frontend Service**
   ```
   Root Directory: frontend
   ```
   
   Environment Variables:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend.railway.app/api/v1
   ```

---

## Option 3: Docker + VPS (DigitalOcean/Linode)

### Prerequisites
- VPS with Ubuntu 22.04+ (minimum 1GB RAM)
- Domain name pointed to your VPS IP

### Step 1: Server Setup

```bash
# SSH into your server
ssh root@your-server-ip

# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh

# Install Docker Compose
apt install docker-compose-plugin -y

# Create app directory
mkdir -p /opt/devsync && cd /opt/devsync

# Clone your repo
git clone https://github.com/yourusername/devsync.git .
```

### Step 2: Configure Environment

```bash
# Copy and edit production env
cp .env.production.example .env

# Edit with your values
nano .env
```

Required values:
```env
DJANGO_DEBUG=False
DJANGO_SECRET_KEY=your-generated-secret-key
DJANGO_ALLOWED_HOSTS=yourdomain.com,api.yourdomain.com
DATABASE_URL=postgresql://devsync_user:your-password@db:5432/devsync_db
POSTGRES_PASSWORD=your-password
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1
```

### Step 3: Deploy with Docker Compose

```bash
# Build and start all services
docker compose -f docker-compose.yml up -d --build

# Check logs
docker compose logs -f

# Run migrations
docker compose exec backend python manage.py migrate

# Create superuser
docker compose exec backend python manage.py createsuperuser
```

### Step 4: Setup SSL with Nginx & Certbot

```bash
# Install Certbot
apt install certbot python3-certbot-nginx -y

# Get SSL certificate
certbot --nginx -d yourdomain.com -d api.yourdomain.com

# Auto-renewal is automatic
```

---

## Post-Deployment Checklist

### Security
- [ ] `DJANGO_DEBUG=False`
- [ ] Strong `DJANGO_SECRET_KEY` (use generator)
- [ ] HTTPS enabled
- [ ] CORS restricted to your domain
- [ ] Rate limiting active

### Monitoring
- [ ] Set up Sentry for error tracking (free tier)
  ```env
  SENTRY_DSN=https://xxx@sentry.io/xxx
  ```
- [ ] Check health endpoint: `GET /api/v1/core/health/`

### Database
- [ ] Backups configured (Render/Railway do this automatically)
- [ ] Run migrations: `python manage.py migrate`

### Performance
- [ ] Static files collected: `python manage.py collectstatic`
- [ ] Gunicorn workers: `gunicorn config.wsgi -w 2 --threads 4`

---

## Environment Variables Reference

### Required
| Variable | Description | Example |
|----------|-------------|---------|
| `DJANGO_SECRET_KEY` | Django secret key | `django-insecure-xxx` |
| `DJANGO_DEBUG` | Debug mode | `False` |
| `DJANGO_ALLOWED_HOSTS` | Allowed hosts | `yourdomain.com` |
| `DATABASE_URL` | PostgreSQL URL | `postgresql://...` |
| `NEXT_PUBLIC_API_URL` | Backend API URL | `https://api.yourdomain.com/api/v1` |

### Optional
| Variable | Description | Default |
|----------|-------------|---------|
| `SENTRY_DSN` | Sentry error tracking | None |
| `REDIS_URL` | Redis for caching | None (uses memory) |
| `USE_CELERY` | Enable background tasks | `False` |

---

## Troubleshooting

### Backend Issues

**500 errors on Render:**
```bash
# Check logs
render logs --service devsync-api

# Common fix: Ensure DATABASE_URL is set
```

**Static files not loading:**
```bash
python manage.py collectstatic --noinput
```

### Frontend Issues

**API connection errors:**
- Check `NEXT_PUBLIC_API_URL` is correct
- Ensure CORS allows your frontend domain
- Check browser console for specific errors

**Build failures:**
```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

### Database Issues

**Migration errors:**
```bash
# Reset migrations (caution: data loss)
python manage.py migrate --fake-initial
```

---

## Scaling Guide

### When to Scale

| Metric | Action |
|--------|--------|
| Response time > 500ms | Add more workers |
| Memory > 80% | Upgrade instance |
| DB connections maxed | Add connection pooling |

### Horizontal Scaling

```yaml
# docker-compose.override.yml
services:
  backend:
    deploy:
      replicas: 3
```

---

## Support

- 📖 [Documentation](./README.md)
- 🐛 [Report Issues](https://github.com/yourusername/devsync/issues)
- 💬 [Discussions](https://github.com/yourusername/devsync/discussions)
