"""Settings from environment variables (TECHNICAL_PROPOSAL §3, §6, §7)."""
import os

DATABASE_PATH = os.getenv("DATABASE_PATH", "data/smart_queue.db")
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://ollama:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen2.5:1.5b")
AI_TIMEOUT_SECONDS = float(os.getenv("AI_TIMEOUT_SECONDS", "10"))
TIMEZONE = os.getenv("TIMEZONE", "America/Puerto_Rico")
STATIC_DIR = os.getenv("STATIC_DIR", "static")
