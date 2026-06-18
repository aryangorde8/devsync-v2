# VISUAL.md — communicate visual work with images, not prose

> For anything the user *looks at*, a picture carries the intent that paragraphs
> can't. **For visual problems, lead with images — not text.**

---

## When to use an image instead of words

| Situation                                   | Do this                                              |
|---------------------------------------------|------------------------------------------------------|
| "This layout is broken / looks off"         | Paste a **screenshot**; mark the problem area.       |
| "Make it look like this"                    | Paste a **reference image / mockup**, then build to it. |
| Proposing a new UI                          | Generate **2–3 visual variants** and compare them as images (the compare-N rule from [WORKFLOW.md](WORKFLOW.md)). |
| Spacing / alignment / color bug             | Screenshot with the misaligned element circled.      |
| Reviewing a finished UI change              | Before/after screenshots side by side.               |

Describing a visual bug in words ("the card is a bit too close to the edge on the
right") wastes turns. One annotated screenshot ends the ambiguity.

## How an agent should work visually here

1. **Capture the real thing.** Run the app (`npm run dev`, see [COMMANDS.md](../../COMMANDS.md))
   and screenshot the actual page/component, not an imagined one.
2. **Read the image.** Claude can see images you paste — describe *what you want
   changed about it*, not the whole DOM.
3. **Show, then change.** Propose the new look as an image/mockup first; once it's
   approved, implement it against the design tokens in
   [frontend/CLAUDE.md](../../frontend/CLAUDE.md).
4. **Prove it visually.** After the change, screenshot again. Before/after is the
   acceptance test for visual work (functional behavior still needs unit tests —
   see [TESTING.md](TESTING.md)).

## Where reference images live

- Product/marketing imagery and logos: `frontend/public/logos/`, repo-root PNGs.
- Drop design references, mockups, and bug screenshots in `docs/screenshots/`
  (referenced by the README) so they travel with the repo and stay linkable.

## Rule of thumb

> If you're about to write three sentences describing how something *looks*,
> stop and attach an image instead.
