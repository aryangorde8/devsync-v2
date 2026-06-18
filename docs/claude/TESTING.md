# TESTING.md — the self-healing gate

> The agent fixes its own errors. You don't ask the user "does this work?" — you
> *prove* it works with tests and a clean build, then commit. A red tree never
> reaches the user.

---

## The loop (run for every change, in this order)

```
1. WRITE / EXTEND TESTS   for the new or changed behavior
2. RUN TESTS              and read failures carefully
3. FIX                    the code (or the test if the test was wrong) — yourself
4. BUILD / TYPE-CHECK     the code must compile
5. LINT                   style must pass
6. COMMIT                 only now, and only if 2–5 are all green
```

If step 2 stays red after a few honest attempts, **stop and report** what you tried
and the exact failure — don't paper over it or delete the failing assertion.

## Backend gate (`backend/`, pytest)

```bash
make test           # pytest -v --tb=short   (full suite must pass)
make lint           # flake8 . && black --check .
make test-cov       # check coverage didn't drop on touched files
```
- Tests live in `backend/tests/` mirroring the app: `test_accounts.py`,
  `test_portfolio.py`, `test_core.py`, plus app-local `tests.py` (e.g. `ai/tests.py`).
- New endpoint/model/branch ⇒ new test. Cover the **unhappy path** too: unauthorized
  access, validation failure, empty data, 404s.
- "Compiles" for Django = imports resolve, `python manage.py makemigrations --check`
  reports no missing migrations, and the test DB builds.

## Frontend gate (`frontend/`, jest + Testing Library)

```bash
npm run lint          # eslint .
npm run type-check    # tsc --noEmit   (this is your "compile")
npm test              # jest
npm run build         # next build      (must succeed)
```
- Tests live in `frontend/src/__tests__/` (`components/`, `hooks/`, `lib/`).
- Test behavior the user sees (render, click, error/empty/loading states), not
  implementation details. Query by role/label, not by test-id where avoidable.

## What "good test" means here

- **Deterministic:** no real network, no real time, no random without a seed. Mock
  the API client (`frontend/src/lib/api.ts`) and external services (Ollama/Gemini).
- **Behavioral:** asserts the contract a caller depends on, so a refactor that keeps
  behavior keeps the test green.
- **Minimal but real:** one clear assertion of intent beats ten brittle snapshots.

## Definition of Done (repeat from [CLAUDE.md](../../CLAUDE.md))

For **every** area touched: tests exist and pass → build/type-check passes →
linters pass → then commit. Skipping any step means the change is not done.

## CI mirrors this gate

`Jenkinsfile` runs the same stages (lint → security scan → backend tests →
frontend tests + build → image build). If it's green locally by this gate, CI
should be green too. See [INFRA.md](INFRA.md).
