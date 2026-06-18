"""
URL configuration for the portfolio app.

This module defines the URL patterns for portfolio-related endpoints.
"""

from django.urls import include, path

from rest_framework.routers import DefaultRouter

from .views import (
    ActivityLogViewSet,
    AnalyticsView,
    BulkOperationsView,
    CertificationViewSet,
    ContactMessageViewSet,
    DashboardStatsView,
    EducationViewSet,
    ExperienceViewSet,
    ExportDataView,
    GitHubImportView,
    PortfolioThemeView,
    ProjectViewSet,
    PublicContactView,
    PublicPortfolioView,
    PublicProjectView,
    QRCodeView,
    ReorderView,
    ResumeDataView,
    ResumeDownloadView,
    SavedDraftViewSet,
    SearchView,
    SkillViewSet,
    SocialLinkViewSet,
    StatsOverviewView,
)

app_name = "portfolio"

router = DefaultRouter()
router.register(r"projects", ProjectViewSet, basename="project")
router.register(r"skills", SkillViewSet, basename="skill")
router.register(r"experiences", ExperienceViewSet, basename="experience")
router.register(r"social-links", SocialLinkViewSet, basename="social-link")
router.register(r"education", EducationViewSet, basename="education")
router.register(r"certifications", CertificationViewSet, basename="certification")
router.register(r"messages", ContactMessageViewSet, basename="message")
router.register(r"activity", ActivityLogViewSet, basename="activity")
router.register(r"drafts", SavedDraftViewSet, basename="draft")

urlpatterns = [
    path("", include(router.urls)),
    # Dashboard & Analytics
    path("dashboard/stats/", DashboardStatsView.as_view(), name="dashboard-stats"),
    path("analytics/", AnalyticsView.as_view(), name="analytics"),
    path("stats/overview/", StatsOverviewView.as_view(), name="stats-overview"),
    # Theme
    path("theme/", PortfolioThemeView.as_view(), name="theme"),
    # GitHub Import
    path("github/import/", GitHubImportView.as_view(), name="github-import"),
    # Resume Data & PDF Download
    path("resume/", ResumeDataView.as_view(), name="resume-data"),
    path("resume/download/", ResumeDownloadView.as_view(), name="resume-download"),
    # Export Data
    path("export/", ExportDataView.as_view(), name="export-data"),
    # Search
    path("search/", SearchView.as_view(), name="search"),
    # Bulk Operations
    path("bulk/", BulkOperationsView.as_view(), name="bulk-operations"),
    # Reorder
    path("reorder/", ReorderView.as_view(), name="reorder"),
    # QR Code
    path("qr-code/", QRCodeView.as_view(), name="qr-code"),
    # Public Portfolio (no auth required)
    path(
        "public/<str:username>/", PublicPortfolioView.as_view(), name="public-portfolio"
    ),
    path(
        "public/<str:username>/contact/",
        PublicContactView.as_view(),
        name="public-contact",
    ),
    path(
        "public/<str:username>/project/<str:slug>/",
        PublicProjectView.as_view(),
        name="public-project",
    ),
]
