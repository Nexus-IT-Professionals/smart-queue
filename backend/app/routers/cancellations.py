"""Patient and provider cancellation review (TECHNICAL_PROPOSAL §2, §4, §6)."""
from fastapi import APIRouter

router = APIRouter(prefix="/cancellations", tags=["cancellations"])

# TODO: patient cancellation request; staff confirms vacancy; show lead time.
# TODO: provider cancellation blocks capacity; <24h -> manual relocation task, no transfer.
