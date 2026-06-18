"""
Serializers for the accounts app.

This module provides serializers for user registration, authentication,
and profile management following DRF best practices.
"""

from typing import Any, Dict

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password

from rest_framework import serializers
from rest_framework.validators import UniqueValidator

User = get_user_model()


class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Serializer for user registration.

    Handles user creation with email validation and password confirmation.
    """

    email = serializers.EmailField(
        required=True,
        validators=[UniqueValidator(queryset=User.objects.all())],
    )
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        style={"input_type": "password"},
    )
    password_confirm = serializers.CharField(
        write_only=True,
        required=True,
        style={"input_type": "password"},
    )

    class Meta:
        model = User
        fields = (
            "email",
            "password",
            "password_confirm",
            "first_name",
            "last_name",
            "username",
        )
        extra_kwargs = {
            "first_name": {"required": False},
            "last_name": {"required": False},
            "username": {"required": False},
        }

    def validate(self, attrs: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate that passwords match.

        Args:
            attrs: Dictionary of field values.

        Returns:
            Dict[str, Any]: Validated attributes.

        Raises:
            serializers.ValidationError: If passwords don't match.
        """
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError(
                {"password_confirm": "Password fields didn't match."}
            )
        return attrs

    def create(self, validated_data: Dict[str, Any]) -> User:
        """
        Create a new user instance.

        Args:
            validated_data: Validated data from the serializer.

        Returns:
            User: The created user instance.
        """
        validated_data.pop("password_confirm")
        user = User.objects.create_user(**validated_data)
        return user


class UserProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for user profile data.

    Used for retrieving and updating user profile information.
    """

    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "username",
            "first_name",
            "last_name",
            "full_name",
            "title",
            "bio",
            "github_username",
            "linkedin_url",
            "portfolio_url",
            "avatar",
            "is_verified",
            "date_joined",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "email",
            "is_verified",
            "date_joined",
            "updated_at",
        )

    def get_full_name(self, obj: User) -> str:
        """
        Get the user's full name.

        Args:
            obj: User instance.

        Returns:
            str: User's full name.
        """
        return obj.get_full_name()


class ChangePasswordSerializer(serializers.Serializer):
    """
    Serializer for password change endpoint.
    """

    old_password = serializers.CharField(
        required=True,
        style={"input_type": "password"},
    )
    new_password = serializers.CharField(
        required=True,
        validators=[validate_password],
        style={"input_type": "password"},
    )
    new_password_confirm = serializers.CharField(
        required=True,
        style={"input_type": "password"},
    )

    def validate(self, attrs: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate that new passwords match.

        Args:
            attrs: Dictionary of field values.

        Returns:
            Dict[str, Any]: Validated attributes.

        Raises:
            serializers.ValidationError: If passwords don't match.
        """
        if attrs["new_password"] != attrs["new_password_confirm"]:
            raise serializers.ValidationError(
                {"new_password_confirm": "New password fields didn't match."}
            )
        return attrs

    def validate_old_password(self, value: str) -> str:
        """
        Validate the old password.

        Args:
            value: The old password value.

        Returns:
            str: The validated old password.

        Raises:
            serializers.ValidationError: If old password is incorrect.
        """
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Old password is incorrect.")
        return value
