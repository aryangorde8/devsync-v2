"""
URL configuration for DevSync project.

This module defines the main URL patterns for the application,
including API endpoints and documentation.
"""

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)

# API version prefix
API_V1_PREFIX = "api/v1/"

urlpatterns = [
    # Admin
    path("admin/", admin.site.urls),
    # API Documentation (OpenAPI/Swagger)
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path(
        "api/docs/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),
    path(
        "api/redoc/",
        SpectacularRedocView.as_view(url_name="schema"),
        name="redoc",
    ),
    # Health Check Endpoints
    path("health/", include("core.health_urls")),
    # API Endpoints
    path(f"{API_V1_PREFIX}auth/", include("accounts.urls", namespace="accounts")),
    path(f"{API_V1_PREFIX}core/", include("core.urls", namespace="core")),
    path(
        f"{API_V1_PREFIX}portfolio/", include("portfolio.urls", namespace="portfolio")
    ),
    path(f"{API_V1_PREFIX}ai/", include("ai.urls")),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
