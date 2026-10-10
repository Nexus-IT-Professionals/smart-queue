"""Teams event subscriber with bounded, process-local delivery status history."""

import logging
from collections import deque

from app.plugins.core.events import ApplicationEvent
from app.plugins.teams.client import DeliveryResult, TeamsWebhookClient
from app.plugins.teams.config import TeamsSettings

logger = logging.getLogger(__name__)


class TeamsPlugin:
    name = "microsoft-teams"

    def __init__(self, settings: TeamsSettings, client: TeamsWebhookClient | None = None) -> None:
        settings.validate()
        if not settings.enabled:
            raise ValueError("Cannot register a disabled Teams plugin")
        self.settings = settings
        self.client = client or TeamsWebhookClient(settings)
        self._events = settings.events
        self._deliveries: deque[DeliveryResult] = deque(maxlen=100)

    @property
    def subscribed_events(self) -> frozenset[str]:
        return self._events

    @property
    def recent_deliveries(self) -> tuple[DeliveryResult, ...]:
        return tuple(self._deliveries)

    @property
    def last_delivery(self) -> DeliveryResult | None:
        return self._deliveries[-1] if self._deliveries else None

    async def handle(self, event: ApplicationEvent) -> str:
        if event.event_type not in self._events:
            return "skipped"
        result = await self.client.send(event)
        self._deliveries.append(result)
        if result.status == "failed":
            logger.warning(
                "Teams notification delivery failed event_type=%s event_id=%s attempts=%s error=%s",
                event.event_type,
                event.event_id,
                result.attempts,
                result.error_code,
            )
        else:
            logger.info(
                "Teams notification delivered event_type=%s event_id=%s http_status=%s",
                event.event_type,
                event.event_id,
                result.http_status,
            )
        return result.status
