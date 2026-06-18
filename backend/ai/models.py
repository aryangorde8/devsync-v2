"""
AI Models for conversation history.

Production-Ready Features:
- Proper database indexes for query performance
- Constraints for data integrity
- Efficient query patterns
"""

from django.conf import settings
from django.db import models


class Conversation(models.Model):
    """
    Store conversation sessions with the AI assistant.

    Indexes:
    - user + updated_at for efficient list queries
    - created_at for time-based queries
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="ai_conversations",
        db_index=True,
    )
    title = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Soft delete support for data retention
    is_deleted = models.BooleanField(default=False)

    class Meta:
        ordering = ["-updated_at"]
        verbose_name = "Conversation"
        verbose_name_plural = "Conversations"
        indexes = [
            # Composite index for user's conversation list
            models.Index(
                fields=["user", "-updated_at"], name="ai_conv_user_updated_idx"
            ),
            # For cleanup queries
            models.Index(
                fields=["is_deleted", "updated_at"], name="ai_conv_deleted_idx"
            ),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.title or 'Untitled'}"

    def save(self, *args, **kwargs):
        # Auto-generate title from first message if not set
        if not self.title and self.pk:
            first_message = self.messages.filter(role="user").first()
            if first_message:
                self.title = first_message.content[:50] + (
                    "..." if len(first_message.content) > 50 else ""
                )
        super().save(*args, **kwargs)

    @property
    def message_count(self) -> int:
        """Get cached message count."""
        return self.messages.count()

    def get_recent_messages(self, limit: int = 20):
        """Get recent messages efficiently."""
        return self.messages.order_by("-created_at")[:limit][::-1]


class Message(models.Model):
    """
    Store individual messages in a conversation.

    Indexes:
    - conversation + created_at for efficient message retrieval
    - role for filtering user/assistant messages
    """

    ROLE_CHOICES = [
        ("user", "User"),
        ("assistant", "Assistant"),
        ("system", "System"),
    ]

    conversation = models.ForeignKey(
        Conversation, on_delete=models.CASCADE, related_name="messages", db_index=True
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, db_index=True)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    # Store metadata like token count, model used, response time, etc.
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["created_at"]
        verbose_name = "Message"
        verbose_name_plural = "Messages"
        indexes = [
            # For fetching conversation messages in order
            models.Index(
                fields=["conversation", "created_at"], name="ai_msg_conv_created_idx"
            ),
            # For analytics queries
            models.Index(fields=["role", "created_at"], name="ai_msg_role_created_idx"),
        ]

    def __str__(self):
        return f"{self.role}: {self.content[:50]}..."
