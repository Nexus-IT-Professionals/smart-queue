"""Patient and staff-assisted registration (TECHNICAL_PROPOSAL §4)."""
from fastapi import APIRouter

router = APIRouter(prefix="/patients", tags=["patients"])

# TODO: create/read/update patient profile and contact preference.
# TODO: enforce patient ownership and staff office membership on reads and writes.
