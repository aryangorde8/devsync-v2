"""
Views for the portfolio app.

This module provides API views for projects, skills,
analytics, and other portfolio-related endpoints.
"""

from datetime import timedelta

from django.contrib.auth import get_user_model
from django.db.models import Count, Q
from django.http import HttpResponse
from django.utils import timezone

from rest_framework import generics, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

import requests as http_requests

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
from .serializers import (
    ActivityLogSerializer,
    AnalyticsSerializer,
    CertificationSerializer,
    ContactMessageCreateSerializer,
    ContactMessageSerializer,
    DashboardStatsSerializer,
    EducationSerializer,
    ExperienceSerializer,
    PortfolioThemeSerializer,
    ProjectDetailSerializer,
    ProjectListSerializer,
    SavedDraftSerializer,
    SkillSerializer,
    SocialLinkSerializer,
)

User = get_user_model()


class ProjectViewSet(viewsets.ModelViewSet):
    """ViewSet for Project CRUD operations."""

    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action == "list":
            return ProjectListSerializer
        return ProjectDetailSerializer

    def get_queryset(self):
        return Project.objects.filter(user=self.request.user).prefetch_related("skills")

    def perform_create(self, serializer):
        instance = serializer.save(user=self.request.user)
        log_activity(
            self.request.user, "create", "Project", instance, request=self.request
        )

    def perform_update(self, serializer):
        instance = serializer.save()
        log_activity(
            self.request.user, "update", "Project", instance, request=self.request
        )

    def perform_destroy(self, instance):
        log_activity(
            self.request.user, "delete", "Project", instance, request=self.request
        )
        instance.delete()

    @action(detail=False, methods=["get"])
    def featured(self, request: Request) -> Response:
        projects = self.get_queryset().filter(is_featured=True)[:6]
        serializer = ProjectListSerializer(projects, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def toggle_featured(self, request: Request, pk=None) -> Response:
        project = self.get_object()
        project.is_featured = not project.is_featured
        project.save()
        return Response({"is_featured": project.is_featured})


class SkillViewSet(viewsets.ModelViewSet):
    """ViewSet for Skill CRUD operations."""

    serializer_class = SkillSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Skill.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        instance = serializer.save(user=self.request.user)
        log_activity(
            self.request.user, "create", "Skill", instance, request=self.request
        )

    def perform_update(self, serializer):
        instance = serializer.save()
        log_activity(
            self.request.user, "update", "Skill", instance, request=self.request
        )

    def perform_destroy(self, instance):
        log_activity(
            self.request.user, "delete", "Skill", instance, request=self.request
        )
        instance.delete()

    @action(detail=False, methods=["get"])
    def by_category(self, request: Request) -> Response:
        skills = self.get_queryset()
        grouped = {}
        for skill in skills:
            category = skill.get_category_display()
            if category not in grouped:
                grouped[category] = []
            grouped[category].append(SkillSerializer(skill).data)
        return Response(grouped)


class ExperienceViewSet(viewsets.ModelViewSet):
    """ViewSet for Experience CRUD operations."""

    serializer_class = ExperienceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Experience.objects.filter(user=self.request.user).prefetch_related(
            "skills"
        )

    def perform_create(self, serializer):
        instance = serializer.save(user=self.request.user)
        log_activity(
            self.request.user, "create", "Experience", instance, request=self.request
        )

    def perform_update(self, serializer):
        instance = serializer.save()
        log_activity(
            self.request.user, "update", "Experience", instance, request=self.request
        )

    def perform_destroy(self, instance):
        log_activity(
            self.request.user, "delete", "Experience", instance, request=self.request
        )
        instance.delete()


class SocialLinkViewSet(viewsets.ModelViewSet):
    """ViewSet for SocialLink CRUD operations."""

    serializer_class = SocialLinkSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return SocialLink.objects.filter(user=self.request.user)


class EducationViewSet(viewsets.ModelViewSet):
    """ViewSet for Education CRUD operations."""

    serializer_class = EducationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Education.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        instance = serializer.save(user=self.request.user)
        log_activity(
            self.request.user, "create", "Education", instance, request=self.request
        )

    def perform_update(self, serializer):
        instance = serializer.save()
        log_activity(
            self.request.user, "update", "Education", instance, request=self.request
        )

    def perform_destroy(self, instance):
        log_activity(
            self.request.user, "delete", "Education", instance, request=self.request
        )
        instance.delete()


class CertificationViewSet(viewsets.ModelViewSet):
    """ViewSet for Certification CRUD operations."""

    serializer_class = CertificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Certification.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        instance = serializer.save(user=self.request.user)
        log_activity(
            self.request.user, "create", "Certification", instance, request=self.request
        )

    def perform_update(self, serializer):
        instance = serializer.save()
        log_activity(
            self.request.user, "update", "Certification", instance, request=self.request
        )

    def perform_destroy(self, instance):
        log_activity(
            self.request.user, "delete", "Certification", instance, request=self.request
        )
        instance.delete()


class ContactMessageViewSet(viewsets.ModelViewSet):
    """ViewSet for Contact Message management."""

    serializer_class = ContactMessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ContactMessage.objects.filter(recipient=self.request.user)

    @action(detail=True, methods=["post"])
    def mark_read(self, request: Request, pk=None) -> Response:
        message = self.get_object()
        message.status = ContactMessage.Status.READ
        message.save()
        return Response({"status": "read"})

    @action(detail=True, methods=["post"])
    def toggle_starred(self, request: Request, pk=None) -> Response:
        message = self.get_object()
        message.is_starred = not message.is_starred
        message.save()
        return Response({"is_starred": message.is_starred})

    @action(detail=True, methods=["post"])
    def archive(self, request: Request, pk=None) -> Response:
        message = self.get_object()
        message.status = ContactMessage.Status.ARCHIVED
        message.save()
        return Response({"status": "archived"})

    @action(detail=False, methods=["get"])
    def unread_count(self, request: Request) -> Response:
        count = self.get_queryset().filter(status=ContactMessage.Status.UNREAD).count()
        return Response({"unread_count": count})


class PortfolioThemeView(APIView):
    """API view for portfolio theme management."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request: Request) -> Response:
        theme, created = PortfolioTheme.objects.get_or_create(user=request.user)
        serializer = PortfolioThemeSerializer(theme)
        return Response(serializer.data)

    def put(self, request: Request) -> Response:
        theme, created = PortfolioTheme.objects.get_or_create(user=request.user)
        serializer = PortfolioThemeSerializer(theme, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request: Request) -> Response:
        theme, created = PortfolioTheme.objects.get_or_create(user=request.user)
        serializer = PortfolioThemeSerializer(theme, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class DashboardStatsView(APIView):
    """API view for dashboard statistics."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request: Request) -> Response:
        user = request.user

        projects = Project.objects.filter(user=user)
        messages = ContactMessage.objects.filter(recipient=user)

        stats = {
            "total_projects": projects.count(),
            "completed_projects": projects.filter(status="completed").count(),
            "in_progress_projects": projects.filter(status="in_progress").count(),
            "total_skills": Skill.objects.filter(user=user).count(),
            "total_experiences": Experience.objects.filter(user=user).count(),
            "profile_views": ProfileView.objects.filter(user=user).count(),
            "total_messages": messages.count(),
            "unread_messages": messages.filter(
                status=ContactMessage.Status.UNREAD
            ).count(),
        }

        serializer = DashboardStatsSerializer(stats)
        return Response(serializer.data)


class AnalyticsView(APIView):
    """API view for detailed analytics."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request: Request) -> Response:
        user = request.user
        now = timezone.now()
        today = now.date()
        week_ago = now - timedelta(days=7)
        month_ago = now - timedelta(days=30)

        profile_views = ProfileView.objects.filter(user=user)
        project_views = ProjectView.objects.filter(project__user=user)

        # Views by day for the last 30 days
        views_by_day = []
        for i in range(30):
            day = today - timedelta(days=i)
            count = profile_views.filter(viewed_at__date=day).count()
            count += project_views.filter(viewed_at__date=day).count()
            views_by_day.append({"date": day.isoformat(), "views": count})

        # Top projects by views
        top_projects = (
            Project.objects.filter(user=user)
            .annotate(view_count=Count("views"))
            .order_by("-view_count")[:5]
            .values("id", "title", "view_count")
        )

        # Referrers
        referrers = (
            profile_views.exclude(referrer="")
            .values("referrer")
            .annotate(count=Count("id"))
            .order_by("-count")[:10]
        )

        # Device breakdown
        device_counts = profile_views.values("device_type").annotate(count=Count("id"))
        devices = {d["device_type"] or "unknown": d["count"] for d in device_counts}

        analytics = {
            "total_profile_views": profile_views.count(),
            "total_project_views": project_views.count(),
            "views_today": profile_views.filter(viewed_at__date=today).count(),
            "views_this_week": profile_views.filter(viewed_at__gte=week_ago).count(),
            "views_this_month": profile_views.filter(viewed_at__gte=month_ago).count(),
            "top_projects": list(top_projects),
            "views_by_day": list(reversed(views_by_day)),
            "referrers": list(referrers),
            "devices": devices,
        }

        serializer = AnalyticsSerializer(analytics)
        return Response(serializer.data)


class PublicPortfolioView(APIView):
    """API view for public portfolio access."""

    permission_classes = [permissions.AllowAny]

    def get(self, request: Request, username: str) -> Response:
        # Try to find user by multiple lookup methods
        user = None

        # 1. Try exact email match
        try:
            user = User.objects.get(email__iexact=username)
        except User.DoesNotExist:
            pass
        except User.MultipleObjectsReturned:
            user = User.objects.filter(email__iexact=username).first()

        # 2. Try username field match
        if not user:
            try:
                user = User.objects.get(username__iexact=username)
            except User.DoesNotExist:
                pass
            except User.MultipleObjectsReturned:
                user = User.objects.filter(username__iexact=username).first()

        # 3. Try email prefix match (e.g., "aryangorde" matches "aryangorde9@gmail.com")
        if not user:
            try:
                # Filter for emails starting with username@, username[0-9]@, etc.
                import re

                pattern = r"^" + re.escape(username) + r"(@|[0-9])"
                users = User.objects.filter(email__iregex=pattern)
                if users.exists():
                    # If multiple matches, get the most recently updated one
                    user = users.order_by("-last_login").first() or users.first()
            except Exception:
                pass

        if not user:
            return Response(
                {"error": "Portfolio not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Track the view
        self._track_view(request, user)

        # Get theme
        theme = None
        try:
            theme = user.portfolio_theme
        except PortfolioTheme.DoesNotExist:
            pass

        # Get public data
        projects = Project.objects.filter(user=user, is_public=True)
        skills = Skill.objects.filter(user=user)
        experiences = Experience.objects.filter(user=user)
        education = Education.objects.filter(user=user)
        certifications = Certification.objects.filter(user=user)
        social_links = SocialLink.objects.filter(user=user, is_visible=True)

        return Response(
            {
                "user": {
                    "id": user.id,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "full_name": user.get_full_name() or user.email.split("@")[0],
                    "bio": getattr(user, "bio", "") or "",
                    "title": getattr(user, "title", "") or "",
                    "avatar": user.avatar.url if user.avatar else None,
                },
                "theme": PortfolioThemeSerializer(theme).data if theme else None,
                "projects": ProjectListSerializer(projects, many=True).data,
                "skills": SkillSerializer(skills, many=True).data,
                "experiences": ExperienceSerializer(experiences, many=True).data,
                "education": EducationSerializer(education, many=True).data,
                "certifications": CertificationSerializer(
                    certifications, many=True
                ).data,
                "social_links": SocialLinkSerializer(social_links, many=True).data,
            }
        )

    def _track_view(self, request: Request, user) -> None:
        """Track portfolio view."""
        # Get client info
        x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
        if x_forwarded_for:
            ip = x_forwarded_for.split(",")[0]
        else:
            ip = request.META.get("REMOTE_ADDR")

        user_agent = request.META.get("HTTP_USER_AGENT", "")
        referrer = request.META.get("HTTP_REFERER", "")

        # Determine device type
        device_type = "desktop"
        ua_lower = user_agent.lower()
        if "mobile" in ua_lower or "android" in ua_lower:
            device_type = "mobile"
        elif "tablet" in ua_lower or "ipad" in ua_lower:
            device_type = "tablet"

        ProfileView.objects.create(
            user=user,
            visitor_ip=ip,
            visitor_user_agent=user_agent[:500],
            referrer=referrer[:200] if referrer else "",
            device_type=device_type,
        )


class PublicContactView(APIView):
    """API view for public contact form submission."""

    permission_classes = [permissions.AllowAny]

    def post(self, request: Request, username: str) -> Response:
        # Find user
        try:
            user = User.objects.get(email__iexact=username)
        except User.DoesNotExist:
            try:
                user = User.objects.get(email__istartswith=f"{username}@")
            except (User.DoesNotExist, User.MultipleObjectsReturned):
                return Response(
                    {"error": "Portfolio not found"},
                    status=status.HTTP_404_NOT_FOUND,
                )

        # Check if contact form is enabled
        try:
            theme = user.portfolio_theme
            if not theme.show_contact_form:
                return Response(
                    {"error": "Contact form is disabled"},
                    status=status.HTTP_403_FORBIDDEN,
                )
        except PortfolioTheme.DoesNotExist:
            pass

        serializer = ContactMessageCreateSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(recipient=user)
            return Response(
                {"message": "Your message has been sent successfully!"},
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PublicProjectView(APIView):
    """API view for viewing a single public project."""

    permission_classes = [permissions.AllowAny]

    def get(self, request: Request, username: str, slug: str) -> Response:
        # Find user
        try:
            user = User.objects.get(email__iexact=username)
        except User.DoesNotExist:
            try:
                user = User.objects.get(email__istartswith=f"{username}@")
            except (User.DoesNotExist, User.MultipleObjectsReturned):
                return Response(
                    {"error": "Portfolio not found"},
                    status=status.HTTP_404_NOT_FOUND,
                )

        # Get project
        try:
            project = Project.objects.get(user=user, slug=slug, is_public=True)
        except Project.DoesNotExist:
            return Response(
                {"error": "Project not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Track view
        self._track_view(request, project)

        return Response(ProjectDetailSerializer(project).data)

    def _track_view(self, request: Request, project: Project) -> None:
        """Track project view."""
        x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
        if x_forwarded_for:
            ip = x_forwarded_for.split(",")[0]
        else:
            ip = request.META.get("REMOTE_ADDR")

        ProjectView.objects.create(
            project=project,
            visitor_ip=ip,
            visitor_user_agent=request.META.get("HTTP_USER_AGENT", "")[:500],
            referrer=request.META.get("HTTP_REFERER", "")[:200],
        )


class GitHubImportView(APIView):
    """API view for importing projects from GitHub."""

    permission_classes = [permissions.IsAuthenticated]

    def _fetch_repositories(self, github_username: str):
        """Fetch repositories from GitHub for a username."""
        response = http_requests.get(
            f"https://api.github.com/users/{github_username}/repos",
            params={"sort": "updated", "per_page": 30},
            headers={"Accept": "application/vnd.github.v3+json"},
            timeout=10,
        )
        response.raise_for_status()
        repos = response.json()
        if not isinstance(repos, list):
            raise ValueError("Unexpected GitHub API response")
        return repos

    def _serialize_repository(self, repo):
        """Return minimal repository fields needed by the import UI."""
        return {
            "name": repo.get("name", ""),
            "description": repo.get("description") or "",
            "language": repo.get("language") or "",
            "html_url": repo.get("html_url") or "",
            "homepage": repo.get("homepage") or "",
            "private": bool(repo.get("private", False)),
            "fork": bool(repo.get("fork", False)),
            "archived": bool(repo.get("archived", False)),
            "stargazers_count": int(repo.get("stargazers_count") or 0),
            "updated_at": repo.get("updated_at"),
        }

    def post(self, request: Request) -> Response:
        """Preview or import repositories from GitHub."""
        github_username = request.data.get("github_username")
        if not github_username:
            # Try to get from user profile
            github_username = getattr(request.user, "github_username", None)

        if not github_username:
            return Response(
                {"error": "GitHub username is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        preview_mode = bool(request.data.get("preview", False))
        requested_repositories = request.data.get("repositories")

        selected_config = {}
        if requested_repositories is not None:
            if not isinstance(requested_repositories, list):
                return Response(
                    {"error": "repositories must be a list"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            for item in requested_repositories:
                if not isinstance(item, dict):
                    continue
                name = item.get("name")
                if not name:
                    continue
                selected_config[name] = {
                    "showcase": bool(item.get("showcase", True)),
                    "featured": bool(item.get("featured", False)),
                }

            if not preview_mode and requested_repositories and not selected_config:
                return Response(
                    {"error": "No valid repositories were provided"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        try:
            repos = self._fetch_repositories(github_username)
        except Exception as e:
            return Response(
                {"error": f"Failed to fetch GitHub repos: {str(e)}"},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        eligible_repos = [repo for repo in repos if not repo.get("fork")]

        if preview_mode:
            return Response(
                {
                    "message": f"Found {len(eligible_repos)} importable repositories",
                    "github_username": github_username,
                    "total_repositories": len(repos),
                    "eligible_repositories": len(eligible_repos),
                    "repositories": [
                        self._serialize_repository(repo) for repo in eligible_repos
                    ],
                }
            )

        repos_to_import = eligible_repos
        if selected_config:
            repos_to_import = [
                repo for repo in eligible_repos if repo.get("name") in selected_config
            ]

        imported = []
        imported_details = []
        skipped = []

        eligible_repo_names = {repo.get("name") for repo in eligible_repos}
        missing_requested = [
            name for name in selected_config.keys() if name not in eligible_repo_names
        ]
        skipped.extend(missing_requested)

        for repo in repos_to_import:
            repo_name = repo.get("name", "")

            # Check if already exists
            if Project.objects.filter(
                user=request.user, github_url=repo["html_url"]
            ).exists():
                skipped.append(repo_name)
                continue

            repo_config = selected_config.get(
                repo_name,
                {
                    "showcase": True,
                    "featured": False,
                },
            )

            # Detect technologies from language
            technologies = []
            if repo.get("language"):
                technologies.append(repo["language"])

            # Create project
            project = Project.objects.create(
                user=request.user,
                title=repo["name"].replace("-", " ").replace("_", " ").title(),
                description=repo.get("description")
                or f"A {repo.get('language', '')} project.",
                short_description=(repo.get("description") or "")[:300],
                github_url=repo["html_url"],
                live_url=repo.get("homepage") or "",
                technologies=technologies,
                status="completed" if not repo.get("archived") else "archived",
                is_public=(not repo.get("private", False)) and repo_config["showcase"],
                is_featured=repo_config["featured"],
            )
            log_activity(request.user, "import", "Project", project, request=request)
            imported.append(project.title)
            imported_details.append(
                {
                    "name": repo_name,
                    "title": project.title,
                    "is_public": project.is_public,
                    "is_featured": project.is_featured,
                }
            )

        return Response(
            {
                "message": f"Imported {len(imported)} projects",
                "github_username": github_username,
                "imported": imported,
                "imported_details": imported_details,
                "skipped": skipped,
            }
        )


class ResumeDataView(APIView):
    """API view for getting resume/CV data."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request: Request) -> Response:
        """Get all data needed to generate a resume."""
        user = request.user

        return Response(
            {
                "personal": {
                    "name": user.get_full_name() or user.email.split("@")[0],
                    "email": user.email,
                    "title": getattr(user, "title", "") or "",
                    "bio": getattr(user, "bio", "") or "",
                    "github": getattr(user, "github_username", "")
                    or SocialLink.objects.filter(user=user, platform="github")
                    .values_list("url", flat=True)
                    .first()
                    or "",
                    "linkedin": getattr(user, "linkedin_url", "")
                    or SocialLink.objects.filter(user=user, platform="linkedin")
                    .values_list("url", flat=True)
                    .first()
                    or "",
                    "portfolio": getattr(user, "portfolio_url", "") or "",
                },
                "skills": SkillSerializer(
                    Skill.objects.filter(user=user), many=True
                ).data,
                "experience": ExperienceSerializer(
                    Experience.objects.filter(user=user), many=True
                ).data,
                "education": EducationSerializer(
                    Education.objects.filter(user=user), many=True
                ).data,
                "certifications": CertificationSerializer(
                    Certification.objects.filter(user=user), many=True
                ).data,
                "projects": ProjectListSerializer(
                    Project.objects.filter(user=user, is_public=True)[:5], many=True
                ).data,
            }
        )


class ResumeDownloadView(APIView):
    """API view for downloading resume as PDF."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request: Request) -> HttpResponse:
        """Generate and download PDF resume."""
        from .pdf_generator import generate_resume_pdf

        user = request.user

        # Gather all user data
        user_data = {
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email,
            "title": getattr(user, "title", ""),
            "bio": getattr(user, "bio", ""),
            "github_username": getattr(user, "github_username", ""),
            "linkedin_url": getattr(user, "linkedin_url", ""),
            "portfolio_url": getattr(user, "portfolio_url", ""),
            "skills": SkillSerializer(Skill.objects.filter(user=user), many=True).data,
            "experiences": ExperienceSerializer(
                Experience.objects.filter(user=user).order_by("-start_date"), many=True
            ).data,
            "education": EducationSerializer(
                Education.objects.filter(user=user).order_by("-start_date"), many=True
            ).data,
            "certifications": CertificationSerializer(
                Certification.objects.filter(user=user).order_by("-issue_date"),
                many=True,
            ).data,
            "projects": ProjectDetailSerializer(
                Project.objects.filter(user=user, is_public=True).order_by(
                    "-is_featured", "-created_at"
                )[:5],
                many=True,
            ).data,
        }

        # Generate PDF
        pdf_bytes = generate_resume_pdf(user_data)

        # Create response
        filename = (
            f"{user.first_name or 'resume'}_{user.last_name or 'cv'}.pdf".replace(
                " ", "_"
            )
        )
        response = HttpResponse(pdf_bytes, content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="{filename}"'

        return response


class ExportDataView(APIView):
    """API view for exporting all user data as JSON."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request: Request) -> Response:
        """Export all user portfolio data."""
        user = request.user

        data = {
            "exported_at": timezone.now().isoformat(),
            "profile": {
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "title": getattr(user, "title", ""),
                "bio": getattr(user, "bio", ""),
                "github_username": getattr(user, "github_username", ""),
                "linkedin_url": getattr(user, "linkedin_url", ""),
                "portfolio_url": getattr(user, "portfolio_url", ""),
            },
            "projects": ProjectDetailSerializer(
                Project.objects.filter(user=user), many=True
            ).data,
            "skills": SkillSerializer(Skill.objects.filter(user=user), many=True).data,
            "experiences": ExperienceSerializer(
                Experience.objects.filter(user=user), many=True
            ).data,
            "education": EducationSerializer(
                Education.objects.filter(user=user), many=True
            ).data,
            "certifications": CertificationSerializer(
                Certification.objects.filter(user=user), many=True
            ).data,
            "social_links": SocialLinkSerializer(
                SocialLink.objects.filter(user=user), many=True
            ).data,
            "theme": (
                PortfolioThemeSerializer(
                    PortfolioTheme.objects.filter(user=user).first()
                ).data
                if PortfolioTheme.objects.filter(user=user).exists()
                else None
            ),
        }

        return Response(data)


class ActivityLogViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing activity logs (read-only)."""

    serializer_class = ActivityLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ActivityLog.objects.filter(user=self.request.user)

    @action(detail=False, methods=["get"])
    def recent(self, request: Request) -> Response:
        """Get recent activity (last 20 items)."""
        logs = self.get_queryset()[:20]
        serializer = self.get_serializer(logs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def by_model(self, request: Request) -> Response:
        """Get activity grouped by model type."""
        model_name = request.query_params.get("model")
        if model_name:
            logs = self.get_queryset().filter(model_name__iexact=model_name)
        else:
            logs = self.get_queryset()
        serializer = self.get_serializer(logs[:50], many=True)
        return Response(serializer.data)


def log_activity(
    user, action: str, model_name: str, obj=None, changes: dict = None, request=None
):
    """Helper function to log user activity."""
    try:
        ip_address = None
        user_agent = ""

        if request:
            x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
            if x_forwarded_for:
                ip_address = x_forwarded_for.split(",")[0]
            else:
                ip_address = request.META.get("REMOTE_ADDR")
            user_agent = request.META.get("HTTP_USER_AGENT", "")[:500]

        ActivityLog.objects.create(
            user=user,
            action=action,
            model_name=model_name,
            object_id=obj.pk if obj else None,
            object_repr=str(obj)[:200] if obj else "",
            changes=changes or {},
            ip_address=ip_address,
            user_agent=user_agent,
        )
    except Exception:
        pass


class SearchView(APIView):
    """API view for full-text search across portfolio."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request: Request) -> Response:
        """Search across all portfolio content."""
        query = request.query_params.get("q", "").strip()

        if not query or len(query) < 2:
            return Response(
                {"error": "Search query must be at least 2 characters"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = request.user
        results = {
            "projects": [],
            "skills": [],
            "experiences": [],
            "education": [],
            "certifications": [],
            "total": 0,
        }

        # Search Projects
        projects = Project.objects.filter(user=user).filter(
            Q(title__icontains=query)
            | Q(description__icontains=query)
            | Q(short_description__icontains=query)
        )[:10]
        results["projects"] = ProjectListSerializer(projects, many=True).data

        # Search Skills
        skills = Skill.objects.filter(user=user, name__icontains=query)[:10]
        results["skills"] = SkillSerializer(skills, many=True).data

        # Search Experiences
        experiences = Experience.objects.filter(user=user).filter(
            Q(company__icontains=query)
            | Q(position__icontains=query)
            | Q(description__icontains=query)
        )[:10]
        results["experiences"] = ExperienceSerializer(experiences, many=True).data

        # Search Education
        education = Education.objects.filter(user=user).filter(
            Q(institution__icontains=query)
            | Q(degree__icontains=query)
            | Q(field_of_study__icontains=query)
        )[:10]
        results["education"] = EducationSerializer(education, many=True).data

        # Search Certifications
        certifications = Certification.objects.filter(user=user).filter(
            Q(name__icontains=query) | Q(issuing_organization__icontains=query)
        )[:10]
        results["certifications"] = CertificationSerializer(
            certifications, many=True
        ).data

        # Calculate total
        results["total"] = (
            len(results["projects"])
            + len(results["skills"])
            + len(results["experiences"])
            + len(results["education"])
            + len(results["certifications"])
        )

        # Log search activity
        log_activity(user, "view", "Search", changes={"query": query}, request=request)

        return Response(results)


class BulkOperationsView(APIView):
    """API view for bulk operations on portfolio items."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request: Request) -> Response:
        """Perform bulk operations."""
        operation = request.data.get("operation")
        model_type = request.data.get("model_type")
        ids = request.data.get("ids", [])

        if not operation or not model_type or not ids:
            return Response(
                {"error": "operation, model_type, and ids are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = request.user
        model_map = {
            "project": Project,
            "skill": Skill,
            "experience": Experience,
            "education": Education,
            "certification": Certification,
            "message": ContactMessage,
        }

        model_class = model_map.get(model_type.lower())
        if not model_class:
            return Response(
                {"error": f"Invalid model_type: {model_type}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get user's objects only
        if model_type.lower() == "message":
            queryset = model_class.objects.filter(recipient=user, id__in=ids)
        else:
            queryset = model_class.objects.filter(user=user, id__in=ids)

        count = queryset.count()

        if operation == "delete":
            queryset.delete()
            log_activity(
                user,
                "delete",
                model_type.title(),
                changes={"deleted_ids": ids, "count": count},
                request=request,
            )
            return Response({"message": f"Deleted {count} {model_type}(s)"})

        elif operation == "archive" and model_type.lower() == "project":
            queryset.update(status="archived")
            log_activity(
                user,
                "update",
                "Project",
                changes={"archived_ids": ids},
                request=request,
            )
            return Response({"message": f"Archived {count} project(s)"})

        elif operation == "make_public" and model_type.lower() == "project":
            queryset.update(is_public=True)
            return Response({"message": f"Made {count} project(s) public"})

        elif operation == "make_private" and model_type.lower() == "project":
            queryset.update(is_public=False)
            return Response({"message": f"Made {count} project(s) private"})

        elif operation == "mark_read" and model_type.lower() == "message":
            queryset.update(status=ContactMessage.Status.READ)
            return Response({"message": f"Marked {count} message(s) as read"})

        elif operation == "mark_unread" and model_type.lower() == "message":
            queryset.update(status=ContactMessage.Status.UNREAD)
            return Response({"message": f"Marked {count} message(s) as unread"})

        else:
            return Response(
                {"error": f"Invalid operation: {operation}"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class QRCodeView(APIView):
    """API view for generating QR codes for portfolio."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request: Request) -> HttpResponse:
        """Generate QR code for public portfolio URL."""
        import io

        try:
            import qrcode
            from qrcode.image.styledpil import StyledPilImage
            from qrcode.image.styles.moduledrawers import RoundedModuleDrawer
        except ImportError:
            return Response(
                {
                    "error": "QR code generation not available. Install qrcode[pil] package."
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        user = request.user

        # Get the portfolio URL
        base_url = request.build_absolute_uri("/").rstrip("/")
        username = user.email.split("@")[0]
        portfolio_url = f"{base_url}/portfolio/{username}"

        # Generate QR code
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(portfolio_url)
        qr.make(fit=True)

        # Create image with rounded modules
        try:
            img = qr.make_image(
                image_factory=StyledPilImage,
                module_drawer=RoundedModuleDrawer(),
                fill_color="#8B5CF6",  # Purple
                back_color="white",
            )
        except Exception:
            # Fallback to basic image
            img = qr.make_image(fill_color="#8B5CF6", back_color="white")

        # Save to bytes
        buffer = io.BytesIO()
        img.save(buffer, format="PNG")
        buffer.seek(0)

        response = HttpResponse(buffer.getvalue(), content_type="image/png")
        response["Content-Disposition"] = (
            f'inline; filename="portfolio_qr_{username}.png"'
        )

        return response


class SavedDraftViewSet(viewsets.ModelViewSet):
    """ViewSet for managing saved form drafts."""

    serializer_class = SavedDraftSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return SavedDraft.objects.filter(user=self.request.user)

    @action(detail=False, methods=["get"])
    def get_draft(self, request: Request) -> Response:
        """Get a specific draft by form_type and optional object_id."""
        form_type = request.query_params.get("form_type")
        object_id = request.query_params.get("object_id")

        if not form_type:
            return Response(
                {"error": "form_type is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        draft = self.get_queryset().filter(form_type=form_type)
        if object_id:
            draft = draft.filter(object_id=object_id)
        else:
            draft = draft.filter(object_id__isnull=True)

        draft = draft.first()
        if draft:
            return Response(SavedDraftSerializer(draft).data)
        return Response({"form_data": None})

    @action(detail=False, methods=["post"])
    def save_draft(self, request: Request) -> Response:
        """Save or update a draft."""
        form_type = request.data.get("form_type")
        form_data = request.data.get("form_data", {})
        object_id = request.data.get("object_id")

        if not form_type:
            return Response(
                {"error": "form_type is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        draft, created = SavedDraft.objects.update_or_create(
            user=request.user,
            form_type=form_type,
            object_id=object_id,
            defaults={"form_data": form_data},
        )

        return Response(SavedDraftSerializer(draft).data)

    @action(detail=False, methods=["delete"])
    def clear_draft(self, request: Request) -> Response:
        """Clear a specific draft."""
        form_type = request.query_params.get("form_type")
        object_id = request.query_params.get("object_id")

        if not form_type:
            return Response(
                {"error": "form_type is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        draft = self.get_queryset().filter(form_type=form_type)
        if object_id:
            draft = draft.filter(object_id=object_id)
        else:
            draft = draft.filter(object_id__isnull=True)

        deleted, _ = draft.delete()
        return Response({"deleted": deleted > 0})


class ReorderView(APIView):
    """API view for reordering portfolio items."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request: Request) -> Response:
        """Reorder items by updating their order field."""
        model_type = request.data.get("model_type")
        items = request.data.get("items", [])  # List of {id, order}

        if not model_type or not items:
            return Response(
                {"error": "model_type and items are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = request.user

        if model_type.lower() == "project":
            for item in items:
                Project.objects.filter(user=user, id=item["id"]).update(
                    order=item["order"]
                )
            return Response({"message": "Projects reordered successfully"})

        return Response(
            {"error": f"Reordering not supported for {model_type}"},
            status=status.HTTP_400_BAD_REQUEST,
        )


class StatsOverviewView(APIView):
    """API view for comprehensive portfolio statistics."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request: Request) -> Response:
        """Get comprehensive statistics for the portfolio."""
        user = request.user
        now = timezone.now()
        month_ago = now - timedelta(days=30)
        week_ago = now - timedelta(days=7)

        # Basic counts
        stats = {
            "projects": {
                "total": Project.objects.filter(user=user).count(),
                "featured": Project.objects.filter(user=user, is_featured=True).count(),
                "completed": Project.objects.filter(
                    user=user, status="completed"
                ).count(),
                "in_progress": Project.objects.filter(
                    user=user, status="in_progress"
                ).count(),
            },
            "skills": {
                "total": Skill.objects.filter(user=user).count(),
                "by_category": dict(
                    Skill.objects.filter(user=user)
                    .values("category")
                    .annotate(count=Count("id"))
                    .values_list("category", "count")
                ),
            },
            "experience": {
                "total": Experience.objects.filter(user=user).count(),
                "current": Experience.objects.filter(
                    user=user, is_current=True
                ).count(),
            },
            "education": {
                "total": Education.objects.filter(user=user).count(),
            },
            "certifications": {
                "total": Certification.objects.filter(user=user).count(),
                "expiring_soon": Certification.objects.filter(
                    user=user,
                    expiry_date__lte=now + timedelta(days=90),
                    expiry_date__gte=now,
                ).count(),
            },
            "messages": {
                "total": ContactMessage.objects.filter(recipient=user).count(),
                "unread": ContactMessage.objects.filter(
                    recipient=user, status=ContactMessage.Status.UNREAD
                ).count(),
                "this_week": ContactMessage.objects.filter(
                    recipient=user, created_at__gte=week_ago
                ).count(),
            },
            "views": {
                "total_profile": ProfileView.objects.filter(user=user).count(),
                "total_projects": ProjectView.objects.filter(
                    project__user=user
                ).count(),
                "this_month": ProfileView.objects.filter(
                    user=user, viewed_at__gte=month_ago
                ).count(),
                "this_week": ProfileView.objects.filter(
                    user=user, viewed_at__gte=week_ago
                ).count(),
            },
            "activity": {
                "recent_count": ActivityLog.objects.filter(
                    user=user, created_at__gte=week_ago
                ).count(),
            },
        }

        # Profile completeness score
        completeness = 0
        checks = [
            (user.first_name and user.last_name, 10),
            (getattr(user, "bio", ""), 15),
            (getattr(user, "title", ""), 10),
            (Project.objects.filter(user=user).exists(), 15),
            (Skill.objects.filter(user=user).count() >= 5, 15),
            (Experience.objects.filter(user=user).exists(), 10),
            (Education.objects.filter(user=user).exists(), 10),
            (SocialLink.objects.filter(user=user).count() >= 2, 10),
            (user.avatar if hasattr(user, "avatar") else None, 5),
        ]

        for check, score in checks:
            if check:
                completeness += score

        stats["profile_completeness"] = completeness

        return Response(stats)
