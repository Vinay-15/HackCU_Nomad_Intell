import asyncio
import httpx
from fastapi import HTTPException

from app.models.schemas import GeoResult

GEOCODE_URL = "https://geocoding-api.open-meteo.com/v1/search"
FORECAST_URL = "https://api.open-meteo.com/v1/forecast"

MAX_RETRIES = 3


async def _get_with_retry(client: httpx.AsyncClient, url: str, params: dict) -> httpx.Response:
    """GET request with retry + exponential backoff for 429 rate limits."""
    for attempt in range(MAX_RETRIES):
        response = await client.get(url, params=params)
        if response.status_code == 429:
            wait = 2 ** attempt  # 1s, 2s, 4s
            await asyncio.sleep(wait)
            continue
        response.raise_for_status()
        return response
    raise HTTPException(
        status_code=503,
        detail="Weather service is temporarily rate-limited. Please try again in a few seconds.",
    )


async def geocode_city(city: str) -> GeoResult:
    params = {
        "name": city,
        "count": 1,
        "language": "en",
        "format": "json",
    }
    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await _get_with_retry(client, GEOCODE_URL, params)
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


async def fetch_weather(latitude: float, longitude: float, timezone: str | None = None) -> dict:
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "daily": "temperature_2m_max,temperature_2m_min,precipitation_sum,sunshine_duration,wind_speed_10m_max",
        "timezone": timezone or "auto",
        "forecast_days": 7,
    }
    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await _get_with_retry(client, FORECAST_URL, params)
        return response.json()
