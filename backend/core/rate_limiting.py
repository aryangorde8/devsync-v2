"""
Rate Limiting Implementation for DevSync API

Provides multiple rate limiting strategies:
- Token bucket algorithm
- Sliding window counter
- Fixed window counter

Can be applied per-user, per-IP, or globally.
"""

import hashlib
import time
from functools import wraps
from typing import Any, Callable, Optional

from django.core.cache import cache
from django.http import HttpRequest, JsonResponse

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler


class RateLimitExceeded(Exception):
    """Exception raised when rate limit is exceeded."""

    def __init__(self, retry_after: int = 60):
        self.retry_after = retry_after
        super().__init__(f"Rate limit exceeded. Retry after {retry_after} seconds.")


class TokenBucket:
    """
    Token bucket rate limiter.

    Allows burst traffic while enforcing average rate limits.
    Tokens are added to the bucket at a fixed rate.
    Each request consumes one token.
    """

    def __init__(
        self,
        rate: int = 100,  # tokens per interval
        interval: int = 60,  # seconds
        burst: int = 10,  # max burst size
        prefix: str = "token_bucket",
    ):
        self.rate = rate
        self.interval = interval
        self.burst = burst
        self.prefix = prefix
        self.refill_rate = rate / interval  # tokens per second

    def _get_key(self, identifier: str) -> str:
        """Generate cache key for the identifier."""
        return f"{self.prefix}:{identifier}"

    def is_allowed(self, identifier: str) -> tuple[bool, dict]:
        """
        Check if request is allowed.

        Returns:
            Tuple of (allowed, info_dict)
        """
        key = self._get_key(identifier)
        now = time.time()

        # Get current bucket state
        data = cache.get(key)

        if data is None:
            # Initialize bucket
            data = {"tokens": self.rate, "last_update": now}
        else:
            # Refill tokens
            time_passed = now - data["last_update"]
            tokens_to_add = time_passed * self.refill_rate
            data["tokens"] = min(self.rate + self.burst, data["tokens"] + tokens_to_add)
            data["last_update"] = now

        # Check if we have tokens
        if data["tokens"] >= 1:
            data["tokens"] -= 1
            cache.set(key, data, timeout=self.interval * 2)

            return True, {
                "remaining": int(data["tokens"]),
                "limit": self.rate,
                "reset": int(now + self.interval),
            }
        else:
            # Calculate retry after
            tokens_needed = 1 - data["tokens"]
            retry_after = int(tokens_needed / self.refill_rate) + 1

            cache.set(key, data, timeout=self.interval * 2)

            return False, {
                "remaining": 0,
                "limit": self.rate,
                "reset": int(now + retry_after),
                "retry_after": retry_after,
            }


class SlidingWindowCounter:
    """
    Sliding window rate limiter.

    More accurate than fixed window but more memory intensive.
    Tracks requests in a sliding time window.
    """

    def __init__(
        self, rate: int = 100, interval: int = 60, prefix: str = "sliding_window"
    ):
        self.rate = rate
        self.interval = interval
        self.prefix = prefix

    def _get_key(self, identifier: str) -> str:
        return f"{self.prefix}:{identifier}"

    def is_allowed(self, identifier: str) -> tuple[bool, dict]:
        """Check if request is allowed."""
        key = self._get_key(identifier)
        now = time.time()
        window_start = now - self.interval

        # Get current requests
        requests = cache.get(key, [])

        # Remove old requests outside the window
        requests = [r for r in requests if r > window_start]

        if len(requests) < self.rate:
            requests.append(now)
            cache.set(key, requests, timeout=self.interval * 2)

            return True, {
                "remaining": self.rate - len(requests),
                "limit": self.rate,
                "reset": int(now + self.interval),
            }
        else:
            # Find oldest request in window
            oldest = min(requests) if requests else now
            retry_after = int(oldest + self.interval - now) + 1

            return False, {
                "remaining": 0,
                "limit": self.rate,
                "reset": int(oldest + self.interval),
                "retry_after": retry_after,
            }


class FixedWindowCounter:
    """
    Fixed window rate limiter.

    Simple and efficient. May allow 2x burst at window boundaries.
    """

    def __init__(
        self, rate: int = 100, interval: int = 60, prefix: str = "fixed_window"
    ):
        self.rate = rate
        self.interval = interval
        self.prefix = prefix

    def _get_key(self, identifier: str) -> str:
        window = int(time.time() / self.interval)
        return f"{self.prefix}:{identifier}:{window}"

    def is_allowed(self, identifier: str) -> tuple[bool, dict]:
        """Check if request is allowed."""
        key = self._get_key(identifier)
        now = time.time()
        window_end = (int(now / self.interval) + 1) * self.interval

        count = cache.get(key, 0)

        if count < self.rate:
            cache.set(key, count + 1, timeout=self.interval)

            return True, {
                "remaining": self.rate - count - 1,
                "limit": self.rate,
                "reset": int(window_end),
            }
        else:
            return False, {
                "remaining": 0,
                "limit": self.rate,
                "reset": int(window_end),
                "retry_after": int(window_end - now) + 1,
            }


# Rate limit configurations
RATE_LIMITS = {
    # API-wide limits
    "default": {"rate": 1000, "interval": 3600},  # 1000/hour
    "burst": {"rate": 100, "interval": 60},  # 100/minute burst
    # Authentication endpoints (stricter)
    "login": {"rate": 5, "interval": 300},  # 5 per 5 minutes
    "register": {"rate": 3, "interval": 3600},  # 3 per hour
    "password_reset": {"rate": 3, "interval": 3600},
    # Portfolio endpoints
    "portfolio_read": {"rate": 500, "interval": 3600},
    "portfolio_write": {"rate": 100, "interval": 3600},
    # Export/download (resource intensive)
    "export": {"rate": 10, "interval": 3600},
    "pdf_generate": {"rate": 20, "interval": 3600},
    # Contact/messaging
    "contact": {"rate": 10, "interval": 3600},
    "message": {"rate": 50, "interval": 3600},
    # GitHub import
    "github_import": {"rate": 10, "interval": 3600},
}


def get_client_ip(request: HttpRequest) -> str:
    """Extract client IP address from request."""
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        ip = x_forwarded_for.split(",")[0].strip()
    else:
        ip = request.META.get("REMOTE_ADDR", "unknown")
    return ip


def get_rate_limit_identifier(request: HttpRequest, scope: str = "ip") -> str:
    """
    Generate identifier for rate limiting.

    Scopes:
    - 'ip': Rate limit by IP address
    - 'user': Rate limit by authenticated user
    - 'ip_user': Combine IP and user for stricter limits
    """
    if scope == "user" and request.user.is_authenticated:
        return f"user:{request.user.id}"
    elif scope == "ip_user" and request.user.is_authenticated:
        ip = get_client_ip(request)
        return f"user:{request.user.id}:ip:{ip}"
    else:
        return f"ip:{get_client_ip(request)}"


def rate_limit(
    limit_name: str = "default", scope: str = "ip", algorithm: str = "token_bucket"
) -> Callable:
    """
    Decorator to apply rate limiting to a view.

    Args:
        limit_name: Name of rate limit config to use
        scope: 'ip', 'user', or 'ip_user'
        algorithm: 'token_bucket', 'sliding_window', or 'fixed_window'
    """

    def decorator(view_func: Callable) -> Callable:
        @wraps(view_func)
        def wrapper(request: HttpRequest, *args, **kwargs) -> Any:
            # Get rate limit config
            config = RATE_LIMITS.get(limit_name, RATE_LIMITS["default"])

            # Create limiter instance
            if algorithm == "sliding_window":
                limiter = SlidingWindowCounter(
                    rate=config["rate"],
                    interval=config["interval"],
                    prefix=f"ratelimit:{limit_name}",
                )
            elif algorithm == "fixed_window":
                limiter = FixedWindowCounter(
                    rate=config["rate"],
                    interval=config["interval"],
                    prefix=f"ratelimit:{limit_name}",
                )
            else:
                limiter = TokenBucket(
                    rate=config["rate"],
                    interval=config["interval"],
                    prefix=f"ratelimit:{limit_name}",
                )

            # Get identifier
            identifier = get_rate_limit_identifier(request, scope)

            # Check rate limit
            allowed, info = limiter.is_allowed(identifier)

            if not allowed:
                response = JsonResponse(
                    {
                        "success": False,
                        "error": {
                            "code": "RATE_5001",
                            "message": "Rate limit exceeded. Please slow down.",
                            "retry_after": info.get("retry_after", 60),
                        },
                    },
                    status=429,
                )

                response["X-RateLimit-Limit"] = str(info["limit"])
                response["X-RateLimit-Remaining"] = "0"
                response["X-RateLimit-Reset"] = str(info["reset"])
                response["Retry-After"] = str(info.get("retry_after", 60))

                return response

            # Process request
            response = view_func(request, *args, **kwargs)

            # Add rate limit headers to response
            if hasattr(response, "__setitem__"):
                response["X-RateLimit-Limit"] = str(info["limit"])
                response["X-RateLimit-Remaining"] = str(info["remaining"])
                response["X-RateLimit-Reset"] = str(info["reset"])

            return response

        return wrapper

    return decorator


class RateLimitMiddleware:
    """
    Global rate limiting middleware.

    Applies default rate limits to all requests.
    Specific endpoints can have stricter limits via decorators.
    """

    def __init__(self, get_response):
        self.get_response = get_response
        self.limiter = TokenBucket(
            rate=1000, interval=3600, burst=100, prefix="ratelimit:global"
        )

    def __call__(self, request):
        # Skip rate limiting for certain paths
        skip_paths = ["/admin/", "/static/", "/media/", "/health/"]
        if any(request.path.startswith(p) for p in skip_paths):
            return self.get_response(request)

        # Get identifier
        identifier = get_rate_limit_identifier(request, "ip")

        # Check global rate limit
        allowed, info = self.limiter.is_allowed(identifier)

        if not allowed:
            return JsonResponse(
                {
                    "success": False,
                    "error": {
                        "code": "RATE_5001",
                        "message": "Too many requests. Please try again later.",
                        "retry_after": info.get("retry_after", 60),
                    },
                },
                status=429,
            )

        # Process request
        response = self.get_response(request)

        # Add headers
        response["X-RateLimit-Limit"] = str(info["limit"])
        response["X-RateLimit-Remaining"] = str(info["remaining"])
        response["X-RateLimit-Reset"] = str(info["reset"])

        return response


# DRF Throttling classes
from rest_framework.throttling import BaseThrottle


class CustomRateThrottle(BaseThrottle):
    """DRF-compatible throttle using our rate limiting system."""

    rate_name = "default"
    scope = "ip"

    def __init__(self):
        config = RATE_LIMITS.get(self.rate_name, RATE_LIMITS["default"])
        self.limiter = TokenBucket(
            rate=config["rate"],
            interval=config["interval"],
            prefix=f"drf_throttle:{self.rate_name}",
        )

    def allow_request(self, request, view):
        identifier = get_rate_limit_identifier(request, self.scope)
        allowed, self.info = self.limiter.is_allowed(identifier)
        return allowed

    def wait(self):
        return self.info.get("retry_after", 60)


class BurstRateThrottle(CustomRateThrottle):
    rate_name = "burst"


class LoginRateThrottle(CustomRateThrottle):
    rate_name = "login"


class ExportRateThrottle(CustomRateThrottle):
    rate_name = "export"


class ContactRateThrottle(CustomRateThrottle):
    rate_name = "contact"


class GitHubImportThrottle(CustomRateThrottle):
    rate_name = "github_import"
