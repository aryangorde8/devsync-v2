"""
AI Serializers for chat API.

Production-Ready Features:
- Input validation and sanitization
- Length limits
- Proper error messages
"""

import re

from rest_framework import serializers

from .models import Conversation, Message

# Constants
MAX_MESSAGE_LENGTH = 10000
MIN_MESSAGE_LENGTH = 1
MAX_TITLE_LENGTH = 200


def sanitize_text(text: str) -> str:
    """Remove control characters from text."""
    if not text:
        return ""
    # Remove control characters except newlines and tabs
    return re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]", "", text).strip()


class MessageSerializer(serializers.ModelSerializer):
    """Serializer for individual chat messages."""

    class Meta:
        model = Message
        fields = ["id", "role", "content", "created_at", "metadata"]
        read_only_fields = ["id", "created_at", "metadata"]

    def validate_content(self, value):
        """Validate and sanitize message content."""
        value = sanitize_text(value)
        if len(value) > MAX_MESSAGE_LENGTH:
            raise serializers.ValidationError(
                f"Message too long. Maximum {MAX_MESSAGE_LENGTH} characters."
            )
        return value


class ConversationSerializer(serializers.ModelSerializer):
    """Serializer for conversations with messages."""

    messages = MessageSerializer(many=True, read_only=True)
    message_count = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = [
            "id",
            "title",
            "created_at",
            "updated_at",
            "messages",
            "message_count",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_message_count(self, obj):
        # Use cached count if available
        if (
            hasattr(obj, "_prefetched_objects_cache")
            and "messages" in obj._prefetched_objects_cache
        ):
            return len(obj.messages.all())
        return obj.messages.count()

    def validate_title(self, value):
        """Validate and sanitize title."""
        if value:
            value = sanitize_text(value)
            if len(value) > MAX_TITLE_LENGTH:
                raise serializers.ValidationError(
                    f"Title too long. Maximum {MAX_TITLE_LENGTH} characters."
                )
        return value


class ConversationListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for conversation list."""

    message_count = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = [
            "id",
            "title",
            "created_at",
            "updated_at",
            "message_count",
            "last_message",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_message_count(self, obj):
        if (
            hasattr(obj, "_prefetched_objects_cache")
            and "messages" in obj._prefetched_objects_cache
        ):
            return len(obj.messages.all())
        return obj.messages.count()

    def get_last_message(self, obj):
        # Use prefetched data if available
        if (
            hasattr(obj, "_prefetched_objects_cache")
            and "messages" in obj._prefetched_objects_cache
        ):
            messages = list(obj.messages.all())
            last = messages[-1] if messages else None
        else:
            last = obj.messages.last()

        if last:
            return {
                "role": last.role,
                "content": last.content[:100]
                + ("..." if len(last.content) > 100 else ""),
                "created_at": last.created_at,
            }
        return None


class ChatInputSerializer(serializers.Serializer):
    """
    Serializer for chat input.

    Validates:
    - Message length (1-10000 chars)
    - Conversation ID (if provided)
    - Input sanitization
    """

    message = serializers.CharField(
        min_length=MIN_MESSAGE_LENGTH,
        max_length=MAX_MESSAGE_LENGTH,
        error_messages={
            "blank": "Message cannot be empty.",
            "min_length": "Message is too short.",
            "max_length": f"Message too long. Maximum {MAX_MESSAGE_LENGTH} characters.",
        },
    )
    conversation_id = serializers.IntegerField(
        required=False,
        allow_null=True,
        min_value=1,
        error_messages={
            "min_value": "Invalid conversation ID.",
        },
    )

    # Portfolio context - AI can help with portfolio improvements
    include_portfolio_context = serializers.BooleanField(default=False)

    def validate_message(self, value):
        """Validate and sanitize the message."""
        value = sanitize_text(value)

        if not value:
            raise serializers.ValidationError(
                "Message cannot be empty after sanitization."
            )

        if len(value) < MIN_MESSAGE_LENGTH:
            raise serializers.ValidationError("Message is too short.")

        if len(value) > MAX_MESSAGE_LENGTH:
            raise serializers.ValidationError(
                f"Message too long. Maximum {MAX_MESSAGE_LENGTH} characters."
            )

        return value


class ChatResponseSerializer(serializers.Serializer):
    """Serializer for chat response."""

    response = serializers.CharField()
    conversation_id = serializers.IntegerField()
    message_id = serializers.IntegerField()
