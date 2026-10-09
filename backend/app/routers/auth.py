"""Login, logout and sessions (TECHNICAL_PROPOSAL §7)."""
from fastapi import APIRouter

router = APIRouter(prefix="/auth", tags=["auth"])

# TODO: POST /login, POST /logout, GET /me.
# TODO: hashed passwords, opaque HttpOnly/SameSite session cookie, CSRF, login rate limit.
# TODO: role comes from the server-side session, never from the client.
