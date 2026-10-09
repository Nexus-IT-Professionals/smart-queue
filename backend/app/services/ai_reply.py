"""Bounded reply classifier via local Ollama (TECHNICAL_PROPOSAL §7).

Returns accept/decline/help/unclear only. The suggestion is shown for explicit patient
confirmation; on any failure or timeout the UI falls back to manual buttons. No retries.
"""
from app.schemas import ReplyIntent

MAX_REPLY_CHARS = 500


def classify_reply(text: str) -> ReplyIntent | None:
    """Return a suggested intent, or None to fall back to manual buttons."""
    # TODO: POST {OLLAMA_URL}/api/chat with format=ReplyIntent JSON schema and
    #       timeout=AI_TIMEOUT_SECONDS; truncate input to MAX_REPLY_CHARS;
    #       validate with ReplyIntent.model_validate_json; return None on any error.
    return None
