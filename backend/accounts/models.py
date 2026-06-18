"""
Custom User Model for DevSync.

This module implements a custom user model following Django best practices
and Meta Backend standards for extensibility and security.
"""

from typing import Optional

from django.contrib.auth.models import (
    AbstractBaseUser,
    BaseUserManager,
    PermissionsMixin,
)
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _


class CustomUserManager(BaseUserManager):
    """
    Custom user manager for handling user creation.

    Provides methods for creating regular users and superusers
    with email as the primary identifier.
    """

    def create_user(
        self, email: str, password: Optional[str] = None, **extra_fields
    ) -> "CustomUser":
        """
        Create and return a regular user with the given email and password.

        Args:
            email: User's email address (required).
            password: User's password (optional).
            **extra_fields: Additional fields for the user model.

        Returns:
            CustomUser: The created user instance.

        Raises:
            ValueError: If email is not provided.
        """
        if not email:
            raise ValueError(_("The Email field must be set"))

        email = self.normalize_email(email)
        extra_fields.setdefault("is_active", True)

        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(
        self, email: str, password: Optional[str] = None, **extra_fields
    ) -> "CustomUser":
        """
        Create and return a superuser with the given email and password.

        Args:
            email: Superuser's email address (required).
            password: Superuser's password (optional).
            **extra_fields: Additional fields for the user model.

        Returns:
            CustomUser: The created superuser instance.

        Raises:
            ValueError: If is_staff or is_superuser is not True.
        """
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError(_("Superuser must have is_staff=True."))
        if extra_fields.get("is_superuser") is not True:
            raise ValueError(_("Superuser must have is_superuser=True."))

        return self.create_user(email, password, **extra_fields)


class CustomUser(AbstractBaseUser, PermissionsMixin):
    """
    Custom User Model for DevSync application.

    Uses email as the primary identifier instead of username.
    Includes additional fields for developer portfolio functionality.
    """

    email = models.EmailField(
        _("email address"),
        unique=True,
        db_index=True,
        help_text=_("Required. A valid email address."),
    )
    username = models.CharField(
        _("username"),
        max_length=150,
        unique=True,
        blank=True,
        null=True,
        help_text=_("Optional. 150 characters or fewer."),
    )
    first_name = models.CharField(_("first name"), max_length=150, blank=True)
    last_name = models.CharField(_("last name"), max_length=150, blank=True)

    # Developer-specific fields
    title = models.CharField(
        _("title"),
        max_length=100,
        blank=True,
        help_text=_("Your professional title, e.g., 'Full Stack Developer'"),
    )
    bio = models.TextField(_("bio"), max_length=500, blank=True)
    github_username = models.CharField(
        _("GitHub username"),
        max_length=39,
        blank=True,
        help_text=_("Your GitHub username for portfolio integration."),
    )
    linkedin_url = models.URLField(_("LinkedIn URL"), blank=True)
    portfolio_url = models.URLField(_("Portfolio URL"), blank=True)
    avatar = models.ImageField(
        _("avatar"),
        upload_to="avatars/",
        blank=True,
        null=True,
    )

    # Status fields
    is_staff = models.BooleanField(
        _("staff status"),
        default=False,
        help_text=_("Designates whether the user can log into admin site."),
    )
    is_active = models.BooleanField(
        _("active"),
        default=True,
        help_text=_("Designates whether this user should be treated as active."),
    )
    is_verified = models.BooleanField(
        _("verified"),
        default=False,
        help_text=_("Designates whether this user has verified their email."),
    )

    # Timestamps
    date_joined = models.DateTimeField(_("date joined"), default=timezone.now)
    updated_at = models.DateTimeField(_("updated at"), auto_now=True)

    objects = CustomUserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    class Meta:
        verbose_name = _("user")
        verbose_name_plural = _("users")
        ordering = ["-date_joined"]

    def __str__(self) -> str:
        """Return string representation of the user."""
        return self.email

    def get_full_name(self) -> str:
        """
        Return the first_name plus the last_name, with a space in between.

        Returns:
            str: Full name of the user.
        """
        full_name = f"{self.first_name} {self.last_name}".strip()
        return full_name or self.email

    def get_short_name(self) -> str:
        """
        Return the short name for the user.

        Returns:
            str: First name of the user or email if not set.
        """
        return self.first_name or self.email.split("@")[0]
