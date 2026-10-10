"""Environment-only Teams configuration; webhook URL is treated as a secret."""

import os
from dataclasses import dataclass
from pathlib import Path
from urllib.parse import urlsplit

from app.plugins.core.events import SUPPORTED_EVENTS

DEFAULT_EVENTS = frozenset(
    {
        "appointment.cancelled",
        "appointment.reassigned",
        "ana.workflow.completed",
        "ana.workflow.failed",
    }
)
ALLOWED_WEBHOOK_SUFFIXES = (
    ".logic.azure.com",
    ".webhook.office.com",
    ".powerplatform.com",
)


@dataclass(frozen=True, slots=True)
class TeamsSettings:
    enabled: bool = False
    webhook_url: str = ""
    events: frozenset[str] = DEFAULT_EVENTS
    mode: str = "demo"
    dashboard_url: str = ""
    timeout_seconds: float = 3.0
    team_name: str = ""
    channel_name: str = ""

    @staticmethod
    def _environment(include_local: bool) -> dict[str, str]:
        """Read ignored backend/.env without printing or mutating process environment."""
        result: dict[str, str] = {}
        path = Path(__file__).resolve().parents[3] / ".env"
        if include_local and path.is_file():
            for line in path.read_text(encoding="utf-8").splitlines():
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                key, value = line.split("=", 1)
                key = key.strip()
                value = value.strip()
                if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
                    value = value[1:-1]
                if key and key.replace("_", "").isalnum():
                    result[key] = value
        result.update(os.environ)
        return result

    @classmethod
    def from_env(cls, *, include_local: bool = False) -> "TeamsSettings":
        env = cls._environment(include_local)
        enabled = env.get("TEAMS_PLUGIN_ENABLED", "false").strip().lower() in {
            "true", "1", "yes"
        }
        raw_events = env.get(
            "TEAMS_NOTIFICATION_EVENTS", ",".join(sorted(DEFAULT_EVENTS))
        )
        events = frozenset(value.strip() for value in raw_events.split(",") if value.strip())
        settings = cls(
            enabled=enabled,
            webhook_url=env.get("TEAMS_WEBHOOK_URL", "").strip(),
            events=events,
            mode=env.get("TEAMS_NOTIFICATION_MODE", "demo").strip().lower(),
            dashboard_url=env.get("TEAMS_DASHBOARD_URL", "").strip(),
            timeout_seconds=float(env.get("TEAMS_REQUEST_TIMEOUT_SECONDS", "3")),
            team_name=env.get("TEAMS_TEAM_NAME", "").strip(),
            channel_name=env.get("TEAMS_CHANNEL_NAME", "").strip(),
        )
        settings.validate()
        return settings

    def validate(self) -> None:
        if not self.enabled:
            return
        if not self.webhook_url:
            raise ValueError("TEAMS_WEBHOOK_URL is required when Teams is enabled")
        parsed = urlsplit(self.webhook_url)
        hostname = (parsed.hostname or "").lower().rstrip(".")
        allowed_host = any(
            hostname.endswith(suffix) and hostname != suffix.lstrip(".")
            for suffix in ALLOWED_WEBHOOK_SUFFIXES
        )
        if (
            parsed.scheme != "https"
            or not allowed_host
            or parsed.username is not None
            or parsed.password is not None
            or parsed.port not in (None, 443)
            or not parsed.path
        ):
            raise ValueError("TEAMS_WEBHOOK_URL must be a valid HTTPS Microsoft workflow URL")
        if self.mode not in {"demo", "live"}:
            raise ValueError("TEAMS_NOTIFICATION_MODE must be demo or live")
        unknown = self.events - SUPPORTED_EVENTS
        if unknown:
            raise ValueError("TEAMS_NOTIFICATION_EVENTS contains an unsupported event")
        if not self.events:
            raise ValueError("TEAMS_NOTIFICATION_EVENTS must include at least one event")
        if not 0.2 <= self.timeout_seconds <= 15:
            raise ValueError("TEAMS_REQUEST_TIMEOUT_SECONDS must be between 0.2 and 15")
        if self.dashboard_url:
            dashboard = urlsplit(self.dashboard_url)
            if (
                dashboard.scheme != "https"
                or not dashboard.netloc
                or dashboard.username is not None
                or dashboard.password is not None
            ):
                raise ValueError("TEAMS_DASHBOARD_URL must be an HTTPS URL")
