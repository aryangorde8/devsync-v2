# DevSync - Developer Portfolio Dashboard

<p align="center">
  <img src="https://img.shields.io/badge/Django-5.1-green?logo=django" alt="Django">
  <img src="https://img.shields.io/badge/Next.js-15-black?logo=next.js" alt="Next.js">
  <img src="https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/Ollama-AI-purple?logo=ollama" alt="Ollama AI">
  <img src="https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker" alt="Docker">
  <img src="https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/License-MIT-yellow" alt="License">
</p>

A **production-grade, full-featured** portfolio management platform built with Django REST Framework and Next.js 15. Features a **custom AI assistant** powered by local LLM (Ollama) with RAG - no API keys needed! This project demonstrates enterprise-level architecture, comprehensive CRUD operations, real-time analytics, PDF generation, and modern DevOps practices.

## ✨ Key Features

### 🤖 AI Assistant (Custom Built)
- **Local LLM** - Powered by Ollama (llama3.2) - 100% free, no API keys
- **RAG System** - ChromaDB + sentence-transformers for accurate context
- **Smart Responses** - Instant answers for common questions (<50ms)
- **Privacy-Focused** - All data stays local, no external API calls
- **LoRA Fine-tuning** - Google Colab notebook included for customization

### 🎯 Portfolio Management
- **Projects** - Showcase your work with images, tech stack, live demos, and GitHub links
- **Skills** - Organize skills by category with proficiency levels (1-5 stars)
- **Experience** - Work history with company info, roles, and achievements
- **Education** - Academic background with degrees, institutions, and grades
- **Certifications** - Professional certifications with verification links
- **Social Links** - Connect all your professional profiles

### 📊 Analytics Dashboard
- **Real-time statistics** - Track portfolio views, engagement metrics
- **Visual charts** - Interactive analytics with Chart.js
- **Activity timeline** - Recent updates and portfolio activity
- **Profile completeness** - Track your portfolio completion score

### 📄 PDF Resume Generator
- **Professional PDF export** - Generate ATS-friendly resumes
- **Multiple sections** - Experience, education, skills, projects, certifications
- **Custom styling** - Professional formatting with ReportLab
- **One-click download** - Instant PDF generation

### 🌐 Public Portfolio
- **Shareable portfolio** - Public URL for your portfolio
- **Theme customization** - 8 beautiful color themes
- **Responsive design** - Mobile-first, works on all devices
- **SEO optimized** - Meta tags, OpenGraph support

### 🔔 Modern UX
- **Toast notifications** - Real-time feedback for all actions
- **Skeleton loaders** - Smooth loading states
- **Form validation** - Client and server-side validation
- **Dark mode ready** - Built-in dark theme support

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Backend** | Python 3.12, Django 5.1, Django REST Framework 3.16 |
| **Database** | PostgreSQL 16 (Docker) / SQLite (local) |
| **Caching** | Redis 7, Django Cache Framework |
| **Authentication** | JWT (SimpleJWT) + Cookie-based |
| **AI/ML** | Ollama (llama3.2), ChromaDB, sentence-transformers |
| **RAG** | Retrieval Augmented Generation with vector search |
| **PDF Generation** | ReportLab, WeasyPrint |
| **API Docs** | OpenAPI 3.0 (Swagger/ReDoc) |
| **Containerization** | Docker, Docker Compose |
| **Reverse Proxy** | Nginx |
| **CI/CD** | Jenkins (primary), GitHub Actions (legacy) |
| **Frontend** | Next.js 15, React 19, TypeScript 5.7 |
| **Styling** | Tailwind CSS 4.0 |
| **Charts** | Chart.js / Recharts |
| **Testing** | Pytest (Backend), Jest (Frontend) |

## 🏗️ Architecture

```
devsync-v2/
├── backend/                 # Django REST API
│   ├── accounts/           # Custom User Model + JWT Auth
│   │   ├── models.py       # CustomUser with email auth
│   │   ├── serializers.py  # User/Profile serializers
│   │   ├── views.py        # Auth endpoints
│   │   └── urls.py         # Auth routes
│   ├── portfolio/          # Portfolio Management
│   │   ├── models.py       # Project, Skill, Experience, etc.
│   │   ├── serializers.py  # CRUD serializers
│   │   ├── views.py        # REST API ViewSets
│   │   ├── pdf_generator.py # PDF Resume generation
│   │   └── urls.py         # Portfolio routes
│   ├── ai/                 # AI Assistant (Custom Built)
│   │   ├── models.py       # Conversation, Message models
│   │   ├── services.py     # Ollama integration, caching
│   │   ├── views.py        # Smart Response Engine + RAG
│   │   ├── rag.py          # ChromaDB vector search
│   │   └── training_data/  # LoRA fine-tuning data
│   ├── core/               # Health checks & utilities
│   ├── config/             # Django settings (12-factor app)
│   ├── tests/              # Pytest test suite (30+ tests)
│   └── Dockerfile          # Multi-stage production build
├── frontend/               # Next.js 15 App Router
│   ├── src/
│   │   ├── app/           # App Router pages
│   │   │   ├── dashboard/ # Protected dashboard pages
│   │   │   │   ├── projects/
│   │   │   │   ├── skills/
│   │   │   │   ├── experience/
│   │   │   │   ├── education/
│   │   │   │   ├── certifications/
│   │   │   │   ├── ai-assistant/  # AI Chat Interface
│   │   │   │   ├── resume/
│   │   │   │   ├── analytics/
│   │   │   │   ├── messages/
│   │   │   │   └── settings/
│   │   │   ├── portfolio/[username]/ # Public portfolio
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── components/    # Reusable components
│   │   │   ├── Toast.tsx  # Notification system
│   │   │   └── Skeleton.tsx # Loading states
│   │   ├── context/       # React Context providers
│   │   │   └── AuthContext.tsx
│   │   └── lib/           # Utilities & API client
│   │       ├── api.ts     # Axios instance
│   │       ├── ai.ts      # AI client library
│   │       └── auth.ts    # Auth utilities
│   └── Dockerfile
├── nginx/                  # Reverse proxy configuration
├── scripts/                # DevOps automation scripts
├── Jenkinsfile             # Jenkins CI/CD pipeline
├── .github/workflows/      # Legacy GitHub Actions pipeline
├── docker-compose.yml      # Container orchestration
├── render.yaml             # Infrastructure as Code (Render)
└── Makefile               # Common commands
```

## � Screenshots

<details>
<summary>Click to view screenshots</summary>

### Dashboard
![Dashboard](docs/screenshots/dashboard.png)

### Projects Page
![Projects](docs/screenshots/projects.png)

### Resume Builder
![Resume Builder](docs/screenshots/resume.png)

### Public Portfolio
![Public Portfolio](docs/screenshots/public-portfolio.png)

### Analytics
![Analytics](docs/screenshots/analytics.png)

</details>

## 🐳 Docker Quick Start

```bash
# Clone the repository
git clone https://github.com/yourusername/devsync-v2.git
cd devsync-v2

# Start all services with Docker Compose
cp .env.docker .env
docker compose up -d

# Run database migrations
docker compose exec backend python manage.py migrate

# Create admin user
docker compose exec backend python manage.py createsuperuser

# View logs
docker compose logs -f backend
```

## 🧩 Jenkins CI/CD (Primary)

This repository includes a root-level `Jenkinsfile` with stages for:

- Backend lint (Black, isort, Flake8)
- Frontend lint + TypeScript checks
- Security scan (Safety + Trivy when available)
- Backend tests (with PostgreSQL + Redis containers)
- Frontend tests + production build
- Docker build and push to GHCR
- Optional Kubernetes deployment for `main`

### Required Jenkins Credentials

- `ghcr-credentials` (Username + PAT/token with package push permissions)
- `kubeconfig-devsync` (Secret file, required only if deployment is enabled)

### Pipeline Parameters

- `ENABLE_DOCKER_PUSH` (default: `false`) – set to `true` only when you want to push images to GHCR
- `ENABLE_DEPLOY` (default: `false`) – set to `true` only for Kubernetes deployment on `main`

### Optional Deployment Gate

Deployment stage runs only when:

- Branch is `main`
- `ENABLE_DOCKER_PUSH=true` and `ENABLE_DEPLOY=true` are selected in Jenkins build parameters

### Access Points
| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:3000 | Next.js Dashboard |
| **API** | http://localhost:8000/api/v1/ | REST API |
| **Swagger Docs** | http://localhost:8000/api/docs/ | Interactive API Docs |
| **ReDoc** | http://localhost:8000/api/redoc/ | API Documentation |
| **Admin Panel** | http://localhost:8000/admin/ | Django Admin |

## 🚀 Local Development (No Docker)

### Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Start server
python manage.py runserver
```

### AI Assistant Setup (Optional)
```bash
# 1. Install Ollama (https://ollama.ai)
curl -fsSL https://ollama.ai/install.sh | sh

# 2. Pull the model
ollama pull llama3.2:1b

# 3. Start Ollama server
ollama serve

# 4. Install RAG dependencies (optional, for better accuracy)
pip install chromadb sentence-transformers
```

**AI Features:**
- Works without Ollama (Smart Response Engine handles common questions)
- Ollama adds support for complex/unique questions
- RAG improves accuracy with DevSync documentation context
- Fine-tune your own model with the included Colab notebook

### Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### Using the Helper Script
```bash
# One-command setup
./scripts/run_local.sh setup

# Start server
./scripts/run_local.sh run

# Run tests
./scripts/run_local.sh test
```

## 🧪 Testing

```bash
# Run with Docker
docker compose exec backend pytest -v

# Run locally
cd backend && source venv/bin/activate && pytest -v

# With coverage report
pytest --cov=. --cov-report=html

# Run specific test file
pytest tests/test_accounts.py -v

# Run specific test
pytest tests/test_accounts.py::TestUserModel::test_create_user -v
```

**Test Coverage**: 35+ unit tests covering:
- ✅ Custom User Model (email-based auth)
- ✅ User Registration & Validation
- ✅ JWT Authentication Flow
- ✅ Profile Management
- ✅ Health Check Endpoints
- ✅ Portfolio CRUD Operations
- ✅ PDF Generation
- ✅ Analytics Endpoints
- ✅ AI Chat & Conversations
- ✅ Smart Response Engine

## 📚 API Documentation

### Authentication Endpoints
| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/v1/auth/register/` | POST | Register new user | ❌ |
| `/api/v1/auth/login/` | POST | Get JWT tokens | ❌ |
| `/api/v1/auth/token/refresh/` | POST | Refresh access token | ❌ |
| `/api/v1/auth/token/verify/` | POST | Verify token validity | ❌ |
| `/api/v1/auth/logout/` | POST | Logout user | ✅ |
| `/api/v1/auth/profile/` | GET/PATCH | User profile | ✅ |
| `/api/v1/auth/change-password/` | POST | Change password | ✅ |

### Portfolio Endpoints
| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/v1/portfolio/projects/` | GET/POST | List/Create projects | ✅ |
| `/api/v1/portfolio/projects/{id}/` | GET/PUT/DELETE | Project detail | ✅ |
| `/api/v1/portfolio/skills/` | GET/POST | List/Create skills | ✅ |
| `/api/v1/portfolio/skills/{id}/` | GET/PUT/DELETE | Skill detail | ✅ |
| `/api/v1/portfolio/experiences/` | GET/POST | List/Create experiences | ✅ |
| `/api/v1/portfolio/experiences/{id}/` | GET/PUT/DELETE | Experience detail | ✅ |
| `/api/v1/portfolio/education/` | GET/POST | List/Create education | ✅ |
| `/api/v1/portfolio/education/{id}/` | GET/PUT/DELETE | Education detail | ✅ |
| `/api/v1/portfolio/certifications/` | GET/POST | List/Create certifications | ✅ |
| `/api/v1/portfolio/certifications/{id}/` | GET/PUT/DELETE | Certification detail | ✅ |
| `/api/v1/portfolio/social-links/` | GET/POST | List/Create social links | ✅ |
| `/api/v1/portfolio/social-links/{id}/` | GET/PUT/DELETE | Social link detail | ✅ |

### Analytics & Export Endpoints
| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/v1/portfolio/analytics/` | GET | Dashboard analytics | ✅ |
| `/api/v1/portfolio/analytics/record-view/` | POST | Record portfolio view | ❌ |
| `/api/v1/portfolio/resume/download/` | GET | Download PDF resume | ✅ |
| `/api/v1/portfolio/export/` | GET | Export all data as JSON | ✅ |

### Public Portfolio Endpoints
| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/v1/portfolio/public/{username}/` | GET | Public portfolio data | ❌ |
| `/api/v1/portfolio/settings/` | GET/PUT | Portfolio settings | ✅ |

### Messaging Endpoints
| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/v1/portfolio/messages/` | GET/POST | List/Create messages | ✅ |
| `/api/v1/portfolio/messages/{id}/` | GET/DELETE | Message detail | ✅ |
| `/api/v1/portfolio/messages/{id}/read/` | POST | Mark as read | ✅ |

### AI Assistant Endpoints
| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/v1/ai/chat/status/` | GET | Check AI service status | ✅ |
| `/api/v1/ai/chat/send/` | POST | Send message to AI | ✅ |
| `/api/v1/ai/chat/analyze/` | GET | Portfolio analysis | ✅ |
| `/api/v1/ai/chat/stream/` | POST | Stream AI response (SSE) | ✅ |
| `/api/v1/ai/conversations/` | GET/POST | List/Create conversations | ✅ |
| `/api/v1/ai/conversations/{id}/` | GET/DELETE | Conversation detail | ✅ |

### System Endpoints
| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/v1/core/health/` | GET | Health check | ❌ |

## 🐳 Docker Architecture

```yaml
Services:
  ├── backend      # Django API (Port 8000)
  ├── frontend     # Next.js App (Port 3000)
  ├── db           # PostgreSQL 16 (Port 5432)
  ├── redis        # Redis 7 (Port 6379)
  ├── celery_worker # Background tasks
  ├── celery_beat   # Scheduled tasks
  └── nginx        # Reverse proxy (Port 80/443)
```

### Docker Commands
```bash
# Start all services
docker compose up -d

# Stop all services
docker compose down

# Rebuild after code changes
docker compose up -d --build

# View logs
docker compose logs -f [service_name]

# Execute commands in container
docker compose exec backend python manage.py shell

# Database shell
docker compose exec db psql -U postgres -d devsync

# Prune unused resources
docker system prune -a
```

## 🔐 Security Features

- ✅ JWT Authentication with HTTP-only cookie storage
- ✅ Token refresh with automatic rotation
- ✅ Password validation (min 8 chars, complexity rules)
- ✅ CORS protection with whitelist
- ✅ CSRF protection
- ✅ Rate limiting (100/hr anon, 1000/hr user)
- ✅ SQL injection protection (Django ORM)
- ✅ XSS protection headers
- ✅ Content Security Policy headers
- ✅ Environment-based secrets (python-dotenv)
- ✅ Secure password hashing (PBKDF2)

## 📊 Database Models

```python
# User & Auth
CustomUser           # Email-based authentication
├── email (unique)
├── username (unique)
├── first_name
├── last_name
├── bio
├── avatar
├── location
├── website
├── github_url
├── linkedin_url
└── twitter_url

# Portfolio Models
Project              # Portfolio projects
├── title
├── description
├── image
├── technologies     # JSON array
├── live_url
├── github_url
├── featured
└── order

Skill                # Skills with proficiency
├── name
├── category         # Frontend, Backend, etc.
├── proficiency      # 1-5 scale
└── icon

Experience           # Work experience
├── company
├── position
├── description
├── location
├── start_date
├── end_date
├── is_current
└── technologies

Education            # Academic background
├── institution
├── degree
├── field_of_study
├── start_date
├── end_date
├── grade
└── description

Certification        # Professional certs
├── name
├── issuing_organization
├── issue_date
├── expiry_date
├── credential_id
└── credential_url

SocialLink           # Social profiles
├── platform
├── url
└── icon

PortfolioSettings    # Public portfolio config
├── is_public
├── show_email
├── show_phone
├── custom_domain
├── theme
└── meta_description

ContactMessage       # Portfolio messages
├── name
├── email
├── subject
├── message
├── is_read
└── created_at

PortfolioAnalytics   # View tracking
├── page_views
├── unique_visitors
├── views_by_date    # JSON
├── views_by_country # JSON
└── referrer_stats   # JSON
```

## 🌐 Deployment

### Render.com (Free Tier)
```bash
# Uses render.yaml for Infrastructure as Code
# Connect GitHub repo → Auto-deploys on push
```

### Manual Docker Deployment
```bash
# Build production image
docker build -t devsync-backend:latest --target production ./backend

# Run with production settings
docker run -d -p 8000:8000 \
  -e DJANGO_DEBUG=False \
  -e DATABASE_URL=postgresql://... \
  devsync-backend:latest
```

### Vercel Deployment (Frontend)
```bash
cd frontend
vercel --prod
```

## 📊 Environment Variables

### Backend (.env)
| Variable | Description | Default |
|----------|-------------|---------|
| `DJANGO_DEBUG` | Debug mode | `True` |
| `DJANGO_SECRET_KEY` | Secret key | Required |
| `DATABASE_URL` | PostgreSQL URL | SQLite |
| `REDIS_URL` | Redis URL | Memory cache |
| `USE_CELERY` | Enable Celery | `False` |
| `CORS_ALLOWED_ORIGINS` | CORS whitelist | localhost |
| `JWT_ACCESS_TOKEN_LIFETIME` | Access token TTL | 15 min |
| `JWT_REFRESH_TOKEN_LIFETIME` | Refresh token TTL | 7 days |

### Frontend (.env.local)
| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | http://localhost:8000 |
| `NEXT_PUBLIC_APP_URL` | Frontend URL | http://localhost:3000 |

## 🎨 Frontend Features

### Components
- **Toast Notifications** - Success, error, info, warning with auto-dismiss
- **Skeleton Loaders** - Card, list, table, profile, chart, form variants
- **Modal Dialogs** - Confirmation, forms, alerts
- **Form Components** - Input, select, textarea with validation
- **Data Tables** - Sortable, filterable, paginated

### Pages
| Page | Route | Features |
|------|-------|----------|
| Dashboard | `/dashboard` | Stats, charts, quick actions, activity |
| Projects | `/dashboard/projects` | CRUD, drag-to-reorder, featured toggle |
| Skills | `/dashboard/skills` | Category filter, proficiency stars |
| Experience | `/dashboard/experience` | Timeline view, current job toggle |
| Education | `/dashboard/education` | Card grid, date formatting |
| Certifications | `/dashboard/certifications` | Expiry tracking, verification links |
| Resume Builder | `/dashboard/resume` | Live preview, completeness score, PDF export |
| Analytics | `/dashboard/analytics` | Charts, views over time, traffic sources |
| Messages | `/dashboard/messages` | Inbox, read/unread, reply |
| Settings | `/dashboard/settings` | Profile, theme, visibility, export |
| Public Portfolio | `/portfolio/[username]` | Shareable, themed, responsive |

## 🔧 Makefile Commands

```bash
# Development
make run          # Start development server
make migrate      # Run migrations
make test         # Run tests
make lint         # Run linter
make format       # Format code

# Docker
make docker-up    # Start all containers
make docker-down  # Stop all containers
make docker-logs  # View logs
make docker-shell # Shell into backend container

# Database
make db-reset     # Reset database
make db-backup    # Backup database
make db-restore   # Restore database
```

## 📈 Performance Optimizations

- ✅ Database query optimization with `select_related` and `prefetch_related`
- ✅ Redis caching for frequently accessed data
- ✅ Pagination on all list endpoints
- ✅ Image optimization and lazy loading
- ✅ Code splitting in Next.js
- ✅ Static file compression (gzip/brotli)
- ✅ CDN-ready asset URLs

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Run tests (`pytest -v`)
4. Run linter (`ruff check .`)
5. Commit changes (`git commit -m 'Add amazing feature'`)
6. Push to branch (`git push origin feature/amazing-feature`)
7. Open Pull Request

### Code Style
- **Backend**: Black, isort, ruff
- **Frontend**: ESLint, Prettier

## 📝 License

MIT License - see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- [Django](https://www.djangoproject.com/) - The web framework for perfectionists
- [Next.js](https://nextjs.org/) - The React framework for production
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [ReportLab](https://www.reportlab.com/) - PDF generation library
- [Ollama](https://ollama.ai/) - Local LLM for AI assistant

---

<p align="center">
  <strong>Built with ❤️ by Aryan</strong>
  <br>
  <a href="https://github.com/aryangorde8/Devsync">Demo</a> •
  <a href="https://github.com/aryangorde8/Devsync#readme">Documentation</a> •
  <a href="https://github.com/aryangorde8/Devsync/issues/new">Report Bug</a>
</p>
