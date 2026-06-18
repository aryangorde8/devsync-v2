# backend/ai/CLAUDE.md — AI assistant context

> Loads automatically when you work in `backend/ai/`. Read [../CLAUDE.md](../CLAUDE.md)
> (backend) and the root [../../CLAUDE.md](../../CLAUDE.md) first.

---

## What it does

A portfolio-aware chat assistant. A user asks questions ("how do I make my profile
stand out?", "summarize my experience") and gets answers grounded in **their own**
portfolio data. Designed to be **free and private by default** — it works with no
external API keys.

## The three-tier provider strategy (Dependency Inversion in practice)

Callers depend on an abstraction, not a vendor. Resolution order:

1. **Smart Response Engine** — `SMART_RESPONSES` pattern map + `get_smart_response()`
   in `views.py`. Instant (<50ms), deterministic answers for common questions. This
   is the default and runs with **no model**. "Smart-only mode" (`is_smart_only_mode()`)
   reports the service as available even when no LLM is running.
2. **Ollama (local LLM)** — `services.py`. Handles novel/complex questions when
   short-circuit smart responses don't apply (longer messages skip straight to the LLM).
3. **RAG** — `rag.py` (ChromaDB + sentence-transformers) retrieves portfolio/doc
   context to ground the LLM. Optional; improves accuracy.

`gemini_service.py` exists as an alternative cloud provider. **Keep providers behind
the service boundary** — never hard-wire a specific client into a view.

## File map

| File                  | Role                                                        |
|-----------------------|-------------------------------------------------------------|
| `views.py`            | `ChatViewSet` (status/send/analyze/stream), `ConversationViewSet`, smart-response engine, throttles. |
| `services.py`         | Ollama integration, caching, mode detection.                |
| `rag.py`              | Vector retrieval (ChromaDB).                                |
| `gemini_service.py`   | Optional Gemini provider.                                   |
| `models.py`           | `Conversation`, `Message`.                                  |
| `serializers.py`      | Request/response shapes.                                    |
| `urls.py`             | Routes under `/api/v1/ai/`.                                 |
| `training_data/`      | LoRA fine-tuning data.                                      |
| `tests.py`            | App-local tests.                                            |

## Endpoints (`/api/v1/ai/`)

`chat/status/`, `chat/send/`, `chat/analyze/`, `chat/stream/` (SSE),
`conversations/` + `conversations/{id}/`. All require auth. Each chat path has its
own throttle class (`AIStatusThrottle`, `AIChatThrottle`, `AIChatStreamThrottle`,
`AIAnalysisThrottle`) — respect those limits; AI calls are the expensive path.

## Rules

- **Degrade gracefully, never hard-fail.** If Ollama is down, fall back to smart
  responses; surface a clean status, not a 500. Use `format_error_response()`.
- **No secrets in code.** Provider keys/URLs come from env.
- **Mock the model in tests** — never hit a live LLM in `tests.py`. Assert the
  routing logic (smart vs LLM vs fallback), throttling, and serialization.
- **Cost-aware.** Short-circuit with smart responses and cache where possible
  before reaching the LLM.
- Grounding the model on the user's own portfolio (via RAG) is the quality lever —
  see [../../docs/claude/ROADMAP.md](../../docs/claude/ROADMAP.md).

> When building or changing anything LLM-shaped here, also consult the
> `claude-api` reference for current model IDs and parameters before picking a model.
