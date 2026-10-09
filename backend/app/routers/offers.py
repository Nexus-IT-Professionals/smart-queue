"""Sequential offers, patient inbox and replies (TECHNICAL_PROPOSAL §6, §7)."""
from fastapi import APIRouter

router = APIRouter(prefix="/offers", tags=["offers"])

# TODO: staff creates an offer for a selected candidate; patient inbox (polling).
# TODO: POST interpret reply -> AI suggestion; explicit accept/decline/help buttons.
