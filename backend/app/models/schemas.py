
from typing import Any

from pydantic import BaseModel, Field


class Anchor(BaseModel):
    currentCity: str = ""
    budget: int = 2500
    internet: int = 80
    workspace: int = 7
    outdoor: int = 7
    minInternet: int = 30
    minWorkspace: int = 5


class AnalyzeRequest(BaseModel):
    mode: str = Field(pattern="^(executive|relocator|nomad)$")
    target_city: str = Field(min_length=1)
    anchor: Anchor
    prefs: list[str] = Field(default_factory=list)


class GeoResult(BaseModel):
    name: str
    country: str
    country_code: str
    latitude: float
    longitude: float
    timezone: str | None = None


class AnalyzeResponse(BaseModel):
    geo: GeoResult
    weather: dict[str, Any]
    intel: dict[str, Any]
