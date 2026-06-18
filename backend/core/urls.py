"""
URL configuration for the core app.

This module defines the URL patterns for core functionality endpoints.
"""

from django.urls import path

from .views import BrandingView, HealthCheckView, MetricsView, ReadinessCheckView

app_name = "core"

urlpatterns = [
    path("health/", HealthCheckView.as_view(), name="health_check"),
    path("health/ready/", ReadinessCheckView.as_view(), name="readiness_check"),
    path("metrics/", MetricsView.as_view(), name="metrics"),
    path("branding/", BrandingView.as_view(), name="branding"),
]
