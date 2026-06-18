"""
App configuration for the accounts app.
"""

from django.apps import AppConfig


class AccountsConfig(AppConfig):
    """Configuration class for the accounts application."""

    default_auto_field = "django.db.models.BigAutoField"
    name = "accounts"
    verbose_name = "User Accounts"

    def ready(self) -> None:
        """
        Run when the app is ready.

        Import signals here to ensure they are registered.
        """
        pass  # Import signals here when needed
