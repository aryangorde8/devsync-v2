"""
Pytest configuration and fixtures for DevSync tests.

This module provides shared fixtures and configuration for all tests.
"""

from django.contrib.auth import get_user_model

from rest_framework.test import APIClient

import pytest

User = get_user_model()


# Store authenticated user for use in portfolio fixtures
_authenticated_user = None


@pytest.fixture
def api_client() -> APIClient:
    """
    Provide an unauthenticated API client.

    Returns:
        APIClient: DRF test client instance.
    """
    return APIClient()


@pytest.fixture
def user_data() -> dict:
    """
    Provide sample user data for testing.

    Returns:
        dict: User registration data.
    """
    return {
        "email": "testuser@example.com",
        "password": "SecurePass123!",
        "password_confirm": "SecurePass123!",
        "first_name": "Test",
        "last_name": "User",
    }


@pytest.fixture
def create_user(db):
    """
    Factory fixture to create users.

    Args:
        db: Database fixture to ensure DB access.

    Returns:
        Callable: Function to create users.
    """

    def _create_user(
        email: str = "testuser@example.com", password: str = "SecurePass123!", **kwargs
    ) -> User:
        return User.objects.create_user(email=email, password=password, **kwargs)

    return _create_user


@pytest.fixture
def authenticated_client(api_client, create_user) -> APIClient:
    """
    Provide an authenticated API client.

    Args:
        api_client: Base API client fixture.
        create_user: User creation fixture.

    Returns:
        APIClient: Authenticated DRF test client.
    """
    global _authenticated_user
    user = create_user(email="authenticated@example.com")
    _authenticated_user = user
    api_client.force_authenticate(user=user)
    api_client.user = user  # Store user on client for access in fixtures
    return api_client


@pytest.fixture
def superuser(db) -> User:
    """
    Create a superuser for testing admin functionality.

    Args:
        db: Database fixture to ensure DB access.

    Returns:
        User: Superuser instance.
    """
    return User.objects.create_superuser(
        email="admin@example.com",
        password="AdminPass123!",
    )


# =============================================================================
# Portfolio Fixtures
# =============================================================================


@pytest.fixture
def create_project(db, create_user):
    """
    Factory fixture to create projects.

    Returns:
        Callable: Function to create projects.
    """
    from portfolio.models import Project

    def _create_project(title: str = "Test Project", user=None, **kwargs):
        if user is None:
            user = _authenticated_user or create_user(email="project_owner@example.com")

        defaults = {
            "description": "A test project description",
            "short_description": "Short description",
            "status": "in_progress",
            "technologies": ["Python", "Django"],
            "is_featured": False,
            "is_public": True,
        }
        defaults.update(kwargs)

        return Project.objects.create(user=user, title=title, **defaults)

    return _create_project


@pytest.fixture
def create_skill(db, create_user):
    """
    Factory fixture to create skills.

    Returns:
        Callable: Function to create skills.
    """
    from portfolio.models import Skill

    def _create_skill(name: str = "Python", user=None, **kwargs):
        if user is None:
            user = _authenticated_user or create_user(email="skill_owner@example.com")

        defaults = {
            "category": "backend",
            "proficiency": 80,
            "years_experience": 3.0,
        }
        defaults.update(kwargs)

        return Skill.objects.create(user=user, name=name, **defaults)

    return _create_skill


@pytest.fixture
def create_experience(db, create_user):
    """
    Factory fixture to create work experience.

    Returns:
        Callable: Function to create experience entries.
    """
    from portfolio.models import Experience

    def _create_experience(company: str = "Tech Corp", user=None, **kwargs):
        if user is None:
            user = _authenticated_user or create_user(email="exp_owner@example.com")

        defaults = {
            "position": "Software Developer",
            "location": "San Francisco, CA",
            "start_date": "2020-01-01",
            "is_current": True,
            "description": "Developing awesome software",
        }
        defaults.update(kwargs)

        return Experience.objects.create(user=user, company=company, **defaults)

    return _create_experience


@pytest.fixture
def create_education(db, create_user):
    """
    Factory fixture to create education entries.

    Returns:
        Callable: Function to create education entries.
    """
    from portfolio.models import Education

    def _create_education(institution: str = "MIT", user=None, **kwargs):
        if user is None:
            user = _authenticated_user or create_user(email="edu_owner@example.com")

        defaults = {
            "degree": "Bachelor of Science",
            "field_of_study": "Computer Science",
            "start_date": "2016-09-01",
            "end_date": "2020-05-01",
        }
        defaults.update(kwargs)

        return Education.objects.create(user=user, institution=institution, **defaults)

    return _create_education


@pytest.fixture
def create_certification(db, create_user):
    """
    Factory fixture to create certifications.

    Returns:
        Callable: Function to create certifications.
    """
    from portfolio.models import Certification

    def _create_certification(
        name: str = "AWS Solutions Architect", user=None, **kwargs
    ):
        if user is None:
            user = _authenticated_user or create_user(email="cert_owner@example.com")

        defaults = {
            "issuing_organization": "Amazon Web Services",
            "issue_date": "2023-01-15",
        }
        defaults.update(kwargs)

        return Certification.objects.create(user=user, name=name, **defaults)

    return _create_certification
