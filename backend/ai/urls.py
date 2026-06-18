"""
AI URL Configuration.
"""

from django.urls import include, path

from rest_framework.routers import DefaultRouter

from .views import ChatViewSet, ConversationViewSet

router = DefaultRouter()
router.register(r"conversations", ConversationViewSet, basename="conversation")
router.register(r"chat", ChatViewSet, basename="chat")

urlpatterns = [
    path("", include(router.urls)),
]
