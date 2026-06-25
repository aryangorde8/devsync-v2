"""Public, shareable portfolio page (port of app/portfolio/[username]).

Anonymous-friendly: only public fields are exposed, mirroring the API's
public-vs-private shape rule.
"""

from __future__ import annotations

from django.contrib.auth import get_user_model
from django.http import Http404
from django.shortcuts import render

from portfolio.models import (
    Certification,
    Education,
    Experience,
    Project,
    Skill,
    SocialLink,
)

User = get_user_model()


def _resolve_user(slug: str):
    user = User.objects.filter(username__iexact=slug).first()
    if user is None:
        user = User.objects.filter(email__istartswith=f"{slug}@").first()
    return user


def public_portfolio(request, username: str):
    owner = _resolve_user(username)
    if owner is None or not owner.is_active:
        raise Http404("Portfolio not found")

    context = {
        "owner": owner,
        "projects": list(
            Project.objects.filter(user=owner, is_public=True).prefetch_related(
                "skills"
            )
        ),
        "skills": list(Skill.objects.filter(user=owner)),
        "experiences": list(Experience.objects.filter(user=owner)),
        "education": list(Education.objects.filter(user=owner)),
        "certifications": list(Certification.objects.filter(user=owner)),
        "social_links": list(SocialLink.objects.filter(user=owner, is_visible=True)),
    }
    return render(request, "web/portfolio.html", context)
