"""Send one synthetic Teams test notification. Run from backend/ with the venv Python."""

import asyncio
import sys

from app.plugins.core.events import ApplicationEvent
from app.plugins.teams.client import TeamsWebhookClient
from app.plugins.teams.config import TeamsSettings


async def main() -> int:
    settings = TeamsSettings.from_env(include_local=True)
    if not settings.enabled:
        print("Teams plugin is disabled. Set TEAMS_PLUGIN_ENABLED=true to send the synthetic test message.")
        return 2
    event = ApplicationEvent(
        event_type="ana.workflow.completed",
        appointment_date="2026-10-08",
        appointment_time="2:00 PM",
        provider_or_resource="Demo Provider",
        workflow_status="Test notification",
        correlation_id="teams-plugin-test",
        event_id="teams-plugin-test",
    )
    result = await TeamsWebhookClient(settings).send(event)
    print(f"Teams test notification {result.status}; attempts={result.attempts}; status={result.http_status or result.error_code or 'unknown'}")
    return 0 if result.status == "delivered" else 1


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
