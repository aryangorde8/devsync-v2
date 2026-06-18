# CLAUDE.md — DevSync Control File

> This is the **global control file** for AI agents working in this repo.
> It is intentionally short. It holds project-wide parameters and a routing
> map that points you to the *one* focused file you need for the task at hand.
> **Do not put feature detail here.** Detail lives in the per-area files below.

---

## 1. Routing map — read the right file, not everything

> Principle: don't load a 400-page brain dump. Load the **one** file that matches
> the task, plus this control file. Each file is small and self-contained.

| If you are working on…                  | Read this file first                          |
|-----------------------------------------|-----------------------------------------------|
| Anything (always)                       | this file (`CLAUDE.md`)                        |
| How we work / process / iteration       | [docs/claude/WORKFLOW.md](docs/claude/WORKFLOW.md)   |
| Design & code-quality rules (SOLID)     | [docs/claude/PRINCIPLES.md](docs/claude/PRINCIPLES.md) |
| Writing/running tests, the build gate   | [docs/claude/TESTING.md](docs/claude/TESTING.md)     |
| Any UI / visual change                  | [docs/claude/VISUAL.md](docs/claude/VISUAL.md)       |
| Where the project is headed             | [docs/claude/ROADMAP.md](docs/claude/ROADMAP.md)     |
| Exact commands to run                   | [COMMANDS.md](COMMANDS.md)                     |
| Django API / models / business logic    | [backend/CLAUDE.md](backend/CLAUDE.md)        |
| Next.js UI / components / styling        | [frontend/CLAUDE.md](frontend/CLAUDE.md)      |
| The AI assistant (LLM, RAG, prompts)    | [backend/ai/CLAUDE.md](backend/ai/CLAUDE.md)  |
| Docker / k8s / Terraform / CI           | [docs/claude/INFRA.md](docs/claude/INFRA.md)  |
| Designing a brand-new frontend look     | [docs/prompts/FRONTEND_REDESIGN.md](docs/prompts/FRONTEND_REDESIGN.md) |

> Claude Code auto-loads `CLAUDE.md` in any directory you touch, so
> `backend/CLAUDE.md` and `frontend/CLAUDE.md` load automatically when you edit
> files there. You still link to `docs/claude/*` explicitly when relevant.

---

## 2. What DevSync is (one paragraph of context)

DevSync is a **production-grade developer-portfolio platform**. A user signs up,
fills in their projects / skills / experience / education / certifications, and
gets (a) a private dashboard to manage everything, (b) a public shareable
portfolio page, (c) a PDF résumé generator, (d) analytics on portfolio views,
and (e) an **AI assistant** (local Ollama LLM + RAG, Gemini optional) that
answers questions about their portfolio. The end user is a **developer showing
their work to recruiters** — every decision optimizes for *their* credibility and
speed, not for our convenience.

## 3. Global parameters (the non-negotiable facts)

| Parameter            | Value                                                              |
|----------------------|-------------------------------------------------------------------|
| Backend              | Python 3.12, Django 5.1, Django REST Framework 3.16               |
| Frontend             | Next.js 16 (App Router, Turbopack), React 19 + React Compiler, TS 5 |
| Styling              | Tailwind CSS 4 + design tokens in `frontend/src/app/globals.css`  |
| UI / motion / 3D     | HeroUI, Framer Motion, GSAP, React Three Fiber / Three.js         |
| DB / cache           | PostgreSQL 16 (Docker) / SQLite (local); Redis 7                  |
| Auth                 | JWT (SimpleJWT) + HTTP-only cookies                               |
| AI                   | Ollama (llama3.2) local + RAG (ChromaDB); Gemini optional         |
| Tests                | `pytest` (backend), `jest` + Testing Library (frontend)           |
| Backend style        | black, isort, flake8 (line length per `.flake8`)                  |
| Frontend style       | eslint (`eslint-config-next`), `tsc --noEmit` must pass           |
| API base             | `/api/v1/` · backend `:8000` · frontend `:3000`                   |
| Default branch       | `main` · feature branches: `feature/<kebab-name>`                 |

## 4. Definition of Done (the gate — see [TESTING.md](docs/claude/TESTING.md))

A change is **not done** until, for every area you touched:

1. **Tests exist** for the new/changed behavior, and the full suite passes.
2. The code **compiles / type-checks**: backend imports + migrations clean;
   frontend `npm run build` and `npm run type-check` pass.
3. **Linters pass** (`make lint` / `npm run lint`).
4. Only **then** do you commit. Never commit red code.

## 5. Commit & branch discipline

- **Commit before you start large changes**, and in small logical chunks after —
  every commit should leave the tree green and be revertible on its own.
- Work on a `feature/<name>` branch, never directly on `main`.
- Write imperative, specific commit subjects (`Add résumé PDF page breaks`,
  not `update`). Body explains *why*, not *what*.
- **Do not add a `Co-Authored-By` trailer.** Commits are authored by the owner.

## 6. The five working principles (full detail in [WORKFLOW.md](docs/claude/WORKFLOW.md))

1. **Context before code.** Understand the problem and the end user before editing. Fix process/context first.
2. **No micro-prompts.** Give whole problems with full context; don't spoon-feed line-by-line.
3. **Segment big work into an explicit iterative plan**, then execute step by step.
4. **Compare N versions, keep the best of each.** For non-trivial work, draft 2–3 approaches and merge the strongest parts.
5. **Self-heal via tests.** Write tests, run them, fix failures yourself, then build, then commit.

## 7. Hard "do not" list

- ❌ Don't commit secrets. `.env*` real values stay local; only `.env.example` is tracked.
- ❌ Don't break the `/api/v1/` contract without updating the frontend client (`frontend/src/lib/`) and tests.
- ❌ Don't hand-edit files in `*/migrations/` — generate them.
- ❌ Don't describe a UI in prose when an image would be clearer — see [VISUAL.md](docs/claude/VISUAL.md).
- ❌ Don't expand this file with feature detail — put it in the matching area file.
