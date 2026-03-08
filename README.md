
# Nomad Intelligence — Gemini Fullstack

This version uses:
- React + Vite for the frontend
- FastAPI for the backend
- Gemini API for ORACLE synthesis
- Open-Meteo for geocoding + weather

## Quick start

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend
```bash
cd backend
python -m venv .venv
# PowerShell
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
copy .env.example .env
# then edit .env and add your GEMINI_API_KEY
python -m uvicorn app.main:app --reload
```

Open http://localhost:5173

## Notes
- The backend supports mock fallback if `ALLOW_MOCK_ORACLE=true` and no Gemini key is provided.
- Frontend API base URL can be changed with `frontend/.env` using `VITE_API_BASE_URL`.
- If PowerShell mixes Conda and `.venv`, use the venv Python directly:
  `./.venv/Scripts/python.exe -m uvicorn app.main:app --reload`
