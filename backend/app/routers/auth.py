"""Post-POC login, logout and sessions. No authentication routes are implemented.

The public POC uses fictional identities and browser-only state. It does not call
this router or bypass server permissions. Do not add a universal backend login.
See docs/DEMO_ACCESS.md for the current demo boundary.
"""
from fastapi import APIRouter

router = APIRouter(prefix="/auth", tags=["auth"])

# Post-POC TODO: POST /login, POST /logout, GET /me.
# TODO: hashed passwords, opaque HttpOnly/SameSite session cookie, CSRF, login rate limit.
# TODO: role comes from the server-side session, never from the client.
