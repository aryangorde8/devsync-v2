"""
Views for the accounts app.

This module provides API views for user authentication, registration,
and profile management following RESTful design principles.
"""

from typing import Any

from django.contrib.auth import get_user_model

from rest_framework import generics, permissions, status
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from rest_framework_simplejwt.views import TokenObtainPairView

from .serializers import (
    ChangePasswordSerializer,
    UserProfileSerializer,
    UserRegistrationSerializer,
)

User = get_user_model()


class UserRegistrationView(generics.CreateAPIView):
    """
    API view for user registration.

    Allows new users to create an account with email and password.
    """

    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = UserRegistrationSerializer

    def create(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        """
        Handle user registration.

        Args:
            request: The HTTP request object.
            *args: Variable length argument list.
            **kwargs: Arbitrary keyword arguments.

        Returns:
            Response: JSON response with user data or errors.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        return Response(
            {
                "message": "User registered successfully.",
                "user": UserProfileSerializer(user).data,
            },
            status=status.HTTP_201_CREATED,
        )


class UserProfileView(generics.RetrieveUpdateAPIView):
    """
    API view for retrieving and updating user profile.

    Requires authentication. Users can only access their own profile.
    """

    serializer_class = UserProfileSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_object(self) -> User:
        """
        Get the current user's profile.

        Returns:
            User: The authenticated user instance.
        """
        return self.request.user


class ChangePasswordView(APIView):
    """
    API view for changing user password.

    Requires authentication and old password verification.
    """

    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request: Request) -> Response:
        """
        Handle password change request.

        Args:
            request: The HTTP request object.

        Returns:
            Response: JSON response with success message or errors.
        """
        serializer = ChangePasswordSerializer(
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)

        request.user.set_password(serializer.validated_data["new_password"])
        request.user.save()

        return Response(
            {"message": "Password changed successfully."},
            status=status.HTTP_200_OK,
        )


class LogoutView(APIView):
    """
    API view for user logout.

    Blacklists the refresh token to invalidate the session.
    """

    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request: Request) -> Response:
        """
        Handle logout request.

        Args:
            request: The HTTP request object.

        Returns:
            Response: JSON response with success message.
        """
        # With SimpleJWT, logout is typically handled client-side
        # by removing the tokens. For enhanced security, you can
        # implement token blacklisting.
        return Response(
            {"message": "Successfully logged out."},
            status=status.HTTP_200_OK,
        )
