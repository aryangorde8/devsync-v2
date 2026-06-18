# WORKFLOW.md — how we work with AI in DevSync

> Process beats code. **Fix the process and the context first; the code follows.**
> These are the working rules for any agent on this repo. They exist so a large,
> fuzzy goal becomes a sequence of small, verifiable wins.

---

## 0. Own the problem (don't just take orders)

Before touching code, restate the problem in your own words and name the **end
user** it serves (for DevSync that's *a developer trying to impress a recruiter*).
If the request is underspecified, infer the intent from that user's goals and
state your assumptions — then proceed. Treat the task as yours to get right, not
a literal instruction to satisfy.

## 1. Context before code

1. Read this file's matching area doc (see the routing map in [CLAUDE.md](../../CLAUDE.md)).
2. Read the real code around the change — match existing patterns, names, and style.
3. Only then plan. **A wrong mental model produces correct-looking wrong code.**

## 2. No micro-prompts — give whole problems

We don't drip-feed line-by-line instructions, and we don't write them either.
- **Bad:** "add a variable x", then "now a for loop", then "now return it".
- **Good:** "Add a paginated `/api/v1/portfolio/projects/` endpoint that returns
  the user's projects newest-first, 20 per page, with `featured` ones pinned to
  the top; here's the model and the existing serializer pattern."

Give the *goal*, the *constraints*, and the *context*. Let the model design the
solution. Micro-prompting throws away the model's ability to reason about the whole.

## 3. Decompose big work into an explicit iterative plan

For anything non-trivial, first write the plan as ordered, independently-shippable
steps, then execute one at a time, committing after each green step.

```
Goal: data export feature
  1. Backend: /export endpoint returns JSON of all user data   → test → commit
  2. Backend: include media URLs + handle empty sections        → test → commit
  3. Frontend: "Export" button + download handler               → test → commit
  4. Frontend: loading + error + success states                 → test → commit
```

Each step is small enough to verify and revert on its own. Never make a single
giant uncommitted change.

## 4. Compare N versions, then keep the best of each

For design-sensitive or hard problems, don't settle for the first idea:
1. Draft **2–3 distinct approaches** (e.g. "compute in the serializer" vs
   "compute in a service" vs "annotate in the queryset").
2. Compare them on the criteria in [PRINCIPLES.md](PRINCIPLES.md): correctness,
   readability, performance, testability, blast radius.
3. **Merge the strongest parts** into one final version. Briefly record *why* the
   chosen shape won (one or two sentences in the PR/commit body).

This is the "compare versions / take the best of each version" rule. For UI work,
generate the variants as **images** and compare visually (see [VISUAL.md](VISUAL.md)).

## 5. Self-heal with tests, then build, then commit

You are responsible for your own errors. The loop for every change:

```
write/extend tests → run tests → fix failures yourself → run build/type-check
→ run linters → ONLY THEN commit
```

Full gate and commands: [TESTING.md](TESTING.md) and [COMMANDS.md](../../COMMANDS.md).
Never hand a red tree to the user.

## 6. Parallel tracks via git worktrees

Independent features get their own **worktree** (a separate working directory on
its own branch sharing one `.git`). This lets multiple agents work without
stepping on each other, and keeps each branch's context clean.

```
devsync/                      # main worktree (main)
../devsync-export/            # git worktree → feature/data-export
../devsync-analytics/         # git worktree → feature/analytics-dashboard
```

```bash
git worktree add ../devsync-export   -b feature/data-export
git worktree add ../devsync-analytics -b feature/analytics-dashboard
git worktree list
git worktree remove ../devsync-export      # when merged
```

Run a separate agent in each worktree. Rules: **one feature per worktree**, branch
name matches the feature, delete the worktree once merged. Each worktree still
obeys this WORKFLOW and the [TESTING.md](TESTING.md) gate.

> ⚠️ Worktrees need the real `git` binary (`apt install git`). The bootstrap of
> *this* repo used a pure-Python git (dulwich) because no `git` was installed;
> dulwich does **not** support worktrees. Install `git` before using this section.

## 7. Keep the docs alive

Context rots. When you change how something works, **update the matching area file
in the same change** — a stale `CLAUDE.md` is worse than none. Adding a command?
Update [COMMANDS.md](../../COMMANDS.md). Shifting direction? Update [ROADMAP.md](ROADMAP.md).
