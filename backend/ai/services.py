"""
Ollama service for AI chat functionality.
Uses local Ollama instance - 100% FREE, no API keys needed.

Production-Ready Features:
- RAG (Retrieval Augmented Generation) for accurate responses
- Connection pooling with requests.Session
- Caching with Django cache framework
- Rate limiting support
- Comprehensive error handling
- Input validation and sanitization
- Logging for debugging and monitoring
- SMART_ONLY mode for free hosting (no Ollama required)
"""

import hashlib
import html
import json
import logging
import os
import re
import time
from datetime import date, timedelta
from functools import wraps
from typing import Any, Callable, Dict, Generator, List, Optional

from django.conf import settings
from django.core.cache import cache

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

logger = logging.getLogger(__name__)


# AI Mode: 'full' (Ollama + Smart), 'gemini' (Gemini API), or 'smart_only' (no AI)
def get_ai_mode() -> str:
    """Get AI mode from environment, checking at runtime."""
    return os.getenv("AI_MODE", "gemini").lower()


# For backward compatibility
AI_MODE = os.getenv("AI_MODE", "gemini")

# Import RAG module (lazy loaded)
_rag_module = None


def get_rag_module():
    """Lazy load RAG module to avoid import errors if dependencies missing."""
    global _rag_module
    if _rag_module is None:
        try:
            from . import rag as rag_module

            _rag_module = rag_module
            logger.info("RAG module loaded successfully")
        except ImportError as e:
            logger.warning(f"RAG module not available: {e}")
            _rag_module = False  # Mark as unavailable
    return _rag_module if _rag_module else None


def is_smart_only_mode() -> bool:
    """Check if AI is in smart-only mode (no Ollama/Gemini)."""
    return get_ai_mode() == "smart_only"


def is_gemini_mode() -> bool:
    """Check if AI is using Gemini API."""
    return get_ai_mode() == "gemini"


# ================== Constants ==================
MAX_MESSAGE_LENGTH = 10000
MAX_CONVERSATION_HISTORY = 20  # Limit history to prevent context overflow
CACHE_TTL_STATUS = 30  # seconds
CACHE_TTL_ANALYSIS = 300  # 5 minutes


# ================== Decorators ==================
def timed_operation(operation_name: str):
    """Decorator to time and log operations."""

    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs) -> Any:
            start_time = time.time()
            try:
                result = func(*args, **kwargs)
                elapsed = time.time() - start_time
                logger.info(f"{operation_name} completed in {elapsed:.2f}s")
                return result
            except Exception as e:
                elapsed = time.time() - start_time
                logger.error(f"{operation_name} failed after {elapsed:.2f}s: {e}")
                raise

        return wrapper

    return decorator


def cached(cache_key_prefix: str, ttl: int):
    """Decorator for caching function results."""

    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs) -> Any:
            # Build cache key from function name and args
            key_parts = [cache_key_prefix, func.__name__]
            for arg in args[1:]:  # Skip self
                if hasattr(arg, "id"):
                    key_parts.append(str(arg.id))
                elif isinstance(arg, (str, int, float, bool)):
                    key_parts.append(str(arg))
            cache_key = ":".join(key_parts)

            # Try cache first
            cached_result = cache.get(cache_key)
            if cached_result is not None:
                logger.debug(f"Cache hit for {cache_key}")
                return cached_result

            # Execute function and cache result
            result = func(*args, **kwargs)
            cache.set(cache_key, result, ttl)
            logger.debug(f"Cached result for {cache_key}")
            return result

        return wrapper

    return decorator


# ================== Input Validation ==================
def sanitize_input(text: str) -> str:
    """
    Sanitize user input to prevent injection attacks.

    - Removes control characters
    - Limits length
    - Escapes HTML entities
    """
    if not text:
        return ""

    # Remove control characters except newlines and tabs
    text = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]", "", text)

    # Limit length
    text = text[:MAX_MESSAGE_LENGTH]

    # Escape HTML entities to prevent XSS if output is rendered
    text = html.escape(text)

    return text.strip()


def validate_messages(messages: List[Dict[str, str]]) -> List[Dict[str, str]]:
    """
    Validate and sanitize message list.

    - Ensures each message has required fields
    - Sanitizes content
    - Limits history length
    """
    validated = []

    for msg in messages[-MAX_CONVERSATION_HISTORY:]:  # Limit history
        if not isinstance(msg, dict):
            continue
        role = msg.get("role", "").lower()
        content = msg.get("content", "")

        if role not in ("user", "assistant", "system"):
            continue
        if not content:
            continue

        validated.append(
            {
                "role": role,
                "content": sanitize_input(content) if role == "user" else content,
            }
        )

    return validated


# ================== Custom Exceptions ==================
class OllamaError(Exception):
    """Base exception for Ollama service errors."""

    pass


class OllamaConnectionError(OllamaError):
    """Raised when connection to Ollama fails."""

    pass


class OllamaTimeoutError(OllamaError):
    """Raised when Ollama request times out."""

    pass


class OllamaModelError(OllamaError):
    """Raised when there's an issue with the model."""

    pass


# ================== Ollama Service ==================
class OllamaService:
    """
    Production-ready service to interact with local Ollama AI.

    Features:
    - Connection pooling for better performance
    - Automatic retries with exponential backoff
    - Caching for status and model checks
    - Comprehensive error handling
    - Request/response logging
    """

    _instance = None
    _session = None

    def __new__(cls):
        """Singleton pattern to reuse connections."""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialize()
        return cls._instance

    def _initialize(self):
        """Initialize service configuration."""
        self.base_url = os.getenv("OLLAMA_HOST", "http://localhost:11434")
        self.model = os.getenv("OLLAMA_MODEL", "llama3.2:1b")
        self.timeout = int(
            os.getenv("OLLAMA_TIMEOUT", "30")
        )  # Reduced to 30s for fast responses
        self.connect_timeout = int(
            os.getenv("OLLAMA_CONNECT_TIMEOUT", "5")
        )  # Faster connection check

        # Create session with connection pooling and retries
        self._session = self._create_session()

        logger.info(f"OllamaService initialized: {self.base_url}, model={self.model}")

    def _create_session(self) -> requests.Session:
        """Create a requests session with retry logic and connection pooling."""
        session = requests.Session()

        # Retry strategy for transient errors
        retry_strategy = Retry(
            total=3,
            backoff_factor=0.5,
            status_forcelist=[429, 500, 502, 503, 504],
            allowed_methods=["HEAD", "GET", "POST"],
        )

        adapter = HTTPAdapter(
            max_retries=retry_strategy,
            pool_connections=10,
            pool_maxsize=10,
        )

        session.mount("http://", adapter)
        session.mount("https://", adapter)

        return session

    @property
    def session(self) -> requests.Session:
        """Get or create session."""
        if self._session is None:
            self._session = self._create_session()
        return self._session

    def is_available(self, use_cache: bool = True) -> bool:
        """
        Check if Ollama is running and available.

        Args:
            use_cache: Whether to use cached result (default True)

        Returns:
            True if Ollama is available
        """
        cache_key = "ollama:status:available"

        if use_cache:
            cached_result = cache.get(cache_key)
            if cached_result is not None:
                return cached_result

        try:
            response = self.session.get(
                f"{self.base_url}/api/tags", timeout=self.connect_timeout
            )
            is_available = response.status_code == 200

            # Cache result
            cache.set(cache_key, is_available, CACHE_TTL_STATUS)

            return is_available
        except requests.RequestException as e:
            logger.warning(f"Ollama availability check failed: {e}")
            cache.set(cache_key, False, CACHE_TTL_STATUS)
            return False

    def get_models(self, use_cache: bool = True) -> List[Dict]:
        """
        Get list of available models.

        Args:
            use_cache: Whether to use cached result

        Returns:
            List of model dictionaries
        """
        cache_key = "ollama:models:list"

        if use_cache:
            cached_result = cache.get(cache_key)
            if cached_result is not None:
                return cached_result

        try:
            response = self.session.get(
                f"{self.base_url}/api/tags", timeout=self.connect_timeout
            )
            if response.status_code == 200:
                models = response.json().get("models", [])
                cache.set(cache_key, models, CACHE_TTL_STATUS)
                return models
            return []
        except requests.RequestException as e:
            logger.warning(f"Failed to get Ollama models: {e}")
            return []

    @timed_operation("AI Chat")
    def chat(
        self,
        messages: List[Dict[str, str]],
        system_prompt: Optional[str] = None,
        stream: bool = False,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
    ) -> str:
        """
        Send a chat request to Ollama.

        Args:
            messages: List of message dicts with 'role' and 'content'
            system_prompt: Optional system prompt to set context
            stream: Whether to stream the response
            temperature: Creativity level (0.0-1.0)
            max_tokens: Maximum tokens in response

        Returns:
            The assistant's response text

        Raises:
            OllamaConnectionError: If connection fails
            OllamaTimeoutError: If request times out
            OllamaModelError: If model error occurs
        """
        # Validate and sanitize messages
        validated_messages = validate_messages(messages)

        if not validated_messages:
            raise ValueError("No valid messages provided")

        # Build the messages list with optional system prompt
        chat_messages = []

        if system_prompt:
            chat_messages.append({"role": "system", "content": system_prompt})

        chat_messages.extend(validated_messages)

        # ACCURACY-OPTIMIZED options for quality responses
        options = {
            "temperature": max(0.0, min(1.0, temperature)),
            "top_p": 0.9,  # Allow more diverse, contextual responses
            "num_predict": max_tokens or 300,  # Enough tokens for detailed answers
            "repeat_penalty": 1.2,  # Gentle repeat reduction
            "top_k": 40,  # Broader token selection for better quality
            "num_ctx": 2048,  # Larger context window for conversation history & RAG
        }

        payload = {
            "model": self.model,
            "messages": chat_messages,
            "stream": stream,
            "options": options,
        }

        try:
            response = self.session.post(
                f"{self.base_url}/api/chat",
                json=payload,
                timeout=(self.connect_timeout, self.timeout),  # (connect, read)
            )

            if response.status_code == 200:
                result = response.json()
                content = result.get("message", {}).get("content", "")

                # Log token usage if available
                if "eval_count" in result:
                    logger.info(f"AI response tokens: {result.get('eval_count')}")

                return content
            elif response.status_code == 404:
                logger.error(f"Model not found: {self.model}")
                raise OllamaModelError(
                    f"Model '{self.model}' not found. Please pull it first."
                )
            else:
                logger.error(f"Ollama error: {response.status_code} - {response.text}")
                raise OllamaError(f"AI service error (status {response.status_code})")

        except requests.Timeout:
            logger.error("Ollama request timed out")
            raise OllamaTimeoutError(
                "AI request timed out. The model might be processing a complex request."
            )
        except requests.ConnectionError as e:
            logger.error(f"Ollama connection failed: {e}")
            raise OllamaConnectionError(
                "Cannot connect to AI service. Is Ollama running?"
            )
        except requests.RequestException as e:
            logger.error(f"Ollama request failed: {e}")
            raise OllamaError(f"AI service error: {str(e)}")

    def chat_stream(
        self,
        messages: List[Dict[str, str]],
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
    ) -> Generator[str, None, None]:
        """
        Stream a chat response from Ollama.

        Yields chunks of the response as they arrive.

        Args:
            messages: List of message dicts
            system_prompt: Optional system context
            temperature: Creativity level

        Yields:
            Response text chunks
        """
        validated_messages = validate_messages(messages)

        if not validated_messages:
            raise ValueError("No valid messages provided")

        chat_messages = []

        if system_prompt:
            chat_messages.append({"role": "system", "content": system_prompt})

        chat_messages.extend(validated_messages)

        payload = {
            "model": self.model,
            "messages": chat_messages,
            "stream": True,
            "options": {
                "temperature": max(0.0, min(1.0, temperature)),
                "top_p": 0.9,
            },
        }

        try:
            response = self.session.post(
                f"{self.base_url}/api/chat",
                json=payload,
                stream=True,
                timeout=(self.connect_timeout, self.timeout),
            )

            if response.status_code == 200:
                for line in response.iter_lines():
                    if line:
                        try:
                            data = json.loads(line)
                            content = data.get("message", {}).get("content", "")
                            if content:
                                yield content
                            if data.get("done"):
                                break
                        except json.JSONDecodeError:
                            continue
            elif response.status_code == 404:
                raise OllamaModelError(f"Model '{self.model}' not found.")
            else:
                raise OllamaError(f"AI service error (status {response.status_code})")

        except requests.ConnectionError as e:
            logger.error(f"Ollama stream connection failed: {e}")
            raise OllamaConnectionError("Cannot connect to AI service.")
        except requests.RequestException as e:
            logger.error(f"Ollama stream failed: {e}")
            raise OllamaError(f"AI streaming error: {str(e)}")

    def invalidate_cache(self):
        """Invalidate all Ollama-related caches."""
        cache.delete("ollama:status:available")
        cache.delete("ollama:models:list")
        logger.info("Ollama cache invalidated")

    @timed_operation("RAG Chat")
    def chat_with_rag(
        self,
        query: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 300,
        conversation_history: Optional[List[Dict[str, str]]] = None,
    ) -> tuple[str, List[Dict]]:
        """
        Chat with RAG (Retrieval Augmented Generation) for more accurate responses.

        Retrieves relevant context from the knowledge base before generating.

        Args:
            query: User's question
            system_prompt: Optional system context
            temperature: Creativity level
            max_tokens: Maximum response length

        Returns:
            Tuple of (response, retrieved_contexts)
        """
        rag = get_rag_module()
        retrieved_contexts = []
        augmented_query = query

        # Try RAG if available
        if rag and rag.is_rag_available():
            try:
                augmented_query, retrieved_contexts = rag.rag_query(query, top_k=5)
                logger.info(f"RAG retrieved {len(retrieved_contexts)} contexts")
            except Exception as e:
                logger.warning(f"RAG retrieval failed, using original query: {e}")

        # Build messages with conversation history for context continuity
        messages = []
        if conversation_history:
            # Include recent history for context (last 10 exchanges)
            for msg in conversation_history[-10:]:
                messages.append(
                    {"role": msg.get("role", "user"), "content": msg.get("content", "")}
                )

        # Add current query (potentially RAG-augmented)
        messages.append({"role": "user", "content": augmented_query})

        response = self.chat(
            messages=messages,
            system_prompt=system_prompt,
            temperature=temperature,
            max_tokens=max_tokens,
        )

        return response, retrieved_contexts


# Detailed system prompt for accurate, helpful responses
PORTFOLIO_SYSTEM_PROMPT = """You are DevSync AI, a friendly and helpful career and portfolio assistant for software developers.

IMPORTANT: Your ENTIRE PURPOSE is to help developers with career growth, job hunting, interview preparation, getting hired, and building great portfolios. Questions about interviews, getting selected, career advice, salaries, job applications, and professional development are EXACTLY what you are designed to answer. NEVER refuse to answer these questions. They are completely safe and appropriate topics.

WHAT YOU HELP WITH:
- Building strong developer portfolios on the DevSync platform
- Interview preparation and tips for getting selected
- Career advice: job searching, resume tips, standing out to recruiters
- Technical guidance: which skills to learn, project ideas, best practices
- Portfolio optimization: what to include, how to present work effectively

DEVSYNC PLATFORM:
DevSync is a developer portfolio platform where users can showcase their:
- Profile (photo, bio, title, social links)
- Skills (with proficiency levels 0-100%)
- Projects (with descriptions, GitHub links, live demos)
- Experience (work history with achievements)
- Education and Certifications

HOW TO RESPOND:
1. Be helpful, specific, and actionable
2. Give practical advice with concrete examples
3. Keep answers focused (50-150 words)
4. Use bullet points or numbered steps
5. When relevant, suggest how to showcase things in their DevSync portfolio
6. Be encouraging and supportive

You are a career coach and portfolio expert. Always provide helpful answers."""


def get_analysis_cache_key(user) -> str:
    """Generate cache key for portfolio analysis."""
    return f"portfolio:analysis:{user.id}"


def invalidate_portfolio_cache(user):
    """Invalidate portfolio analysis cache for a user."""
    cache.delete(get_analysis_cache_key(user))
    logger.debug(f"Invalidated portfolio cache for user {user.id}")


@cached("portfolio", CACHE_TTL_ANALYSIS)
def analyze_portfolio_completeness(user) -> Dict:
    """
    Analyze portfolio completeness and identify issues.
    Returns a dict with analysis results.
    """
    from accounts.models import CustomUser
    from portfolio.models import (
        Certification,
        Education,
        Experience,
        Project,
        Skill,
        SocialLink,
    )

    analysis = {
        "completeness_score": 0,
        "issues": [],
        "suggestions": [],
        "strengths": [],
    }

    total_points = 0
    earned_points = 0

    # Profile basics (30 points)
    total_points += 30

    # Avatar check
    if user.avatar:
        earned_points += 10
        analysis["strengths"].append("Has profile picture")
    else:
        analysis["issues"].append(
            "⚠️ NO PROFILE PICTURE - This is critical! Profiles with photos get 14x more views."
        )
        analysis["suggestions"].append(
            "Upload a professional headshot. Good lighting, neutral background, smile!"
        )

    # Title check
    if user.title:
        earned_points += 5
        if len(user.title) < 10:
            analysis["issues"].append(
                f"Title is too short: '{user.title}'. Be more specific!"
            )
        elif len(user.title) > 50:
            analysis["suggestions"].append("Title might be too long. Keep it concise.")
        else:
            analysis["strengths"].append(f"Has professional title: {user.title}")
    else:
        analysis["issues"].append(
            "⚠️ NO PROFESSIONAL TITLE - Add a title like 'Full Stack Developer' or 'React Specialist'"
        )

    # Bio check
    if user.bio:
        earned_points += 10
        bio_len = len(user.bio)
        if bio_len < 50:
            analysis["issues"].append(
                f"Bio is too short ({bio_len} chars). Aim for 150-300 characters."
            )
        elif bio_len > 500:
            analysis["suggestions"].append(
                f"Bio might be too long ({bio_len} chars). Keep it focused."
            )
        else:
            analysis["strengths"].append("Bio is well-written")
    else:
        analysis["issues"].append(
            "⚠️ NO BIO - Write 2-3 sentences about yourself and what you do."
        )

    # Name check
    if user.first_name and user.last_name:
        earned_points += 5
        analysis["strengths"].append(
            f"Full name provided: {user.first_name} {user.last_name}"
        )
    else:
        analysis["issues"].append(
            "Name is incomplete. Add your full name for professionalism."
        )

    # Skills analysis (20 points)
    total_points += 20
    skills = Skill.objects.filter(user=user)
    skill_count = skills.count()

    if skill_count > 0:
        earned_points += 10

        if skill_count < 5:
            analysis["issues"].append(
                f"Only {skill_count} skills listed. Add more to showcase your expertise (aim for 8-15)."
            )
        elif skill_count > 20:
            analysis["suggestions"].append(
                f"{skill_count} skills is a lot! Focus on your strongest 10-15."
            )
        else:
            analysis["strengths"].append(f"{skill_count} skills listed - good range!")

        # Check proficiency distribution
        high_prof = skills.filter(proficiency__gte=90).count()
        if high_prof == skill_count and skill_count > 3:
            analysis["issues"].append(
                "All skills at 90%+? Be honest about proficiency levels - it's more credible."
            )

        # Check skill categories
        categories = set(skills.values_list("category", flat=True))
        if len(categories) >= 3:
            earned_points += 10
            analysis["strengths"].append(
                f"Skills span {len(categories)} categories - shows versatility"
            )
        else:
            analysis["suggestions"].append(
                "Add skills from different categories (frontend, backend, tools, etc.)"
            )
    else:
        analysis["issues"].append(
            "⚠️ NO SKILLS ADDED - This is essential! Add your technical skills."
        )

    # Projects analysis (25 points)
    total_points += 25
    projects = Project.objects.filter(user=user)
    project_count = projects.count()

    if project_count > 0:
        earned_points += 15

        if project_count < 3:
            analysis["issues"].append(
                f"Only {project_count} project(s). Aim for 3-6 quality projects."
            )
        elif project_count > 10:
            analysis["suggestions"].append(
                f"{project_count} projects - consider featuring only your best 5-6."
            )
        else:
            analysis["strengths"].append(f"{project_count} projects showcased")

        # Check for links and images
        projects_with_links = (
            projects.exclude(github_url="").count()
            + projects.exclude(live_url="").count()
        )
        if projects_with_links < project_count:
            analysis["suggestions"].append(
                "Some projects lack GitHub/live links. Add them for credibility."
            )
        else:
            earned_points += 5
            analysis["strengths"].append("Projects have links to code/demos")

        projects_with_images = (
            projects.exclude(featured_image="")
            .exclude(featured_image__isnull=True)
            .count()
        )
        if projects_with_images < project_count:
            analysis["suggestions"].append(
                f"Only {projects_with_images}/{project_count} projects have images. Visual projects get more attention!"
            )
        else:
            earned_points += 5
            analysis["strengths"].append("All projects have featured images")

        # Check descriptions
        short_desc_projects = [p for p in projects if len(p.description) < 100]
        if short_desc_projects:
            analysis["issues"].append(
                f"{len(short_desc_projects)} project(s) have very short descriptions. Explain the problem you solved!"
            )
    else:
        analysis["issues"].append(
            "⚠️ NO PROJECTS - Add at least 3 projects to showcase your work!"
        )

    # Experience analysis (15 points)
    total_points += 15
    experiences = Experience.objects.filter(user=user)
    exp_count = experiences.count()

    if exp_count > 0:
        earned_points += 10
        analysis["strengths"].append(f"{exp_count} work experience(s) listed")

        # Check descriptions
        exp_without_desc = experiences.filter(description="").count()
        if exp_without_desc > 0:
            analysis["issues"].append(
                f"{exp_without_desc} experience(s) have no description. Add achievements!"
            )
        else:
            earned_points += 5
            analysis["strengths"].append("All experiences have descriptions")
    else:
        analysis["suggestions"].append(
            "Add work experience (internships, freelance, etc. all count!)"
        )

    # Education & Certifications (10 points)
    total_points += 10
    education = Education.objects.filter(user=user)
    certifications = Certification.objects.filter(user=user)

    if education.exists():
        earned_points += 5
        analysis["strengths"].append("Education background added")
    else:
        analysis["suggestions"].append("Add your educational background")

    if certifications.exists():
        earned_points += 5
        cert_count = certifications.count()
        analysis["strengths"].append(f"{cert_count} certification(s) listed")

        # Check for expired certifications
        today = date.today()
        expired = certifications.filter(expiry_date__lt=today).count()
        expiring_soon = certifications.filter(
            expiry_date__gte=today, expiry_date__lt=today + timedelta(days=90)
        ).count()

        if expired > 0:
            analysis["issues"].append(
                f"⚠️ {expired} certification(s) have EXPIRED! Update or remove them."
            )
        if expiring_soon > 0:
            analysis["suggestions"].append(
                f"{expiring_soon} certification(s) expiring in <90 days. Plan to renew!"
            )
    else:
        analysis["suggestions"].append(
            "Add certifications to boost credibility (AWS, Google, etc.)"
        )

    # Social links
    social_links = SocialLink.objects.filter(user=user)
    github_link = social_links.filter(platform="github").exists() or bool(
        user.github_username
    )
    linkedin_link = social_links.filter(platform="linkedin").exists() or bool(
        user.linkedin_url
    )

    if github_link:
        analysis["strengths"].append("GitHub profile linked")
    else:
        analysis["suggestions"].append("Add your GitHub profile link")

    if linkedin_link:
        analysis["strengths"].append("LinkedIn profile linked")
    else:
        analysis["suggestions"].append("Add your LinkedIn profile link")

    # Calculate final score
    analysis["completeness_score"] = round((earned_points / total_points) * 100)

    return analysis


def get_portfolio_context(user) -> str:
    """
    Build comprehensive context string from user's portfolio data.
    Includes detailed analysis for AI to provide specific feedback.
    """
    from accounts.models import CustomUser
    from portfolio.models import (
        Certification,
        Education,
        Experience,
        Project,
        Skill,
        SocialLink,
    )

    context_parts = []

    # Run comprehensive analysis
    analysis = analyze_portfolio_completeness(user)

    context_parts.append("=" * 50)
    context_parts.append("PORTFOLIO ANALYSIS REPORT")
    context_parts.append("=" * 50)

    # Completeness score
    context_parts.append(f"\n📊 COMPLETENESS SCORE: {analysis['completeness_score']}%")

    # === PROFILE SECTION ===
    context_parts.append("\n\n👤 PROFILE DETAILS:")
    context_parts.append("-" * 30)
    context_parts.append(
        f"• Name: {user.first_name} {user.last_name}"
        if user.first_name
        else "• Name: NOT SET ❌"
    )
    context_parts.append(f"• Username: {user.username or 'NOT SET ❌'}")
    context_parts.append(f"• Email: {user.email}")
    context_parts.append(f"• Title: {user.title or 'NOT SET ❌'}")
    context_parts.append(
        f"• Bio: {user.bio[:200] + '...' if user.bio and len(user.bio) > 200 else user.bio or 'NOT SET ❌'}"
    )
    context_parts.append(
        f"• Profile Picture: {'YES ✓' if user.avatar else 'NOT SET ❌'}"
    )
    context_parts.append(f"• GitHub: {user.github_username or 'NOT SET'}")
    context_parts.append(f"• LinkedIn: {'SET ✓' if user.linkedin_url else 'NOT SET'}")

    # === SKILLS SECTION ===
    skills = Skill.objects.filter(user=user)
    context_parts.append(f"\n\n🛠️ SKILLS ({skills.count()} total):")
    context_parts.append("-" * 30)

    if skills.exists():
        # Group by category
        categories = {}
        for skill in skills:
            cat = skill.get_category_display()
            if cat not in categories:
                categories[cat] = []
            categories[cat].append(f"{skill.name} ({skill.proficiency}%)")

        for cat, skill_list in categories.items():
            context_parts.append(f"• {cat}: {', '.join(skill_list)}")
    else:
        context_parts.append("• No skills added ❌")

    # === PROJECTS SECTION ===
    projects = Project.objects.filter(user=user)
    context_parts.append(f"\n\n💼 PROJECTS ({projects.count()} total):")
    context_parts.append("-" * 30)

    if projects.exists():
        for i, project in enumerate(projects[:5], 1):  # Top 5 projects
            context_parts.append(f"\n  Project {i}: {project.title}")
            context_parts.append(f"    - Status: {project.get_status_display()}")
            context_parts.append(
                f"    - Description length: {len(project.description)} chars"
            )
            context_parts.append(
                f"    - Has GitHub link: {'YES ✓' if project.github_url else 'NO ❌'}"
            )
            context_parts.append(
                f"    - Has live demo: {'YES ✓' if project.live_url else 'NO'}"
            )
            context_parts.append(
                f"    - Has image: {'YES ✓' if project.featured_image else 'NO ❌'}"
            )
            context_parts.append(
                f"    - Technologies: {', '.join(project.technologies) if project.technologies else 'None listed'}"
            )
    else:
        context_parts.append("• No projects added ❌")

    # === EXPERIENCE SECTION ===
    experiences = Experience.objects.filter(user=user)
    context_parts.append(f"\n\n💼 WORK EXPERIENCE ({experiences.count()} total):")
    context_parts.append("-" * 30)

    if experiences.exists():
        for exp in experiences[:3]:  # Top 3 experiences
            context_parts.append(f"• {exp.position} at {exp.company}")
            context_parts.append(f"    - Type: {exp.get_type_display()}")
            context_parts.append(
                f"    - Duration: {exp.start_date} to {'Present' if exp.is_current else exp.end_date}"
            )
            context_parts.append(
                f"    - Has description: {'YES ✓' if exp.description else 'NO ❌'}"
            )
    else:
        context_parts.append("• No work experience added")

    # === EDUCATION SECTION ===
    education = Education.objects.filter(user=user)
    context_parts.append(f"\n\n🎓 EDUCATION ({education.count()} total):")
    context_parts.append("-" * 30)

    if education.exists():
        for edu in education:
            context_parts.append(f"• {edu.degree} in {edu.field_of_study}")
            context_parts.append(f"    - Institution: {edu.institution}")
            context_parts.append(
                f"    - Period: {edu.start_date} to {'Present' if edu.is_current else edu.end_date}"
            )
    else:
        context_parts.append("• No education added")

    # === CERTIFICATIONS SECTION ===
    certifications = Certification.objects.filter(user=user)
    context_parts.append(f"\n\n📜 CERTIFICATIONS ({certifications.count()} total):")
    context_parts.append("-" * 30)

    if certifications.exists():
        today = date.today()
        for cert in certifications:
            status = ""
            if cert.expiry_date:
                if cert.expiry_date < today:
                    status = " ⚠️ EXPIRED!"
                elif cert.expiry_date < today + timedelta(days=90):
                    status = " ⏰ Expiring soon!"
            context_parts.append(f"• {cert.name} - {cert.issuing_organization}{status}")
            context_parts.append(f"    - Issued: {cert.issue_date}")
            if cert.expiry_date:
                context_parts.append(f"    - Expires: {cert.expiry_date}")
            context_parts.append(
                f"    - Has credential URL: {'YES ✓' if cert.credential_url else 'NO'}"
            )
    else:
        context_parts.append("• No certifications added")

    # === ISSUES & SUGGESTIONS ===
    context_parts.append("\n\n" + "=" * 50)
    context_parts.append("DETECTED ISSUES (AI should address these):")
    context_parts.append("=" * 50)

    if analysis["issues"]:
        for issue in analysis["issues"]:
            context_parts.append(f"• {issue}")
    else:
        context_parts.append("• No major issues found!")

    context_parts.append("\n\n📋 SUGGESTIONS:")
    if analysis["suggestions"]:
        for suggestion in analysis["suggestions"]:
            context_parts.append(f"• {suggestion}")

    context_parts.append("\n\n✅ STRENGTHS:")
    if analysis["strengths"]:
        for strength in analysis["strengths"]:
            context_parts.append(f"• {strength}")

    return "\n".join(context_parts)


# Singleton instance
ollama_service = OllamaService()
