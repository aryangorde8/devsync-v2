# INFRA.md — Docker, k8s, Terraform, CI

> Read before touching anything that deploys or runs the stack. Infra mistakes are
> expensive and slow to catch — move carefully and prove changes locally first.

---

## Local orchestration — Docker Compose

`docker-compose.yml` runs the whole stack. Services:

| Service         | Port      | Role                          |
|-----------------|-----------|-------------------------------|
| `backend`       | 8000      | Django API                    |
| `frontend`      | 3000      | Next.js app                   |
| `db`            | 5432      | PostgreSQL 16                 |
| `redis`         | 6379      | cache + Celery broker         |
| `celery_worker` | —         | background tasks              |
| `celery_beat`   | —         | scheduled tasks               |
| `nginx`         | 80 / 443  | reverse proxy (`nginx/nginx.conf`) |

Commands in [../../COMMANDS.md](../../COMMANDS.md). Env: `cp .env.docker .env` then fill values.

## CI/CD — Jenkins (primary)

`Jenkinsfile` is the source of truth. Stages: backend lint (black/isort/flake8) →
frontend lint + TS check → security scan (Safety + Trivy) → backend tests (with
Postgres + Redis containers) → frontend tests + production build → Docker build &
push to GHCR → optional k8s deploy on `main`.

- Deploy is **gated**: only on `main` with `ENABLE_DOCKER_PUSH=true` **and**
  `ENABLE_DEPLOY=true`. Defaults are `false` — keep them safe.
- Credentials: `ghcr-credentials`, `kubeconfig-devsync`.
- `.github/workflows/` is **legacy** — Jenkins is primary. Don't add new logic to
  Actions without a reason.
- **CI mirrors the local gate** ([TESTING.md](TESTING.md)). Green locally ⇒ green CI.

## Kubernetes — `k8s/`

Kustomize-based. Manifests: namespace, configmap, secrets, backend/frontend
deployment+service, postgres, redis, ingress, hpa, network-policy. Apply with
`kubectl apply -k k8s/`. **Never commit real secret values** — `secrets.yaml` holds
placeholders.

## Terraform

- `terraform/` — full AWS stack (VPC, EKS, RDS, ElastiCache, S3).
- `terraform-ec2/` — cheaper single-EC2 option (see its `COST_GUIDE.md`, `manage.sh`,
  `user_data/` bootstrap scripts for Jenkins/SonarQube/app).
- `terraform.tfvars` is **gitignored** — only `*.tfvars.example` is tracked.
- Run `terraform plan` and read it before every `apply`. Treat state as production truth.

## Managed-platform deploys

- `render.yaml` — Render.com IaC (the frontend's API client defaults to a Render URL).
- `frontend/vercel.json` / root `vercel.json` — Vercel (frontend).

## Hard rules

- ❌ Never commit populated `.env*`, `*.tfvars`, kubeconfigs, or real `k8s` secrets.
- ❌ Don't flip deploy gates to `true` as a "default".
- ✅ Change infra in small steps; validate (`docker compose config`, `terraform plan`,
  `kubectl --dry-run`) before applying.
