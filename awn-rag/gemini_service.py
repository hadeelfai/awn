"""Shared Gemini client with a stable fallback for temporary model failures."""
import os
from typing import Optional

from google import genai
from google.genai import errors, types

GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")
GEMINI_FALLBACK_MODEL = os.getenv("GEMINI_FALLBACK_MODEL", "gemini-3.5-flash-lite")
GEMINI_THINKING_LEVEL = os.getenv("GEMINI_THINKING_LEVEL", "").strip().lower()
FALLBACK_ERROR_CODES = {404, 429, 500, 502, 503, 504}

client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])


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
    except errors.APIError as error:
        if error.code not in FALLBACK_ERROR_CODES or GEMINI_FALLBACK_MODEL == GEMINI_MODEL:
            raise
        return client.models.generate_content(
            model=GEMINI_FALLBACK_MODEL,
            contents=contents,
            config=config,
        )


def generate_content_stream(
    contents,
    *,
    system_instruction: Optional[str] = None,
    temperature: float = 0.2,
):
    """Yield Gemini text chunks; retry on fallback only before any text was sent."""
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
            if getattr(chunk, "text", None):
                sent_text = True
            yield chunk
    except errors.APIError as error:
        if (
            sent_text
            or error.code not in FALLBACK_ERROR_CODES
            or GEMINI_FALLBACK_MODEL == GEMINI_MODEL
        ):
            raise
        yield from client.models.generate_content_stream(
            model=GEMINI_FALLBACK_MODEL,
            contents=contents,
            config=config,
        )
