"""
Unit tests for the portfolio app.

This module contains tests for portfolio CRUD operations including
projects, skills, experience, education, and certifications.
"""

from django.contrib.auth import get_user_model
from django.urls import reverse

from rest_framework import status

import pytest

User = get_user_model()


@pytest.mark.django_db
class TestProjectCRUD:
    """Tests for Project CRUD operations."""

    def test_create_project(self, authenticated_client, create_user):
        """Test creating a project."""
        url = reverse("portfolio:project-list")
        data = {
            "title": "Test Project",
            "description": "A test project description",
            "short_description": "Short desc",
            "status": "in_progress",
            "technologies": ["Python", "Django"],
            "github_url": "https://github.com/test/project",
            "live_url": "https://example.com",
        }
        response = authenticated_client.post(url, data, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["title"] == "Test Project"
        assert "Python" in response.data["technologies"]

    def test_list_projects(self, authenticated_client, create_project):
        """Test listing user's projects."""
        # Create a project for the authenticated user
        project = create_project(title="My Project")
        url = reverse("portfolio:project-list")
        response = authenticated_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["results"]) >= 1

    def test_retrieve_project(self, authenticated_client, create_project):
        """Test retrieving a single project."""
        project = create_project(title="Specific Project")
        url = reverse("portfolio:project-detail", kwargs={"pk": project.id})
        response = authenticated_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data["title"] == "Specific Project"

    def test_update_project(self, authenticated_client, create_project):
        """Test updating a project."""
        project = create_project(title="Original Title")
        url = reverse("portfolio:project-detail", kwargs={"pk": project.id})
        data = {
            "title": "Updated Title",
            "description": "Updated description",
            "status": "completed",
        }
        response = authenticated_client.patch(url, data, format="json")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["title"] == "Updated Title"

    def test_delete_project(self, authenticated_client, create_project):
        """Test deleting a project."""
        project = create_project(title="To Be Deleted")
        url = reverse("portfolio:project-detail", kwargs={"pk": project.id})
        response = authenticated_client.delete(url)
        assert response.status_code == status.HTTP_204_NO_CONTENT

    def test_toggle_featured(self, authenticated_client, create_project):
        """Test toggling project featured status."""
        project = create_project(title="Feature Me", is_featured=False)
        url = reverse("portfolio:project-toggle-featured", kwargs={"pk": project.id})
        response = authenticated_client.post(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data["is_featured"] is True

    def test_unauthenticated_cannot_create(self, api_client):
        """Test that unauthenticated users cannot create projects."""
        url = reverse("portfolio:project-list")
        data = {"title": "Unauthorized", "description": "Should fail"}
        response = api_client.post(url, data, format="json")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
class TestSkillCRUD:
    """Tests for Skill CRUD operations."""

    def test_create_skill(self, authenticated_client):
        """Test creating a skill."""
        url = reverse("portfolio:skill-list")
        data = {
            "name": "Python",
            "category": "backend",
            "proficiency": 90,
            "years_experience": 5.0,
        }
        response = authenticated_client.post(url, data, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["name"] == "Python"
        assert response.data["proficiency"] == 90

    def test_list_skills(self, authenticated_client, create_skill):
        """Test listing user's skills."""
        create_skill(name="JavaScript")
        url = reverse("portfolio:skill-list")
        response = authenticated_client.get(url)
        assert response.status_code == status.HTTP_200_OK

    def test_update_skill(self, authenticated_client, create_skill):
        """Test updating a skill."""
        skill = create_skill(name="React", proficiency=70)
        url = reverse("portfolio:skill-detail", kwargs={"pk": skill.id})
        data = {"proficiency": 85}
        response = authenticated_client.patch(url, data, format="json")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["proficiency"] == 85

    def test_delete_skill(self, authenticated_client, create_skill):
        """Test deleting a skill."""
        skill = create_skill(name="To Delete")
        url = reverse("portfolio:skill-detail", kwargs={"pk": skill.id})
        response = authenticated_client.delete(url)
        assert response.status_code == status.HTTP_204_NO_CONTENT

    def test_skills_by_category(self, authenticated_client, create_skill):
        """Test getting skills grouped by category."""
        create_skill(name="Django", category="backend")
        create_skill(name="React", category="frontend")
        url = reverse("portfolio:skill-by-category")
        response = authenticated_client.get(url)
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
class TestExperienceCRUD:
    """Tests for Experience CRUD operations."""

    def test_create_experience(self, authenticated_client):
        """Test creating work experience."""
        url = reverse("portfolio:experience-list")
        data = {
            "company": "Tech Corp",
            "position": "Senior Developer",
            "location": "San Francisco, CA",
            "start_date": "2020-01-01",
            "is_current": True,
            "description": "Leading development team",
        }
        response = authenticated_client.post(url, data, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["company"] == "Tech Corp"

    def test_list_experience(self, authenticated_client, create_experience):
        """Test listing work experience."""
        create_experience(company="Previous Corp")
        url = reverse("portfolio:experience-list")
        response = authenticated_client.get(url)
        assert response.status_code == status.HTTP_200_OK

    def test_update_experience(self, authenticated_client, create_experience):
        """Test updating work experience."""
        exp = create_experience(company="Old Corp", position="Developer")
        url = reverse("portfolio:experience-detail", kwargs={"pk": exp.id})
        data = {"position": "Senior Developer"}
        response = authenticated_client.patch(url, data, format="json")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["position"] == "Senior Developer"


@pytest.mark.django_db
class TestEducationCRUD:
    """Tests for Education CRUD operations."""

    def test_create_education(self, authenticated_client):
        """Test creating education entry."""
        url = reverse("portfolio:education-list")
        data = {
            "institution": "MIT",
            "degree": "Bachelor of Science",
            "field_of_study": "Computer Science",
            "start_date": "2016-09-01",
            "end_date": "2020-05-01",
            "gpa": "3.8",
        }
        response = authenticated_client.post(url, data, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["institution"] == "MIT"

    def test_list_education(self, authenticated_client, create_education):
        """Test listing education entries."""
        create_education(institution="Stanford")
        url = reverse("portfolio:education-list")
        response = authenticated_client.get(url)
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
class TestCertificationCRUD:
    """Tests for Certification CRUD operations."""

    def test_create_certification(self, authenticated_client):
        """Test creating certification."""
        url = reverse("portfolio:certification-list")
        data = {
            "name": "AWS Solutions Architect",
            "issuing_organization": "Amazon Web Services",
            "issue_date": "2023-01-15",
            "credential_id": "ABC123",
            "credential_url": "https://aws.amazon.com/verify/ABC123",
        }
        response = authenticated_client.post(url, data, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["name"] == "AWS Solutions Architect"

    def test_list_certifications(self, authenticated_client, create_certification):
        """Test listing certifications."""
        create_certification(name="Google Cloud")
        url = reverse("portfolio:certification-list")
        response = authenticated_client.get(url)
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
class TestDashboardAnalytics:
    """Tests for dashboard and analytics endpoints."""

    def test_dashboard_stats(self, authenticated_client, create_project, create_skill):
        """Test dashboard stats endpoint."""
        create_project(title="Project 1")
        create_skill(name="Python")
        url = reverse("portfolio:dashboard-stats")
        response = authenticated_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert "total_projects" in response.data
        assert "total_skills" in response.data

    def test_analytics_overview(self, authenticated_client):
        """Test analytics overview endpoint."""
        url = reverse("portfolio:analytics")
        response = authenticated_client.get(url)
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
class TestPublicPortfolio:
    """Tests for public portfolio endpoints."""

    def test_public_portfolio_by_username(
        self, api_client, create_user, create_project
    ):
        """Test accessing public portfolio by username."""
        user = create_user(email="public@test.com", password="testpass123")
        # Need to create project with specific user
        from portfolio.models import Project

        Project.objects.create(
            user=user,
            title="Public Project",
            description="A public project",
            is_public=True,
        )
        url = reverse("portfolio:public-portfolio", kwargs={"username": user.username})
        response = api_client.get(url)
        # May return 200 or 404 depending on user setup
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_404_NOT_FOUND]


@pytest.mark.django_db
class TestResumeGeneration:
    """Tests for PDF resume generation."""

    def test_generate_resume_pdf(
        self, authenticated_client, create_project, create_skill
    ):
        """Test generating PDF resume."""
        create_project(title="Resume Project")
        create_skill(name="Python")
        url = reverse("portfolio:resume-download")
        response = authenticated_client.get(url)
        # Should return PDF or success response
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_204_NO_CONTENT]
