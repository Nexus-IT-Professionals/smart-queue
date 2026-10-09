"""Daily schedule and appointments (TECHNICAL_PROPOSAL §4, §6)."""
from fastapi import APIRouter

router = APIRouter(prefix="/appointments", tags=["appointments"])

# TODO: list by date/office/insurer (staff); own appointment (patient).
# TODO: mark completed (staff only) — "served" metric source.
