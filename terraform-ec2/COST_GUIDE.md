# Cost Management — Stay Under Your $99 AWS Credits (15-day demo)

You have **$99.36** in free credits. Here's how to spend < $20 of it for a 15-day student demo.

---

## TL;DR — The Plan

1. Use **t3.small** (Jenkins + App) and **t3.medium** (SonarQube only)
2. **STOP all instances when not actively demoing** (`./manage.sh stop`)
3. **NO Elastic IP** (default in this Terraform)
4. Set **billing alert at $20**
5. **Destroy everything after 15 days** (`terraform destroy`)

Estimated total: **$5–$15** out of your $99 credits.

---

## Cost breakdown

### Compute (per hour, ap-south-1 / us-east-1)

| Instance | Type | $/hour | $/day (24h) | $/15 days |
|----------|------|--------|-------------|-----------|
| Jenkins | t3.small | $0.0224 | $0.54 | **$8.06** |
| SonarQube | t3.medium | $0.0464 | $1.11 | **$16.70** |
| App | t3.small | $0.0224 | $0.54 | **$8.06** |
| **Total 24/7** | | $0.0912 | $2.19 | **$32.82** |

### Storage (always-on, even when stopped)

| Item | Cost |
|------|------|
| 3× 20 GB gp3 EBS | ~$4.80 / month → **$2.40 for 15 days** |

### Network / misc

| Item | Cost |
|------|------|
| Public IP (free while attached & running) | $0 |
| Public IP (charged ~$0.005/h while STOPPED, since 2024) | ~$3.60/mo per IP |
| Outbound data transfer (first 100 GB free) | $0 |

⚠️ **AWS now charges for public IPs on stopped instances** (~$3.60/mo each). To eliminate this:
- Either keep instances running (cheaper than IP-only-while-stopped if running ≤4h/day)
- Or `terraform destroy` between demo sessions and `terraform apply` when needed

---

## Real-world scenarios for 15 days

### Scenario A — Run 24/7 the whole time
- Compute: $32.82
- Storage: $2.40
- IP charges (running, so free): $0
- **Total: ~$35** ✅ fits in credits

### Scenario B — Run only ~4 hours/day for demos (recommended)
- 60 hours × $0.0912 = **$5.50** compute
- Storage (stopped): $2.40
- Public IP while stopped: 3 IPs × ~$0.005/h × 300h = **$4.50**
- **Total: ~$12** ✅ saves $20

### Scenario C — Destroy + recreate per session
- 4h × 15 sessions = same compute (~$5.50)
- Storage: only ~$0.10 (since you destroy)
- IP: $0 (no stopped instances)
- **Total: ~$6** ✅ cheapest

---

## Daily workflow (Scenario B — recommended)

**Morning of demo:**
```bash
cd terraform-ec2
./manage.sh start          # boots all 3 (~30s)
./manage.sh ips            # gets new IPs (they CHANGE on restart)
```

→ Update Jenkinsfile `APP_EC2_HOST` if it changed → demo to teacher.

**After demo:**
```bash
./manage.sh stop           # stops all 3 (charges drop ~95%)
```

**End of project (after 15 days):**
```bash
terraform destroy          # deletes everything, $0 ongoing
```

---

## CRITICAL: Set billing alerts NOW

Before doing anything else:

1. AWS Console → **Billing** → **Budgets** → **Create budget**
2. Type: **Cost budget**
3. Amount: **$20** (warning), **$50** (critical)
4. Alert via email when 80% reached
5. Save

This guarantees you'll get an email before burning through your credits unexpectedly.

---

## Even cheaper alternative: single EC2 with everything

If $35 is still too much, use **ONE t3.large** running Jenkins + SonarQube + App in Docker:

| Item | Cost |
|------|------|
| 1× t3.large (8GB) for 15 days | $0.0928/h × 360h = **$33** |
| 1× 30 GB EBS | **$2.40** |
| **Total** | **~$35** |

That's the same as Scenario A but with simpler ops (1 server to manage). Trade-off: less realistic CI/CD architecture for your teacher to see.

---

## Things that will NOT cost money

- ✅ VPC, subnets, route tables (default VPC is free)
- ✅ Security groups
- ✅ Key pair generation
- ✅ Data transfer **into** AWS
- ✅ First 100 GB outbound transfer per month
- ✅ CloudWatch basic metrics

## Things that WILL cost money (watch out)

- ❌ NAT Gateway (we don't use one — good)
- ❌ Load Balancer (we don't use one — good)
- ❌ Elastic IP attached to stopped or unattached (we disabled by default)
- ❌ EBS snapshots (don't take any unless you need to)
- ❌ Instances left running 24/7

---

## Final checklist before showing your teacher

- [ ] Billing alert set at $20
- [ ] `terraform.tfvars` has `use_elastic_ip = false`
- [ ] Use `./manage.sh stop` whenever not actively demoing
- [ ] Run `./manage.sh status` daily to confirm what's running
- [ ] After demo period: `terraform destroy` — verify in AWS console that EC2 list is empty

Follow this and you'll spend **$5–$15** of your $99.
