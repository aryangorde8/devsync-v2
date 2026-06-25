"""Session-auth views for the server-rendered UI.

The old SPA used JWT-in-localStorage against ``/api/v1/auth/``. Server-rendered
pages use Django's session auth instead — same user-facing behaviour (sign in,
land on the dashboard), correct fit for server rendering. The JWT API endpoints
are untouched for any remaining API clients.
"""

from __future__ import annotations

from django.contrib.auth import authenticate, login, logout
from django.shortcuts import redirect, render

from .forms import RegisterForm


def login_view(request):
    if request.user.is_authenticated:
        return redirect("/dashboard")

    error = None
    session_expired = request.GET.get("session_expired") == "true"
    email = ""
    if request.method == "POST":
        email = request.POST.get("email", "").strip().lower()
        password = request.POST.get("password", "")
        user = authenticate(request, username=email, password=password)
        if user is not None:
            login(request, user)
            return redirect(
                request.POST.get("next") or request.GET.get("next") or "/dashboard"
            )
        error = "Invalid credentials. Please try again."

    return render(
        request,
        "web/login.html",
        {
            "error": error,
            "session_expired": session_expired,
            "email": email,
            "next": request.GET.get("next", ""),
        },
    )


def register_view(request):
    if request.user.is_authenticated:
        return redirect("/dashboard")

    form = RegisterForm(request.POST or None)
    if request.method == "POST" and form.is_valid():
        user = form.save()
        authed = authenticate(
            request, username=user.email, password=form.cleaned_data["password"]
        )
        if authed is not None:
            login(request, authed)
        return redirect("/dashboard")

    return render(request, "web/register.html", {"form": form})


def logout_view(request):
    if request.method == "POST":
        logout(request)
    return redirect("/")
