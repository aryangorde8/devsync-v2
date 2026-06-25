"""Authenticated dashboard pages (server-rendered).

Each view pulls the signed-in user's real data straight from the models (the
same models the REST API serializes) and renders it with the Synthesis design
system. Replaces the Next.js ``app/dashboard/*`` route group.
"""

from __future__ import annotations

from django.contrib.auth.decorators import login_required
from django.shortcuts import redirect, render
from django.utils.safestring import mark_safe

from portfolio.models import (
    ActivityLog,
    Certification,
    ContactMessage,
    Education,
    Experience,
    ProfileView,
    Project,
    Skill,
)

# --- Sidebar navigation (ported from app/dashboard/layout.tsx) ---------------

NAV_ITEMS = [
    (
        "Dashboard",
        "/dashboard",
        "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
    ),  # noqa: E501
    (
        "Projects",
        "/dashboard/projects",
        "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10",
    ),  # noqa: E501
    (
        "Experience",
        "/dashboard/experience",
        "M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
    ),  # noqa: E501
    (
        "Education",
        "/dashboard/education",
        "M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222",
    ),  # noqa: E501
    (
        "Certifications",
        "/dashboard/certifications",
        "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z",
    ),  # noqa: E501
    (
        "Resume",
        "/dashboard/resume",
        "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    ),  # noqa: E501
    (
        "Messages",
        "/dashboard/messages",
        "M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z",
    ),  # noqa: E501
    (
        "Analytics",
        "/dashboard/analytics",
        "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
    ),  # noqa: E501
    ("Activity", "/dashboard/activity", "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"),
    (
        "AI Assistant",
        "/dashboard/ai-assistant",
        "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
    ),  # noqa: E501
    (
        "Settings",
        "/dashboard/settings",
        "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z",
    ),  # noqa: E501
]


def _nav(request):
    """Navigation rows with active flag + icon path marked safe for the template."""
    path = request.path
    items = []
    for name, href, icon in NAV_ITEMS:
        if href == "/dashboard":
            active = path == "/dashboard"
        else:
            active = path.startswith(href)
        items.append(
            {"name": name, "href": href, "icon": mark_safe(icon), "active": active}
        )
    return items


def _base_context(request):
    return {"nav": _nav(request), "user": request.user}


# --- Overview ----------------------------------------------------------------


@login_required
def overview(request):
    user = request.user
    projects = Project.objects.filter(user=user)
    stat_cards = [
        ("Projects", projects.count(), "#a78bfa"),
        ("Skills", Skill.objects.filter(user=user).count(), "#e879f9"),
        ("Experience", Experience.objects.filter(user=user).count(), "#f472b6"),
        ("Profile views", ProfileView.objects.filter(user=user).count(), "#67e8f9"),
    ]
    ctx = _base_context(request)
    ctx.update(
        {
            "stat_cards": stat_cards,
            "recent_projects": list(projects[:5]),
            "recent_activity": list(ActivityLog.objects.filter(user=user)[:6]),
        }
    )
    return render(request, "web/dashboard/overview.html", ctx)


# --- Projects (read + create + delete) ---------------------------------------


@login_required
def projects(request):
    user = request.user
    if request.method == "POST":
        action = request.POST.get("action")
        if action == "delete":
            Project.objects.filter(user=user, pk=request.POST.get("id")).delete()
        elif action == "create":
            title = request.POST.get("title", "").strip()
            if title:
                techs = [
                    t.strip()
                    for t in request.POST.get("technologies", "").split(",")
                    if t.strip()
                ]
                Project.objects.create(
                    user=user,
                    title=title,
                    description=request.POST.get("description", "").strip(),
                    short_description=request.POST.get("short_description", "").strip(),
                    github_url=request.POST.get("github_url", "").strip(),
                    live_url=request.POST.get("live_url", "").strip(),
                    technologies=techs,
                    is_featured=bool(request.POST.get("is_featured")),
                    status=request.POST.get("status", Project.Status.IN_PROGRESS),
                )
        return redirect("/dashboard/projects")

    ctx = _base_context(request)
    ctx["projects"] = list(Project.objects.filter(user=user))
    ctx["statuses"] = Project.Status.choices
    return render(request, "web/dashboard/projects.html", ctx)


# --- Experience --------------------------------------------------------------


@login_required
def experience(request):
    user = request.user
    if request.method == "POST":
        if request.POST.get("action") == "delete":
            Experience.objects.filter(user=user, pk=request.POST.get("id")).delete()
        elif request.POST.get("company"):
            Experience.objects.create(
                user=user,
                company=request.POST.get("company", "").strip(),
                position=request.POST.get("position", "").strip(),
                location=request.POST.get("location", "").strip(),
                description=request.POST.get("description", "").strip(),
                start_date=request.POST.get("start_date") or None,
                end_date=request.POST.get("end_date") or None,
                is_current=bool(request.POST.get("is_current")),
                type=request.POST.get("type", Experience.Type.FULL_TIME),
            )
        return redirect("/dashboard/experience")
    ctx = _base_context(request)
    ctx["experiences"] = list(Experience.objects.filter(user=user))
    ctx["types"] = Experience.Type.choices
    return render(request, "web/dashboard/experience.html", ctx)


# --- Education ---------------------------------------------------------------


@login_required
def education(request):
    user = request.user
    if request.method == "POST":
        if request.POST.get("action") == "delete":
            Education.objects.filter(user=user, pk=request.POST.get("id")).delete()
        elif request.POST.get("institution"):
            Education.objects.create(
                user=user,
                institution=request.POST.get("institution", "").strip(),
                degree=request.POST.get("degree", "").strip(),
                field_of_study=request.POST.get("field_of_study", "").strip(),
                start_date=request.POST.get("start_date") or None,
                end_date=request.POST.get("end_date") or None,
                is_current=bool(request.POST.get("is_current")),
                grade=request.POST.get("grade", "").strip(),
                description=request.POST.get("description", "").strip(),
            )
        return redirect("/dashboard/education")
    ctx = _base_context(request)
    ctx["education"] = list(Education.objects.filter(user=user))
    return render(request, "web/dashboard/education.html", ctx)


# --- Certifications ----------------------------------------------------------


@login_required
def certifications(request):
    user = request.user
    if request.method == "POST":
        if request.POST.get("action") == "delete":
            Certification.objects.filter(user=user, pk=request.POST.get("id")).delete()
        elif request.POST.get("name"):
            Certification.objects.create(
                user=user,
                name=request.POST.get("name", "").strip(),
                issuing_organization=request.POST.get(
                    "issuing_organization", ""
                ).strip(),
                issue_date=request.POST.get("issue_date") or None,
                expiry_date=request.POST.get("expiry_date") or None,
                credential_id=request.POST.get("credential_id", "").strip(),
                credential_url=request.POST.get("credential_url", "").strip(),
            )
        return redirect("/dashboard/certifications")
    ctx = _base_context(request)
    ctx["certifications"] = list(Certification.objects.filter(user=user))
    return render(request, "web/dashboard/certifications.html", ctx)


# --- Messages ----------------------------------------------------------------


@login_required
def messages(request):
    user = request.user
    if request.method == "POST" and request.POST.get("action") == "delete":
        ContactMessage.objects.filter(
            recipient=user, pk=request.POST.get("id")
        ).delete()
        return redirect("/dashboard/messages")
    ctx = _base_context(request)
    ctx["messages_list"] = list(ContactMessage.objects.filter(recipient=user))
    ctx["unread"] = ContactMessage.objects.filter(
        recipient=user, status=ContactMessage.Status.UNREAD
    ).count()
    return render(request, "web/dashboard/messages.html", ctx)


# --- Analytics ---------------------------------------------------------------


@login_required
def analytics(request):
    user = request.user
    views = ProfileView.objects.filter(user=user)
    stat_cards = [
        ("Total views", views.count(), "#a78bfa"),
        ("Unique visitors", views.values("visitor_ip").distinct().count(), "#67e8f9"),
        ("Projects", Project.objects.filter(user=user).count(), "#e879f9"),
    ]
    ctx = _base_context(request)
    ctx.update({"stat_cards": stat_cards, "recent_views": list(views[:12])})
    return render(request, "web/dashboard/analytics.html", ctx)


# --- Activity ----------------------------------------------------------------


@login_required
def activity(request):
    ctx = _base_context(request)
    ctx["logs"] = list(ActivityLog.objects.filter(user=request.user)[:50])
    return render(request, "web/dashboard/activity.html", ctx)


# --- AI assistant ------------------------------------------------------------


@login_required
def ai_assistant(request):
    return render(request, "web/dashboard/ai_assistant.html", _base_context(request))


# --- Resume ------------------------------------------------------------------


@login_required
def resume(request):
    user = request.user
    ctx = _base_context(request)
    ctx.update(
        {
            "experiences": list(Experience.objects.filter(user=user)),
            "education": list(Education.objects.filter(user=user)),
            "skills": list(Skill.objects.filter(user=user)),
            "projects": list(Project.objects.filter(user=user, is_featured=True)),
        }
    )
    return render(request, "web/dashboard/resume.html", ctx)


# --- Import (GitHub) ---------------------------------------------------------


@login_required
def github_import(request):
    return render(request, "web/dashboard/import.html", _base_context(request))


# --- Share -------------------------------------------------------------------


@login_required
def share(request):
    user = request.user
    ctx = _base_context(request)
    username = user.username or user.email.split("@")[0]
    ctx["portfolio_path"] = f"/portfolio/{username}"
    ctx["portfolio_url"] = request.build_absolute_uri(ctx["portfolio_path"])
    return render(request, "web/dashboard/share.html", ctx)


# --- Settings (read + write) -------------------------------------------------


@login_required
def settings_view(request):
    from .forms import ProfileForm

    saved = False
    if request.method == "POST":
        form = ProfileForm(request.POST, instance=request.user)
        if form.is_valid():
            form.save()
            saved = True
    else:
        form = ProfileForm(instance=request.user)
    ctx = _base_context(request)
    ctx.update({"form": form, "saved": saved})
    return render(request, "web/dashboard/settings.html", ctx)
