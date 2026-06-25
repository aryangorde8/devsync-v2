# DevSync v2 — Terraform single-instance deploy

Provisions one EC2 instance that runs the whole Python stack (Postgres + Redis +
Django + Celery + Caddy) via Docker Compose, with automatic HTTPS for your
domain. The instance **self-deploys on boot** and then **auto-updates** from
`main` every couple of minutes (a systemd pull timer) — so pushing to `main`
ships to production with no inbound SSH and no CI runner touching the box.

## Deploy

```bash
cd terraform-ec2-single
cp terraform.tfvars.example terraform.tfvars   # set my_ip_cidr, region, domain
export AWS_ACCESS_KEY_ID=...                    # use short-lived creds; never commit them
export AWS_SECRET_ACCESS_KEY=...
terraform init
terraform apply
```

Then point your domain's **A record** at the `public_ip` output. Within ~10–15
minutes Caddy obtains a Let's Encrypt cert and `https://<domain>` serves the
Django UI. Watch progress with the `watch_bootstrap` output command.

## How updates ship

`/usr/local/bin/devsync-redeploy.sh` (installed by the bootstrap) runs on a
`devsync-redeploy.timer`: it fetches `origin/main`, and if the commit changed it
rebuilds the backend image and `docker compose up -d`, then migrates + collects
static. Push to `main` → live in a few minutes.

## Notes

- `terraform.tfvars`, `*.tfstate`, and the generated `devsync-key.pem` are
  git-ignored — keep them safe; the state and key grant control of the box.
- For team use / CI applies, move state to a remote backend (S3 + DynamoDB lock)
  instead of local state.
- The CI pipeline runs `terraform fmt -check` + `validate` on every push so the
  config can't drift into an invalid state.
- Replaces the old Next.js deploy: no frontend image is built; Caddy (not Nginx)
  terminates TLS and proxies everything to Django.
