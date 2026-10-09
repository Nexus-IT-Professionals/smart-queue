"""SQLite connection and schema setup (TECHNICAL_PROPOSAL §6)."""
import sqlite3
from pathlib import Path

from app import config

SCHEMA_PATH = Path(__file__).with_name("schema.sql")


def connect(path: str | None = None) -> sqlite3.Connection:
    db_path = Path(path or config.DATABASE_PATH)
    db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db(conn: sqlite3.Connection) -> None:
    conn.executescript(SCHEMA_PATH.read_text(encoding="utf-8"))
    conn.commit()
