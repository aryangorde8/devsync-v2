"""
API Rate Limiting Configuration for DevSync.

This module provides rate limiting middleware and decorators
to protect API endpoints from abuse.
"""

from functools import wraps
from typing import Callable, Optional

from django.conf import settings
from django.core.cache import cache
from django.http import JsonResponse

from rest_framework import status
from rest_framework.request import Request
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle


class BurstRateThrottle(UserRateThrottle):
    """
    Rate limit for burst requests (short time window).
    Allows 60 requests per minute.
    """

    scope = "burst"
    rate = "60/min"


class SustainedRateThrottle(UserRateThrottle):
    """
    Rate limit for sustained requests (longer time window).
    Allows 1000 requests per hour.
    """

    scope = "sustained"
    rate = "1000/hour"


class AnonBurstRateThrottle(AnonRateThrottle):
    """
    Rate limit for anonymous burst requests.
    Allows 20 requests per minute.
    """

    scope = "anon_burst"
    rate = "20/min"


class AnonSustainedRateThrottle(AnonRateThrottle):
    """
    Rate limit for anonymous sustained requests.
    Allows 100 requests per hour.
    """

    scope = "anon_sustained"
    rate = "100/hour"


class LoginRateThrottle(AnonRateThrottle):
    """
    Strict rate limit for login attempts.
    Allows 5 attempts per minute to prevent brute force.
    """

    scope = "login"
    rate = "5/min"


class RegistrationRateThrottle(AnonRateThrottle):
    """
    Rate limit for registration attempts.
    Allows 3 registrations per hour per IP.
    """

    scope = "registration"
    rate = "3/hour"


class ContactRateThrottle(AnonRateThrottle):
    """
    Rate limit for contact form submissions.
    Allows 5 messages per hour.
    """

    scope = "contact"
    rate = "5/hour"


class ExportRateThrottle(UserRateThrottle):
    """
    Rate limit for export operations (PDF, data export).
    Allows 10 exports per hour.
    """

    scope = "export"
    rate = "10/hour"


class GitHubImportRateThrottle(UserRateThrottle):
    """
    Rate limit for GitHub import operations.
    Allows 5 imports per hour.
    """

    scope = "github_import"
    rate = "5/hour"


def get_client_ip(request: Request) -> str:
    """
    Get client IP address from request.
    Handles X-Forwarded-For header for proxied requests.
    """
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        ip = x_forwarded_for.split(",")[0].strip()
    else:
        ip = request.META.get("REMOTE_ADDR", "")
    return ip


def rate_limit(
    key_prefix: str, limit: int, period: int, block_duration: Optional[int] = None
) -> Callable:
    """
    Custom rate limiting decorator for views.

    Args:
        key_prefix: Unique prefix for cache key
        limit: Maximum number of requests allowed
        period: Time period in seconds
        block_duration: How long to block after limit exceeded (optional)

    Usage:
        @rate_limit('my_view', limit=10, period=60)
        def my_view(request):
            ...
    """

    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(request, *args, **kwargs):
            # Get identifier (user ID or IP)
            if hasattr(request, "user") and request.user.is_authenticated:
                identifier = f"user_{request.user.id}"
            else:
                identifier = f"ip_{get_client_ip(request)}"

            cache_key = f"ratelimit:{key_prefix}:{identifier}"
            block_key = f"ratelimit:block:{key_prefix}:{identifier}"

            # Check if currently blocked
            if cache.get(block_key):
                return JsonResponse(
                    {
                        "error": "Rate limit exceeded. Please try again later.",
                        "retry_after": cache.ttl(block_key) or block_duration or period,
                    },
                    status=status.HTTP_429_TOO_MANY_REQUESTS,
                )

            # Get current request count
            current_count = cache.get(cache_key, 0)

            if current_count >= limit:
                # Block if block_duration is set
                if block_duration:
                    cache.set(block_key, True, block_duration)

                return JsonResponse(
                    {
                        "error": "Rate limit exceeded. Please try again later.",
                        "retry_after": period,
                    },
                    status=status.HTTP_429_TOO_MANY_REQUESTS,
                )

            # Increment counter
            if current_count == 0:
                cache.set(cache_key, 1, period)
            else:
                cache.incr(cache_key)

            return func(request, *args, **kwargs)

        return wrapper

    return decorator


# Default throttle classes for REST Framework settings
DEFAULT_THROTTLE_CLASSES = [
    "core.throttling.BurstRateThrottle",
    "core.throttling.SustainedRateThrottle",
]

DEFAULT_THROTTLE_RATES = {
    "burst": "60/min",
    "sustained": "1000/hour",
    "anon_burst": "20/min",
    "anon_sustained": "100/hour",
    "login": "5/min",
    "registration": "3/hour",
    "contact": "5/hour",
    "export": "10/hour",
    "github_import": "5/hour",
}
