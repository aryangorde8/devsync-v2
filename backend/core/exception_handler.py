"""
Custom exception handler for Django REST Framework.

Provides consistent, enterprise-grade error responses with:
- Standardized error format
- Error codes for programmatic handling
- Request ID for debugging
- Detailed validation errors
"""

import logging
from typing import Any

from django.conf import settings
from django.core.exceptions import PermissionDenied
from django.http import Http404

from rest_framework import exceptions, status
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler

from .exceptions import BaseAPIException, ErrorCode

logger = logging.getLogger("devsync")


def exception_handler(exc: Exception, context: dict) -> Response | None:
    """
    Custom exception handler for DRF.

    Returns a consistent error response format:
    {
        "error": {
            "code": "ERROR_CODE",
            "message": "Human readable message",
            "field": "field_name",  # For validation errors
            "details": {},  # Additional error details
        },
        "errors": [],  # Multiple errors (validation)
        "status": "error",
        "request_id": "uuid",
    }
    """
    # Get request ID for debugging
    request = context.get("request")
    request_id = getattr(request, "request_id", None) if request else None

    # Handle our custom exceptions
    if isinstance(exc, BaseAPIException):
        return _create_error_response(
            code=exc.code,
            message=exc.detail,
            status_code=exc.status_code,
            field=exc.field,
            extra=exc.extra,
            request_id=request_id,
        )

    # Handle DRF validation errors
    if isinstance(exc, exceptions.ValidationError):
        return _handle_validation_error(exc, request_id)

    # Handle DRF authentication errors
    if isinstance(exc, exceptions.NotAuthenticated):
        return _create_error_response(
            code=ErrorCode.AUTH_TOKEN_INVALID,
            message="Authentication credentials were not provided.",
            status_code=status.HTTP_401_UNAUTHORIZED,
            request_id=request_id,
        )

    if isinstance(exc, exceptions.AuthenticationFailed):
        return _create_error_response(
            code=ErrorCode.AUTH_INVALID_CREDENTIALS,
            message=str(exc.detail) if exc.detail else "Authentication failed.",
            status_code=status.HTTP_401_UNAUTHORIZED,
            request_id=request_id,
        )

    # Handle permission denied
    if isinstance(exc, (exceptions.PermissionDenied, PermissionDenied)):
        return _create_error_response(
            code=ErrorCode.AUTH_PERMISSION_DENIED,
            message="You do not have permission to perform this action.",
            status_code=status.HTTP_403_FORBIDDEN,
            request_id=request_id,
        )

    # Handle not found
    if isinstance(exc, (exceptions.NotFound, Http404)):
        return _create_error_response(
            code=ErrorCode.RESOURCE_NOT_FOUND,
            message="The requested resource was not found.",
            status_code=status.HTTP_404_NOT_FOUND,
            request_id=request_id,
        )

    # Handle method not allowed
    if isinstance(exc, exceptions.MethodNotAllowed):
        return _create_error_response(
            code="METHOD_NOT_ALLOWED",
            message=f"Method {exc.detail} is not allowed.",
            status_code=status.HTTP_405_METHOD_NOT_ALLOWED,
            request_id=request_id,
        )

    # Handle throttling
    if isinstance(exc, exceptions.Throttled):
        return _create_error_response(
            code=ErrorCode.RATE_LIMIT_EXCEEDED,
            message=f"Request was throttled. Try again in {exc.wait} seconds.",
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            extra={"retry_after": exc.wait},
            request_id=request_id,
        )

    # Handle parse errors
    if isinstance(exc, exceptions.ParseError):
        return _create_error_response(
            code=ErrorCode.VALIDATION_INVALID_FORMAT,
            message="Unable to parse request body.",
            status_code=status.HTTP_400_BAD_REQUEST,
            request_id=request_id,
        )

    # Let DRF handle other exceptions
    response = drf_exception_handler(exc, context)

    if response is not None:
        # Wrap DRF response in our format
        return _create_error_response(
            code="API_ERROR",
            message=str(exc.detail) if hasattr(exc, "detail") else str(exc),
            status_code=response.status_code,
            request_id=request_id,
        )

    # Log unhandled exceptions
    logger.exception(
        "Unhandled exception in API",
        extra={
            "request_id": request_id,
            "exception_type": type(exc).__name__,
            "path": request.path if request else None,
        },
    )

    # Return generic error in production but include exception type for debugging
    if not settings.DEBUG:
        return _create_error_response(
            code=ErrorCode.INTERNAL_ERROR,
            message="An unexpected error occurred. Please try again later.",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            request_id=request_id,
            extra={"exception_type": type(exc).__name__},
        )

    return None


def _handle_validation_error(
    exc: exceptions.ValidationError,
    request_id: str | None,
) -> Response:
    """Handle DRF validation errors with detailed field information."""
    errors = []

    if isinstance(exc.detail, dict):
        for field, messages in exc.detail.items():
            if isinstance(messages, list):
                for message in messages:
                    errors.append(
                        {
                            "code": ErrorCode.VALIDATION_ERROR,
                            "message": str(message),
                            "field": field if field != "non_field_errors" else None,
                        }
                    )
            else:
                errors.append(
                    {
                        "code": ErrorCode.VALIDATION_ERROR,
                        "message": str(messages),
                        "field": field if field != "non_field_errors" else None,
                    }
                )
    elif isinstance(exc.detail, list):
        for message in exc.detail:
            errors.append(
                {
                    "code": ErrorCode.VALIDATION_ERROR,
                    "message": str(message),
                }
            )
    else:
        errors.append(
            {
                "code": ErrorCode.VALIDATION_ERROR,
                "message": str(exc.detail),
            }
        )

    return Response(
        {
            "error": errors[0] if len(errors) == 1 else None,
            "errors": errors if len(errors) > 1 else None,
            "status": "error",
            "request_id": request_id,
        },
        status=status.HTTP_400_BAD_REQUEST,
    )


def _create_error_response(
    code: str,
    message: str,
    status_code: int,
    field: str = None,
    extra: dict = None,
    request_id: str = None,
) -> Response:
    """Create a standardized error response."""
    error = {
        "code": code,
        "message": message,
    }

    if field:
        error["field"] = field

    if extra:
        error["details"] = extra

    return Response(
        {
            "error": error,
            "status": "error",
            "request_id": request_id,
        },
        status=status_code,
    )
