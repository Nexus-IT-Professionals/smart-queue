"""Create compact Adaptive Card payloads without patient supplied text."""

from app.plugins.core.events import ApplicationEvent

TITLES = {
    "appointment.cancelled": "Appointment cancelled",
    "ana.waitlist.evaluated": "Waiting list evaluated",
    "ana.invitation.sent": "Appointment invitation sent",
    "ana.invitation.accepted": "Invitation accepted",
    "appointment.reassigned": "Appointment reassigned",
    "ana.workflow.completed": "Scheduling workflow completed",
    "ana.workflow.failed": "Scheduling workflow needs staff attention",
}
DESCRIPTIONS = {
    "appointment.cancelled": "A cancellation opened a synthetic appointment slot.",
    "ana.waitlist.evaluated": "Eligible candidates were checked using configured scheduling rules.",
    "ana.invitation.sent": "A synthetic appointment invitation was generated for patient review.",
    "ana.invitation.accepted": "The patient accepted the synthetic appointment offer.",
    "appointment.reassigned": "The accepted appointment is reflected in the provider schedule.",
    "ana.workflow.completed": "The scheduling workflow completed after patient confirmation.",
    "ana.workflow.failed": "A scheduling step needs medical office staff review.",
}


def format_message(
    event: ApplicationEvent,
    *,
    mode: str,
    dashboard_url: str = "",
    team_name: str = "",
    channel_name: str = "",
) -> dict:
    """Build the documented Teams Workflow Adaptive Card envelope.

    Descriptions are fixed by event type. Names, patient IDs, diagnoses and raw
    event text are not accepted by this adapter.
    """
    facts = [
        {"title": "Appointment", "value": f"{event.appointment_date} · {event.appointment_time}"},
        {"title": "Provider / resource", "value": event.provider_or_resource},
        {"title": "Status", "value": event.workflow_status},
        {"title": "Mode", "value": "Demo · synthetic data" if mode == "demo" else "Live · minimum necessary details"},
        {"title": "Event time (UTC)", "value": event.occurred_at.isoformat()},
        {"title": "Correlation ID", "value": event.correlation_id},
    ]
    if team_name:
        facts.append({"title": "Team", "value": team_name})
    if channel_name:
        facts.append({"title": "Channel", "value": channel_name})
    if dashboard_url:
        facts.append({"title": "Smart Queue", "value": dashboard_url})
    body = [
        {"type": "TextBlock", "text": TITLES[event.event_type], "weight": "Bolder", "size": "Medium", "wrap": True},
        {"type": "TextBlock", "text": DESCRIPTIONS[event.event_type], "wrap": True},
        {"type": "FactSet", "facts": facts},
    ]
    if dashboard_url:
        body.append(
            {
                "type": "TextBlock",
                "text": f"[Open Smart Queue dashboard]({dashboard_url})",
                "wrap": True,
            }
        )
    card = {
        "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
        "type": "AdaptiveCard",
        "version": "1.2",
        "body": body,
    }
    return {
        "type": "message",
        "attachments": [
            {
                "contentType": "application/vnd.microsoft.card.adaptive",
                "contentUrl": None,
                "content": card,
            }
        ],
    }
