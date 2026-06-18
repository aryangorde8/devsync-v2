"""
Unit tests for the core app.

This module contains tests for core functionality including
health checks and system-level endpoints.
"""

from django.urls import reverse

from rest_framework import status

import pytest


@pytest.mark.django_db
class TestHealthCheck:
    """Tests for the health check endpoint."""

    def test_health_check_returns_healthy(self, api_client):
        """Test health check returns healthy status."""
        url = reverse("core:health_check")
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data["status"] == "healthy"
        assert "services" in response.data
        assert "database" in response.data["services"]

    def test_health_check_database_status(self, api_client):
        """Test health check includes database status."""
        url = reverse("core:health_check")
        response = api_client.get(url)

        assert response.data["services"]["database"]["status"] == "healthy"

    def test_health_check_version(self, api_client):
        """Test health check includes version."""
        url = reverse("core:health_check")
        response = api_client.get(url)

        assert "version" in response.data
