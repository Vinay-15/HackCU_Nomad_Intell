
import logging

from google import genai
from google.genai import types

from app.core.config import get_settings
from app.services.json_utils import JsonExtractionError, parse_model_json
from app.services.mock_oracle import build_mock_oracle_payload
from app.services.prompt_builder import build_oracle_prompt

logger = logging.getLogger(__name__)


def _extract_text(response) -> str:
    text = getattr(response, "text", None)
    if text:
        return text

    parts: list[str] = []
    for candidate in getattr(response, "candidates", []) or []:
        content = getattr(candidate, "content", None)
        for part in getattr(content, "parts", []) or []:
            maybe_text = getattr(part, "text", None)
            if maybe_text:
                parts.append(maybe_text)
    return "".join(parts)


async def generate_oracle_payload(*, geo, weather: dict, mode: str, anchor, prefs: list[str]) -> dict:
    settings = get_settings()

    if not settings.gemini_api_key:
        if settings.allow_mock_oracle:
            return build_mock_oracle_payload(geo=geo, weather=weather, mode=mode, anchor=anchor, prefs=prefs)
        raise RuntimeError("GEMINI_API_KEY is not set.")

    prompt = build_oracle_prompt(geo=geo, weather=weather, mode=mode, anchor=anchor, prefs=prefs)
    client = genai.Client(api_key=settings.gemini_api_key)
    response = client.models.generate_content(
        model=settings.gemini_model,
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            temperature=0.4,
        ),
    )
    text = _extract_text(response)

    try:
        return parse_model_json(text)
    except JsonExtractionError as exc:
        logger.error("Raw ORACLE output: %s", text)
        if settings.allow_mock_oracle:
            logger.warning("Falling back to mock ORACLE payload because parsing failed: %s", exc)
            payload = build_mock_oracle_payload(geo=geo, weather=weather, mode=mode, anchor=anchor, prefs=prefs)
            payload["summary"] = f"Fallback response used because ORACLE returned malformed JSON. {payload['summary']}"
            payload["top_highlight"] = "The backend caught invalid model JSON and recovered with a safe fallback payload."
            return payload
        raise
    except Exception:
        logger.exception("Unexpected ORACLE error")
        raise
