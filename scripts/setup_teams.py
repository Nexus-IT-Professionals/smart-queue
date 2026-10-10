#!/usr/bin/env python3
"""Securely configure Teams and restart the local Smart Queue backend."""

from __future__ import annotations

import getpass
import json
import os
import signal
import subprocess
import sys
import tempfile
import time
from pathlib import Path
from urllib.error import URLError
from urllib.parse import urlsplit
from urllib.request import urlopen

ROOT = Path(__file__).resolve().parents[1]
BACKEND = ROOT / "backend"
ENV_FILE = BACKEND / ".env"
LOCAL_STATE = BACKEND / ".smart-queue"
PYTHON = ROOT / ".venv" / "bin" / "python"
FRONTEND_DIST = ROOT / "frontend" / "dist"
PORT = 8000
TEAM = "Isla Care"
CHANNEL = "Smart Queue Notifications"
DEFAULT_EVENTS = (
    "appointment.cancelled",
    "appointment.reassigned",
    "ana.workflow.completed",
    "ana.workflow.failed",
)
SUPPORTED_HOST_SUFFIXES = (
    ".logic.azure.com",
    ".webhook.office.com",
    ".powerplatform.com",
)
def parse_env(text: str) -> dict[str, str]:
    values: dict[str, str] = {}
    for raw_line in text.splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key, value = key.strip(), value.strip()
        if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
            value = value[1:-1]
        values[key] = value
    return values


def validate_webhook_url(value: str) -> bool:
    try:
        parsed = urlsplit(value.strip())
        hostname = (parsed.hostname or "").lower().rstrip(".")
        allowed_host = any(
            hostname.endswith(suffix) and hostname != suffix[1:]
            for suffix in SUPPORTED_HOST_SUFFIXES
        )
        return bool(
            parsed.scheme == "https"
            and allowed_host
            and parsed.username is None
            and parsed.password is None
            and parsed.port in (None, 443)
            and parsed.path
            and not any(char.isspace() for char in value)
        )
    except ValueError:
        return False


def build_updates(existing: dict[str, str], webhook_url: str) -> dict[str, str]:
    events = [
        event.strip()
        for event in existing.get("TEAMS_NOTIFICATION_EVENTS", "").split(",")
        if event.strip()
    ]
    for event in DEFAULT_EVENTS:
        if event not in events:
            events.append(event)
    allowed = set(DEFAULT_EVENTS) | {
        "ana.waitlist.evaluated",
        "ana.invitation.sent",
        "ana.invitation.accepted",
    }
    if set(events) - allowed:
        raise ValueError("TEAMS_NOTIFICATION_EVENTS contains unsupported event names")

    mode = existing.get("TEAMS_NOTIFICATION_MODE", "demo") or "demo"
    if mode not in {"demo", "live"}:
        raise ValueError("TEAMS_NOTIFICATION_MODE must be demo or live")

    return {
        "TEAMS_PLUGIN_ENABLED": "true",
        "TEAMS_TEAM_NAME": TEAM,
        "TEAMS_CHANNEL_NAME": CHANNEL,
        "TEAMS_WEBHOOK_URL": webhook_url,
        "TEAMS_NOTIFICATION_EVENTS": ",".join(events),
        "TEAMS_NOTIFICATION_MODE": mode,
        "TEAMS_REQUEST_TIMEOUT_SECONDS": existing.get(
            "TEAMS_REQUEST_TIMEOUT_SECONDS", "3"
        )
        or "3",
    }


def render_env(text: str, updates: dict[str, str]) -> str:
    lines = text.splitlines()
    rendered: list[str] = []
    written: set[str] = set()
    for line in lines:
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or "=" not in stripped:
            rendered.append(line)
            continue
        key = stripped.split("=", 1)[0].strip()
        if key not in updates:
            rendered.append(line)
        elif key not in written:
            rendered.append(f"{key}={updates[key]}")
            written.add(key)
    for key, value in updates.items():
        if key not in written:
            rendered.append(f"{key}={value}")
    return "\n".join(rendered).rstrip("\n") + "\n"


def write_env_securely(content: str) -> None:
    if ENV_FILE.is_symlink():
        raise RuntimeError("Refusing to write backend/.env because it is a symbolic link")
    if ENV_FILE.exists() and ENV_FILE.stat().st_mode & 0o077:
        print("Securing backend/.env permissions to owner-only access.")
    BACKEND.mkdir(parents=True, exist_ok=True)
    fd, temporary_name = tempfile.mkstemp(prefix=".env-", dir=BACKEND)
    try:
        os.fchmod(fd, 0o600)
        with os.fdopen(fd, "w", encoding="utf-8") as handle:
            handle.write(content)
            handle.flush()
            os.fsync(handle.fileno())
        os.replace(temporary_name, ENV_FILE)
        os.chmod(ENV_FILE, 0o600)
    except Exception:
        try:
            os.unlink(temporary_name)
        except FileNotFoundError:
            pass
        raise


def ensure_local_secret_is_ignored() -> None:
    tracked = subprocess.run(
        ["git", "ls-files", "--error-unmatch", "backend/.env"],
        cwd=ROOT,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        check=False,
    )
    if tracked.returncode == 0:
        raise RuntimeError(
            "backend/.env is tracked by Git. Remove it from the index with "
            "'git rm --cached backend/.env' before storing a secret."
        )
    ignored = subprocess.run(
        ["git", "check-ignore", "-q", "backend/.env"],
        cwd=ROOT,
        check=False,
    )
    if ignored.returncode != 0:
        raise RuntimeError("backend/.env is not ignored by Git; refusing to write a secret")


def safe_listener_pids() -> list[int]:
    if sys.platform == "win32":
        raise RuntimeError("Automatic restart currently supports macOS and Linux only")
    try:
        result = subprocess.run(
            ["lsof", "-nP", f"-iTCP:{PORT}", "-sTCP:LISTEN", "-t"],
            capture_output=True,
            text=True,
            check=False,
        )
    except FileNotFoundError as exc:
        raise RuntimeError("lsof is required to safely inspect the local server port") from exc
    if result.returncode not in (0, 1):
        raise RuntimeError("Could not safely inspect port 8000")
    pids = sorted({int(value) for value in result.stdout.split() if value.isdigit()})
    for pid in pids:
        command = subprocess.run(
            ["ps", "-p", str(pid), "-o", "command="],
            capture_output=True,
            text=True,
            check=False,
        ).stdout.strip()
        cwd_result = subprocess.run(
            ["lsof", "-a", "-p", str(pid), "-d", "cwd", "-Fn"],
            capture_output=True,
            text=True,
            check=False,
        ).stdout.splitlines()
        process_cwd = next((line[1:] for line in cwd_result if line.startswith("n/")), "")
        is_smart_queue_server = (
            "uvicorn" in command.lower()
            and "app.main:app" in command
            and Path(process_cwd).resolve() == BACKEND.resolve()
        )
        if not is_smart_queue_server:
            raise RuntimeError(
                f"Port 8000 is used by another or unverified process (PID {pid}); "
                "it was left running. Stop it manually, then retry."
            )
    return pids


def stop_existing_server(pids: list[int]) -> None:
    for pid in pids:
        try:
            os.kill(pid, signal.SIGTERM)
        except ProcessLookupError:
            continue
    deadline = time.monotonic() + 10
    while time.monotonic() < deadline:
        alive = []
        for pid in pids:
            try:
                os.kill(pid, 0)
                alive.append(pid)
            except ProcessLookupError:
                pass
        if not alive:
            return
        time.sleep(0.2)
    raise RuntimeError("The existing Smart Queue server did not stop cleanly; no force-kill was used")


def wait_for_health(process: subprocess.Popen[bytes], timeout: float = 15) -> bool:
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        if process.poll() is not None:
            return False
        try:
            with urlopen(f"http://127.0.0.1:{PORT}/api/health", timeout=1) as response:
                health = json.loads(response.read())
            with urlopen(f"http://127.0.0.1:{PORT}/openapi.json", timeout=1) as response:
                api = json.loads(response.read())
            return health.get("status") == "ok" and "/api/local-demo/events" in api.get("paths", {})
        except (OSError, URLError, ValueError, json.JSONDecodeError):
            time.sleep(0.25)
    return False


def restart_server(env_values: dict[str, str]) -> subprocess.Popen[bytes]:
    pids = safe_listener_pids()
    stop_existing_server(pids)

    LOCAL_STATE.mkdir(mode=0o700, parents=True, exist_ok=True)
    os.chmod(LOCAL_STATE, 0o700)
    log_path = LOCAL_STATE / "server.log"
    if log_path.exists() and log_path.stat().st_size > 1_000_000:
        log_path.rename(LOCAL_STATE / "server.previous.log")

    server_env = os.environ.copy()
    server_env.update(env_values)
    server_env["STATIC_DIR"] = "../frontend/dist"
    server_env.setdefault("DATABASE_PATH", "../data/smart_queue.db")
    log_handle = log_path.open("ab")
    process = subprocess.Popen(
        [
            str(PYTHON),
            "-m",
            "uvicorn",
            "app.main:app",
            "--host",
            "127.0.0.1",
            "--port",
            str(PORT),
        ],
        cwd=BACKEND,
        env=server_env,
        stdin=subprocess.DEVNULL,
        stdout=log_handle,
        stderr=subprocess.STDOUT,
        start_new_session=True,
    )
    log_handle.close()
    (LOCAL_STATE / "server.pid").write_text(f"{process.pid}\n", encoding="ascii")
    if not wait_for_health(process):
        if process.poll() is None:
            process.terminate()
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                pass
        raise RuntimeError(
            "Smart Queue did not become healthy with the Teams plugin enabled. "
            f"Review the sanitized local server log at {log_path}."
        )
    return process


def check_prerequisites() -> None:
    if sys.platform == "win32":
        raise RuntimeError("Automatic restart currently supports macOS and Linux only")
    if not PYTHON.is_file():
        raise RuntimeError("Project Python environment is missing; create .venv and install backend/requirements.txt")
    if not (FRONTEND_DIST / "index.html").is_file():
        raise RuntimeError("Frontend build is missing; run 'cd frontend && npm ci && npm run build' first")
    uvicorn = subprocess.run(
        [str(PYTHON), "-m", "uvicorn", "--version"],
        cwd=BACKEND,
        capture_output=True,
        text=True,
        check=False,
    )
    if uvicorn.returncode != 0:
        raise RuntimeError("Uvicorn is unavailable in the project Python environment")
    safe_listener_pids()


def validate_plugin_configuration(updates: dict[str, str]) -> None:
    check = subprocess.run(
        [
            str(PYTHON),
            "-c",
            "from app.plugins.runtime import create_plugin_runtime; "
            "registry, _ = create_plugin_runtime(); "
            "assert registry.names == ('microsoft-teams',)",
        ],
        cwd=BACKEND,
        env={**os.environ, **updates},
        capture_output=True,
        text=True,
        check=False,
    )
    if check.returncode != 0:
        raise RuntimeError(
            "Teams configuration/plugin validation failed; existing server was left running. "
            "Check the event list, mode, URL format, timeout, and dashboard URL."
        )


def main() -> int:
    if not (ROOT / ".git").exists():
        raise RuntimeError("Run this command from a Smart Queue checkout")
    ensure_local_secret_is_ignored()
    check_prerequisites()

    current_text = ENV_FILE.read_text(encoding="utf-8") if ENV_FILE.exists() else ""
    if ENV_FILE.exists() and ENV_FILE.is_symlink():
        raise RuntimeError("Refusing to read backend/.env because it is a symbolic link")
    current = parse_env(current_text)
    existing_url = current.get("TEAMS_WEBHOOK_URL", "").strip()
    prompt = "Teams webhook URL (hidden; press Enter to keep the saved value): "
    webhook_url = getpass.getpass(prompt).strip()
    if not webhook_url:
        webhook_url = existing_url
    while not validate_webhook_url(webhook_url):
        print("The webhook must be a valid HTTPS Microsoft Workflows URL. Its value is never displayed.")
        webhook_url = getpass.getpass("Enter the webhook URL (hidden): ").strip()

    updates = build_updates(current, webhook_url)
    validate_plugin_configuration(updates)
    write_env_securely(render_env(current_text, updates))
    print("Teams settings saved to ignored backend/.env with owner-only file permissions.")

    process = restart_server(updates)
    print(
        f"Smart Queue restarted at http://localhost:{PORT}/; health is OK and the local event route is active."
    )
    print("The enabled plugin initialized during backend startup. The webhook URL was not displayed.")

    answer = input(
        f"Send one synthetic test card to {TEAM} → {CHANNEL} now? [y/N]: "
    ).strip().lower()
    if answer not in {"y", "yes"}:
        print("Test card not sent. The server is ready; rerun this command to test later.")
        return 0

    test = subprocess.run(
        [str(PYTHON), "-m", "app.plugins.test_notification"],
        cwd=BACKEND,
        env={**os.environ, **updates},
        capture_output=True,
        text=True,
        check=False,
    )
    for line in test.stdout.splitlines():
        if line.startswith("Teams test notification "):
            print(line)
            break
    if test.returncode != 0:
        print("Test delivery failed. Review sanitized backend status and Power Automate run history.")
        return test.returncode or 1
    print("The workflow endpoint accepted the test. Confirm the card appears in the Teams channel.")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except KeyboardInterrupt:
        print("\nSetup cancelled.", file=sys.stderr)
        raise SystemExit(130)
    except (OSError, RuntimeError, ValueError) as error:
        print(f"Setup stopped safely: {error}", file=sys.stderr)
        raise SystemExit(1)
