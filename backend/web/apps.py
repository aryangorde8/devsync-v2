from django.apps import AppConfig


class WebConfig(AppConfig):
    """Server-rendered UI for DevSync.

    This app renders the user-facing pages (landing, auth, dashboard, public
    portfolio) with Django templates. It replaces the former Next.js frontend
    while reusing the same models and business logic that back the REST API.
    The ``/api/v1/`` contract is untouched.
    """

    default_auto_field = "django.db.models.BigAutoField"
    name = "web"
