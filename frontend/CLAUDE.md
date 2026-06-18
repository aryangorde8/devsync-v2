# frontend/CLAUDE.md — Next.js UI context

> Loads automatically when you work in `frontend/`. Read [../CLAUDE.md](../CLAUDE.md),
> [../docs/claude/PRINCIPLES.md](../docs/claude/PRINCIPLES.md),
> [../docs/claude/VISUAL.md](../docs/claude/VISUAL.md) and
> [../docs/claude/TESTING.md](../docs/claude/TESTING.md) first.

---

## Stack

Next.js 16 (App Router, Turbopack), React 19 with **React Compiler**
(`babel-plugin-react-compiler`), TypeScript 5. Styling: **Tailwind CSS 4**. UI:
**HeroUI**. Motion: **Framer Motion** + **GSAP**. 3D: **React Three Fiber** + Drei
+ Three.js. Tests: **Jest** + Testing Library. PWA-enabled (`public/manifest.json`,
`public/sw.js`).

## Directory map

```
src/
  app/                 # App Router. Routes = folders.
    dashboard/         # protected pages: projects, experience, education,
                       #   certifications, ai-assistant, resume, analytics,
                       #   messages, activity, import, share, settings
    portfolio/[username]/   # public, themeable portfolio
    login/ register/ offline/ privacy/ terms/
    layout.tsx         # providers: Auth, Notifications, ErrorBoundary, PageLoader, PWA
    globals.css        # ⭐ DESIGN TOKENS — the single styling source of truth
  components/          # shared UI (Toast, Skeleton, CommandPalette, ThemeToggle, Hero…)
    3d/  animations/  dashboard/
  context/             # AuthContext, ThemeContext
  hooks/               # useReducedMotion, …
  lib/                 # api.ts, auth.ts, ai.ts, portfolio.ts, gsap.ts  (data layer)
  __tests__/           # components/ hooks/ lib/
```

## Design system — style only through tokens

`src/app/globals.css` defines a full **design-token system** (light/dark via
`[data-theme]`): surfaces, text, borders, sidebar/header/input/dropdown, status
colors, shadows, **glassmorphism**, skeletons, scrollbars, accent **purple
`#7c3aed`** + **pink** glow, gradients. Theme is driven by `ThemeContext` +
`ThemeToggle`.

- **Never hard-code colors, spacing, or shadows.** Use the CSS variables / Tailwind
  classes that map to them. A new color means a new token, not an inline hex.
- Respect `prefers-reduced-motion` via `useReducedMotion()` before adding animation.
- Keep dark **and** light correct — test both.

## Data layer — never fetch inline

All backend calls go through `src/lib/`. `api.ts` is a fetch-based client that
handles JWT storage and **automatic token refresh** (`NEXT_PUBLIC_API_URL`, falling
back to the Render production URL). Use `lib/portfolio.ts`, `lib/ai.ts`, `lib/auth.ts`
— don't scatter `fetch()` calls inside components. Adding an endpoint? Add its typed
client function in `lib/` (no `any`).

## Component rules

- Server components by default; `'use client'` only when you need state/effects/events.
- Typed props, no `any`. Small, single-purpose components.
- Always handle **loading** (`Skeleton`), **empty**, and **error** (`ErrorBoundary`,
  `Toast`/`Notifications`) states — the user never sees a blank screen.
- Accessible: semantic elements, labels, focus-visible, keyboard paths
  (there's a `CommandPalette` + `KeyboardShortcuts` — keep parity).
- Mobile-first and responsive.

## Visual work

Lead with images, not prose — see [../docs/claude/VISUAL.md](../docs/claude/VISUAL.md).
For a ground-up new look, use [../docs/prompts/FRONTEND_REDESIGN.md](../docs/prompts/FRONTEND_REDESIGN.md).

## The gate (before commit)

```bash
npm run lint && npm run type-check && npm test && npm run build
```
Tests live in `src/__tests__/`; test what the user sees (render, interaction,
loading/empty/error), mock `lib/api.ts`. Details:
[../docs/claude/TESTING.md](../docs/claude/TESTING.md).
