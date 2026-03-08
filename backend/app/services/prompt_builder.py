
MODE_RULES = {
    "executive": "All work dims must match or exceed anchor",
    "relocator": "DNA match ≥ 0.75 AND mean delta > +0.15",
    "nomad": "All critical floors must be satisfied",
}

PREF_LABELS = {
    "hiking": "Hiking & Trekking",
    "water": "Water Sports",
    "cycling": "Cycling",
    "climbing": "Climbing",
    "wellness": "Wellness & Yoga",
    "urban": "Urban Exploration",
}


def build_oracle_prompt(*, geo, weather: dict, mode: str, anchor, prefs: list[str]) -> str:
    if weather.get("daily"):
        daily = weather["daily"]
        avg_high = round(sum(daily.get("temperature_2m_max", [])) / 7)
        avg_sun = round(sum(daily.get("sunshine_duration", [])) / 3600 / 7)
        rain = round(sum(daily.get("precipitation_sum", [])), 1)
        weather_summary = f"Avg high {avg_high}°C, sun {avg_sun}h/day, rain {rain}mm/wk"
    else:
        weather_summary = "unavailable"

    pref_summary = ", ".join(PREF_LABELS.get(pref, pref) for pref in prefs) or "general"

    return f"""
You are ORACLE analyzing {geo.name}, {geo.country} (lat:{geo.latitude}, lon:{geo.longitude}) for a {mode} traveler.

ANCHOR: city={anchor.currentCity or 'unknown'}, budget=${anchor.budget}/mo, internet={anchor.internet}Mbps, workspace={anchor.workspace}/10, outdoor_importance={anchor.outdoor}/10
PREFERENCES: {pref_summary}
LIVE WEATHER: {weather_summary}
MODE: {mode.upper()} — {MODE_RULES[mode]}

IMPORTANT:
- Return strictly valid JSON.
- Use double quotes for all strings.
- Do not include markdown, comments, or backticks.
- Do not include trailing commas.
- Keep strings concise.
- Generate 10-12 REAL locations if possible; if uncertain, prefer fewer, higher-confidence activities.
- Coordinates must be realistic and within 40km of the city center.

Return ONLY this JSON shape:
{{
  "internet": <number, typical Mbps at coworking spaces>,
  "workspace": <1-10>,
  "cost_total": <monthly USD total>,
  "cost_housing": <USD/mo>,
  "cost_food": <USD/mo>,
  "cost_transport": <USD/mo>,
  "cost_coworking": <USD/mo>,
  "cost_leisure": <USD/mo>,
  "safety": <1-10>,
  "outdoor": <1-10>,
  "lifestyle": <1-10>,
  "air_quality": <1-10>,
  "visa_ease": <1-10>,
  "visa_details": "<1 sentence>",
  "sentiment": <1-10>,
  "outdoor_scores": {{
    "hiking": <1-10>,
    "water": <1-10>,
    "cycling": <1-10>,
    "climbing": <1-10>,
    "wellness": <1-10>,
    "urban": <1-10>
  }},
  "activities": [
    {{
      "id": "<unique string like act_1>",
      "name": "<real place name>",
      "type": "<one of: hiking|beach|park|viewpoint|coworking|wellness|food|cycling>",
      "lat": <real latitude as number>,
      "lon": <real longitude as number>,
      "distance": <km from city center as number>,
      "description": "<1 short sentence>"
    }}
  ],
  "best_months": ["<3-letter month>"],
  "worst_months": ["<3-letter month>"],
  "summary": "<3 sentences honest assessment>",
  "top_highlight": "<one compelling insight>",
  "neighborhood": "<best neighborhood name>",
  "neighborhood_why": "<1 sentence why>",
  "community_vibe": "<1 sentence>",
  "english_friendly": <1-10>,
  "coworking_scene": <1-10>,
  "arbitrage_signal": "<rising|stable|declining>",
  "arbitrage_note": "<1 sentence on cost vs quality trend>",
  "climate_note": "<1 sentence on outdoor suitability>",
  "mode_specific_note": "<1 sentence specific to {mode} travelers>"
}}
""".strip()
