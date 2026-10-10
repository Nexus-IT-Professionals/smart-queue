# Microsoft Teams one-command setup

Run from the Smart Queue repository root on macOS or Linux:

```bash
./scripts/setup_teams.py
```

The script reuses the existing **Isla Care → Smart Queue Notifications** Workflows destination. It securely asks for the webhook URL with hidden input; press Enter to retain an already saved URL. It validates the Microsoft HTTPS host without echoing the secret, preserves unrelated `.env` values, enables the plugin, adds the four cancellation/reassignment/completion/failure events while retaining valid configured events, and writes `backend/.env` with owner-only permissions. `.env.example` stays placeholder-only.

It then safely checks port 8000. The script stops only a Uvicorn `app.main:app` process whose working directory is this checkout's `backend/`; an unrelated or unverifiable listener is left untouched and setup stops. The current frontend build is served using the documented local backend command. Health and the local event route are checked after startup; invalid Teams settings prevent a successful startup.

After the restart, the script asks whether to send one **synthetic test card**. Answer `y` only when you want a card posted to the existing channel. A successful HTTP response means the Workflows trigger accepted the request; confirm the card appears in Teams and inspect the flow run history if it does not. Answer `n` to configure/restart without sending a test.

## Requirements

- Install frontend dependencies and create a local build once:

  ```bash
  cd frontend && npm ci && npm run build
  ```

- Create the project Python environment once and install the backend requirements, if not already set up:

  ```bash
  cd ..
  python3 -m venv .venv
  .venv/bin/python -m pip install -r backend/requirements.txt
  ```

- Keep the active Teams workflow and its webhook permission available in the tenant. This script never creates Teams resources.
- `lsof` is used to identify the process on port 8000. Automatic restart currently supports macOS/Linux; on Windows, use the documented manual backend startup in the main README.

## Troubleshooting

- **Webhook rejected:** confirm the secret is the existing Workflows trigger URL using HTTPS and a supported Microsoft workflow host. Re-enter it hidden; never paste it into chat, logs, or Git.
- **Port 8000 used by another process:** the script intentionally does not terminate an unknown process. Stop that service yourself, then rerun.
- **Backend environment/build missing:** follow the one-time requirements above, then rerun the command.
- **Startup/health failure:** inspect `backend/.smart-queue/server.log`; it is Git-ignored. The URL is not written to that log. Fix the reported local configuration and rerun.
- **No channel card after endpoint acceptance:** inspect the existing Power Automate workflow's run history, destination Team/channel, and connector permissions. HTTP 2xx alone does not prove the final Teams post.
- **Secret was committed previously:** rotate the workflow URL with its owner, update local `.env`, and remove any tracked copy from the Git index with `git rm --cached -- <path>`; this leaves the local file in place. The current checkout tracks only `.env.example`, not a real `.env`.

## Workflow

```mermaid
flowchart TD
    A[Run setup command] --> B[Hidden webhook prompt]
    B --> C[Validate URL and preserve local settings]
    C --> D[Write ignored backend/.env with mode 0600]
    D --> E[Safely restart local Uvicorn]
    E --> F{Health and plugin startup OK?}
    F -->|No| G[Show safe error and local log path]
    F -->|Yes| H{Send test card?]
    H -->|No| I[Ready for local ANA demo]
    H -->|Yes| J[Post synthetic test card]
    J --> K[Verify card in Isla Care channel]
```

The live local demo then posts cancellation, reassignment, and workflow-completed cards as the synthetic browser scenario progresses. See [Isla Care demo](ISLA_CARE_DEMO.md) and [integration details](TEAMS_INTEGRATION.md).
