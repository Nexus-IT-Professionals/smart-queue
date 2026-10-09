"""Pydantic request/response models (TECHNICAL_PROPOSAL §4, §7)."""
from typing import Literal

from pydantic import BaseModel


class ReplyIntent(BaseModel):
    """Bounded AI output: a suggestion only, never a booking decision."""

    intent: Literal["accept", "decline", "help", "unclear"]


# TODO: Login, Patient, Appointment, WaitlistEntry, Offer, Stats models.
