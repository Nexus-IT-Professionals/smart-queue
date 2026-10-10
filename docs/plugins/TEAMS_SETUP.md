# Microsoft Teams Workflows setup

This configures an optional backend integration. The existing Isla Care team, channel, and active workflow are reused; this setup does not create or recreate them. The public Smart Queue demo remains disconnected. Local backend settings are read from ignored `backend/.env` (process environment takes precedence); `.env.example` contains no callback secret. Automated tests use mocked HTTP and cannot prove access to a tenant.

## A. Prepare Teams

1. Sign in to Microsoft Teams with the business account that will own the workflow.
2. Use the existing **Isla Care** Team and its **Smart Queue Notifications** channel. Do not create duplicates.
3. Confirm the Workflows app and Power Automate connections are permitted by the tenant administrator.
4. Add a co-owner to the workflow so it does not depend on one employee's account.

## B. Verify the existing webhook workflow

1. Open the channel's `…` menu and choose **Workflows**.
2. Open the existing **Send webhook alerts to Smart Queue Notifications** workflow and confirm it is Active.
3. Verify its destination is the existing Team/channel and inspect the trigger authentication and Teams posting action.
4. Reuse the existing callback stored in ignored `backend/.env`. Do not regenerate, recreate, or display it unless the workflow owner determines rotation is necessary.
5. Confirm the workflow's expected request body. The built-in sender posts a Teams webhook envelope with `type: message` and an Adaptive Card attachment. If the chosen flow expects another schema, change its mapping to accept this envelope or adapt the formatter and its tests.

Microsoft documents the [incoming webhook workflow and Adaptive Card request format](https://learn.microsoft.com/en-us/microsoftteams/platform/webhooks-and-connectors/how-to/add-incoming-webhook?tabs=dotnet) and the [Teams webhook templates](https://support.microsoft.com/en-us/workflows/send-messages-in-teams-using-incoming-webhooks). Template names and tenant policy can vary. The older Microsoft 365 Connector mechanism is nearing retirement; use the Workflows webhook trigger.

### If the existing workflow is unavailable

Ask the workflow owner to restore the existing resource. Do not create a replacement during this integration. If the owner later authorizes replacement, configure an equivalent webhook-triggered Power Automate flow and update the local secret securely.

## C. Configure the backend

For a guided secure configuration and local server restart, use the [one-command quick setup](TEAMS_QUICK_SETUP.md): `./scripts/setup_teams.py` from the repository root. The script hides URL entry, preserves other settings, verifies the current backend, and asks before sending its synthetic test card.

The backend plugin reads `backend/.env` for its local Teams configuration, with process environment variables taking precedence. The `.env.example` contains only a blank webhook placeholder. The webhook value is a bearer secret: keep the ignored local file owner-readable only, never put it in `VITE_*`, and never commit `.env`, callback URLs, tokens, or credentials. On hosted servers, inject the values through the secret manager instead of copying a local file.

```env
TEAMS_PLUGIN_ENABLED=false
TEAMS_TEAM_NAME=Isla Care
TEAMS_CHANNEL_NAME=Smart Queue Notifications
TEAMS_WEBHOOK_URL=
TEAMS_NOTIFICATION_EVENTS=appointment.cancelled,appointment.reassigned,ana.workflow.completed,ana.workflow.failed
TEAMS_NOTIFICATION_MODE=demo
TEAMS_DASHBOARD_URL=
TEAMS_REQUEST_TIMEOUT_SECONDS=3
```

For local use, copy the Teams settings into ignored `backend/.env`, set `TEAMS_PLUGIN_ENABLED=true`, and retain live mode only when intentionally sending to the active channel. Never print the URL or place it in frontend variables. The runtime reads the local file without logging it. Supported callback hosts are Microsoft workflow domains (`*.logic.azure.com`, `*.webhook.office.com`, `*.powerplatform.com`); non-HTTPS URLs, redirects, other hostnames and nonstandard ports are rejected. Configuration is validated at backend startup. Timeout accepts 0.2–15 seconds; delivery gets at most three attempts.

`demo` marks cards as synthetic demo data. `live` changes the mode label only; it does not make the app production-ready or authorize sending patient information. Both modes intentionally omit patient names, identifiers, conditions, and raw messages. The optional dashboard URL must use HTTPS and should not contain a patient-specific path.

### Synthetic test command

From the repository root after installing `backend/requirements.txt`, set the environment securely, enable the plugin, then run:

```bash
cd backend
../.venv/bin/python -m app.plugins.test_notification
```

The command posts one generic test card for the fictional `Demo Provider` and date `2026-10-08`. It prints only delivered/failed, attempts and an HTTP status or sanitized error code. A `2xx` means the workflow endpoint accepted the request; confirm it actually appeared in the channel. There is no public test endpoint, no UI setting, and no test request is made while disabled.

## D. Validate the workflow

1. Run backend unit tests with the plugin disabled: `../.venv/bin/python -m pytest -q` from `backend/`. They mock HTTP and do not send messages.
2. Run the synthetic test command with the configured secret and verify the card in `Smart Queue Notifications`.
3. For local demo notifications, start the backend and Vite dev server, run [the Isla Care scenario](ISLA_CARE_DEMO.md), and verify cancellation/reassignment/completion notifications in the channel. This live scenario has been visually verified in the existing channel.
4. Keep Teams disabled in the public static demo. Do not enter patient information into a live workflow during a hackathon walkthrough.

## Troubleshooting

- **Workflows/template unavailable:** ask the Teams administrator to enable Workflows/Power Automate and the Teams connector; create the equivalent webhook-triggered cloud flow above.
- **401/403:** review the trigger authentication scope, caller restriction and tenant policy; regenerate/reconfigure the workflow secret through secure environment provisioning. Do not print the response body or URL.
- **Invalid URL/startup validation:** confirm HTTPS, supported Microsoft workflow host, port 443, and no whitespace. The application never includes the URL in error output.
- **400/format error:** compare the flow trigger's expected schema with the Adaptive Card envelope. Review the card shape in `formatter.py`; never capture a real callback URL in bug reports.
- **429/5xx/timeout:** the sender retries a bounded number of times; inspect sanitized backend status logs and the workflow run history. An ambiguous timeout may create a duplicate card. Repeated failure does not affect the appointment transaction.
- **No card in the channel after 2xx:** inspect the flow run history and destination/channel mapping, connection owner, and co-owner. HTTP acceptance alone does not prove the downstream Teams post succeeded.
- **Local demo events not sent:** confirm the local backend is running and the plugin is enabled; relay requests require a loopback browser origin and are intentionally absent from the public build.
- **Network / DNS failure:** allow backend egress only to the workflow hosts required by your tenant, check proxy/DNS policy, and keep redirect following disabled. Do not broaden egress to arbitrary URLs.
- **Secret exposure:** revoke/regenerate the workflow callback immediately, update the secret store and audit logs/history. Deleting a committed URL does not revoke it.

## Operational boundaries

Delivery status is kept in a bounded in-memory list and is lost on restart. There is no durable retry queue, audit retention, delivery-status API, plugin settings UI, authentication/authorization, or transactional backend booking event source. The test trigger and the three local demo notification types have been visually verified in the channel. See [plugin architecture and remaining integration limits](PLUGIN_ARCHITECTURE.md).
