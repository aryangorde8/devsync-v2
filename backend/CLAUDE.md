# backend/CLAUDE.md — Django API context

> Loads automatically when you work in `backend/`. Read [../CLAUDE.md](../CLAUDE.md),
> [../docs/claude/PRINCIPLES.md](../docs/claude/PRINCIPLES.md) and
> [../docs/claude/TESTING.md](../docs/claude/TESTING.md) first.

---

## Stack & shape

Django 5.1 + Django REST Framework 3.16, Python 3.12. API docs via
**drf-spectacular** (`/api/schema/`, `/api/docs/`, `/api/redoc/`). Auth is JWT
(SimpleJWT) + HTTP-only cookies. DB: PostgreSQL (Docker) / SQLite (local). Redis
for cache + Celery. Settings are 12-factor in `config/settings.py` (env via
`python-dotenv`).

## App map (each app = one responsibility)

| App           | Responsibility                                                        |
|---------------|-----------------------------------------------------------------------|
| `accounts/`   | `CustomUser` (email login), registration, JWT auth, profile.          |
| `portfolio/`  | All portfolio domain models + CRUD + analytics + PDF résumé.          |
| `ai/`         | AI assistant — see [ai/CLAUDE.md](ai/CLAUDE.md).                       |
| `core/`       | Health checks (`/health/`) and shared utilities.                      |
| `config/`     | Project settings, root `urls.py`, ASGI/WSGI, Celery.                  |
| `tests/`      | Pytest suite, mirrors apps (`test_accounts.py`, `test_portfolio.py`…).|

## URL contract

Root routing in `config/urls.py`; everything user-facing is under **`/api/v1/`**:
`auth/` (accounts), `core/`, `portfolio/`, `ai/`. Health at `/health/`. Keep this
contract stable — a change here ripples to `frontend/src/lib/`. Version it; don't
break it silently.

## Per-file convention (so errors are locatable)

Within each app: `models.py` (data + domain methods) · `serializers.py` (validation
+ shape) · `views.py` (HTTP/viewsets only) · `urls.py` (routes) · `admin.py`.
`portfolio/` also has `pdf_generator.py` (ReportLab résumé) and
`management/commands/` for one-off scripts. **Business logic belongs on the model
or a service method, not in the view.**

`portfolio/models.py` holds: `Skill`, `Project`, `Experience`, `Education`,
`Certification`, `SocialLink`, `ContactMessage`, `PortfolioTheme`, `ProfileView`,
`ProjectView`, `ActivityLog`, `GitHubImport`, `SavedDraft`.

## Rules specific to the backend

- **Serializer is the trust boundary** — validate there; never trust client input.
- **No N+1** — use `select_related`/`prefetch_related`; every list endpoint paginates.
- **Public vs private shape** — public-portfolio responses expose only public fields;
  never serialize the whole model to an anonymous request.
- **Migrations are generated** (`make migrate`), reviewed, and committed. Never hand-edit.
  Run `python manage.py makemigrations --check` before committing model changes.
- **Throttling/security** is configured (rate limits, CORS whitelist, CSRF). Don't loosen it.
- **Secrets** come from env only. `.env.example` is the tracked template.

## The gate (before commit)

```bash
make lint        # flake8 . && black --check .
make test        # pytest -v --tb=short
```
Add/extend a test in `tests/` (or the app's `tests.py`) for every new endpoint,
model field, or branch — including the unauthorized / invalid / empty cases.
Full process: [../docs/claude/TESTING.md](../docs/claude/TESTING.md).
