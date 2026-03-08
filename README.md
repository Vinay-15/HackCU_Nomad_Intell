# 🌍 Nomad Intelligence

> **Your personal AI city analyst — get a full intelligence report on any city in 30 seconds, benchmarked against your life.**

Hosted on: https://hack-cu-nomad-intell.vercel.app/



## ✨ What Is This?

The remote work revolution has created 35 million+ location-independent professionals — yet choosing *where* to actually live is still completely broken. Hours cross-referencing Numbeo, Reddit, visa forums, weather apps, and Google Maps just to decide if a city is worth considering.

**Nomad Intelligence** solves this. Enter your current city and baseline profile once. Search any destination. Get a complete, personalised intelligence report in under 30 seconds.

---

## 📸 Features

### 🎯 Personalised Delta Score
Compare any destination against *your* current city across 6 dimensions — internet speed, workspace quality, cost of living, safety, outdoor access, and lifestyle. Get a clear **Recommended / Conditional / Disqualified** verdict.

### 🗺️ Interactive Activity Map
AI generates 10–12 real locations with GPS coordinates — coworking spaces, hiking trails, beaches, restaurants, viewpoints — plotted live on a Leaflet map with colour-coded markers by activity type.

### 💰 Full Cost Breakdown
Monthly cost estimates split by category: housing, food, transport, coworking, and leisure — benchmarked against your current budget with a visual comparison bar.

### 🌤️ Live 7-Day Weather
Real forecast data from Open-Meteo injected into the AI prompt, with temperature area charts and rainfall bar charts. Includes best and worst months to visit.

### 🧭 Three Travel Modes
- **Nomad** — floor-based: must meet minimum internet and workspace requirements
- **Relocator** — delta-based: target must score meaningfully higher than your baseline
- **Executive** — non-negotiable: internet and workspace must match or exceed your current setup

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────┐
│              React Frontend (Vercel)         │
│   App.jsx · Recharts · Leaflet · CSS-in-JS  │
└───────────────────┬─────────────────────────┘
                    │ POST /api/analyze
                    ▼
┌─────────────────────────────────────────────┐
│             FastAPI Backend (Render)         │
│                                             │
│  1. geocode_city()   → Open-Meteo Geocoding │
│  2. fetch_weather()  → Open-Meteo Forecast  │
│  3. build_prompt()   → prompt_builder.py    │
│  4. run_oracle()     → Gemini 2.0 Flash     │
│                                             │
│  Returns: { geo, weather, intel }           │
└─────────────────────────────────────────────┘
```

### Request Flow

1. User submits destination city + personal profile
2. Backend geocodes the city via Open-Meteo (no key required)
3. Backend fetches live 7-day weather for those coordinates
4. Backend builds a structured prompt with user profile + weather context
5. Gemini 2.0 Flash returns a ~30-field JSON object
6. Frontend renders results across 4 tabs: Overview · Activities · Cost · Climate

---

## 🗂️ Project Structure

```
nomad-final/
├── frontend/
│   ├── src/
│   │   └── App.jsx              # Entire React app — components, state, CSS, API
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── .env.example
│
└── backend/
    ├── app/
    │   ├── main.py               # FastAPI app + CORS middleware
    │   ├── api/routes/
    │   │   └── analyze.py        # POST /api/analyze endpoint
    │   ├── services/
    │   │   ├── open_meteo.py     # Geocoding + weather (with retry/backoff)
    │   │   ├── prompt_builder.py # Constructs the Gemini prompt
    │   │   ├── oracle_service.py # Calls Gemini, parses JSON response
    │   │   ├── json_utils.py     # JSON repair for truncated responses
    │   │   └── mock_oracle.py    # Dev fallback — no API key needed
    │   ├── models/
    │   │   └── schemas.py        # Pydantic models
    │   └── core/
    │       └── config.py         # Settings from .env
    ├── requirements.txt
    └── .env.example
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Python 3.11+
- A [Google Gemini API key](https://aistudio.google.com) (free tier works)

---

### Backend Setup

```bash
cd nomad-final/backend

# Create and activate virtual environment
python -m venv .venv

# macOS / Linux
source .venv/bin/activate

# Windows (PowerShell)
.\.venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Open .env and add your GEMINI_API_KEY
```

**`.env` file:**
```env
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-2.0-flash
ALLOW_MOCK_ORACLE=false
```

```bash
# Start the backend
uvicorn app.main:app --reload
# Runs on http://localhost:8000
```

---

### Frontend Setup

```bash
cd nomad-final/frontend

npm install

# Configure environment (optional — defaults to localhost:8000)
cp .env.example .env
```

**`frontend/.env` file:**
```env
VITE_API_BASE_URL=http://localhost:8000
```

```bash
npm run dev
# Runs on http://localhost:5173
```

Open [http://localhost:5173](http://localhost:5173) and you're live.

---

### Development Without a Gemini Key

Set `ALLOW_MOCK_ORACLE=true` in your backend `.env` — the app returns a pre-built mock response for any city so you can develop and test the full frontend without API costs.

---

## ⚙️ Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `GEMINI_API_KEY` | Yes* | — | Google Gemini API key |
| `GEMINI_MODEL` | No | `gemini-2.0-flash` | Gemini model to use |
| `ALLOW_MOCK_ORACLE` | No | `false` | Return mock data instead of calling Gemini |
| `VITE_API_BASE_URL` | No | `http://localhost:8000` | Backend URL (frontend) |

*Not required if `ALLOW_MOCK_ORACLE=true`

---

## 🤖 How the AI Works

The intelligence pipeline is built around a single, carefully engineered Gemini prompt. Key design decisions:

**Live weather injection** — the current week's actual forecast is summarised and included in the prompt, so Gemini's outdoor recommendations reflect real conditions, not historical averages.

**User profile context** — budget, internet speed, workspace requirements, travel mode, and activity preferences are all passed in, making every response personalised.

**Strict JSON schema** — the prompt instructs Gemini to return only a specific JSON shape with ~30 fields. A JSON repair utility handles rare truncated responses near the token limit.

**Coordinate constraints** — all activity GPS coordinates are constrained to within 40km of the city centre to prevent hallucinated locations.

**Temperature: 0.4** — low enough for factual consistency, high enough for varied activity recommendations.

### The Intel Object

Gemini returns a single JSON object covering:

| Category | Fields |
|---|---|
| Work | `internet`, `workspace` |
| Cost | `cost_total`, `cost_housing`, `cost_food`, `cost_transport`, `cost_coworking`, `cost_leisure` |
| Scores | `safety`, `outdoor`, `lifestyle`, `air_quality`, `sentiment` |
| Visa | `visa_ease`, `visa_details` |
| Activities | `activities[]` — name, type, lat/lng, distance, description |
| Climate | `best_months`, `worst_months`, `climate_note` |
| Insights | `summary`, `top_highlight`, `neighborhood`, `arbitrage_signal`, `arbitrage_note` |


---

## 🔭 Roadmap

- User accounts + saved searches + analysis history
- Multi-city side-by-side comparison view
- Real-time cost data via Numbeo API
- Verified activity locations via Google Places API
- Mobile app (React Native)
- Community validation layer — user-submitted corrections to AI estimates
-  Developer API for third-party integrations
- True multi-agent architecture with parallel specialised agents

---

## 🏆 Hackathon

**What we learned:**
- Prompt engineering is real engineering — output quality is almost entirely determined by prompt structure and constraints
- Deployment environments differ massively from local — rate limits, CORS, and IP throttling don't show up on `localhost`
- AI can generate spatially-aware content — having Gemini produce real GPS coordinates and plotting them live on a map transforms text analysis into an interactive geographic experience

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Recharts, Leaflet |
| Backend | FastAPI, Python 3.11, Pydantic, uvicorn, httpx |
| AI | Google Gemini 2.0 Flash |
| Data | Open-Meteo (geocoding + weather) |
| Hosting | Vercel (frontend), Render (backend) |

---

## 📄 License

MIT — do whatever you want with it.

---

<p align="center">
  Built with ☕ and too little sleep · <strong>Nomad Intelligence </strong>
</p>
