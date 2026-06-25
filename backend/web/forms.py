"""Forms for the server-rendered UI.

These mirror the validation the DRF serializers enforce on the API side
(``accounts/serializers.py``) so the rendered pages behave like the old SPA.
"""

from __future__ import annotations

from django import forms
from django.contrib.auth import get_user_model, password_validation

User = get_user_model()


class RegisterForm(forms.Form):
    """User registration — email + password with confirmation."""

    first_name = forms.CharField(max_length=150, required=False)
    last_name = forms.CharField(max_length=150, required=False)
    email = forms.EmailField()
    password = forms.CharField(widget=forms.PasswordInput)
    password_confirm = forms.CharField(widget=forms.PasswordInput)

    def clean_email(self) -> str:
        email = self.cleaned_data["email"].strip().lower()
        if User.objects.filter(email__iexact=email).exists():
            raise forms.ValidationError("An account with this email already exists.")
        return email

    def clean(self):
        cleaned = super().clean()
        password = cleaned.get("password")
        confirm = cleaned.get("password_confirm")
        if password and confirm and password != confirm:
            self.add_error("password_confirm", "Password fields didn't match.")
        if password:
            try:
                password_validation.validate_password(password)
            except forms.ValidationError as exc:
                self.add_error("password", exc)
        return cleaned

    def save(self) -> "User":
        data = self.cleaned_data
        return User.objects.create_user(
            email=data["email"],
            password=data["password"],
            first_name=data.get("first_name", ""),
            last_name=data.get("last_name", ""),
        )


class ProfileForm(forms.ModelForm):
    """Settings page — edit profile fields (mirrors ProfileUpdateData)."""

    class Meta:
        model = User
        fields = (
            "first_name",
            "last_name",
            "title",
            "bio",
            "github_username",
            "linkedin_url",
            "portfolio_url",
        )
