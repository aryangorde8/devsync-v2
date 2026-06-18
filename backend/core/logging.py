"""
Structured Logging Configuration for DevSync.

This module provides structured logging with JSON format,
correlation IDs, and context enrichment for production debugging.
"""

import json
import logging
import sys
import traceback
import uuid
from datetime import datetime
from functools import wraps
from typing import Any, Callable, Dict, Optional

from django.conf import settings


class CorrelationIdFilter(logging.Filter):
    """
    Logging filter that adds correlation ID to log records.
    """

    _correlation_id: Optional[str] = None

    @classmethod
    def set_correlation_id(cls, correlation_id: str) -> None:
        """Set the correlation ID for the current request."""
        cls._correlation_id = correlation_id

    @classmethod
    def get_correlation_id(cls) -> str:
        """Get the current correlation ID or generate a new one."""
        if cls._correlation_id is None:
            cls._correlation_id = str(uuid.uuid4())
        return cls._correlation_id

    @classmethod
    def clear_correlation_id(cls) -> None:
        """Clear the correlation ID after request processing."""
        cls._correlation_id = None

    def filter(self, record: logging.LogRecord) -> bool:
        """Add correlation_id to the log record."""
        record.correlation_id = self.get_correlation_id()
        return True


class JsonFormatter(logging.Formatter):
    """
    JSON log formatter for structured logging.
    Outputs logs in JSON format for easy parsing by log aggregators.
    """

    def format(self, record: logging.LogRecord) -> str:
        """Format log record as JSON."""
        log_data: Dict[str, Any] = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "correlation_id": getattr(record, "correlation_id", None),
        }

        # Add location info
        log_data["location"] = {
            "file": record.filename,
            "line": record.lineno,
            "function": record.funcName,
        }

        # Add exception info if present
        if record.exc_info:
            log_data["exception"] = {
                "type": record.exc_info[0].__name__ if record.exc_info[0] else None,
                "message": str(record.exc_info[1]) if record.exc_info[1] else None,
                "traceback": traceback.format_exception(*record.exc_info),
            }

        # Add extra fields
        extra_fields = {
            key: value
            for key, value in record.__dict__.items()
            if key
            not in {
                "name",
                "msg",
                "args",
                "created",
                "filename",
                "funcName",
                "levelname",
                "levelno",
                "lineno",
                "module",
                "msecs",
                "pathname",
                "process",
                "processName",
                "relativeCreated",
                "stack_info",
                "exc_info",
                "exc_text",
                "message",
                "correlation_id",
                "taskName",
            }
        }
        if extra_fields:
            log_data["extra"] = extra_fields

        return json.dumps(log_data, default=str)


class DevSyncLogger:
    """
    Custom logger wrapper with convenience methods for structured logging.
    """

    def __init__(self, name: str = "devsync"):
        self.logger = logging.getLogger(name)

    def _log(self, level: int, message: str, **kwargs: Any) -> None:
        """Internal log method with extra context."""
        self.logger.log(level, message, extra=kwargs)

    def debug(self, message: str, **kwargs: Any) -> None:
        """Log debug message."""
        self._log(logging.DEBUG, message, **kwargs)

    def info(self, message: str, **kwargs: Any) -> None:
        """Log info message."""
        self._log(logging.INFO, message, **kwargs)

    def warning(self, message: str, **kwargs: Any) -> None:
        """Log warning message."""
        self._log(logging.WARNING, message, **kwargs)

    def error(self, message: str, **kwargs: Any) -> None:
        """Log error message."""
        self._log(logging.ERROR, message, **kwargs)

    def critical(self, message: str, **kwargs: Any) -> None:
        """Log critical message."""
        self._log(logging.CRITICAL, message, **kwargs)

    def exception(self, message: str, **kwargs: Any) -> None:
        """Log exception with traceback."""
        self.logger.exception(message, extra=kwargs)

    # Convenience methods for common operations
    def request_started(
        self,
        method: str,
        path: str,
        user_id: Optional[int] = None,
        ip_address: Optional[str] = None,
        **kwargs: Any,
    ) -> None:
        """Log request started."""
        self.info(
            f"Request started: {method} {path}",
            event="request_started",
            method=method,
            path=path,
            user_id=user_id,
            ip_address=ip_address,
            **kwargs,
        )

    def request_completed(
        self,
        method: str,
        path: str,
        status_code: int,
        duration_ms: float,
        **kwargs: Any,
    ) -> None:
        """Log request completed."""
        level = logging.INFO if status_code < 400 else logging.WARNING
        self._log(
            level,
            f"Request completed: {method} {path} - {status_code} ({duration_ms:.2f}ms)",
            event="request_completed",
            method=method,
            path=path,
            status_code=status_code,
            duration_ms=duration_ms,
            **kwargs,
        )

    def user_action(
        self,
        action: str,
        user_id: int,
        resource_type: str,
        resource_id: Optional[int] = None,
        **kwargs: Any,
    ) -> None:
        """Log user action."""
        self.info(
            f"User action: {action} on {resource_type}",
            event="user_action",
            action=action,
            user_id=user_id,
            resource_type=resource_type,
            resource_id=resource_id,
            **kwargs,
        )

    def security_event(
        self,
        event_type: str,
        ip_address: str,
        user_id: Optional[int] = None,
        details: Optional[str] = None,
        **kwargs: Any,
    ) -> None:
        """Log security-related event."""
        self.warning(
            f"Security event: {event_type}",
            event="security",
            event_type=event_type,
            ip_address=ip_address,
            user_id=user_id,
            details=details,
            **kwargs,
        )

    def database_query(
        self,
        query_type: str,
        table: str,
        duration_ms: float,
        rows_affected: Optional[int] = None,
        **kwargs: Any,
    ) -> None:
        """Log database query (use sparingly in production)."""
        self.debug(
            f"DB query: {query_type} on {table} ({duration_ms:.2f}ms)",
            event="database_query",
            query_type=query_type,
            table=table,
            duration_ms=duration_ms,
            rows_affected=rows_affected,
            **kwargs,
        )

    def external_api_call(
        self,
        service: str,
        endpoint: str,
        method: str,
        status_code: int,
        duration_ms: float,
        **kwargs: Any,
    ) -> None:
        """Log external API call."""
        level = logging.INFO if status_code < 400 else logging.WARNING
        self._log(
            level,
            f"External API: {service} {method} {endpoint} - {status_code}",
            event="external_api",
            service=service,
            endpoint=endpoint,
            method=method,
            status_code=status_code,
            duration_ms=duration_ms,
            **kwargs,
        )


def log_function_call(logger: Optional[DevSyncLogger] = None) -> Callable:
    """
    Decorator to log function calls with timing.

    Usage:
        @log_function_call()
        def my_function():
            ...
    """
    if logger is None:
        logger = DevSyncLogger()

    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            import time

            start_time = time.time()

            try:
                result = func(*args, **kwargs)
                duration_ms = (time.time() - start_time) * 1000
                logger.debug(
                    f"Function completed: {func.__name__}",
                    event="function_call",
                    function=func.__name__,
                    duration_ms=duration_ms,
                    success=True,
                )
                return result
            except Exception as e:
                duration_ms = (time.time() - start_time) * 1000
                logger.error(
                    f"Function failed: {func.__name__}",
                    event="function_call",
                    function=func.__name__,
                    duration_ms=duration_ms,
                    success=False,
                    error=str(e),
                )
                raise

        return wrapper

    return decorator


# Configure logging for Django
LOGGING_CONFIG = {
    "version": 1,
    "disable_existing_loggers": False,
    "filters": {
        "correlation_id": {
            "()": CorrelationIdFilter,
        },
    },
    "formatters": {
        "json": {
            "()": JsonFormatter,
        },
        "verbose": {
            "format": "[{asctime}] {levelname} [{correlation_id}] {name}: {message}",
            "style": "{",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "stream": sys.stdout,
            "formatter": "verbose",
            "filters": ["correlation_id"],
        },
        "json_console": {
            "class": "logging.StreamHandler",
            "stream": sys.stdout,
            "formatter": "json",
            "filters": ["correlation_id"],
        },
    },
    "root": {
        "handlers": ["console"],
        "level": "INFO",
    },
    "loggers": {
        "django": {
            "handlers": ["console"],
            "level": "INFO",
            "propagate": False,
        },
        "django.request": {
            "handlers": ["console"],
            "level": "WARNING",
            "propagate": False,
        },
        "devsync": {
            "handlers": ["console"],
            "level": "DEBUG",
            "propagate": False,
        },
    },
}

# Global logger instance
logger = DevSyncLogger()
