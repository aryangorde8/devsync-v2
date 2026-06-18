"""
Health check URL patterns.
"""

from django.urls import path

from core.health import (
    ai_config_check,
    ai_test,
    db_diagnostics,
    health_check,
    health_check_detailed,
    liveness_check,
    metrics,
    readiness_check,
    run_migrations,
)

urlpatterns = [
    path("", health_check, name="health"),
    path("detailed/", health_check_detailed, name="health-detailed"),
    path("ready/", readiness_check, name="readiness"),
    path("live/", liveness_check, name="liveness"),
    path("metrics/", metrics, name="metrics"),
    path("db/", db_diagnostics, name="db-diagnostics"),
    path("migrate/", run_migrations, name="run-migrations"),
    path("ai/", ai_config_check, name="ai-config"),
    path("ai/test/", ai_test, name="ai-test"),
]
