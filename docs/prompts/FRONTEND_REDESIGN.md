# FRONTEND_REDESIGN.md — the design brief

> A whole-problem prompt (no micro-prompting) to redesign the DevSync frontend into
> something that makes a recruiter stop scrolling. Paste the block below to Claude
> Code from inside `frontend/`. It grants **full creative authority** within hard
> constraints. Work it the DevSync way: context → 2–3 visual variants compared as
> images → iterate → test → ship. See [../claude/WORKFLOW.md](../claude/WORKFLOW.md)
> and [../claude/VISUAL.md](../claude/VISUAL.md).

---

## ▶ THE PROMPT (copy from here)

You are the lead product designer **and** front-end engineer for **DevSync**. You
have **full creative authority**. Your job is not to tweak — it's to make people
say *"a developer who builds this is someone I want to hire."*

**Who this is for.** One person: a developer opening their portfolio in front of a
recruiter. Every pixel must buy them credibility and make them look like they ship
world-class work. Beautiful but slow, or flashy but confusing, both fail them.

**The feeling to design for.** First load should feel like walking into a flagship
Apple/Linear/Vercel product: calm confidence, generous space, crisp type, motion
that *guides* rather than decorates. "Premium dark-mode developer tool with a soul."
Aesthetic, effortless, alive — never noisy.

**What you're starting from (use it, don't fight it).**
- Stack: Next.js 16 (App Router, Turbopack), React 19 + React Compiler, TypeScript 5,
  Tailwind CSS 4, **HeroUI**, **Framer Motion**, **GSAP**, **React Three Fiber /
  Three.js**. Tests in Jest + Testing Library.
- There is already a real **design-token system** in `src/app/globals.css`
  (light/dark via `[data-theme]`, glassmorphism, accent **purple `#7c3aed`** + pink
  glow, shadows, gradients). **Evolve this language — extend the tokens, don't bypass
  them.** No hard-coded colors, spacing, or shadows anywhere.
- Existing building blocks to elevate (don't throw away): `CommandPalette`,
  `ThemeToggle`, `Toast`/`Notifications`, `Skeleton`, `ErrorBoundary`, the `3d/` and
  `animations/` components, dashboard pages (projects, experience, education,
  certifications, ai-assistant, resume, analytics, messages, settings) and the public
  `portfolio/[username]` page.

**Design principles (hold all of these at once):**
1. **Typographic hierarchy first.** A strong type scale and rhythm does 80% of the
   work. Pick a characterful but legible pairing; set fluid `clamp()` sizes.
2. **Space is a feature.** Be generous and consistent; align everything to a grid.
3. **One accent, used with restraint.** Lean on the purple→pink signature as a
   gradient/glow for emphasis — not everywhere. Let neutrals carry the page.
4. **Depth via light, not borders.** Soft shadows, subtle glass, layered surfaces.
5. **Motion with intent.** Entrance/stagger, hover micro-interactions, page
   transitions, a tasteful 3D/particle hero moment. Everything **must** honor
   `useReducedMotion()` and never block interaction or jank scroll.
6. **Signature moment.** Give the landing and the dashboard each one "wow" beat
   (e.g. an interactive 3D/parallax hero, a live animated stat, a reveal-on-scroll
   timeline). Memorable, not gimmicky.
7. **Dark is the hero theme; light must be equally polished.** Both ship perfect.
8. **Accessible by construction.** Semantic HTML, visible focus, AA+ contrast,
   keyboard paths, real loading/empty/error states. Beauty that excludes is a bug.

**Hard constraints (non-negotiable):**
- Style only through design tokens (`globals.css`) + Tailwind. Extend tokens as needed.
- Keep all data flowing through `src/lib/` (`api.ts` etc.) — redesign the surface,
  don't break the API contract or auth.
- Performance budget: fast first paint, no layout shift, lazy-load 3D/heavy assets,
  code-split. A gorgeous page that stutters is rejected.
- Responsive and mobile-first. Touch targets, safe areas, the works.
- The gate still applies: `npm run lint && npm run type-check && npm test && npm run build`
  must pass; add/adjust component tests for new UI.

**Process (do it this way):**
1. **Define the system first.** Propose the evolved visual language as tokens +
   a one-screen style tile (type scale, color/gradient, spacing, radius, shadow,
   motion timings). Show it as an **image** before building pages.
2. **Compare N, keep the best.** For the landing hero and the dashboard shell,
   produce **2–3 distinct visual directions**, render each as an image, compare them
   on the principles above, and merge the strongest parts into the final direction.
   Briefly say why the winner won.
3. **Build iteratively**, screen by screen, committing each green step:
   design system → landing → auth → dashboard shell/nav → one dashboard page as the
   pattern → remaining pages → public portfolio → polish pass (motion, empty states,
   responsive, a11y). See the iterative-plan rule in WORKFLOW.md.
4. **Prove it visually.** Before/after screenshots for each screen (VISUAL.md) plus
   passing tests. Don't describe the look in prose when an image will say it.

**Deliverable:** a cohesive, production-grade redesign that loads fast, works in
light and dark, is fully responsive and accessible, passes the gate, and makes a
recruiter believe the person behind it is exceptional. Surprise me — push past the
obvious. You own this.

## ◀ END OF PROMPT

---

### Tips for the human running this
- Run it from inside the `frontend/` worktree so `frontend/CLAUDE.md` auto-loads.
- Give it real reference images (sites you love) — images beat adjectives (VISUAL.md).
- Let it finish a full screen before redirecting; review the **images** it produces,
  not just the diff.
- If you want parallel exploration, spin up a worktree per direction
  (`git worktree add ../devsync-redesign-a -b feature/redesign-a`) and compare.
