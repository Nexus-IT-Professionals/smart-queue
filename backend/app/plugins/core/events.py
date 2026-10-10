"""Allowlisted, minimal application events; deliberately excludes patient data."""

from dataclasses import dataclass, field
from datetime import datetime, timezone
from uuid import uuid4


SUPPORTED_EVENTS = frozenset(
    {
        "appointment.cancelled",
        "ana.waitlist.evaluated",
        "ana.invitation.sent",
        "ana.invitation.accepted",
        "appointment.reassigned",
        "ana.workflow.completed",
        "ana.workflow.failed",
    }
)


@dataclass(frozen=True, slots=True)
class ApplicationEvent:
    """A notification-safe event envelope. Never put names, IDs, or conditions here."""

    event_type: str
    appointment_date: str
    appointment_time: str
    provider_or_resource: str
    workflow_status: str
    correlation_id: str = field(default_factory=lambda: str(uuid4()))
    event_id: str = field(default_factory=lambda: str(uuid4()))
    occurred_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

    def __post_init__(self) -> None:
        if self.event_type not in SUPPORTED_EVENTS:
            raise ValueError("Unsupported application event type")
        if not self.appointment_date or len(self.appointment_date) > 32:
            raise ValueError("Invalid appointment date")
        if not self.appointment_time or len(self.appointment_time) > 32:
            raise ValueError("Invalid appointment time")
        if not self.provider_or_resource or len(self.provider_or_resource) > 100:
            raise ValueError("Invalid provider or resource")
        if not self.workflow_status or len(self.workflow_status) > 64:
            raise ValueError("Invalid workflow status")
        if len(self.correlation_id) > 64 or len(self.event_id) > 64:
            raise ValueError("Event identifiers are too long")
