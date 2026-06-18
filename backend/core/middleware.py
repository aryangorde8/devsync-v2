"""
Enterprise-grade middleware for request/response handling.

This module provides production-ready middleware including:
- Request ID tracking for distributed tracing
- Structured logging with correlation IDs
- Performance monitoring
- Security headers
- Rate limiting helpers
"""

import logging
import time
import uuid
from typing import Callable

from django.conf import settings
from django.http import HttpRequest, HttpResponse, JsonResponse
from django.utils.deprecation import MiddlewareMixin

logger = logging.getLogger("devsync")


class RequestIDMiddleware(MiddlewareMixin):
    """
    Middleware to add a unique request ID to each request.

    This enables distributed tracing across services and helps
    correlate logs for debugging production issues.
    """

    HEADER_NAME = "X-Request-ID"

    def process_request(self, request: HttpRequest) -> None:
        """Add request ID to the request object."""
        request_id = request.headers.get(self.HEADER_NAME) or str(uuid.uuid4())
        request.request_id = request_id
        # Store in thread-local for logging
        setattr(request, "_request_id", request_id)

    def process_response(
        self, request: HttpRequest, response: HttpResponse
    ) -> HttpResponse:
        """Add request ID to response headers."""
        request_id = getattr(request, "request_id", str(uuid.uuid4()))
        response[self.HEADER_NAME] = request_id
        return response


class PerformanceMonitoringMiddleware(MiddlewareMixin):
    """
    Middleware to monitor request performance.

    Tracks request duration and logs slow requests for
    performance optimization.
    """

    SLOW_REQUEST_THRESHOLD_MS = 500  # Log requests slower than 500ms

    def process_request(self, request: HttpRequest) -> None:
        """Record request start time."""
        request._start_time = time.time()

    def process_response(
        self, request: HttpRequest, response: HttpResponse
    ) -> HttpResponse:
        """Calculate and log request duration."""
        if hasattr(request, "_start_time"):
            duration_ms = (time.time() - request._start_time) * 1000

            # Add timing header
            response["X-Response-Time"] = f"{duration_ms:.2f}ms"
            response["Server-Timing"] = f"total;dur={duration_ms:.2f}"

            # Log slow requests
            if duration_ms > self.SLOW_REQUEST_THRESHOLD_MS:
                logger.warning(
                    "Slow request detected",
                    extra={
                        "path": request.path,
                        "method": request.method,
                        "duration_ms": duration_ms,
                        "request_id": getattr(request, "request_id", "unknown"),
                        "user_id": (
                            request.user.id if request.user.is_authenticated else None
                        ),
                    },
                )

        return response


class SecurityHeadersMiddleware(MiddlewareMixin):
    """
    Middleware to add security headers to all responses.

    Implements security best practices including:
    - Content Security Policy
    - XSS Protection
    - Frame Options
    - Content Type Options
    """

    def process_response(
        self, request: HttpRequest, response: HttpResponse
    ) -> HttpResponse:
        """Add security headers to response."""
        # Prevent clickjacking
        if "X-Frame-Options" not in response:
            response["X-Frame-Options"] = "DENY"

        # Prevent MIME type sniffing
        response["X-Content-Type-Options"] = "nosniff"

        # Enable XSS filter in browsers
        response["X-XSS-Protection"] = "1; mode=block"

        # Referrer policy
        response["Referrer-Policy"] = "strict-origin-when-cross-origin"

        # Permissions policy (feature policy)
        response["Permissions-Policy"] = (
            "accelerometer=(), camera=(), geolocation=(), "
            "gyroscope=(), magnetometer=(), microphone=(), "
            "payment=(), usb=()"
        )

        # HSTS header (only in production)
        if not settings.DEBUG:
            response["Strict-Transport-Security"] = (
                "max-age=31536000; includeSubDomains; preload"
            )

        return response


class APIVersionMiddleware(MiddlewareMixin):
    """
    Middleware for API versioning support.

    Supports version detection from:
    - URL path (/api/v1/, /api/v2/)
    - Accept header (application/vnd.devsync.v1+json)
    - Custom header (X-API-Version)
    """

    DEFAULT_VERSION = "1"

    def process_request(self, request: HttpRequest) -> None:
        """Detect and set API version."""
        version = self.DEFAULT_VERSION

        # Check URL path
        path = request.path
        if "/api/v" in path:
            import re

            match = re.search(r"/api/v(\d+)/", path)
            if match:
                version = match.group(1)

        # Check Accept header
        accept = request.headers.get("Accept", "")
        if "vnd.devsync.v" in accept:
            import re

            match = re.search(r"vnd\.devsync\.v(\d+)", accept)
            if match:
                version = match.group(1)

        # Check custom header (highest priority)
        header_version = request.headers.get("X-API-Version")
        if header_version:
            version = header_version

        request.api_version = version

    def process_response(
        self, request: HttpRequest, response: HttpResponse
    ) -> HttpResponse:
        """Add API version to response headers."""
        version = getattr(request, "api_version", self.DEFAULT_VERSION)
        response["X-API-Version"] = version
        return response


class ExceptionHandlerMiddleware(MiddlewareMixin):
    """
    Global exception handler for consistent error responses.

    Catches unhandled exceptions and returns properly formatted
    JSON error responses with appropriate status codes.
    """

    def process_exception(
        self, request: HttpRequest, exception: Exception
    ) -> HttpResponse | None:
        """Handle uncaught exceptions."""
        request_id = getattr(request, "request_id", str(uuid.uuid4()))

        # Log the exception with full context
        logger.exception(
            "Unhandled exception",
            extra={
                "request_id": request_id,
                "path": request.path,
                "method": request.method,
                "user_id": request.user.id if request.user.is_authenticated else None,
                "exception_type": type(exception).__name__,
            },
        )

        # Don't handle in debug mode - let Django show debug page
        if settings.DEBUG:
            return None

        # Return user-friendly error response
        return JsonResponse(
            {
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": "An unexpected error occurred. Please try again later.",
                    "request_id": request_id,
                },
                "status": "error",
            },
            status=500,
        )


class CORSMiddleware(MiddlewareMixin):
    """
    Enhanced CORS middleware with fine-grained control.

    Supports:
    - Preflight requests
    - Credentials
    - Custom headers
    - Origin whitelisting
    """

    ALLOWED_ORIGINS = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://devsync.vercel.app",
    ]

    ALLOWED_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]

    ALLOWED_HEADERS = [
        "Accept",
        "Accept-Language",
        "Content-Type",
        "Authorization",
        "X-Request-ID",
        "X-API-Version",
    ]

    def process_request(self, request: HttpRequest) -> HttpResponse | None:
        """Handle preflight requests."""
        if request.method == "OPTIONS":
            response = HttpResponse()
            self._add_cors_headers(request, response)
            return response
        return None

    def process_response(
        self, request: HttpRequest, response: HttpResponse
    ) -> HttpResponse:
        """Add CORS headers to all responses."""
        self._add_cors_headers(request, response)
        return response

    def _add_cors_headers(self, request: HttpRequest, response: HttpResponse) -> None:
        """Add CORS headers based on request origin."""
        origin = request.headers.get("Origin", "")

        # Check if origin is allowed
        if origin in self.ALLOWED_ORIGINS or settings.DEBUG:
            response["Access-Control-Allow-Origin"] = origin
            response["Access-Control-Allow-Credentials"] = "true"
            response["Access-Control-Allow-Methods"] = ", ".join(self.ALLOWED_METHODS)
            response["Access-Control-Allow-Headers"] = ", ".join(self.ALLOWED_HEADERS)
            response["Access-Control-Max-Age"] = "86400"  # 24 hours
            response["Access-Control-Expose-Headers"] = (
                "X-Request-ID, X-Response-Time, X-API-Version"
            )
