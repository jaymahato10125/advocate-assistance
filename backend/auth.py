"""Clerk authentication for the FastAPI backend.

Protected routes depend on `get_current_user`, which verifies the Clerk
session JWT sent as `Authorization: Bearer <token>` by the frontend and
returns the authenticated user's identity. Set AUTH_DISABLED=true for local
development without Clerk (never in production).
"""

import logging
from dataclasses import dataclass, field

from clerk_backend_api import Clerk
from clerk_backend_api.security.types import AuthenticateRequestOptions
from fastapi import HTTPException, Request

from backend.config import AUTH_DISABLED, CLERK_AUTHORIZED_PARTIES, CLERK_SECRET_KEY

logger = logging.getLogger(__name__)

# Fixed identity attached to every request when AUTH_DISABLED is on.
DEV_USER_ID = "dev_user"

# Module-level client (like the Mongo client in app/database.py) so the SDK's
# JWKS cache is shared across requests.
_clerk = Clerk(bearer_auth=CLERK_SECRET_KEY) if CLERK_SECRET_KEY else None


@dataclass(frozen=True)
class ClerkUser:
    """The authenticated caller, derived from a verified Clerk session JWT."""

    user_id: str
    session_id: str = ""
    claims: dict = field(default_factory=dict)


def get_current_user(request: Request) -> ClerkUser:
    """Verify the request's Clerk session token and return the caller.

    Defined as a sync function so FastAPI runs it in the threadpool — the SDK
    may perform a (cached) network call to fetch Clerk's JWKS.
    """
    if AUTH_DISABLED:
        return ClerkUser(user_id=DEV_USER_ID)

    try:
        state = _clerk.authenticate_request(
            request,
            AuthenticateRequestOptions(
                secret_key=CLERK_SECRET_KEY,
                authorized_parties=CLERK_AUTHORIZED_PARTIES,
            ),
        )
    except Exception as exc:  # JWKS fetch failure, Clerk API outage, ...
        logger.error("Clerk request authentication failed to run: %s", exc)
        raise HTTPException(
            status_code=503, detail="Authentication service unavailable."
        ) from exc

    if not state.is_signed_in:
        raise HTTPException(
            status_code=401,
            detail="Not authenticated.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = state.payload or {}
    return ClerkUser(
        user_id=str(payload.get("sub", "")),
        session_id=str(payload.get("sid", "")),
        claims=payload,
    )


def owner_filter(user: ClerkUser) -> dict:
    """MongoDB filter scoping a query to the user's own documents.

    With AUTH_DISABLED on, returns an empty filter so pre-auth documents stay
    visible — preserving the app's original single-tenant behavior in dev.
    """
    if AUTH_DISABLED:
        return {}
    return {"owner_id": user.user_id}
