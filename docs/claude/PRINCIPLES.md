# PRINCIPLES.md — design & code-quality rules

> Higher code quality is non-negotiable. These are the rules every change is
> judged against. When you "compare N versions" (see [WORKFLOW.md](WORKFLOW.md)),
> these are the comparison criteria.

---

## The end user is the north star

DevSync exists for **a developer presenting their work to a recruiter**. Every
trade-off resolves in favor of *that person's* trust, speed, and clarity:
- Their data must never be lost, leaked, or shown to the wrong audience.
- Pages must feel instant; a slow portfolio reads as a careless developer.
- Errors must be legible and recoverable, never a blank screen.
If a "clean" abstraction makes the user's experience worse, it's not clean.

## SOLID (applied to this codebase)

- **S — Single Responsibility.** A Django view handles HTTP; business logic lives
  in a service/model method; serialization lives in serializers. A React component
  renders; data-fetching lives in `lib/` or a hook. One reason to change per unit.
- **O — Open/Closed.** Extend via new serializers, new viewset actions, new
  components — not by bolting `if special_case` branches into existing hot paths.
- **L — Liskov.** A subclass/override must honor the base contract. A custom
  permission or serializer must behave everywhere the base is expected.
- **I — Interface Segregation.** Keep serializers and API shapes narrow. The
  public portfolio endpoint exposes only public fields — never the full model.
- **D — Dependency Inversion.** Depend on abstractions. The AI layer talks to a
  provider interface (Ollama / Gemini / smart-response), not a hard-wired client,
  so providers swap without touching callers.

## Concrete quality bar

**Naming & structure** (so an error's location is obvious without spelunking):
- Names say what a thing *is/does*: `record_portfolio_view`, not `handle`.
- One concept per file; file name matches the concept. Mirror the layout in tests
  (`portfolio/views.py` ↔ `tests/test_portfolio.py`). A stack-trace path should
  point you straight at the responsible file.

**Functions & flow:**
- Small, single-purpose functions; early-return over deep nesting.
- No dead code, no commented-out blocks, no `console.log`/`print` debugging left in.
- Handle the unhappy path explicitly: empty states, nulls, auth failures, network errors.

**Backend specifics:**
- Validate at the serializer boundary; never trust client input.
- Avoid N+1: use `select_related`/`prefetch_related`; paginate every list endpoint.
- Keep migrations generated and reviewed; never edit them by hand.
- Respect the security posture in the README (JWT, CORS whitelist, rate limits, ORM).

**Frontend specifics:**
- Type everything; no `any`. `tsc --noEmit` must pass.
- Style only through the design tokens in `globals.css` — no hard-coded hex/spacing.
  See [frontend/CLAUDE.md](../../frontend/CLAUDE.md).
- Components are accessible (semantic HTML, labels, focus states, keyboard paths)
  and responsive (mobile-first). Respect `prefers-reduced-motion` (`useReducedMotion`).

**Performance & cost:**
- Don't fetch what you won't render. Cache the expensive and stable (Redis on the
  backend, memoization/React Compiler on the front).

## DRY, but readability first

Remove genuine duplication, but don't over-abstract. A premature "shared" helper
that couples unrelated callers is worse than two clear copies. Prefer the version
a new contributor understands in one read.

## Comments

Explain **why**, not **what**. Match the comment density of the surrounding file.
Code that needs a paragraph to explain *what* it does usually needs rewriting, not
a comment.
