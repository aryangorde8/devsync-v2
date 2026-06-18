"""
Prometheus Metrics for DevSync
Exposes application metrics for monitoring
"""

import time
from functools import wraps

from django.conf import settings
from django.core.cache import cache
from django.db import connection
from django.http import HttpResponse

# Metrics storage (in production, use prometheus_client library)
_metrics = {
    "http_requests_total": {},
    "http_request_duration_seconds": {},
    "db_query_count": 0,
    "cache_hits": 0,
    "cache_misses": 0,
    "active_users": 0,
}


def get_metrics_text():
    """Generate Prometheus-compatible metrics output."""
    lines = []

    # Application info
    lines.append("# HELP devsync_info Application information")
    lines.append("# TYPE devsync_info gauge")
    lines.append(f'devsync_info{{version="1.0.0",django_version="5.0"}} 1')

    # HTTP request metrics
    lines.append("")
    lines.append("# HELP http_requests_total Total HTTP requests")
    lines.append("# TYPE http_requests_total counter")
    for key, value in _metrics["http_requests_total"].items():
        method, path, status = key.split("|")
        lines.append(
            f'http_requests_total{{method="{method}",path="{path}",status="{status}"}} {value}'
        )

    # Request duration
    lines.append("")
    lines.append(
        "# HELP http_request_duration_seconds HTTP request duration in seconds"
    )
    lines.append("# TYPE http_request_duration_seconds histogram")
    for key, values in _metrics["http_request_duration_seconds"].items():
        method, path = key.split("|")
        if values:
            avg_duration = sum(values) / len(values)
            lines.append(
                f'http_request_duration_seconds_sum{{method="{method}",path="{path}"}} {sum(values):.4f}'
            )
            lines.append(
                f'http_request_duration_seconds_count{{method="{method}",path="{path}"}} {len(values)}'
            )

    # Database metrics
    lines.append("")
    lines.append("# HELP db_queries_total Total database queries")
    lines.append("# TYPE db_queries_total counter")
    lines.append(f'db_queries_total {_metrics["db_query_count"]}')

    # Cache metrics
    lines.append("")
    lines.append("# HELP cache_hits_total Total cache hits")
    lines.append("# TYPE cache_hits_total counter")
    lines.append(f'cache_hits_total {_metrics["cache_hits"]}')

    lines.append("")
    lines.append("# HELP cache_misses_total Total cache misses")
    lines.append("# TYPE cache_misses_total counter")
    lines.append(f'cache_misses_total {_metrics["cache_misses"]}')

    # Database connection pool
    lines.append("")
    lines.append("# HELP db_connection_pool_size Database connection pool size")
    lines.append("# TYPE db_connection_pool_size gauge")
    try:
        from django.db import connections

        pool_size = len(connections.all())
        lines.append(f"db_connection_pool_size {pool_size}")
    except:
        lines.append("db_connection_pool_size 1")

    # Model counts
    lines.append("")
    lines.append("# HELP model_count Total count of model instances")
    lines.append("# TYPE model_count gauge")
    try:
        from accounts.models import CustomUser
        from portfolio.models import Experience, Project, Skill

        lines.append(f'model_count{{model="users"}} {CustomUser.objects.count()}')
        lines.append(f'model_count{{model="projects"}} {Project.objects.count()}')
        lines.append(f'model_count{{model="skills"}} {Skill.objects.count()}')
        lines.append(f'model_count{{model="experiences"}} {Experience.objects.count()}')
    except:
        pass

    # System metrics
    lines.append("")
    lines.append("# HELP python_info Python interpreter information")
    lines.append("# TYPE python_info gauge")
    import sys

    lines.append(f'python_info{{version="{sys.version.split()[0]}"}} 1')

    # Memory usage (if psutil available)
    try:
        import psutil

        process = psutil.Process()
        memory_info = process.memory_info()

        lines.append("")
        lines.append("# HELP process_memory_bytes Process memory usage in bytes")
        lines.append("# TYPE process_memory_bytes gauge")
        lines.append(f'process_memory_bytes{{type="rss"}} {memory_info.rss}')
        lines.append(f'process_memory_bytes{{type="vms"}} {memory_info.vms}')

        lines.append("")
        lines.append("# HELP process_cpu_percent Process CPU usage percentage")
        lines.append("# TYPE process_cpu_percent gauge")
        lines.append(f"process_cpu_percent {process.cpu_percent()}")
    except ImportError:
        pass

    return "\n".join(lines) + "\n"


def record_request(method, path, status, duration):
    """Record HTTP request metrics."""
    key = f"{method}|{path}|{status}"
    _metrics["http_requests_total"][key] = (
        _metrics["http_requests_total"].get(key, 0) + 1
    )

    duration_key = f"{method}|{path}"
    if duration_key not in _metrics["http_request_duration_seconds"]:
        _metrics["http_request_duration_seconds"][duration_key] = []
    _metrics["http_request_duration_seconds"][duration_key].append(duration)

    # Keep only last 1000 duration measurements per endpoint
    if len(_metrics["http_request_duration_seconds"][duration_key]) > 1000:
        _metrics["http_request_duration_seconds"][duration_key] = _metrics[
            "http_request_duration_seconds"
        ][duration_key][-1000:]


def increment_db_queries(count=1):
    """Increment database query counter."""
    _metrics["db_query_count"] += count


def record_cache_hit():
    """Record a cache hit."""
    _metrics["cache_hits"] += 1


def record_cache_miss():
    """Record a cache miss."""
    _metrics["cache_misses"] += 1


class MetricsMiddleware:
    """Middleware to collect request metrics."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        start_time = time.time()

        response = self.get_response(request)

        duration = time.time() - start_time

        # Normalize path (remove IDs for consistent metrics)
        path = request.path
        # Simple path normalization
        import re

        path = re.sub(r"/\d+/", "/{id}/", path)
        path = re.sub(r"/[0-9a-f-]{36}/", "/{uuid}/", path)

        record_request(
            method=request.method,
            path=path,
            status=response.status_code,
            duration=duration,
        )

        return response
