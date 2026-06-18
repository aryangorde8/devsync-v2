# COMMANDS.md — the exact commands to run

> The single source of truth for *how to run things*. When a task says "run the
> tests" or "build it", use the command from here — don't guess. If a command
> here is wrong, fix it here in the same change.

All commands assume repo root `/…/devsync` unless a `cd` is shown.

---

## Backend (Django · `backend/`)

| Goal              | Command                                                                 |
|-------------------|-------------------------------------------------------------------------|
| One-time setup    | `cd backend && python3 -m venv venv && . venv/bin/activate && pip install -r requirements.txt` |
| Run dev server    | `make run`  (→ `python manage.py runserver`, port 8000)                 |
| Migrations        | `make migrate`  (= `makemigrations` + `migrate`)                        |
| Run tests         | `make test`  (= `pytest -v --tb=short`)                                 |
| Tests + coverage  | `make test-cov`  (= `pytest --cov=. --cov-report=html --cov-report=term`) |
| One test file     | `cd backend && . venv/bin/activate && pytest tests/test_portfolio.py -v` |
| One test          | `pytest tests/test_accounts.py::TestUserModel::test_create_user -v`      |
| Lint              | `make lint`  (= `flake8 . && black --check .`)                          |
| Format            | `make format`  (= `black . && isort .`)                                 |
| Django shell      | `make shell`                                                            |
| Create admin      | `make superuser`                                                        |

**Backend gate (must pass before commit):** `make lint && make test`

---

## Frontend (Next.js · `frontend/`)

| Goal              | Command                                            |
|-------------------|----------------------------------------------------|
| Install deps      | `cd frontend && npm install`                       |
| Run dev server    | `cd frontend && npm run dev`  (Turbopack, port 3000) |
| Type-check        | `cd frontend && npm run type-check`  (`tsc --noEmit`) |
| Lint              | `cd frontend && npm run lint`  (`eslint .`)        |
| Unit tests        | `cd frontend && npm test`  (`jest`)                |
| Tests (watch)     | `cd frontend && npm run test:watch`                |
| Tests + coverage  | `cd frontend && npm run test:coverage`             |
| Production build  | `cd frontend && npm run build`                     |

**Frontend gate (must pass before commit):**
`cd frontend && npm run lint && npm run type-check && npm test && npm run build`

---

## Docker (full stack)

| Goal                  | Command                                              |
|-----------------------|------------------------------------------------------|
| Start all services    | `docker compose up -d`  (or `make docker-up`)        |
| Rebuild after changes | `docker compose up -d --build`                       |
| Stop all              | `docker compose down`  (or `make docker-down`)       |
| Logs                  | `docker compose logs -f backend`                     |
| Migrate in container  | `docker compose exec backend python manage.py migrate` |
| Backend shell         | `make docker-shell`                                  |
| DB shell              | `docker compose exec db psql -U postgres -d devsync` |

Services: `backend:8000` · `frontend:3000` · `db:5432` · `redis:6379` · `nginx:80/443` · `celery_worker` · `celery_beat`.

---

## AI assistant (optional, local)

```bash
curl -fsSL https://ollama.ai/install.sh | sh   # install Ollama
ollama pull llama3.2:1b                         # pull model
ollama serve                                    # run server
pip install chromadb sentence-transformers      # RAG (optional, better accuracy)
```
The Smart Response Engine answers common questions with **no** model running; Ollama only handles novel questions. See [backend/ai/CLAUDE.md](backend/ai/CLAUDE.md).

---

## Infra / CI

| Goal              | Where                                                |
|-------------------|------------------------------------------------------|
| CI pipeline       | `Jenkinsfile` (primary), `.github/workflows/` (legacy) |
| Kubernetes        | `k8s/` (`kubectl apply -k k8s/`)                     |
| Terraform (EKS)   | `terraform/`  ·  Terraform (EC2): `terraform-ec2/`   |
| Reverse proxy     | `nginx/nginx.conf`                                   |

See [docs/claude/INFRA.md](docs/claude/INFRA.md) before touching any of these.

---

## Environment files

`.env.example` is the template. Copy it (`cp .env.docker .env` for Docker) and fill
real values **locally** — never commit a populated `.env`. Backend reads env via
`python-dotenv`; frontend uses `NEXT_PUBLIC_*` vars.
