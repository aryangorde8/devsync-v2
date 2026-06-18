"""
Enterprise-grade exception handling and error responses.

This module provides:
- Custom exception classes for business logic errors
- Consistent error response formatting
- Error codes for client-side handling
- Detailed error logging
"""

from rest_framework import status
from rest_framework.exceptions import APIException


class ErrorCode:
    """Standardized error codes for API responses."""

    # Authentication errors (1xxx)
    AUTH_INVALID_CREDENTIALS = "AUTH_1001"
    AUTH_TOKEN_EXPIRED = "AUTH_1002"
    AUTH_TOKEN_INVALID = "AUTH_1003"
    AUTH_PERMISSION_DENIED = "AUTH_1004"
    AUTH_ACCOUNT_DISABLED = "AUTH_1005"
    AUTH_EMAIL_NOT_VERIFIED = "AUTH_1006"

    # Validation errors (2xxx)
    VALIDATION_ERROR = "VAL_2001"
    VALIDATION_REQUIRED_FIELD = "VAL_2002"
    VALIDATION_INVALID_FORMAT = "VAL_2003"
    VALIDATION_DUPLICATE_ENTRY = "VAL_2004"
    VALIDATION_MAX_LENGTH_EXCEEDED = "VAL_2005"

    # Resource errors (3xxx)
    RESOURCE_NOT_FOUND = "RES_3001"
    RESOURCE_ALREADY_EXISTS = "RES_3002"
    RESOURCE_CONFLICT = "RES_3003"
    RESOURCE_LIMIT_EXCEEDED = "RES_3004"

    # External service errors (4xxx)
    EXTERNAL_SERVICE_ERROR = "EXT_4001"
    GITHUB_API_ERROR = "EXT_4002"
    EMAIL_SERVICE_ERROR = "EXT_4003"
    STORAGE_SERVICE_ERROR = "EXT_4004"

    # Rate limiting (5xxx)
    RATE_LIMIT_EXCEEDED = "RATE_5001"
    QUOTA_EXCEEDED = "RATE_5002"

    # Server errors (9xxx)
    INTERNAL_ERROR = "SRV_9001"
    DATABASE_ERROR = "SRV_9002"
    SERVICE_UNAVAILABLE = "SRV_9003"


class BaseAPIException(APIException):
    """Base exception class for all API exceptions."""

    status_code = status.HTTP_400_BAD_REQUEST
    default_code = ErrorCode.VALIDATION_ERROR
    default_detail = "An error occurred."

    def __init__(
        self,
        detail: str = None,
        code: str = None,
        field: str = None,
        extra: dict = None,
    ):
        self.code = code or self.default_code
        self.detail = detail or self.default_detail
        self.field = field
        self.extra = extra or {}
        super().__init__(detail=self.detail, code=self.code)

    def get_full_details(self) -> dict:
        """Return full error details for API response."""
        error = {
            "code": self.code,
            "message": self.detail,
        }
        if self.field:
            error["field"] = self.field
        if self.extra:
            error["details"] = self.extra
        return error


# Authentication Exceptions
class InvalidCredentialsError(BaseAPIException):
    """Raised when login credentials are invalid."""

    status_code = status.HTTP_401_UNAUTHORIZED
    default_code = ErrorCode.AUTH_INVALID_CREDENTIALS
    default_detail = "Invalid email or password."


class TokenExpiredError(BaseAPIException):
    """Raised when authentication token has expired."""

    status_code = status.HTTP_401_UNAUTHORIZED
    default_code = ErrorCode.AUTH_TOKEN_EXPIRED
    default_detail = "Your session has expired. Please log in again."


class TokenInvalidError(BaseAPIException):
    """Raised when authentication token is invalid."""

    status_code = status.HTTP_401_UNAUTHORIZED
    default_code = ErrorCode.AUTH_TOKEN_INVALID
    default_detail = "Invalid authentication token."


class PermissionDeniedError(BaseAPIException):
    """Raised when user doesn't have permission for an action."""

    status_code = status.HTTP_403_FORBIDDEN
    default_code = ErrorCode.AUTH_PERMISSION_DENIED
    default_detail = "You don't have permission to perform this action."


class AccountDisabledError(BaseAPIException):
    """Raised when user account is disabled."""

    status_code = status.HTTP_403_FORBIDDEN
    default_code = ErrorCode.AUTH_ACCOUNT_DISABLED
    default_detail = "Your account has been disabled. Please contact support."


# Validation Exceptions
class ValidationError(BaseAPIException):
    """Raised for general validation errors."""

    status_code = status.HTTP_400_BAD_REQUEST
    default_code = ErrorCode.VALIDATION_ERROR
    default_detail = "The provided data is invalid."


class RequiredFieldError(BaseAPIException):
    """Raised when a required field is missing."""

    status_code = status.HTTP_400_BAD_REQUEST
    default_code = ErrorCode.VALIDATION_REQUIRED_FIELD
    default_detail = "This field is required."


class DuplicateEntryError(BaseAPIException):
    """Raised when trying to create a duplicate entry."""

    status_code = status.HTTP_409_CONFLICT
    default_code = ErrorCode.VALIDATION_DUPLICATE_ENTRY
    default_detail = "An entry with this value already exists."


# Resource Exceptions
class ResourceNotFoundError(BaseAPIException):
    """Raised when a requested resource is not found."""

    status_code = status.HTTP_404_NOT_FOUND
    default_code = ErrorCode.RESOURCE_NOT_FOUND
    default_detail = "The requested resource was not found."


class ResourceConflictError(BaseAPIException):
    """Raised when there's a conflict with the current resource state."""

    status_code = status.HTTP_409_CONFLICT
    default_code = ErrorCode.RESOURCE_CONFLICT
    default_detail = "The request conflicts with the current state of the resource."


class ResourceLimitExceededError(BaseAPIException):
    """Raised when user exceeds resource limits."""

    status_code = status.HTTP_403_FORBIDDEN
    default_code = ErrorCode.RESOURCE_LIMIT_EXCEEDED
    default_detail = "You have reached the maximum limit for this resource."


# External Service Exceptions
class ExternalServiceError(BaseAPIException):
    """Raised when an external service fails."""

    status_code = status.HTTP_502_BAD_GATEWAY
    default_code = ErrorCode.EXTERNAL_SERVICE_ERROR
    default_detail = "An external service is temporarily unavailable."


class GitHubAPIError(BaseAPIException):
    """Raised when GitHub API request fails."""

    status_code = status.HTTP_502_BAD_GATEWAY
    default_code = ErrorCode.GITHUB_API_ERROR
    default_detail = "Failed to communicate with GitHub. Please try again later."


# Rate Limiting Exceptions
class RateLimitExceededError(BaseAPIException):
    """Raised when rate limit is exceeded."""

    status_code = status.HTTP_429_TOO_MANY_REQUESTS
    default_code = ErrorCode.RATE_LIMIT_EXCEEDED
    default_detail = "Too many requests. Please try again later."


class QuotaExceededError(BaseAPIException):
    """Raised when usage quota is exceeded."""

    status_code = status.HTTP_429_TOO_MANY_REQUESTS
    default_code = ErrorCode.QUOTA_EXCEEDED
    default_detail = "You have exceeded your usage quota."


# Server Exceptions
class InternalError(BaseAPIException):
    """Raised for internal server errors."""

    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    default_code = ErrorCode.INTERNAL_ERROR
    default_detail = "An unexpected error occurred. Please try again later."


class DatabaseError(BaseAPIException):
    """Raised for database-related errors."""

    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    default_code = ErrorCode.DATABASE_ERROR
    default_detail = "A database error occurred. Please try again later."


class ServiceUnavailableError(BaseAPIException):
    """Raised when the service is temporarily unavailable."""

    status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    default_code = ErrorCode.SERVICE_UNAVAILABLE
    default_detail = "The service is temporarily unavailable. Please try again later."
