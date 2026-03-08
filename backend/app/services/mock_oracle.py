from math import cos

ACTIVITY_TYPES = [
    "hiking",
    "park",
    "viewpoint",
    "coworking",
    "food",
    "cycling",
    "wellness",
    "beach",
]


def _clamp(value: float, low: int = 1, high: int = 10) -> int:
    return max(low, min(high, int(round(value))))


def _activity(geo, idx: int, name: str, type_: str, lat_offset: float, lon_offset: float, distance: float, description: str) -> dict:
    lon_scale = max(cos(abs(geo.latitude) * 0.01745), 0.35)
    return {
        "id": f"act_{idx}",
        "name": name,
        "type": type_,
        "lat": round(geo.latitude + lat_offset, 6),
        "lon": round(geo.longitude + (lon_offset / lon_scale), 6),
        "distance": round(distance, 1),
        "description": description,
    }


def build_mock_oracle_payload(*, geo, weather: dict, mode: str, anchor, prefs: list[str]) -> dict:
    daily = weather.get("daily", {})
    avg_high = sum(daily.get("temperature_2m_max", [20] * 7)) / max(len(daily.get("temperature_2m_max", [])) or 1, 1)
    total_rain = sum(daily.get("precipitation_sum", [0] * 7))
    avg_wind = sum(daily.get("wind_speed_10m_max", [10] * 7)) / max(len(daily.get("wind_speed_10m_max", [])) or 1, 1)
    sunshine = sum(daily.get("sunshine_duration", [18000] * 7)) / max(len(daily.get("sunshine_duration", [])) or 1, 1) / 3600

    outdoor = _clamp(7 + (avg_high - 18) / 6 - total_rain / 25)
    lifestyle = _clamp(6 + len(prefs) * 0.25)
    safety = _clamp(7 - avg_wind / 30)
    workspace = _clamp(anchor.workspace + 1)
    internet = max(40, anchor.internet + 20)

    activities = [
        _activity(geo, 1, f"{geo.name} Central Cowork", "coworking", 0.012, 0.008, 1.6, "Modern desks, fast Wi‑Fi, and a good day-pass setup."),
        _activity(geo, 2, f"{geo.name} Riverfront Trail", "cycling", 0.03, -0.015, 3.8, "A scenic loop for easy morning rides and sunset walks."),
        _activity(geo, 3, f"Old Town {geo.name}", "food", -0.01, 0.01, 1.4, "Dense cluster of cafés, bakeries, and late-night dinner options."),
        _activity(geo, 4, f"{geo.name} Panorama Point", "viewpoint", 0.055, 0.028, 7.9, "Best elevated view over the city and surrounding landscape."),
        _activity(geo, 5, f"{geo.name} Wellness Studio", "wellness", -0.018, -0.012, 2.1, "Popular for yoga, recovery sessions, and community classes."),
        _activity(geo, 6, f"{geo.name} Green Park", "park", 0.016, -0.02, 2.9, "Reliable green space for breaks, jogging, and reading outdoors."),
        _activity(geo, 7, f"{geo.name} Ridge Trailhead", "hiking", 0.09, 0.045, 12.7, "Half-day hike with strong views and a straightforward trailhead."),
        _activity(geo, 8, f"{geo.name} Waterfront Spot", "beach", -0.06, 0.03, 8.4, "Useful for warm-weather downtime and easy social afternoons."),
        _activity(geo, 9, f"{geo.name} Design District", "food", 0.006, 0.027, 2.5, "Walkable neighborhood with coffee shops and creative studios."),
        _activity(geo, 10, f"{geo.name} North Loop Workspace", "coworking", 0.024, 0.036, 4.3, "Quiet coworking option with meeting rooms and reliable focus zones."),
    ]

    cost_housing = int(anchor.budget * 0.48)
    cost_food = int(anchor.budget * 0.2)
    cost_transport = int(anchor.budget * 0.08)
    cost_coworking = int(anchor.budget * 0.1)
    cost_leisure = int(anchor.budget * 0.12)
    cost_total = cost_housing + cost_food + cost_transport + cost_coworking + cost_leisure

    if mode == "executive":
        mode_note = "This works best as a short, polished stay if you prioritize reliable workdays and frictionless logistics."
    elif mode == "relocator":
        mode_note = "The city looks strongest when you care about a broad life upgrade rather than pure short-term arbitrage."
    else:
        mode_note = "The destination fits a hop-based lifestyle if your floor for workspace and internet matters more than luxury."

    best_months = ["May", "Jun", "Sep", "Oct"] if avg_high < 30 else ["Mar", "Apr", "Oct", "Nov"]
    worst_months = ["Dec", "Jan"] if avg_high < 15 else ["Jul", "Aug"]

    return {
        "internet": internet,
        "workspace": workspace,
        "cost_total": cost_total,
        "cost_housing": cost_housing,
        "cost_food": cost_food,
        "cost_transport": cost_transport,
        "cost_coworking": cost_coworking,
        "cost_leisure": cost_leisure,
        "safety": safety,
        "outdoor": outdoor,
        "lifestyle": lifestyle,
        "air_quality": _clamp(7 - total_rain / 40 + sunshine / 10),
        "visa_ease": 6,
        "visa_details": "Check your passport-specific entry rules before booking; long stays may require additional paperwork.",
        "sentiment": _clamp(6 + sunshine / 6),
        "outdoor_scores": {
            "hiking": outdoor,
            "water": _clamp(5 + avg_high / 8),
            "cycling": _clamp(6 + sunshine / 5),
            "climbing": _clamp(5 + outdoor / 4),
            "wellness": _clamp(6 + lifestyle / 5),
            "urban": _clamp(6 + lifestyle / 4),
        },
        "activities": activities,
        "best_months": best_months,
        "worst_months": worst_months,
        "summary": f"{geo.name} looks like a balanced base with decent work reliability and a good mix of urban and outdoor options. The near-term weather points to manageable conditions for daily routines. Cost performance is solid enough to compare against your anchor instead of dismissing outright.",
        "top_highlight": f"The strongest signal is how easily {geo.name} combines productive weekdays with nearby after-work activities.",
        "neighborhood": f"Central {geo.name}",
        "neighborhood_why": "It keeps commute friction low while preserving access to cafés, coworking, and evening activity.",
        "community_vibe": "There is enough social and professional density to meet people without forcing a party-heavy routine.",
        "english_friendly": 7,
        "coworking_scene": _clamp(workspace),
        "arbitrage_signal": "stable" if cost_total <= anchor.budget else "declining",
        "arbitrage_note": "The city feels more like a quality-of-life play than a sharp cost arbitrage bet.",
        "climate_note": f"Current conditions lean toward {'comfortable' if outdoor >= 7 else 'mixed'} outdoor use, with roughly {round(sunshine, 1)} hours of daily sunshine.",
        "mode_specific_note": mode_note,
    }
