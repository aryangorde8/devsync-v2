"""
Serializers for the portfolio app.

This module provides serializers for projects, skills,
and other portfolio-related models.
"""

from rest_framework import serializers

from .models import (
    ActivityLog,
    Certification,
    ContactMessage,
    Education,
    Experience,
    GitHubImport,
    PortfolioTheme,
    ProfileView,
    Project,
    ProjectView,
    SavedDraft,
    Skill,
    SocialLink,
)


class SkillSerializer(serializers.ModelSerializer):
    """Serializer for Skill model."""

    category_display = serializers.CharField(
        source="get_category_display",
        read_only=True,
    )

    class Meta:
        model = Skill
        fields = [
            "id",
            "name",
            "category",
            "category_display",
            "proficiency",
            "years_experience",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def create(self, validated_data):
        """Create skill with current user."""
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)


class ProjectListSerializer(serializers.ModelSerializer):
    """Serializer for listing projects (minimal data)."""

    status_display = serializers.CharField(
        source="get_status_display",
        read_only=True,
    )

    class Meta:
        model = Project
        fields = [
            "id",
            "title",
            "slug",
            "short_description",
            "status",
            "status_display",
            "technologies",
            "github_url",
            "live_url",
            "featured_image",
            "is_featured",
            "is_public",
            "created_at",
        ]


class ProjectDetailSerializer(serializers.ModelSerializer):
    """Serializer for project details (full data)."""

    status_display = serializers.CharField(
        source="get_status_display",
        read_only=True,
    )
    skills = SkillSerializer(many=True, read_only=True)
    skill_ids = serializers.PrimaryKeyRelatedField(
        queryset=Skill.objects.all(),
        many=True,
        write_only=True,
        required=False,
        source="skills",
    )

    class Meta:
        model = Project
        fields = [
            "id",
            "title",
            "slug",
            "description",
            "short_description",
            "status",
            "status_display",
            "github_url",
            "live_url",
            "demo_url",
            "featured_image",
            "skills",
            "skill_ids",
            "technologies",
            "is_featured",
            "is_public",
            "order",
            "start_date",
            "end_date",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "slug", "created_at", "updated_at"]

    def create(self, validated_data):
        """Create project with current user."""
        skills = validated_data.pop("skills", [])
        validated_data["user"] = self.context["request"].user
        project = super().create(validated_data)
        if skills:
            project.skills.set(skills)
        return project

    def update(self, instance, validated_data):
        """Update project with skills handling."""
        skills = validated_data.pop("skills", None)
        project = super().update(instance, validated_data)
        if skills is not None:
            project.skills.set(skills)
        return project


class ExperienceSerializer(serializers.ModelSerializer):
    """Serializer for Experience model."""

    type_display = serializers.CharField(
        source="get_type_display",
        read_only=True,
    )
    skills = SkillSerializer(many=True, read_only=True)
    skill_ids = serializers.PrimaryKeyRelatedField(
        queryset=Skill.objects.all(),
        many=True,
        write_only=True,
        required=False,
        source="skills",
    )

    class Meta:
        model = Experience
        fields = [
            "id",
            "company",
            "position",
            "type",
            "type_display",
            "location",
            "description",
            "start_date",
            "end_date",
            "is_current",
            "skills",
            "skill_ids",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def create(self, validated_data):
        """Create experience with current user."""
        skills = validated_data.pop("skills", [])
        validated_data["user"] = self.context["request"].user
        experience = super().create(validated_data)
        if skills:
            experience.skills.set(skills)
        return experience

    def update(self, instance, validated_data):
        """Update experience with skills handling."""
        skills = validated_data.pop("skills", None)
        experience = super().update(instance, validated_data)
        if skills is not None:
            experience.skills.set(skills)
        return experience


class SocialLinkSerializer(serializers.ModelSerializer):
    """Serializer for SocialLink model."""

    platform_display = serializers.CharField(
        source="get_platform_display",
        read_only=True,
    )

    class Meta:
        model = SocialLink
        fields = [
            "id",
            "platform",
            "platform_display",
            "url",
            "is_visible",
        ]

    def create(self, validated_data):
        """Create social link with current user."""
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)


class DashboardStatsSerializer(serializers.Serializer):
    """Serializer for dashboard statistics."""

    total_projects = serializers.IntegerField()
    completed_projects = serializers.IntegerField()
    in_progress_projects = serializers.IntegerField()
    total_skills = serializers.IntegerField()
    total_experiences = serializers.IntegerField()
    profile_views = serializers.IntegerField()
    total_messages = serializers.IntegerField(default=0)
    unread_messages = serializers.IntegerField(default=0)


class ContactMessageSerializer(serializers.ModelSerializer):
    """Serializer for contact messages."""

    status_display = serializers.CharField(
        source="get_status_display",
        read_only=True,
    )

    class Meta:
        model = ContactMessage
        fields = [
            "id",
            "sender_name",
            "sender_email",
            "subject",
            "message",
            "status",
            "status_display",
            "is_starred",
            "replied_at",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class ContactMessageCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating contact messages (public)."""

    class Meta:
        model = ContactMessage
        fields = ["sender_name", "sender_email", "subject", "message"]


class PortfolioThemeSerializer(serializers.ModelSerializer):
    """Serializer for portfolio theme customization."""

    preset_display = serializers.CharField(
        source="get_preset_display",
        read_only=True,
    )

    class Meta:
        model = PortfolioTheme
        fields = [
            "id",
            "preset",
            "preset_display",
            "primary_color",
            "secondary_color",
            "background_color",
            "text_color",
            "accent_color",
            "show_skills_section",
            "show_experience_section",
            "show_projects_section",
            "show_contact_form",
            "hero_title",
            "hero_subtitle",
            "meta_title",
            "meta_description",
            "updated_at",
        ]
        read_only_fields = ["id", "updated_at"]

    def create(self, validated_data):
        """Create theme with current user."""
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)


class EducationSerializer(serializers.ModelSerializer):
    """Serializer for Education model."""

    class Meta:
        model = Education
        fields = [
            "id",
            "institution",
            "degree",
            "field_of_study",
            "start_date",
            "end_date",
            "is_current",
            "grade",
            "description",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def create(self, validated_data):
        """Create education with current user."""
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)


class CertificationSerializer(serializers.ModelSerializer):
    """Serializer for Certification model."""

    class Meta:
        model = Certification
        fields = [
            "id",
            "name",
            "issuing_organization",
            "issue_date",
            "expiry_date",
            "credential_id",
            "credential_url",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def create(self, validated_data):
        """Create certification with current user."""
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)


class AnalyticsSerializer(serializers.Serializer):
    """Serializer for analytics data."""

    total_profile_views = serializers.IntegerField()
    total_project_views = serializers.IntegerField()
    views_today = serializers.IntegerField()
    views_this_week = serializers.IntegerField()
    views_this_month = serializers.IntegerField()
    top_projects = serializers.ListField(child=serializers.DictField())
    views_by_day = serializers.ListField(child=serializers.DictField())
    referrers = serializers.ListField(child=serializers.DictField())
    devices = serializers.DictField()


class PublicProfileSerializer(serializers.Serializer):
    """Serializer for public portfolio profile."""

    id = serializers.IntegerField()
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    full_name = serializers.CharField()
    title = serializers.CharField()
    bio = serializers.CharField()
    avatar = serializers.ImageField()
    github_username = serializers.CharField()
    linkedin_url = serializers.URLField()
    portfolio_url = serializers.URLField()
    skills = SkillSerializer(many=True)
    projects = ProjectListSerializer(many=True)
    experiences = ExperienceSerializer(many=True)
    education = EducationSerializer(many=True)
    certifications = CertificationSerializer(many=True)
    social_links = SocialLinkSerializer(many=True)
    theme = PortfolioThemeSerializer()


class ActivityLogSerializer(serializers.ModelSerializer):
    """Serializer for activity logs."""

    action_display = serializers.CharField(
        source="get_action_display",
        read_only=True,
    )
    time_ago = serializers.SerializerMethodField()

    class Meta:
        model = ActivityLog
        fields = [
            "id",
            "action",
            "action_display",
            "model_name",
            "object_id",
            "object_repr",
            "changes",
            "ip_address",
            "created_at",
            "time_ago",
        ]
        read_only_fields = ["id", "created_at"]

    def get_time_ago(self, obj):
        """Return human-readable time ago string."""
        from datetime import timedelta

        from django.utils import timezone

        now = timezone.now()
        diff = now - obj.created_at

        if diff < timedelta(minutes=1):
            return "just now"
        elif diff < timedelta(hours=1):
            minutes = int(diff.total_seconds() / 60)
            return f"{minutes} minute{'s' if minutes != 1 else ''} ago"
        elif diff < timedelta(days=1):
            hours = int(diff.total_seconds() / 3600)
            return f"{hours} hour{'s' if hours != 1 else ''} ago"
        elif diff < timedelta(days=7):
            days = diff.days
            return f"{days} day{'s' if days != 1 else ''} ago"
        elif diff < timedelta(days=30):
            weeks = diff.days // 7
            return f"{weeks} week{'s' if weeks != 1 else ''} ago"
        else:
            return obj.created_at.strftime("%b %d, %Y")


class GitHubImportSerializer(serializers.ModelSerializer):
    """Serializer for GitHub import status."""

    status_display = serializers.CharField(
        source="get_status_display",
        read_only=True,
    )

    class Meta:
        model = GitHubImport
        fields = [
            "id",
            "github_username",
            "repo_name",
            "status",
            "status_display",
            "repos_found",
            "repos_imported",
            "error_message",
            "created_at",
            "completed_at",
        ]
        read_only_fields = ["id", "created_at", "completed_at"]


class SavedDraftSerializer(serializers.ModelSerializer):
    """Serializer for saved drafts."""

    class Meta:
        model = SavedDraft
        fields = [
            "id",
            "form_type",
            "form_data",
            "object_id",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def create(self, validated_data):
        """Create draft with current user."""
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)


class SearchResultSerializer(serializers.Serializer):
    """Serializer for search results."""

    projects = ProjectListSerializer(many=True)
    skills = SkillSerializer(many=True)
    experiences = ExperienceSerializer(many=True)
    education = EducationSerializer(many=True)
    certifications = CertificationSerializer(many=True)
    total = serializers.IntegerField()


class BulkOperationSerializer(serializers.Serializer):
    """Serializer for bulk operations."""

    operation = serializers.ChoiceField(
        choices=[
            "delete",
            "archive",
            "make_public",
            "make_private",
            "mark_read",
            "mark_unread",
        ]
    )
    model_type = serializers.ChoiceField(
        choices=[
            "project",
            "skill",
            "experience",
            "education",
            "certification",
            "message",
        ]
    )
    ids = serializers.ListField(child=serializers.IntegerField())
