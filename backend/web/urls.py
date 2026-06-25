"""URL routes for the server-rendered UI.

These live at the site root (``/``, ``/login``, ``/dashboard`` …), parallel to
the REST API which keeps its ``/api/v1/`` prefix.
"""

from django.urls import path

from . import auth_views, dashboard_views, portfolio_views, views

app_name = "web"

urlpatterns = [
    # Public
    path("", views.landing, name="landing"),
    path("privacy", views.privacy, name="privacy"),
    path("terms", views.terms, name="terms"),
    path("offline", views.offline, name="offline"),
    # Auth (session)
    path("login", auth_views.login_view, name="login"),
    path("register", auth_views.register_view, name="register"),
    path("logout", auth_views.logout_view, name="logout"),
    # Dashboard
    path("dashboard", dashboard_views.overview, name="dashboard"),
    path("dashboard/projects", dashboard_views.projects, name="projects"),
    path("dashboard/experience", dashboard_views.experience, name="experience"),
    path("dashboard/education", dashboard_views.education, name="education"),
    path(
        "dashboard/certifications",
        dashboard_views.certifications,
        name="certifications",
    ),
    path("dashboard/resume", dashboard_views.resume, name="resume"),
    path("dashboard/messages", dashboard_views.messages, name="messages"),
    path("dashboard/analytics", dashboard_views.analytics, name="analytics"),
    path("dashboard/activity", dashboard_views.activity, name="activity"),
    path("dashboard/ai-assistant", dashboard_views.ai_assistant, name="ai_assistant"),
    path("dashboard/import", dashboard_views.github_import, name="import"),
    path("dashboard/share", dashboard_views.share, name="share"),
    path("dashboard/settings", dashboard_views.settings_view, name="settings"),
    # Public portfolio
    path(
        "portfolio/<str:username>", portfolio_views.public_portfolio, name="portfolio"
    ),
]
