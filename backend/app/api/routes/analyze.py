
from fastapi import APIRouter

from app.models.schemas import AnalyzeRequest, AnalyzeResponse
from app.services.open_meteo import fetch_weather, geocode_city
from app.services.oracle_service import generate_oracle_payload

router = APIRouter(tags=["analysis"])


@router.get("/health")
async def health_check() -> dict:
    return {"status": "ok"}


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_city(request: AnalyzeRequest) -> AnalyzeResponse:
    geo = await geocode_city(request.target_city)
    weather = await fetch_weather(geo.latitude, geo.longitude, geo.timezone)
    intel = await generate_oracle_payload(
        geo=geo,
        weather=weather,
        mode=request.mode,
        anchor=request.anchor,
        prefs=request.prefs,
    )
    return AnalyzeResponse(geo=geo, weather=weather, intel=intel)
