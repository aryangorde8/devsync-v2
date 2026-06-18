# ROADMAP.md — key context & direction

> Persistent "where we are and where we're going" context that the code alone
> doesn't tell you. **Keep this current** — update it in the same change that
> shifts direction. It's a living file, not a contract.

---

## Where we are (current state)

DevSync is feature-complete for a v1 portfolio platform. Shipped and working:

- **Auth** — email-based `CustomUser`, JWT + HTTP-only cookies (`backend/accounts/`).
- **Portfolio CRUD** — projects, skills, experience, education, certifications,
  social links, settings, contact messages (`backend/portfolio/`).
- **Public portfolio** — shareable `/portfolio/[username]`, themeable.
- **Résumé PDF** — `backend/portfolio/pdf_generator.py` (ReportLab).
- **Analytics** — view tracking + dashboard charts.
- **AI assistant** — local Ollama LLM + RAG + smart-response engine (`backend/ai/`).
- **Frontend** — Next.js 16 dashboard with 12+ pages, 3D/animation polish, dark/light.
- **Infra** — Docker Compose, k8s manifests, Terraform (EKS + EC2), Jenkins CI, Nginx.

Dashboard pages present in `frontend/src/app/dashboard/`: projects, experience,
education, certifications, ai-assistant, resume, analytics, messages, activity,
import, share, settings.

## Operating focus (this initiative)

This branch installs the **AI operating system** for the repo: the `CLAUDE.md`
control file, the per-area context files, the process docs, and the testing gate.
The point is to make future AI-assisted work *fast, safe, and consistent* —
**fixing process and context before writing more product code**.

## Natural next steps (candidates, not commitments)

Pick from these based on user value to *the developer showing a recruiter*:

1. **Frontend redesign** — elevate the look to "wow on first load" using the brief
   in [docs/prompts/FRONTEND_REDESIGN.md](../prompts/FRONTEND_REDESIGN.md).
2. **Data export/import hardening** — round-trip a full portfolio as JSON safely.
3. **Public-portfolio SEO & share cards** — OpenGraph images per portfolio.
4. **AI quality** — better RAG grounding on the user's own portfolio content.
5. **Analytics depth** — referrers, geography, time-series with real aggregation.

## How to use this file

When you start a feature, read this for context and confirm it still matches
reality. When you finish, move the item from "next steps" to "current state" and
note anything future-you needs to know. Don't let it drift.
