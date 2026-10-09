"""Statistics (TECHNICAL_PROPOSAL §6 metric definitions)."""
from fastapi import APIRouter

router = APIRouter(prefix="/stats", tags=["stats"])

# TODO: GET cancellation rates, waitlist size, daily additions, served count (staff only).
