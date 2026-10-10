"""FastAPI app: routers under /api, health check, built frontend (TECHNICAL_PROPOSAL §3, §4)."""
from contextlib import asynccontextmanager
from ipaddress import ip_address
from pathlib import Path
from typing import Literal
from urllib.parse import urlsplit
from uuid import UUID

from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel, ConfigDict, Field
from fastapi.staticfiles import StaticFiles

from app import config
from app.plugins.core.events import ApplicationEvent
from app.plugins.runtime import create_plugin_runtime
from app.routers import appointments, auth, cancellations, offers, patients, stats, waitlist


@asynccontextmanager
async def lifespan(application: FastAPI):
    registry, dispatcher = create_plugin_runtime()
    application.state.plugin_registry = registry
    application.state.event_dispatcher = dispatcher
    try:
        yield
    finally:
        await dispatcher.drain()


app = FastAPI(title="Smart Appointment Queue", lifespan=lifespan)


class LocalDemoEvent(BaseModel):
    """Allowlisted, synthetic transitions from the local browser-only POC."""

    model_config = ConfigDict(extra="forbid")
    kind: Literal["cancelled", "updated"]
    appointment_date: str = Field(pattern=r"^\d{4}-\d{2}-\d{2}$")
    appointment_time: str = Field(min_length=1, max_length=16, pattern=r"^[0-9: APMapm]+$")
    event_id: UUID
    correlation_id: UUID


def _is_loopback_request(request: Request) -> bool:
    """Reject any event relay use beyond the local dev server and local UI."""
    client_host = request.client.host if request.client else ""
    try:
        if not ip_address(client_host).is_loopback:
            return False
    except ValueError:
        return False
    origin = request.headers.get("origin", "")
    parsed = urlsplit(origin)
    try:
        origin_loopback = parsed.hostname in {"localhost", "127.0.0.1", "::1"}
        origin_port = parsed.port
    except ValueError:
        return False
    valid_port = origin_port is None or 1 <= origin_port <= 65535
    return parsed.scheme == "http" and origin_loopback and valid_port


@app.post("/api/local-demo/events", status_code=202)
async def publish_local_demo_event(payload: LocalDemoEvent, request: Request) -> dict:
    """Relay only synthetic browser-demo milestones into the optional plugin."""
    if not _is_loopback_request(request):
        raise HTTPException(status_code=404, detail="Not found")
    dispatcher = getattr(request.app.state, "event_dispatcher", None)
    if dispatcher is None:
        raise HTTPException(status_code=503, detail="Event dispatcher unavailable")
    event_specs = {
        "cancelled": (
            ("appointment.cancelled", "Cancellation recorded; ANA opened an eligible demo slot."),
        ),
        "updated": (
            ("appointment.reassigned", "Schedule updated after patient confirmation."),
            ("ana.workflow.completed", "Demo scheduling workflow completed."),
        ),
    }
    event_ids = []
    for event_type, status in event_specs[payload.kind]:
        suffix = event_type.rsplit(".", 1)[-1]
        event_id = f"{payload.event_id.hex[:24]}-{suffix}"
        event = ApplicationEvent(
            event_type=event_type,
            appointment_date=payload.appointment_date,
            appointment_time=payload.appointment_time,
            provider_or_resource="Dr. Carlos Rivera",
            workflow_status=status,
            correlation_id=str(payload.correlation_id),
            event_id=event_id,
        )
        dispatcher.publish(event)
        event_ids.append(event_id)
    return {"accepted": True, "event_ids": event_ids}

for module in (auth, patients, appointments, waitlist, cancellations, offers, stats):
    app.include_router(module.router, prefix="/api")


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok"}


# TODO: init DB at startup; resolve expired offers at startup (§6).

# Serve the built frontend from one origin when present. Mounted last so /api wins.
if Path(config.STATIC_DIR).is_dir():
    app.mount("/", StaticFiles(directory=config.STATIC_DIR, html=True), name="static")
