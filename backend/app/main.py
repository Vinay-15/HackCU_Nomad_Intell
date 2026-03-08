
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.analyze import router as analyze_router
from app.core.config import get_settings

settings = get_settings()

app = FastAPI(title="Nomad Intelligence API", version="2.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(analyze_router, prefix="/api")


@app.get("/")
async def root() -> dict:
    return {"message": "Nomad Intelligence backend is running."}
