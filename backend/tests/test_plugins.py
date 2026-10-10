import asyncio
import logging
from datetime import datetime, timezone

import httpx
import pytest

from app.plugins.core import ApplicationEvent, EventDispatcher, PluginRegistry
from app.plugins.teams.client import TeamsWebhookClient
from app.plugins.teams.config import TeamsSettings
from app.plugins.teams.formatter import format_message
from app.plugins.teams.plugin import TeamsPlugin


def event(event_type="appointment.reassigned", **values):
    defaults = dict(
        event_type=event_type,
        appointment_date="2026-10-08",
        appointment_time="2:00 PM",
        provider_or_resource="Dr. Rivera",
        workflow_status="Patient confirmed",
        correlation_id="correlation-demo-1",
        event_id="event-demo-1",
        occurred_at=datetime(2026, 10, 8, 18, tzinfo=timezone.utc),
    )
    return ApplicationEvent(**(defaults | values))


def settings(**values):
    return TeamsSettings(**(
        {
            "enabled": True,
            "webhook_url": "https://prod-01.westus.logic.azure.com/workflows/fake?sig=synthetic-test-value",
            "events": frozenset({"appointment.reassigned", "ana.workflow.completed"}),
        }
        | values
    ))


def test_disabled_by_default_and_does_not_require_webhook(monkeypatch):
    for key in (
        "TEAMS_PLUGIN_ENABLED", "TEAMS_WEBHOOK_URL", "TEAMS_NOTIFICATION_EVENTS",
        "TEAMS_NOTIFICATION_MODE", "TEAMS_DASHBOARD_URL", "TEAMS_REQUEST_TIMEOUT_SECONDS",
    ):
        monkeypatch.delenv(key, raising=False)
    config = TeamsSettings.from_env()
    assert config.enabled is False
    assert config.webhook_url == ""
    registry = PluginRegistry()
    assert registry.names == ()


@pytest.mark.parametrize(
    "url",
    [
        "http://prod-01.logic.azure.com/workflow?sig=x",
        "https://localhost/workflow?sig=x",
        "https://127.0.0.1/workflow?sig=x",
        "https://example.com/workflow?sig=x",
        "https://logic.azure.com.evil.invalid/workflow?sig=x",
        "https://user:pass@prod.logic.azure.com/workflow?sig=x",
        "https://prod.logic.azure.com:444/workflow?sig=x",
    ],
)
def test_rejects_non_microsoft_or_unsafe_webhook_url(url):
    with pytest.raises(ValueError):
        settings(webhook_url=url).validate()


def test_enabled_configuration_requires_url_and_valid_events(monkeypatch):
    monkeypatch.setenv("TEAMS_PLUGIN_ENABLED", "true")
    monkeypatch.delenv("TEAMS_WEBHOOK_URL", raising=False)
    with pytest.raises(ValueError, match="required"):
        TeamsSettings.from_env()
    with pytest.raises(ValueError, match="unsupported event"):
        settings(events=frozenset({"patient.diagnosis.shared"})).validate()
    with pytest.raises(ValueError, match="must be demo or live"):
        settings(mode="production").validate()
    with pytest.raises(ValueError, match="between 0.2 and 15"):
        settings(timeout_seconds=20).validate()


def test_runtime_only_registers_teams_when_enabled(monkeypatch):
    from app.plugins.runtime import create_plugin_runtime

    monkeypatch.setenv("TEAMS_PLUGIN_ENABLED", "false")
    registry, dispatcher = create_plugin_runtime()
    assert registry.names == ()
    assert dispatcher.registry is registry
    monkeypatch.setenv("TEAMS_PLUGIN_ENABLED", "true")
    monkeypatch.setenv(
        "TEAMS_WEBHOOK_URL",
        "https://prod-01.westus.logic.azure.com/workflows/fake?sig=synthetic-test-value",
    )
    monkeypatch.setenv("TEAMS_NOTIFICATION_EVENTS", "appointment.cancelled")
    registry, _ = create_plugin_runtime()
    assert registry.names == ("microsoft-teams",)
    assert tuple(registry.subscribed_to("appointment.cancelled"))[0].name == "microsoft-teams"
    assert tuple(registry.subscribed_to("ana.workflow.failed")) == ()


def test_local_demo_relay_accepts_loopback_ports_and_dedupes(monkeypatch):
    from fastapi.testclient import TestClient
    from app.main import app

    captured = []

    class CapturePlugin:
        name = "capture"
        subscribed_events = frozenset({"appointment.cancelled", "appointment.reassigned", "ana.workflow.completed"})

        async def handle(self, item):
            captured.append(item)

    def runtime():
        registry = PluginRegistry()
        registry.register(CapturePlugin())
        return registry, EventDispatcher(registry)

    monkeypatch.setattr("app.main.create_plugin_runtime", runtime)
    payload = {
        "kind": "updated",
        "appointment_date": "2026-10-08",
        "appointment_time": "2:00 PM",
        "event_id": "d1d89e80-724a-4a09-958f-a276500fa527",
        "correlation_id": "1c22b33f-dc2a-46f6-b506-a3010d0cf10f",
    }
    with TestClient(app, client=("127.0.0.1", 1234)) as client:
        headers = {"Origin": "http://localhost:57519"}
        first = client.post("/api/local-demo/events", json=payload, headers=headers)
        duplicate = client.post("/api/local-demo/events", json=payload, headers=headers)
        assert first.status_code == duplicate.status_code == 202
        assert first.json()["accepted"] is True
        assert len(first.json()["event_ids"]) == 2
        assert len(duplicate.json()["event_ids"]) == 2
        assert "María" not in str(captured) and "José" not in str(captured)
        assert {item.event_type for item in captured} == {
            "appointment.reassigned", "ana.workflow.completed"
        }
        assert len({item.event_id for item in captured}) == 2
        rejected = client.post(
            "/api/local-demo/events",
            json=payload,
            headers={"Origin": "https://attacker.example"},
        )
        assert rejected.status_code == 404


def test_formatter_contains_only_minimum_scheduling_metadata():
    payload = format_message(
        event(), mode="demo", dashboard_url="https://smart-queue.example"
    )
    rendered = str(payload)
    for forbidden in ("María", "José", "patient-id", "diagnosis", "condition"):
        assert forbidden.lower() not in rendered.lower()
    assert payload["type"] == "message"
    card = payload["attachments"][0]["content"]
    assert card["type"] == "AdaptiveCard"
    facts = card["body"][2]["facts"]
    assert {fact["title"] for fact in facts} >= {
        "Appointment", "Provider / resource", "Status", "Event time (UTC)", "Correlation ID"
    }


def test_successful_webhook_delivery_sends_adaptive_card():
    requests = []

    def respond(request):
        requests.append(request)
        return httpx.Response(202)

    client = TeamsWebhookClient(settings(), transport=httpx.MockTransport(respond))
    result = asyncio.run(client.send(event()))
    assert result.status == "delivered"
    assert result.attempts == 1
    assert requests[0].url.params["sig"] == "synthetic-test-value"
    assert requests[0].read().find(b"AdaptiveCard") >= 0


def test_retries_transient_failure_then_succeeds():
    statuses = iter([503, 429, 202])
    calls = []

    def respond(request):
        calls.append(request)
        return httpx.Response(next(statuses))

    client = TeamsWebhookClient(
        settings(), transport=httpx.MockTransport(respond), retry_delays=(0, 0)
    )
    result = asyncio.run(client.send(event()))
    assert result.status == "delivered"
    assert result.attempts == 3
    assert len(calls) == 3


def test_timeout_is_retried_with_a_bounded_attempt_count():
    calls = []

    def respond(request):
        calls.append(request)
        raise httpx.ReadTimeout("private webhook URL must not be logged", request=request)

    result = asyncio.run(
        TeamsWebhookClient(
            settings(), transport=httpx.MockTransport(respond), retry_delays=(0, 0)
        ).send(event())
    )
    assert result.status == "failed"
    assert result.error_code == "timeout"
    assert result.attempts == 3
    assert len(calls) == 3


def test_client_does_not_follow_redirect_or_retry_permanent_failure():
    calls = []

    def respond(request):
        calls.append(request)
        return httpx.Response(302, headers={"Location": "https://attacker.invalid"})

    result = asyncio.run(
        TeamsWebhookClient(settings(), transport=httpx.MockTransport(respond)).send(event())
    )
    assert result.status == "failed"
    assert result.attempts == 1
    assert result.error_code == "http_302"
    assert len(calls) == 1


def test_failed_plugin_delivery_is_sanitized_and_does_not_escape(caplog):
    def respond(request):
        return httpx.Response(401, text="secret webhook token and patient diagnosis")

    plugin = TeamsPlugin(
        settings(),
        TeamsWebhookClient(
            settings(), transport=httpx.MockTransport(respond), retry_delays=(0, 0)
        ),
    )
    registry = PluginRegistry()
    registry.register(plugin)
    dispatcher = EventDispatcher(registry)
    with caplog.at_level(logging.WARNING):
        asyncio.run(dispatcher.dispatch(event()))
    assert plugin.last_delivery.status == "failed"
    assert plugin.last_delivery.attempts == 1
    assert "webhook token" not in caplog.text
    assert "diagnosis" not in caplog.text
    assert "patient-id" not in caplog.text


def test_duplicate_events_dispatch_once_and_plugin_errors_are_isolated():
    class BrokenPlugin:
        name = "broken"
        subscribed_events = frozenset({"appointment.reassigned"})

        async def handle(self, incoming):
            raise RuntimeError("network failure")

    registry = PluginRegistry()
    registry.register(BrokenPlugin())
    dispatcher = EventDispatcher(registry)
    current = event()

    async def run():
        assert dispatcher.publish(current) is True
        assert dispatcher.publish(current) is False
        await dispatcher.drain()

    asyncio.run(run())
    # Also prove the controlled dispatch path handles the same failure.
    asyncio.run(dispatcher.dispatch(current))


def test_all_documented_workflow_events_are_subscribable():
    from app.plugins.core.events import SUPPORTED_EVENTS

    config = settings(events=SUPPORTED_EVENTS)
    plugin = TeamsPlugin(config)
    assert plugin.subscribed_events == SUPPORTED_EVENTS
    for event_type in SUPPORTED_EVENTS:
        message = format_message(event(event_type=event_type), mode="demo")
        assert message["attachments"][0]["content"]["body"][0]["text"]


def test_registry_rejects_duplicate_plugin_names():
    class Plugin:
        name = "same"
        subscribed_events = frozenset()

        async def handle(self, incoming):
            return "ok"

    registry = PluginRegistry()
    registry.register(Plugin())
    with pytest.raises(ValueError, match="already registered"):
        registry.register(Plugin())
