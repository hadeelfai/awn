"""Shared Gemini client with bounded latency and a model-name fallback."""
import os
from typing import Optional

import httpx
from google import genai
from google.genai import errors, types

GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")
GEMINI_FALLBACK_MODEL = os.getenv("GEMINI_FALLBACK_MODEL", "gemini-3.5-flash-lite")
GEMINI_THINKING_LEVEL = os.getenv("GEMINI_THINKING_LEVEL", "").strip().lower()
GEMINI_TIMEOUT_MS = int(os.getenv("GEMINI_TIMEOUT_MS", "25000"))
# Keep generation latency bounded. A failed request should surface quickly
# instead of spending up to a minute in the SDK's default retry backoff.
FALLBACK_ERROR_CODES = {404}
RETRY_WITH_FALLBACK_ERROR_CODES = {408, 429, 500, 502, 503, 504}

client = genai.Client(
    api_key=os.environ["GEMINI_API_KEY"],
    http_options=types.HttpOptions(
        timeout=GEMINI_TIMEOUT_MS,
        retry_options=types.HttpRetryOptions(attempts=1),
    ),
)


def _generation_config(*, system_instruction, response_mime_type=None, temperature=0.2):
    config = {
        "system_instruction": system_instruction,
        "response_mime_type": response_mime_type,
        "temperature": temperature,
    }
    # Thinking levels are model-specific. Leave this unset by default to retain
    # compatibility with existing deployments; opt in only after verifying the model.
    if GEMINI_THINKING_LEVEL:
        config["thinking_config"] = types.ThinkingConfig(
            thinking_level=GEMINI_THINKING_LEVEL,
        )
    return types.GenerateContentConfig(**config)


def generate_content(
    contents,
    *,
    system_instruction: Optional[str] = None,
    response_mime_type: Optional[str] = None,
    temperature: float = 0.2,
):
    config = _generation_config(
        system_instruction=system_instruction,
        response_mime_type=response_mime_type,
        temperature=temperature,
    )
    try:
        return client.models.generate_content(
            model=GEMINI_MODEL,
            contents=contents,
            config=config,
        )
    except (errors.APIError, httpx.TimeoutException) as error:
        should_fallback = (
            isinstance(error, httpx.TimeoutException)
            or error.code in FALLBACK_ERROR_CODES | RETRY_WITH_FALLBACK_ERROR_CODES
        )
        if not should_fallback or GEMINI_FALLBACK_MODEL == GEMINI_MODEL:
            raise
        return client.models.generate_content(
            model=GEMINI_FALLBACK_MODEL,
            contents=contents,
            config=config,
        )


def response_text(response) -> str:
    """Read text parts directly, avoiding SDK warnings for thought signatures."""
    candidates = getattr(response, "candidates", None) or []
    parts = [
        part
        for candidate in candidates
        for part in (getattr(getattr(candidate, "content", None), "parts", None) or [])
    ]
    if parts:
        return "".join(
            text for part in parts
            if not getattr(part, "thought", False)
            and isinstance((text := getattr(part, "text", None)), str)
        )
    # Supports test doubles and older SDK response types without candidates.
    text = getattr(response, "text", None)
    return text if isinstance(text, str) else ""


def generate_content_stream(
    contents,
    *,
    system_instruction: Optional[str] = None,
    temperature: float = 0.2,
):
    """Yield Gemini text chunks; switch models only before any text was sent."""
    config = _generation_config(
        system_instruction=system_instruction,
        temperature=temperature,
    )
    sent_text = False
    try:
        chunks = client.models.generate_content_stream(
            model=GEMINI_MODEL,
            contents=contents,
            config=config,
        )
        for chunk in chunks:
            if response_text(chunk):
                sent_text = True
            yield chunk
    except (errors.APIError, httpx.TimeoutException) as error:
        should_fallback = (
            isinstance(error, httpx.TimeoutException)
            or error.code in FALLBACK_ERROR_CODES | RETRY_WITH_FALLBACK_ERROR_CODES
        )
        if (
            sent_text
            or not should_fallback
            or GEMINI_FALLBACK_MODEL == GEMINI_MODEL
        ):
            raise
        yield from client.models.generate_content_stream(
            model=GEMINI_FALLBACK_MODEL,
            contents=contents,
            config=config,
        )
