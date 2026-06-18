"""
Models for the portfolio app.

This module defines the data models for projects, skills,
and other portfolio-related content.
"""

from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _


class Skill(models.Model):
    """
    Model representing a technical skill.

    Skills can be associated with projects and user profiles
    to showcase technical expertise.
    """

    class Category(models.TextChoices):
        """Skill category choices."""

        FRONTEND = "frontend", _("Frontend")
        BACKEND = "backend", _("Backend")
        DATABASE = "database", _("Database")
        DEVOPS = "devops", _("DevOps")
        MOBILE = "mobile", _("Mobile")
        DESIGN = "design", _("Design")
        OTHER = "other", _("Other")

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="skills",
    )
    name = models.CharField(max_length=100)
    category = models.CharField(
        max_length=20,
        choices=Category.choices,
        default=Category.OTHER,
    )
    proficiency = models.PositiveSmallIntegerField(
        default=50,
        help_text=_("Proficiency level from 0 to 100"),
    )
    years_experience = models.DecimalField(
        max_digits=4,
        decimal_places=1,
        null=True,
        blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-proficiency", "name"]
        unique_together = ["user", "name"]
        indexes = [
            models.Index(fields=["user", "category"], name="port_skill_user_cat_idx"),
            models.Index(fields=["-proficiency"], name="port_skill_prof_idx"),
        ]

    def __str__(self) -> str:
        return f"{self.name} ({self.proficiency}%)"


class Project(models.Model):
    """
    Model representing a portfolio project.

    Projects showcase the user's work with details like
    description, technologies used, and links.
    """

    class Status(models.TextChoices):
        """Project status choices."""

        PLANNING = "planning", _("Planning")
        IN_PROGRESS = "in_progress", _("In Progress")
        COMPLETED = "completed", _("Completed")
        ON_HOLD = "on_hold", _("On Hold")
        ARCHIVED = "archived", _("Archived")

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="projects",
    )
    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=200, blank=True)
    description = models.TextField()
    short_description = models.CharField(
        max_length=300,
        blank=True,
        help_text=_("Brief description for cards and previews"),
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.IN_PROGRESS,
    )

    # Links
    github_url = models.URLField(blank=True)
    live_url = models.URLField(blank=True)
    demo_url = models.URLField(blank=True)

    # Media
    featured_image = models.ImageField(
        upload_to="projects/",
        blank=True,
        null=True,
    )

    # Technologies
    skills = models.ManyToManyField(
        Skill,
        related_name="projects",
        blank=True,
    )
    technologies = models.JSONField(
        default=list,
        blank=True,
        help_text=_("List of technologies used (for quick display)"),
    )

    # Metadata
    is_featured = models.BooleanField(default=False)
    is_public = models.BooleanField(default=True)
    order = models.PositiveIntegerField(default=0)

    # Timestamps
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-is_featured", "-created_at"]
        unique_together = ["user", "slug"]
        indexes = [
            models.Index(fields=["user", "status"], name="port_proj_user_status_idx"),
            models.Index(
                fields=["user", "is_featured"], name="port_proj_user_feat_idx"
            ),
            models.Index(fields=["-created_at"], name="port_proj_created_idx"),
            models.Index(fields=["slug"], name="port_proj_slug_idx"),
        ]

    def __str__(self) -> str:
        return self.title

    def save(self, *args, **kwargs):
        """Generate slug from title if not provided."""
        if not self.slug:
            from django.utils.text import slugify

            base_slug = slugify(self.title)
            slug = base_slug
            counter = 1
            while (
                Project.objects.filter(user=self.user, slug=slug)
                .exclude(pk=self.pk)
                .exists()
            ):
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)


class Experience(models.Model):
    """
    Model representing work experience.

    Track professional experience for the portfolio.
    """

    class Type(models.TextChoices):
        """Experience type choices."""

        FULL_TIME = "full_time", _("Full Time")
        PART_TIME = "part_time", _("Part Time")
        CONTRACT = "contract", _("Contract")
        FREELANCE = "freelance", _("Freelance")
        INTERNSHIP = "internship", _("Internship")

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="experiences",
    )
    company = models.CharField(max_length=200)
    position = models.CharField(max_length=200)
    type = models.CharField(
        max_length=20,
        choices=Type.choices,
        default=Type.FULL_TIME,
    )
    location = models.CharField(max_length=200, blank=True)
    description = models.TextField(blank=True)

    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    is_current = models.BooleanField(default=False)

    skills = models.ManyToManyField(
        Skill,
        related_name="experiences",
        blank=True,
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-is_current", "-start_date"]
        verbose_name_plural = "experiences"
        indexes = [
            models.Index(fields=["user", "-start_date"], name="port_exp_user_date_idx"),
            models.Index(
                fields=["user", "is_current"], name="port_exp_user_current_idx"
            ),
        ]

    def __str__(self) -> str:
        return f"{self.position} at {self.company}"


class SocialLink(models.Model):
    """
    Model representing social media links.
    """

    class Platform(models.TextChoices):
        """Social platform choices."""

        GITHUB = "github", _("GitHub")
        LINKEDIN = "linkedin", _("LinkedIn")
        TWITTER = "twitter", _("Twitter/X")
        WEBSITE = "website", _("Website")
        YOUTUBE = "youtube", _("YouTube")
        DEVTO = "devto", _("Dev.to")
        MEDIUM = "medium", _("Medium")
        STACKOVERFLOW = "stackoverflow", _("Stack Overflow")
        OTHER = "other", _("Other")

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="social_links",
    )
    platform = models.CharField(
        max_length=20,
        choices=Platform.choices,
    )
    url = models.URLField()
    is_visible = models.BooleanField(default=True)

    class Meta:
        unique_together = ["user", "platform"]
        indexes = [
            models.Index(fields=["user", "platform"], name="port_social_user_plat_idx"),
        ]

    def __str__(self) -> str:
        return f"{self.get_platform_display()}: {self.url}"


class ProfileView(models.Model):
    """
    Model for tracking profile/portfolio views.
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="profile_views",
    )
    visitor_ip = models.GenericIPAddressField(null=True, blank=True)
    visitor_user_agent = models.TextField(blank=True)
    referrer = models.URLField(blank=True)
    country = models.CharField(max_length=100, blank=True)
    city = models.CharField(max_length=100, blank=True)
    device_type = models.CharField(max_length=20, blank=True)  # mobile, tablet, desktop
    viewed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-viewed_at"]
        indexes = [
            models.Index(fields=["user", "viewed_at"], name="port_pview_user_date_idx"),
        ]

    def __str__(self) -> str:
        return f"View for {self.user.email} at {self.viewed_at}"


class ProjectView(models.Model):
    """
    Model for tracking individual project views.
    """

    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="views",
    )
    visitor_ip = models.GenericIPAddressField(null=True, blank=True)
    visitor_user_agent = models.TextField(blank=True)
    referrer = models.URLField(blank=True)
    viewed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-viewed_at"]
        indexes = [
            models.Index(
                fields=["project", "viewed_at"], name="port_projview_date_idx"
            ),
        ]

    def __str__(self) -> str:
        return f"View for {self.project.title} at {self.viewed_at}"


class ContactMessage(models.Model):
    """
    Model for storing contact form messages.
    """

    class Status(models.TextChoices):
        UNREAD = "unread", _("Unread")
        READ = "read", _("Read")
        REPLIED = "replied", _("Replied")
        ARCHIVED = "archived", _("Archived")

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="received_messages",
    )
    sender_name = models.CharField(max_length=100)
    sender_email = models.EmailField()
    subject = models.CharField(max_length=200)
    message = models.TextField()
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.UNREAD,
    )
    is_starred = models.BooleanField(default=False)
    replied_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["recipient", "status"], name="port_msg_user_read_idx"),
            models.Index(
                fields=["recipient", "-created_at"], name="port_msg_user_date_idx"
            ),
        ]

    def __str__(self) -> str:
        return f"Message from {self.sender_name}: {self.subject}"


class PortfolioTheme(models.Model):
    """
    Model for portfolio theme customization.
    """

    class ThemePreset(models.TextChoices):
        DARK = "dark", _("Dark")
        LIGHT = "light", _("Light")
        PURPLE = "purple", _("Purple Gradient")
        BLUE = "blue", _("Blue Ocean")
        GREEN = "green", _("Green Forest")
        SUNSET = "sunset", _("Sunset")
        CUSTOM = "custom", _("Custom")

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="portfolio_theme",
    )
    preset = models.CharField(
        max_length=20,
        choices=ThemePreset.choices,
        default=ThemePreset.PURPLE,
    )
    # Custom colors
    primary_color = models.CharField(max_length=7, default="#8B5CF6")  # Purple
    secondary_color = models.CharField(max_length=7, default="#EC4899")  # Pink
    background_color = models.CharField(max_length=7, default="#0F172A")  # Dark slate
    text_color = models.CharField(max_length=7, default="#F8FAFC")  # Light
    accent_color = models.CharField(max_length=7, default="#22D3EE")  # Cyan

    # Layout options
    show_skills_section = models.BooleanField(default=True)
    show_experience_section = models.BooleanField(default=True)
    show_projects_section = models.BooleanField(default=True)
    show_contact_form = models.BooleanField(default=True)

    # Hero section
    hero_title = models.CharField(max_length=200, blank=True)
    hero_subtitle = models.CharField(max_length=500, blank=True)

    # SEO
    meta_title = models.CharField(max_length=60, blank=True)
    meta_description = models.CharField(max_length=160, blank=True)

    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return f"Theme for {self.user.email}"


class Education(models.Model):
    """
    Model representing educational background.
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="education",
    )
    institution = models.CharField(max_length=200)
    degree = models.CharField(max_length=200)
    field_of_study = models.CharField(max_length=200)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    is_current = models.BooleanField(default=False)
    grade = models.CharField(max_length=50, blank=True)
    description = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-is_current", "-start_date"]
        verbose_name_plural = "education"
        indexes = [
            models.Index(fields=["user", "-start_date"], name="port_edu_user_date_idx"),
        ]

    def __str__(self) -> str:
        return f"{self.degree} at {self.institution}"


class Certification(models.Model):
    """
    Model representing certifications and credentials.
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="certifications",
    )
    name = models.CharField(max_length=200)
    issuing_organization = models.CharField(max_length=200)
    issue_date = models.DateField()
    expiry_date = models.DateField(null=True, blank=True)
    credential_id = models.CharField(max_length=100, blank=True)
    credential_url = models.URLField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-issue_date"]
        indexes = [
            models.Index(
                fields=["user", "-issue_date"], name="port_cert_user_date_idx"
            ),
            models.Index(
                fields=["user", "expiry_date"], name="port_cert_user_expiry_idx"
            ),
        ]

    def __str__(self) -> str:
        return f"{self.name} - {self.issuing_organization}"


class ActivityLog(models.Model):
    """
    Model for tracking user activities and audit trail.

    Records all CRUD operations on portfolio items for
    security auditing and activity tracking.
    """

    class ActionType(models.TextChoices):
        """Action type choices."""

        CREATE = "create", _("Created")
        UPDATE = "update", _("Updated")
        DELETE = "delete", _("Deleted")
        VIEW = "view", _("Viewed")
        LOGIN = "login", _("Logged In")
        LOGOUT = "logout", _("Logged Out")
        EXPORT = "export", _("Exported Data")
        IMPORT = "import", _("Imported Data")

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="activity_logs",
    )
    action = models.CharField(
        max_length=20,
        choices=ActionType.choices,
    )
    model_name = models.CharField(max_length=50)  # e.g., "Project", "Skill"
    object_id = models.PositiveIntegerField(null=True, blank=True)
    object_repr = models.CharField(max_length=200, blank=True)  # String representation
    changes = models.JSONField(
        default=dict,
        blank=True,
        help_text=_("JSON of field changes (old_value -> new_value)"),
    )
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Activity Log"
        verbose_name_plural = "Activity Logs"
        indexes = [
            models.Index(
                fields=["user", "-created_at"], name="port_actlog_user_time_idx"
            ),
            models.Index(
                fields=["action", "-created_at"], name="port_actlog_type_time_idx"
            ),
        ]

    def __str__(self) -> str:
        return f"{self.user.email} {self.action} {self.model_name} at {self.created_at}"


class GitHubImport(models.Model):
    """
    Model for tracking GitHub repository imports.
    """

    class Status(models.TextChoices):
        PENDING = "pending", _("Pending")
        IN_PROGRESS = "in_progress", _("In Progress")
        COMPLETED = "completed", _("Completed")
        FAILED = "failed", _("Failed")

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="github_imports",
    )
    github_username = models.CharField(max_length=100)
    repo_name = models.CharField(max_length=200, blank=True)  # Specific repo or all
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )
    repos_found = models.PositiveIntegerField(default=0)
    repos_imported = models.PositiveIntegerField(default=0)
    error_message = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"Import from {self.github_username} - {self.status}"


class SavedDraft(models.Model):
    """
    Model for auto-saved form drafts.

    Stores unsaved form data to prevent data loss.
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="saved_drafts",
    )
    form_type = models.CharField(max_length=50)  # e.g., "project", "experience"
    form_data = models.JSONField(default=dict)
    object_id = models.PositiveIntegerField(null=True, blank=True)  # For edit drafts
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]
        unique_together = ["user", "form_type", "object_id"]

    def __str__(self) -> str:
        return f"Draft {self.form_type} for {self.user.email}"
