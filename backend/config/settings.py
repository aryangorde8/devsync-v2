"""
Django settings for DevSync project.

Production-grade configuration following Meta Backend and IBM DevOps standards.
Uses environment variables for all sensitive data.

For more information on this file, see
https://docs.djangoproject.com/en/5.0/topics/settings/
"""

import os
from datetime import timedelta
from pathlib import Path
from typing import List

from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent


# =============================================================================
# SECURITY SETTINGS
# =============================================================================

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY: str = os.getenv(
    "DJANGO_SECRET_KEY",
    "django-insecure-change-me-in-production-use-a-real-secret-key",
)

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG: bool = os.getenv("DJANGO_DEBUG", "True").lower() in ("true", "1", "yes")

ALLOWED_HOSTS: List[str] = os.getenv(
    "DJANGO_ALLOWED_HOSTS",
    "localhost,127.0.0.1,0.0.0.0",
).split(",")


# Parse comma-separated URL env vars while tolerating whitespace.
def _parse_csv_env(var_name: str, default: str) -> List[str]:
    return [
        item.strip() for item in os.getenv(var_name, default).split(",") if item.strip()
    ]


# CSRF and CORS settings
CSRF_TRUSTED_ORIGINS: List[str] = _parse_csv_env(
    "DJANGO_CSRF_TRUSTED_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001,https://frontend-one-zeta-66.vercel.app,https://devsync-dun.vercel.app,https://devsync-frontend.vercel.app",
)

# The server-rendered UI is served from this domain and POSTs forms (login,
# register, dashboard CRUD, logout). The apex domain must therefore be an
# allowed host AND a trusted CSRF origin, even if the deploy env omits it.
PRIMARY_DOMAIN = "devsync.aryangorde.com"
if PRIMARY_DOMAIN not in ALLOWED_HOSTS:
    ALLOWED_HOSTS.append(PRIMARY_DOMAIN)
if f"https://{PRIMARY_DOMAIN}" not in CSRF_TRUSTED_ORIGINS:
    CSRF_TRUSTED_ORIGINS.append(f"https://{PRIMARY_DOMAIN}")

# CORS Configuration - Allow Vercel frontend domains
CORS_ALLOWED_ORIGINS: List[str] = _parse_csv_env(
    "CORS_ALLOWED_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001,https://frontend-one-zeta-66.vercel.app,https://devsync-dun.vercel.app,https://devsync-frontend.vercel.app",
)

# Always include Vercel domains even if env var is set
VERCEL_ORIGINS = [
    "https://frontend-one-zeta-66.vercel.app",
    "https://devsync-dun.vercel.app",
    "https://devsync-frontend.vercel.app",
]
for origin in VERCEL_ORIGINS:
    if origin not in CORS_ALLOWED_ORIGINS:
        CORS_ALLOWED_ORIGINS.append(origin)

CORS_ALLOW_CREDENTIALS: bool = True
CORS_ALLOW_METHODS: List[str] = [
    "DELETE",
    "GET",
    "OPTIONS",
    "PATCH",
    "POST",
    "PUT",
]
CORS_ALLOW_HEADERS: List[str] = [
    "accept",
    "accept-encoding",
    "authorization",
    "content-type",
    "dnt",
    "origin",
    "user-agent",
    "x-csrftoken",
    "x-requested-with",
]

# Allow all origins in development
CORS_ALLOW_ALL_ORIGINS: bool = DEBUG


# =============================================================================
# APPLICATION DEFINITION
# =============================================================================

DJANGO_APPS: List[str] = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
]

THIRD_PARTY_APPS: List[str] = [
    "rest_framework",
    "rest_framework_simplejwt",
    "corsheaders",
    "drf_spectacular",
]

LOCAL_APPS: List[str] = [
    "accounts.apps.AccountsConfig",
    "core.apps.CoreConfig",
    "portfolio.apps.PortfolioConfig",
    "ai.apps.AiConfig",
    "web.apps.WebConfig",
]

INSTALLED_APPS: List[str] = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS


MIDDLEWARE: List[str] = [
    "corsheaders.middleware.CorsMiddleware",  # MUST be first for CORS to work
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",  # Serve static files (FREE, no Nginx needed)
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"


# =============================================================================
# DATABASE CONFIGURATION
# =============================================================================

# PyMySQL as MySQLdb replacement (for PythonAnywhere)
try:
    import pymysql

    pymysql.install_as_MySQLdb()
except ImportError:
    pass

# Use SQLite for development (free), PostgreSQL/MySQL for production
DATABASE_URL = os.getenv("DATABASE_URL", "")

if DATABASE_URL:
    # Production: Parse DATABASE_URL (works with Render, Railway, PythonAnywhere)
    import dj_database_url

    DATABASES = {"default": dj_database_url.parse(DATABASE_URL, conn_max_age=600)}
elif os.getenv("USE_POSTGRES", "False").lower() in ("true", "1", "yes"):
    # Optional PostgreSQL for local development
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": os.getenv("POSTGRES_DB", "devsync_db"),
            "USER": os.getenv("POSTGRES_USER", "devsync_user"),
            "PASSWORD": os.getenv("POSTGRES_PASSWORD", "devsync_password"),
            "HOST": os.getenv("POSTGRES_HOST", "localhost"),
            "PORT": os.getenv("POSTGRES_PORT", "5432"),
            "CONN_MAX_AGE": 60,
        }
    }
else:
    # Default: SQLite for local development (FREE, no setup required)
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }


# =============================================================================
# CACHING (Optional Redis - defaults to local memory cache for FREE)
# =============================================================================

REDIS_URL = os.getenv("REDIS_URL", "")

if REDIS_URL:
    CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.redis.RedisCache",
            "LOCATION": REDIS_URL,
        }
    }
else:
    # FREE: Use local memory cache (no Redis required)
    CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
            "LOCATION": "unique-snowflake",
        }
    }


# =============================================================================
# CELERY CONFIGURATION (Optional - disabled by default for FREE setup)
# =============================================================================

USE_CELERY: bool = os.getenv("USE_CELERY", "False").lower() in ("true", "1", "yes")

if USE_CELERY and REDIS_URL:
    CELERY_BROKER_URL: str = REDIS_URL
    CELERY_RESULT_BACKEND: str = REDIS_URL
    CELERY_ACCEPT_CONTENT: List[str] = ["json"]
    CELERY_TASK_SERIALIZER: str = "json"
    CELERY_RESULT_SERIALIZER: str = "json"
    CELERY_TIMEZONE: str = "UTC"
    CELERY_TASK_TRACK_STARTED: bool = True
    CELERY_TASK_TIME_LIMIT: int = 30 * 60  # 30 minutes


# =============================================================================
# AUTHENTICATION
# =============================================================================

AUTH_USER_MODEL = "accounts.CustomUser"

# Server-rendered UI (the `web` app) uses Django session auth.
LOGIN_URL = "/login"
LOGIN_REDIRECT_URL = "/dashboard"
LOGOUT_REDIRECT_URL = "/"

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
        "OPTIONS": {"min_length": 8},
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]


# =============================================================================
# DJANGO REST FRAMEWORK
# =============================================================================

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": ("rest_framework.permissions.IsAuthenticated",),
    "DEFAULT_RENDERER_CLASSES": ("rest_framework.renderers.JSONRenderer",),
    "DEFAULT_PARSER_CLASSES": (
        "rest_framework.parsers.JSONParser",
        "rest_framework.parsers.MultiPartParser",
        "rest_framework.parsers.FormParser",
    ),
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 20,
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    # Custom throttle classes for better rate limiting
    "DEFAULT_THROTTLE_CLASSES": [
        "core.throttling.BurstRateThrottle",
        "core.throttling.SustainedRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        # Production throttle rates (stricter when DEBUG=False)
        "burst": "60/min" if not DEBUG else "300/min",
        "sustained": "1000/hour" if not DEBUG else "5000/hour",
        "login": "5/min" if not DEBUG else "20/min",
        "registration": "3/hour" if not DEBUG else "10/hour",
        "export": "10/hour" if not DEBUG else "30/hour",
        # Default rates
        "anon": "100/hour" if not DEBUG else "500/hour",
        "user": "1000/hour" if not DEBUG else "5000/hour",
    },
}


# =============================================================================
# SIMPLE JWT CONFIGURATION
# =============================================================================

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=30),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "UPDATE_LAST_LOGIN": True,
    "ALGORITHM": "HS256",
    "SIGNING_KEY": SECRET_KEY,
    "AUTH_HEADER_TYPES": ("Bearer",),
    "AUTH_HEADER_NAME": "HTTP_AUTHORIZATION",
    "USER_ID_FIELD": "id",
    "USER_ID_CLAIM": "user_id",
}


# =============================================================================
# DRF SPECTACULAR (OPENAPI/SWAGGER)
# =============================================================================

SPECTACULAR_SETTINGS = {
    "TITLE": "DevSync API",
    "DESCRIPTION": "API documentation for the DevSync Developer Portfolio Dashboard",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
    "CONTACT": {
        "name": "DevSync Support",
        "email": "support@devsync.dev",
    },
    "LICENSE": {
        "name": "MIT License",
    },
    "SWAGGER_UI_SETTINGS": {
        "deepLinking": True,
        "persistAuthorization": True,
    },
}


# =============================================================================
# INTERNATIONALIZATION
# =============================================================================

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True


# =============================================================================
# STATIC AND MEDIA FILES
# =============================================================================

STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_DIRS = [BASE_DIR / "static"]

# WhiteNoise for serving static files (FREE, no Nginx/CDN needed)
STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"


# =============================================================================
# DEFAULT PRIMARY KEY FIELD TYPE
# =============================================================================

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"


# =============================================================================
# LOGGING CONFIGURATION
# =============================================================================

# On cloud platforms (Render, etc.), use console-only logging
# File logging is only used in local development
ENABLE_FILE_LOGGING = os.getenv(
    "ENABLE_FILE_LOGGING", "True" if DEBUG else "False"
).lower() in ("true", "1", "yes")

_log_handlers = {
    "console": {
        "level": "INFO",
        "class": "logging.StreamHandler",
        "formatter": "simple",
    },
    "console_production": {
        "level": "INFO",
        "class": "logging.StreamHandler",
        "formatter": "verbose",
    },
}

if ENABLE_FILE_LOGGING:
    LOGS_DIR = BASE_DIR / "logs"
    LOGS_DIR.mkdir(exist_ok=True)
    _log_handlers["file"] = {
        "level": "WARNING",
        "class": "logging.handlers.RotatingFileHandler",
        "filename": LOGS_DIR / "django.log",
        "maxBytes": 10485760,  # 10MB
        "backupCount": 5,
        "formatter": "verbose",
    }

# Pick active handlers based on environment
_active_handlers = ["console"] if DEBUG else ["console_production"]
if ENABLE_FILE_LOGGING:
    _active_handlers.append("file")

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "{levelname} {asctime} {module} {process:d} {thread:d} {message}",
            "style": "{",
        },
        "simple": {
            "format": "{levelname} {message}",
            "style": "{",
        },
    },
    "handlers": _log_handlers,
    "root": {
        "handlers": _active_handlers,
        "level": "WARNING",
    },
    "loggers": {
        "django": {
            "handlers": _active_handlers,
            "propagate": True,
        },
        "django.request": {
            "handlers": _active_handlers,
            "level": "ERROR",
            "propagate": False,
        },
        "devsync": {
            "handlers": _active_handlers,
            "level": "DEBUG" if DEBUG else "INFO",
            "propagate": False,
        },
    },
}


# =============================================================================
# SENTRY CONFIGURATION (Error Monitoring)
# =============================================================================

SENTRY_DSN = os.getenv("SENTRY_DSN", "")

if SENTRY_DSN and not DEBUG:
    import sentry_sdk
    from sentry_sdk.integrations.celery import CeleryIntegration
    from sentry_sdk.integrations.django import DjangoIntegration
    from sentry_sdk.integrations.redis import RedisIntegration

    sentry_sdk.init(
        dsn=SENTRY_DSN,
        integrations=[
            DjangoIntegration(),
            CeleryIntegration(),
            RedisIntegration(),
        ],
        traces_sample_rate=0.1,  # 10% of transactions for performance monitoring
        send_default_pii=False,  # Don't send personally identifiable information
        environment=os.getenv("SENTRY_ENVIRONMENT", "production"),
    )


# =============================================================================
# SECURITY SETTINGS FOR PRODUCTION
# =============================================================================

if not DEBUG:
    # HTTPS settings
    SECURE_SSL_REDIRECT = os.getenv("SECURE_SSL_REDIRECT", "True").lower() in (
        "true",
        "1",
        "yes",
    )
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True

    # HSTS settings
    SECURE_HSTS_SECONDS = 31536000  # 1 year
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True

    # Other security settings
    SECURE_CONTENT_TYPE_NOSNIFF = True
    SECURE_BROWSER_XSS_FILTER = True
    X_FRAME_OPTIONS = "DENY"
