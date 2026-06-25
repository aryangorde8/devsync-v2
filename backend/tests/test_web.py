"""Tests for the server-rendered ``web`` UI (Python/Django frontend rewrite).

These cover the landing page that replaces the former Next.js ``app/page.tsx``.
As more pages are ported (auth, dashboard, portfolio), their view tests join
this module.
"""

import pytest

from web.views import GLYPHS, HUES, _glyph


@pytest.fixture(autouse=True)
def _plain_static_storage(settings):
    """Use non-manifest static storage in tests.

    pytest-django forces ``DEBUG=False``, which activates WhiteNoise's
    ``CompressedManifestStaticFilesStorage`` — that needs a ``collectstatic``
    manifest the test run doesn't build, so ``{% static %}`` would raise. The
    plain storage resolves ``{% static %}`` to ``STATIC_URL + path`` directly,
    exactly as the page serves it in dev (``DEBUG=True``) or after collectstatic.
    """
    settings.STORAGES = {
        "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
        "staticfiles": {
            "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"
        },
    }


@pytest.mark.django_db
class TestLandingPage:
    """The public marketing landing page at ``/``."""

    def test_returns_200(self, client):
        assert client.get("/").status_code == 200

    def test_uses_landing_template(self, client):
        response = client.get("/")
        assert "web/landing.html" in [t.name for t in response.templates]

    def test_renders_hero_and_headline(self, client):
        html = client.get("/").content.decode()
        assert "DevSync - Developer Portfolio Dashboard" in html
        assert "Build a portfolio" in html
        assert "synthesis-gradient-text" in html

    def test_renders_all_six_features(self, client):
        html = client.get("/").content.decode()
        for title in (
            "Projects, beautifully shown",
            "A portfolio worth sharing",
            "ATS-friendly",
            "Know who is looking",
            "Import from GitHub",
            "An AI co-pilot",
        ):
            assert title in html

    def test_renders_three_steps(self, client):
        html = client.get("/").content.decode()
        for step in ("Add your work", "Publish your page", "Get noticed"):
            assert step in html

    def test_renders_nine_glyph_tiles(self, client):
        # 6 feature cards + 3 "how it works" steps each render one glyph tile.
        html = client.get("/").content.decode()
        assert html.count("ds-glyph__tile") == 9

    def test_includes_logo_wall_cta_and_footer(self, client):
        html = client.get("/").content.decode()
        assert "TRUSTED BY DEVS HIRED AT" in html
        assert "Ready to showcase" in html
        assert "© 2026 DevSync" in html

    def test_links_ported_static_assets(self, client):
        html = client.get("/").content.decode()
        assert "/static/web/css/app.css" in html
        assert "/static/web/logos/devsync-64.png" in html

    def test_includes_theme_and_animation(self, client):
        html = client.get("/").content.decode()
        assert "devsync-color-mode" in html  # no-flash theme script
        assert "flux-spin" in html  # ribbon animation carried over


class TestGlyphData:
    """The design data ported from page.tsx into Python."""

    def test_glyph_resolves_known_icon_and_hue(self):
        g = _glyph("github", "coral", 52)
        assert g["path"] == GLYPHS["github"]
        assert g["grad"] == HUES["coral"]["grad"]
        assert g["size"] == 52
        assert g["ico"] == round(52 * 0.46)

    def test_glyph_falls_back_to_defaults(self):
        g = _glyph("does-not-exist", "nope", 40)
        assert g["path"] == GLYPHS["projects"]
        assert g["grad"] == HUES["violet"]["grad"]


# --- shared fixtures ---------------------------------------------------------


@pytest.fixture
def user(django_user_model):
    return django_user_model.objects.create_user(
        email="dev@example.com",
        password="Str0ng!Passw0rd",
        first_name="Dev",
        username="dev",
    )


@pytest.fixture
def auth_client(client, user):
    client.force_login(user)
    return client


# --- public + static pages ---------------------------------------------------


@pytest.mark.django_db
@pytest.mark.parametrize(
    "path", ["/", "/privacy", "/terms", "/offline", "/login", "/register"]
)
def test_public_pages_render(client, path):
    assert client.get(path).status_code == 200


# --- auth --------------------------------------------------------------------


@pytest.mark.django_db
class TestAuth:
    def test_register_creates_user_and_logs_in(self, client, django_user_model):
        resp = client.post(
            "/register",
            {
                "first_name": "Ada",
                "email": "ada@example.com",
                "password": "Str0ng!Passw0rd",
                "password_confirm": "Str0ng!Passw0rd",
            },
        )
        assert resp.status_code == 302
        assert resp.headers["Location"] == "/dashboard"
        assert django_user_model.objects.filter(email="ada@example.com").exists()
        assert "_auth_user_id" in client.session

    def test_register_rejects_mismatched_passwords(self, client, django_user_model):
        resp = client.post(
            "/register",
            {
                "email": "x@example.com",
                "password": "Str0ng!Passw0rd",
                "password_confirm": "different",
            },
        )
        assert resp.status_code == 200  # re-renders form with errors
        assert b"didn&#x27;t match" in resp.content or b"didn't match" in resp.content
        assert not django_user_model.objects.filter(email="x@example.com").exists()

    def test_login_valid_then_invalid(self, client, user):
        resp = client.post(
            "/login", {"email": "dev@example.com", "password": "Str0ng!Passw0rd"}
        )
        assert resp.status_code == 302
        assert "_auth_user_id" in client.session
        client.post("/logout")
        assert "_auth_user_id" not in client.session
        bad = client.post("/login", {"email": "dev@example.com", "password": "nope"})
        assert bad.status_code == 200
        assert b"Invalid credentials" in bad.content

    def test_dashboard_requires_login(self, client):
        resp = client.get("/dashboard")
        assert resp.status_code == 302
        assert "/login" in resp.headers["Location"]


# --- dashboard ---------------------------------------------------------------


DASHBOARD_PATHS = [
    "/dashboard",
    "/dashboard/projects",
    "/dashboard/experience",
    "/dashboard/education",
    "/dashboard/certifications",
    "/dashboard/resume",
    "/dashboard/messages",
    "/dashboard/analytics",
    "/dashboard/activity",
    "/dashboard/ai-assistant",
    "/dashboard/import",
    "/dashboard/share",
    "/dashboard/settings",
]


@pytest.mark.django_db
@pytest.mark.parametrize("path", DASHBOARD_PATHS)
def test_dashboard_pages_render_for_authed_user(auth_client, path):
    assert auth_client.get(path).status_code == 200


@pytest.mark.django_db
class TestDashboardCrud:
    def test_create_and_delete_project(self, auth_client, user):
        from portfolio.models import Project

        auth_client.post(
            "/dashboard/projects",
            {
                "action": "create",
                "title": "My API",
                "short_description": "A REST API",
                "technologies": "Python, Django",
                "status": "completed",
                "is_featured": "on",
            },
        )
        project = Project.objects.get(user=user, title="My API")
        assert project.technologies == ["Python", "Django"]
        assert project.is_featured is True

        auth_client.post("/dashboard/projects", {"action": "delete", "id": project.id})
        assert not Project.objects.filter(pk=project.id).exists()

    def test_settings_saves_profile(self, auth_client, user):
        auth_client.post(
            "/dashboard/settings",
            {
                "first_name": "Dev",
                "last_name": "Eloper",
                "title": "Engineer",
                "bio": "hi",
                "github_username": "dev",
                "linkedin_url": "",
                "portfolio_url": "",
            },
        )
        user.refresh_from_db()
        assert user.title == "Engineer"
        assert user.last_name == "Eloper"


# --- public portfolio --------------------------------------------------------


@pytest.mark.django_db
class TestPublicPortfolio:
    def test_renders_for_existing_user(self, client, user):
        resp = client.get("/portfolio/dev")
        assert resp.status_code == 200
        assert b"Dev" in resp.content

    def test_404_for_unknown_user(self, client):
        assert client.get("/portfolio/ghost").status_code == 404
