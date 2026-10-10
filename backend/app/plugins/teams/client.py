"""Bounded asynchronous webhook transport with no redirects or secret-bearing logs."""

import asyncio
from dataclasses import dataclass

import httpx

from app.plugins.core.events import ApplicationEvent
from app.plugins.teams.config import TeamsSettings
from app.plugins.teams.formatter import format_message


@dataclass(frozen=True, slots=True)
class DeliveryResult:
    event_id: str
    status: str
    attempts: int
    http_status: int | None = None
    error_code: str | None = None


class TeamsWebhookClient:
    def __init__(
        self,
        settings: TeamsSettings,
        *,
        transport: httpx.AsyncBaseTransport | None = None,
        retry_delays: tuple[float, ...] = (0.1, 0.3),
    ) -> None:
        self.settings = settings
        self._transport = transport
        self._retry_delays = retry_delays

    async def send(self, event: ApplicationEvent) -> DeliveryResult:
        payload = format_message(
            event,
            mode=self.settings.mode,
            dashboard_url=self.settings.dashboard_url,
            team_name=self.settings.team_name,
            channel_name=self.settings.channel_name,
        )
        attempts = len(self._retry_delays) + 1
        for attempt in range(1, attempts + 1):
            try:
                async with httpx.AsyncClient(
                    timeout=self.settings.timeout_seconds,
                    follow_redirects=False,
                    transport=self._transport,
                ) as client:
                    response = await client.post(
                        self.settings.webhook_url,
                        json=payload,
                        headers={"Content-Type": "application/json"},
                    )
                if 200 <= response.status_code < 300:
                    return DeliveryResult(event.event_id, "delivered", attempt, response.status_code)
                error = f"http_{response.status_code}"
                retryable = response.status_code == 429 or response.status_code >= 500
            except httpx.TimeoutException:
                error, retryable = "timeout", True
            except httpx.HTTPError:
                error, retryable = "transport_error", True
            except Exception:
                error, retryable = "unexpected_error", False
            if not retryable or attempt == attempts:
                return DeliveryResult(event.event_id, "failed", attempt, error_code=error)
            await asyncio.sleep(self._retry_delays[attempt - 1])
        return DeliveryResult(event.event_id, "failed", attempts, error_code="retry_exhausted")
