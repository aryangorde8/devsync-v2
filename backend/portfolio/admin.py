"""
Admin configuration for the portfolio app.
"""

from django.contrib import admin

from .models import (
    Certification,
    ContactMessage,
    Education,
    Experience,
    PortfolioTheme,
    ProfileView,
    Project,
    ProjectView,
    Skill,
    SocialLink,
)


@admin.register(Skill)
class SkillAdmin(admin.ModelAdmin):
    """Admin interface for Skill model."""

    list_display = ["name", "user", "category", "proficiency", "created_at"]
    list_filter = ["category", "created_at"]
    search_fields = ["name", "user__email"]
    ordering = ["-created_at"]


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    """Admin interface for Project model."""

    list_display = ["title", "user", "status", "is_featured", "is_public", "created_at"]
    list_filter = ["status", "is_featured", "is_public", "created_at"]
    search_fields = ["title", "description", "user__email"]
    prepopulated_fields = {"slug": ("title",)}
    ordering = ["-created_at"]
    filter_horizontal = ["skills"]


@admin.register(Experience)
class ExperienceAdmin(admin.ModelAdmin):
    """Admin interface for Experience model."""

    list_display = ["position", "company", "user", "type", "is_current", "start_date"]
    list_filter = ["type", "is_current", "start_date"]
    search_fields = ["position", "company", "user__email"]
    ordering = ["-start_date"]
    filter_horizontal = ["skills"]


@admin.register(SocialLink)
class SocialLinkAdmin(admin.ModelAdmin):
    """Admin interface for SocialLink model."""

    list_display = ["platform", "user", "url", "is_visible"]
    list_filter = ["platform", "is_visible"]
    search_fields = ["user__email", "url"]


@admin.register(Education)
class EducationAdmin(admin.ModelAdmin):
    """Admin interface for Education model."""

    list_display = [
        "degree",
        "institution",
        "user",
        "field_of_study",
        "is_current",
        "start_date",
    ]
    list_filter = ["is_current", "start_date"]
    search_fields = ["institution", "degree", "user__email"]
    ordering = ["-start_date"]


@admin.register(Certification)
class CertificationAdmin(admin.ModelAdmin):
    """Admin interface for Certification model."""

    list_display = ["name", "issuing_organization", "user", "issue_date", "expiry_date"]
    list_filter = ["issue_date", "expiry_date"]
    search_fields = ["name", "issuing_organization", "user__email"]
    ordering = ["-issue_date"]


@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    """Admin interface for ContactMessage model."""

    list_display = [
        "subject",
        "sender_name",
        "sender_email",
        "recipient",
        "status",
        "is_starred",
        "created_at",
    ]
    list_filter = ["status", "is_starred", "created_at"]
    search_fields = ["subject", "sender_name", "sender_email", "recipient__email"]
    ordering = ["-created_at"]
    readonly_fields = [
        "sender_name",
        "sender_email",
        "subject",
        "message",
        "created_at",
    ]


@admin.register(PortfolioTheme)
class PortfolioThemeAdmin(admin.ModelAdmin):
    """Admin interface for PortfolioTheme model."""

    list_display = ["user", "preset", "primary_color", "updated_at"]
    list_filter = ["preset"]
    search_fields = ["user__email"]


@admin.register(ProfileView)
class ProfileViewAdmin(admin.ModelAdmin):
    """Admin interface for ProfileView model."""

    list_display = ["user", "visitor_ip", "device_type", "viewed_at"]
    list_filter = ["device_type", "viewed_at"]
    search_fields = ["user__email", "visitor_ip"]
    ordering = ["-viewed_at"]
    readonly_fields = [
        "user",
        "visitor_ip",
        "visitor_user_agent",
        "referrer",
        "device_type",
        "viewed_at",
    ]


@admin.register(ProjectView)
class ProjectViewAdmin(admin.ModelAdmin):
    """Admin interface for ProjectView model."""

    list_display = ["project", "visitor_ip", "viewed_at"]
    list_filter = ["viewed_at"]
    search_fields = ["project__title", "visitor_ip"]
    ordering = ["-viewed_at"]
    readonly_fields = [
        "project",
        "visitor_ip",
        "visitor_user_agent",
        "referrer",
        "viewed_at",
    ]
