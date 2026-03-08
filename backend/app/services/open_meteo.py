import httpx
from fastapi import HTTPException

from app.models.schemas import GeoResult

GEOCODE_URL = "https://geocoding-api.open-meteo.com/v1/search"
FORECAST_URL = "https://api.open-meteo.com/v1/forecast"


async def geocode_city(city: str) -> GeoResult:
    params = {
        "name": city,
        "count": 1,
        "language": "en",
        "format": "json",
    }
    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.get(GEOCODE_URL, params=params)
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


async def fetch_weather(latitude: float, longitude: float, timezone: str | None = None) -> dict:
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "daily": "temperature_2m_max,temperature_2m_min,precipitation_sum,sunshine_duration,wind_speed_10m_max",
        "timezone": timezone or "auto",
        "forecast_days": 7,
    }
    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.get(FORECAST_URL, params=params)
        response.raise_for_status()
        return response.json()
