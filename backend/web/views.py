"""Server-rendered page views.

The data that drove the React landing page (glyph SVG paths, hue gradients,
feature/step copy) lives here in Python instead of TS constants. Templates stay
dumb: they loop over the context these views build.
"""

from __future__ import annotations

from django.shortcuts import render

# --- Design data, ported 1:1 from frontend/src/app/page.tsx ------------------

GLYPHS: dict[str, str] = {
    "projects": "M5 3l14 9-14 9V3z",
    "portfolio": (
        "M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
    ),
    "resume": (
        "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h6l6 6v10a2 2 0 01-2 2zM13 3v6h6"
    ),
    "analytics": "M9 19v-6m4 6V5m4 14v-9M5 21h14",
    "github": (
        "M9 19c-5 1.5-5-2.5-7-3m14 6v-3.9a3.4 3.4 0 00-.9-2.6c3-.3 6.1-1.5 6.1-6.6"
        "A5.1 5.1 0 0019.9 5 4.8 4.8 0 0019.8 1.4S18.6 1 16 2.8a13.4 13.4 0 00-7 0"
        "C6.4 1 5.2 1.4 5.2 1.4A4.8 4.8 0 005.1 5 5.1 5.1 0 003.7 8.4c0 5.1 3.1 6.3 "
        "6.1 6.6a3.4 3.4 0 00-.9 2.6V22"
    ),
    "ai": (
        "M12 3l1.6 4.8L18 9l-4.4 1.2L12 15l-1.6-4.8L6 9l4.4-1.2zM19 14l.7 2.3L22 17"
        "l-2.3.7L19 20l-.7-2.3L16 17l2.3-.7z"
    ),
}

HUES: dict[str, dict[str, str]] = {
    "violet": {
        "grad": "linear-gradient(150deg, #8b5cf6, #6d28d9)",
        "glow": "rgba(124,58,237,.55)",
    },
    "pink": {
        "grad": "linear-gradient(150deg, #f472b6, #db2777)",
        "glow": "rgba(236,72,153,.5)",
    },
    "fuchsia": {
        "grad": "linear-gradient(150deg, #e879f9, #a21caf)",
        "glow": "rgba(217,70,239,.5)",
    },
    "cyan": {
        "grad": "linear-gradient(150deg, #67e8f9, #0891b2)",
        "glow": "rgba(34,211,238,.45)",
    },
    "coral": {
        "grad": "linear-gradient(150deg, #fda4af, #e11d48)",
        "glow": "rgba(251,113,133,.45)",
    },
}


def _glyph(name: str, hue: str, size: int) -> dict:
    """Build the context a glyph tile needs (mirrors the <Glyph> component)."""
    preset = HUES.get(hue, HUES["violet"])
    return {
        "path": GLYPHS.get(name, GLYPHS["projects"]),
        "grad": preset["grad"],
        "glow": preset["glow"],
        "size": size,
        "ico": round(size * 0.46),
    }


_FEATURE_DATA = [
    (
        "projects",
        "violet",
        "Projects, beautifully shown",
        "Tech tags, live demos and a Featured spotlight on everything you ship.",
    ),
    (
        "portfolio",
        "fuchsia",
        "A portfolio worth sharing",
        "A fast, themeable public page — your work, your colors.",
    ),
    (
        "resume",
        "pink",
        "ATS-friendly résumé",
        "Generate a clean, parseable PDF from your profile in one click.",
    ),
    (
        "analytics",
        "cyan",
        "Know who is looking",
        "Views, sources and trends — turn quiet interest into conversations.",
    ),
    (
        "github",
        "coral",
        "Import from GitHub",
        "Pull repos, languages and stars straight into your projects.",
    ),
    (
        "ai",
        "violet",
        "An AI co-pilot",
        "Sharpen your bio, draft bullet points and find skill gaps in seconds.",
    ),
]

_STEP_DATA = [
    (
        "projects",
        "violet",
        "Add your work",
        "Import from GitHub or add projects, skills and experience.",
    ),
    (
        "portfolio",
        "fuchsia",
        "Publish your page",
        "Pick a theme and ship a fast public portfolio in a click.",
    ),
    (
        "analytics",
        "cyan",
        "Get noticed",
        "Share it, track who looks, and turn views into offers.",
    ),
]


def landing(request):
    """Public marketing landing page (port of app/page.tsx, the Flux design)."""
    features = [
        {"glyph": _glyph(g, h, 52), "title": t, "desc": d}
        for g, h, t, d in _FEATURE_DATA
    ]
    steps = [
        {"glyph": _glyph(g, h, 42), "num": f"0{i + 1}", "title": t, "desc": d}
        for i, (g, h, t, d) in enumerate(_STEP_DATA)
    ]
    context = {
        "features": features,
        "steps": steps,
        "logos": ["GitHub", "Vercel", "Linear", "Stripe", "OpenAI", "Notion"],
        "ring": ["#635bff", "#0ea5e9", "#ec4899", "#f59e0b", "#a855f7"],
        "hero_cols": ["FOR DEVELOPERS", "WHO SHIP REAL WORK", "SEEN BY RECRUITERS"],
    }
    return render(request, "web/landing.html", context)


def privacy(request):
    """Privacy policy (static)."""
    return render(request, "web/privacy.html")


def terms(request):
    """Terms of service (static)."""
    return render(request, "web/terms.html")


def offline(request):
    """PWA offline fallback page."""
    return render(request, "web/offline.html")
