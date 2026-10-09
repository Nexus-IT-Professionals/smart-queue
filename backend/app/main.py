"""FastAPI app: routers under /api, health check, built frontend (TECHNICAL_PROPOSAL §3, §4)."""
from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from app import config
from app.routers import appointments, auth, cancellations, offers, patients, stats, waitlist

app = FastAPI(title="Smart Appointment Queue")

for module in (auth, patients, appointments, waitlist, cancellations, offers, stats):
    app.include_router(module.router, prefix="/api")


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok"}


# TODO: init DB at startup; resolve expired offers at startup (§6).

# Serve the built frontend from one origin when present. Mounted last so /api wins.
if Path(config.STATIC_DIR).is_dir():
    app.mount("/", StaticFiles(directory=config.STATIC_DIR, html=True), name="static")
