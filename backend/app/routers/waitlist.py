"""Waitlist entries (TECHNICAL_PROPOSAL §4, §6)."""
from fastapi import APIRouter

router = APIRouter(prefix="/waitlist", tags=["waitlist"])

# TODO: add/list/update entries; desired date/time, reason, insurer.
# TODO: priority is staff-only; a patient sees only their own entry.
