"""
Unit tests for the accounts app.

This module contains tests for user registration, authentication,
and profile management following TDD principles.
"""

from django.contrib.auth import get_user_model
from django.urls import reverse

from rest_framework import status

import pytest

User = get_user_model()


@pytest.mark.django_db
class TestCustomUserModel:
    """Tests for the CustomUser model."""

    def test_create_user_with_email(self, create_user):
        """Test creating a user with email is successful."""
        user = create_user(
            email="test@example.com",
            password="testpass123",
        )
        assert user.email == "test@example.com"
        assert user.check_password("testpass123")
        assert user.is_active
        assert not user.is_staff
        assert not user.is_superuser

    def test_create_user_normalizes_email(self, create_user):
        """Test that email is normalized for new users."""
        emails = [
            ("test1@EXAMPLE.com", "test1@example.com"),
            ("Test2@Example.COM", "Test2@example.com"),
            ("TEST3@EXAMPLE.COM", "TEST3@example.com"),
        ]
        for email, expected in emails:
            user = create_user(email=email, password="testpass123")
            assert user.email == expected

    def test_create_user_without_email_raises_error(self, db):
        """Test creating a user without email raises ValueError."""
        with pytest.raises(ValueError):
            User.objects.create_user(email="", password="testpass123")

    def test_create_superuser(self, superuser):
        """Test creating a superuser."""
        assert superuser.email == "admin@example.com"
        assert superuser.is_staff
        assert superuser.is_superuser
        assert superuser.is_active

    def test_user_str_representation(self, create_user):
        """Test user string representation."""
        user = create_user(email="str@example.com")
        assert str(user) == "str@example.com"

    def test_get_full_name(self, create_user):
        """Test get_full_name method."""
        user = create_user(
            email="fullname@example.com",
            first_name="John",
            last_name="Doe",
        )
        assert user.get_full_name() == "John Doe"

    def test_get_short_name(self, create_user):
        """Test get_short_name method."""
        user = create_user(
            email="shortname@example.com",
            first_name="Jane",
        )
        assert user.get_short_name() == "Jane"


@pytest.mark.django_db
class TestUserRegistration:
    """Tests for user registration endpoint."""

    def test_user_registration_successful(self, api_client, user_data):
        """Test successful user registration."""
        url = reverse("accounts:register")
        response = api_client.post(url, user_data, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        assert "user" in response.data
        assert response.data["user"]["email"] == user_data["email"]
        assert User.objects.filter(email=user_data["email"]).exists()

    def test_user_registration_password_mismatch(self, api_client, user_data):
        """Test registration fails with password mismatch."""
        user_data["password_confirm"] = "DifferentPass123!"
        url = reverse("accounts:register")
        response = api_client.post(url, user_data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_user_registration_duplicate_email(
        self, api_client, create_user, user_data
    ):
        """Test registration fails with duplicate email."""
        create_user(email=user_data["email"])
        url = reverse("accounts:register")
        response = api_client.post(url, user_data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_user_registration_weak_password(self, api_client, user_data):
        """Test registration fails with weak password."""
        user_data["password"] = "123"
        user_data["password_confirm"] = "123"
        url = reverse("accounts:register")
        response = api_client.post(url, user_data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestUserAuthentication:
    """Tests for user authentication endpoints."""

    def test_login_successful(self, api_client, create_user):
        """Test successful login returns tokens."""
        user = create_user(email="login@example.com", password="SecurePass123!")
        url = reverse("accounts:login")
        response = api_client.post(
            url,
            {"email": "login@example.com", "password": "SecurePass123!"},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        assert "access" in response.data
        assert "refresh" in response.data

    def test_login_invalid_credentials(self, api_client, create_user):
        """Test login fails with invalid credentials."""
        create_user(email="invalid@example.com", password="SecurePass123!")
        url = reverse("accounts:login")
        response = api_client.post(
            url,
            {"email": "invalid@example.com", "password": "WrongPass123!"},
            format="json",
        )

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_token_refresh(self, api_client, create_user):
        """Test token refresh endpoint."""
        create_user(email="refresh@example.com", password="SecurePass123!")
        login_url = reverse("accounts:login")
        login_response = api_client.post(
            login_url,
            {"email": "refresh@example.com", "password": "SecurePass123!"},
            format="json",
        )

        refresh_url = reverse("accounts:token_refresh")
        response = api_client.post(
            refresh_url,
            {"refresh": login_response.data["refresh"]},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        assert "access" in response.data


@pytest.mark.django_db
class TestUserProfile:
    """Tests for user profile endpoints."""

    def test_get_profile_authenticated(self, authenticated_client):
        """Test authenticated user can get their profile."""
        url = reverse("accounts:profile")
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert "email" in response.data

    def test_get_profile_unauthenticated(self, api_client):
        """Test unauthenticated user cannot get profile."""
        url = reverse("accounts:profile")
        response = api_client.get(url)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_update_profile(self, authenticated_client):
        """Test user can update their profile."""
        url = reverse("accounts:profile")
        response = authenticated_client.patch(
            url,
            {"first_name": "Updated", "bio": "New bio"},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.data["first_name"] == "Updated"
        assert response.data["bio"] == "New bio"
