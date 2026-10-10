"""Focused tests for the dependency-free local Teams setup helper."""

import importlib.util
from pathlib import Path


SCRIPT = Path(__file__).resolve().parents[2] / "scripts" / "setup_teams.py"
SPEC = importlib.util.spec_from_file_location("setup_teams", SCRIPT)
setup_teams = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
SPEC.loader.exec_module(setup_teams)


def test_webhook_validator_accepts_microsoft_https_hosts_only():
    assert setup_teams.validate_webhook_url(
        "https://tenant.logic.azure.com/workflows/trigger?sig=placeholder"
    )
    assert not setup_teams.validate_webhook_url("http://tenant.logic.azure.com/hook")
    assert not setup_teams.validate_webhook_url("https://example.com/hook")
    assert not setup_teams.validate_webhook_url("https://logic.azure.com/hook")
    assert not setup_teams.validate_webhook_url("https://user@tenant.logic.azure.com/hook")


def test_build_updates_enables_plugin_and_preserves_existing_event_mode_and_timeout():
    existing = {
        "TEAMS_NOTIFICATION_EVENTS": "ana.invitation.accepted,appointment.cancelled",
        "TEAMS_NOTIFICATION_MODE": "live",
        "TEAMS_REQUEST_TIMEOUT_SECONDS": "5",
        "DATABASE_PATH": "../data/custom.db",
    }
    updates = setup_teams.build_updates(existing, "https://tenant.logic.azure.com/hook")
    assert updates["TEAMS_PLUGIN_ENABLED"] == "true"
    assert updates["TEAMS_TEAM_NAME"] == "Isla Care"
    assert updates["TEAMS_CHANNEL_NAME"] == "Smart Queue Notifications"
    assert updates["TEAMS_NOTIFICATION_MODE"] == "live"
    assert updates["TEAMS_REQUEST_TIMEOUT_SECONDS"] == "5"
    assert set(updates["TEAMS_NOTIFICATION_EVENTS"].split(",")) == {
        "ana.invitation.accepted",
        "appointment.cancelled",
        "appointment.reassigned",
        "ana.workflow.completed",
        "ana.workflow.failed",
    }
    assert existing["DATABASE_PATH"] == "../data/custom.db"


def test_render_env_preserves_unrelated_content_and_deduplicates_managed_keys():
    source = "# local database\nDATABASE_PATH=custom.db\nTEAMS_PLUGIN_ENABLED=false\nTEAMS_PLUGIN_ENABLED=false\n"
    rendered = setup_teams.render_env(
        source,
        {"TEAMS_PLUGIN_ENABLED": "true", "TEAMS_WEBHOOK_URL": "https://tenant.logic.azure.com/hook"},
    )
    assert "# local database" in rendered
    assert "DATABASE_PATH=custom.db" in rendered
    assert rendered.count("TEAMS_PLUGIN_ENABLED=") == 1
    assert "TEAMS_PLUGIN_ENABLED=true" in rendered
    assert "TEAMS_WEBHOOK_URL=https://tenant.logic.azure.com/hook" in rendered


def test_build_updates_rejects_unknown_events_and_invalid_mode():
    try:
        setup_teams.build_updates(
            {"TEAMS_NOTIFICATION_EVENTS": "appointment.cancelled,unrecognized.event"},
            "https://tenant.logic.azure.com/hook",
        )
    except ValueError as error:
        assert "unsupported event" in str(error)
    else:
        raise AssertionError("unknown notification event was accepted")

    try:
        setup_teams.build_updates({"TEAMS_NOTIFICATION_MODE": "other"}, "https://tenant.logic.azure.com/hook")
    except ValueError as error:
        assert "demo or live" in str(error)
    else:
        raise AssertionError("invalid notification mode was accepted")
