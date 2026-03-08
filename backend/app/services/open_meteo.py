import asyncio
import logging

import httpx
from fastapi import HTTPException

from app.models.schemas import GeoResult

logger = logging.getLogger(__name__)

GEOCODE_URL = "https://geocoding-api.open-meteo.com/v1/search"
FORECAST_URL = "https://api.open-meteo.com/v1/forecast"

MAX_RETRIES = 4
RETRY_DELAYS = [1.0, 2.0, 4.0, 8.0]


async def geocode_city(city: str) -> GeoResult:
    params = {
        "name": city,
        "count": 1,
        "language": "en",
        "format": "json",
    }

    for attempt in range(MAX_RETRIES):
        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                response = await client.get(GEOCODE_URL, params=params)
                if response.status_code == 429:
                    delay = RETRY_DELAYS[min(attempt, len(RETRY_DELAYS) - 1)]
                    logger.warning(f"Geocoding rate-limited (attempt {attempt + 1}), retrying in {delay}s")
                    await asyncio.sleep(delay)
                    continue
                response.raise_for_status()
                payload = response.json()
                results = payload.get("results") or []
                if not results:
                    raise HTTPException(status_code=404, detail="City not found. Try a different spelling.")
                item = results[0]
                return GeoResult(
                    name=item["name"],
                    country=item.get("country", "Unknown"),
                    country_code=(item.get("country_code") or "").upper(),
                    latitude=item["latitude"],
                    longitude=item["longitude"],
                    timezone=item.get("timezone"),
                )
        except HTTPException:
            raise
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 429:
                delay = RETRY_DELAYS[min(attempt, len(RETRY_DELAYS) - 1)]
                await asyncio.sleep(delay)
                continue
            raise HTTPException(status_code=502, detail=f"Geocoding service error: {e}")
        except Exception as e:
            logger.error(f"Geocoding attempt {attempt + 1} failed: {e}")
            if attempt < MAX_RETRIES - 1:
                await asyncio.sleep(RETRY_DELAYS[attempt])

    raise HTTPException(
        status_code=503,
        detail="Location service is temporarily unavailable. Please try again in a moment."
    )


async def fetch_weather(latitude: float, longitude: float, timezone: str | None = None) -> dict:
    """Fetch 7-day forecast. On persistent 429s, returns a fallback so the AI analysis still runs."""
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "daily": "temperature_2m_max,temperature_2m_min,precipitation_sum,sunshine_duration,wind_speed_10m_max",
        "timezone": timezone or "auto",
        "forecast_days": 7,
    }

    for attempt in range(MAX_RETRIES):
        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                response = await client.get(FORECAST_URL, params=params)
                if response.status_code == 429:
                    delay = RETRY_DELAYS[min(attempt, len(RETRY_DELAYS) - 1)]
                    logger.warning(f"Weather rate-limited (attempt {attempt + 1}), retrying in {delay}s")
                    await asyncio.sleep(delay)
                    continue
                response.raise_for_status()
                return response.json()
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 429:
                delay = RETRY_DELAYS[min(attempt, len(RETRY_DELAYS) - 1)]
                await asyncio.sleep(delay)
                continue
            logger.error(f"Weather fetch HTTP error: {e}")
            break
        except Exception as e:
            logger.error(f"Weather fetch attempt {attempt + 1} failed: {e}")
            if attempt < MAX_RETRIES - 1:
                await asyncio.sleep(RETRY_DELAYS[attempt])

    # All retries exhausted — return fallback so pipeline continues without live weather
    logger.warning(f"Weather fetch failed for ({latitude}, {longitude}) — using fallback")
    return {"latitude": latitude, "longitude": longitude, "timezone": "UTC", "daily": None, "_fallback": True}
