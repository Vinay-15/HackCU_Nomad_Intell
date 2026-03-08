
from fastapi import APIRouter, HTTPException
import httpx

from app.models.schemas import AnalyzeRequest, AnalyzeResponse
from app.services.open_meteo import fetch_weather, geocode_city
from app.services.oracle_service import generate_oracle_payload

router = APIRouter(tags=["analysis"])


@router.get("/health")
async def health_check() -> dict:
    return {"status": "ok"}


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_city(request: AnalyzeRequest) -> AnalyzeResponse:
    try:
        geo = await geocode_city(request.target_city)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Geocoding failed: {e}")

    try:
        weather = await fetch_weather(geo.latitude, geo.longitude, geo.timezone)
    except HTTPException:
        raise
    except (httpx.HTTPStatusError, httpx.TimeoutException) as e:
        raise HTTPException(status_code=502, detail=f"Weather service error: {e}")

    try:
        intel = await generate_oracle_payload(
            geo=geo,
            weather=weather,
            mode=request.mode,
            anchor=request.anchor,
            prefs=request.prefs,
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI analysis failed: {e}")

    return AnalyzeResponse(geo=geo, weather=weather, intel=intel)

