"""Small template helpers for the server-rendered UI."""

from django import template

register = template.Library()


@register.filter
def startswith(value, prefix):
    """True if ``value`` starts with ``prefix`` (used for sidebar active state)."""
    return str(value).startswith(str(prefix))


@register.filter
def initial(value):
    """First character, uppercased — for avatar fallbacks."""
    text = str(value or "").strip()
    return text[0].upper() if text else "U"
