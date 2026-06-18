"""
Gemini AI Service for DevSync.

Uses Google's Gemini 2.0 Flash model - FREE tier with generous limits.
Provides cloud-based AI when Ollama is not available.
"""

import logging
import os
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)

# Gemini configuration
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

# Lazy load the SDK
_genai = None
_model = None


def _get_gemini():
    """Lazy load Gemini SDK and model."""
    global _genai, _model

    if _genai is None:
        if not GEMINI_API_KEY:
            logger.warning("GEMINI_API_KEY not set")
            return None, None

        try:
            import google.generativeai as genai

            genai.configure(api_key=GEMINI_API_KEY)
            _genai = genai
            _model = genai.GenerativeModel(GEMINI_MODEL)
            logger.info(f"Gemini initialized with model: {GEMINI_MODEL}")
        except ImportError:
            logger.error("google-generativeai package not installed")
            return None, None
        except Exception as e:
            logger.error(f"Failed to initialize Gemini: {e}")
            return None, None

    return _genai, _model


def is_gemini_available() -> bool:
    """Check if Gemini API is available."""
    if not GEMINI_API_KEY:
        return False

    genai, model = _get_gemini()
    return model is not None


def gemini_chat(
    messages: List[Dict[str, str]],
    system_prompt: str = "",
    max_tokens: int = 1024,
    temperature: float = 0.7,
) -> Optional[str]:
    """
    Send a chat request to Gemini.

    Args:
        messages: List of message dicts with 'role' and 'content'
        system_prompt: System instructions for the AI
        max_tokens: Maximum response length
        temperature: Creativity (0.0-1.0)

    Returns:
        AI response text or None on error
    """
    genai, model = _get_gemini()

    if model is None:
        logger.error("Gemini model not available")
        return None

    try:
        # Build the conversation history for Gemini
        # Gemini uses 'user' and 'model' roles
        chat_history = []

        for msg in messages[:-1]:  # All except the last message
            role = "model" if msg["role"] == "assistant" else "user"
            chat_history.append({"role": role, "parts": [msg["content"]]})

        # Start chat with history
        chat = model.start_chat(history=chat_history)

        # Get the last user message
        last_message = messages[-1]["content"] if messages else ""

        # ALWAYS prepend system prompt to give AI the context
        # This includes portfolio data when includePortfolio is enabled
        if system_prompt:
            last_message = f"{system_prompt}\n\nUser message: {last_message}"

        # Generate response
        logger.info(f"Sending message to Gemini: {last_message[:100]}...")
        response = chat.send_message(
            last_message,
            generation_config={
                "max_output_tokens": max_tokens,
                "temperature": temperature,
            },
        )

        logger.info(
            f"Gemini response received: {response.text[:100] if response.text else 'empty'}..."
        )
        return response.text

    except Exception as e:
        logger.error(f"Gemini chat error: {type(e).__name__}: {e}")
        import traceback

        logger.error(f"Gemini traceback: {traceback.format_exc()}")
        return None


def gemini_generate(
    prompt: str,
    system_prompt: str = "",
    max_tokens: int = 1024,
    temperature: float = 0.7,
) -> Optional[str]:
    """
    Generate a single response from Gemini.

    Args:
        prompt: The user prompt
        system_prompt: System instructions
        max_tokens: Maximum response length
        temperature: Creativity (0.0-1.0)

    Returns:
        AI response text or None on error
    """
    genai, model = _get_gemini()

    if model is None:
        logger.error("Gemini model not available")
        return None

    try:
        # Combine system prompt and user prompt
        full_prompt = prompt
        if system_prompt:
            full_prompt = f"{system_prompt}\n\nUser: {prompt}"

        response = model.generate_content(
            full_prompt,
            generation_config={
                "max_output_tokens": max_tokens,
                "temperature": temperature,
            },
        )

        return response.text

    except Exception as e:
        logger.error(f"Gemini generate error: {e}")
        return None


class GeminiService:
    """
    Singleton service for Gemini AI interactions.
    Drop-in replacement for OllamaService for cloud deployments.
    """

    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self._initialized = True
        self.model = GEMINI_MODEL
        logger.info(f"GeminiService initialized with model: {self.model}")

    def is_available(self, use_cache: bool = True) -> bool:
        """Check if Gemini is available."""
        return is_gemini_available()

    def chat(
        self,
        message: str = None,
        messages: List[Dict[str, str]] = None,
        system_prompt: str = "",
        conversation_history: List[Dict[str, str]] = None,
        max_tokens: int = 1024,
        temperature: float = 0.7,
    ) -> str:
        """
        Chat with Gemini AI.

        Args:
            message: Single user message (simpler interface)
            messages: Full message list (advanced interface)
            system_prompt: System instructions
            conversation_history: Previous conversation history
            max_tokens: Max response tokens
            temperature: Creativity (0-1)

        Returns response text or raises exception on error.
        """
        # Build messages list from parameters
        if messages is None:
            messages = []
            if conversation_history:
                messages.extend(conversation_history)
            if message:
                messages.append({"role": "user", "content": message})

        if not messages:
            raise ValueError("No message provided")

        response = gemini_chat(
            messages=messages,
            system_prompt=system_prompt,
            max_tokens=max_tokens,
            temperature=temperature,
        )

        if response is None:
            raise Exception("Failed to get response from Gemini")

        return response

    def get_models(self, use_cache: bool = True) -> List[Dict]:
        """Get available models (for compatibility with OllamaService)."""
        if is_gemini_available():
            return [{"name": GEMINI_MODEL}]
        return []


# Singleton instance
gemini_service = GeminiService()
