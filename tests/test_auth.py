"""Tests for Clerk authentication (backend/auth.py) and route protection.

No real Clerk tokens or network calls: the SDK client is replaced with a stub,
and `TestClient` is used without the lifespan context manager so startup
events (init_db -> MongoDB) never run.
"""

from types import SimpleNamespace

import pytest
from clerk_backend_api.security.types import AuthStatus, RequestState
from fastapi.testclient import TestClient

import backend.auth as auth_module
from backend.auth import DEV_USER_ID, ClerkUser, get_current_user, owner_filter
from backend.main import app

VALID_OBJECT_ID = "a" * 24


@pytest.fixture
def client():
    return TestClient(app)


class _StubClerk:
    """Stands in for the Clerk SDK client — no JWKS network calls."""

    def __init__(self, state: RequestState):
        self.state = state

    def authenticate_request(self, request, options):
        return self.state


def _signed_in_state(user_id: str = "user_123", session_id: str = "sess_9"):
    return RequestState(
        status=AuthStatus.SIGNED_IN,
        token="session-token",
        payload={"sub": user_id, "sid": session_id},
    )


# --- Unauthenticated requests ------------------------------------------------


def test_contracts_require_auth(client):
    response = client.get("/contracts/")
    assert response.status_code == 401
    assert response.json()["detail"] == "Not authenticated."
    assert response.headers["www-authenticate"] == "Bearer"


def test_analysis_routes_require_auth(client):
    assert client.post(f"/analysis/analyze/{VALID_OBJECT_ID}").status_code == 401
    assert client.get(f"/analysis/contracts/{VALID_OBJECT_ID}").status_code == 401
    assert client.get(f"/analysis/{VALID_OBJECT_ID}").status_code == 401


def test_root_is_public(client):
    assert client.get("/").status_code == 200


def test_signed_out_state_returns_401(client, monkeypatch):
    monkeypatch.setattr(
        auth_module, "_clerk", _StubClerk(RequestState(status=AuthStatus.SIGNED_OUT))
    )
    response = client.get(
        "/contracts/", headers={"Authorization": "Bearer garbage-token"}
    )
    assert response.status_code == 401


def test_sdk_failure_returns_503(client, monkeypatch):
    class _FailingClerk:
        def authenticate_request(self, request, options):
            raise RuntimeError("JWKS fetch failed")

    monkeypatch.setattr(auth_module, "_clerk", _FailingClerk())
    response = client.get(
        "/contracts/", headers={"Authorization": "Bearer some-token"}
    )
    assert response.status_code == 503
    assert response.json()["detail"] == "Authentication service unavailable."


# --- get_current_user / owner_filter -----------------------------------------


def test_signed_in_state_returns_clerk_user(monkeypatch):
    monkeypatch.setattr(auth_module, "_clerk", _StubClerk(_signed_in_state()))
    request = SimpleNamespace(headers={"Authorization": "Bearer session-token"})
    user = get_current_user(request)
    assert user == ClerkUser(
        user_id="user_123", session_id="sess_9", claims={"sub": "user_123", "sid": "sess_9"}
    )


def test_auth_disabled_returns_dev_user(monkeypatch):
    monkeypatch.setattr(auth_module, "AUTH_DISABLED", True)
    user = get_current_user(SimpleNamespace(headers={}))
    assert user.user_id == DEV_USER_ID


def test_owner_filter_scopes_to_user():
    assert owner_filter(ClerkUser(user_id="user_abc")) == {"owner_id": "user_abc"}


def test_owner_filter_empty_when_auth_disabled(monkeypatch):
    monkeypatch.setattr(auth_module, "AUTH_DISABLED", True)
    assert owner_filter(ClerkUser(user_id=DEV_USER_ID)) == {}


# --- Owner scoping through the API --------------------------------------------


class _FakeContractsCollection:
    def __init__(self):
        self.find_filter = None
        self.find_one_query = None

    def find(self, filter_, projection=None):
        self.find_filter = filter_
        return iter([])

    def find_one(self, query, projection=None):
        self.find_one_query = query
        return None  # owner filter excludes every document


def test_list_contracts_scoped_to_caller(client, monkeypatch):
    fake = _FakeContractsCollection()
    monkeypatch.setattr("backend.routes.contracts.contracts_collection", fake)
    app.dependency_overrides[get_current_user] = lambda: ClerkUser(user_id="user_abc")
    try:
        response = client.get("/contracts/")
        assert response.status_code == 200
        assert response.json() == []
        assert fake.find_filter == {"owner_id": "user_abc"}
    finally:
        app.dependency_overrides.clear()


def test_get_contract_from_other_user_returns_404(client, monkeypatch):
    fake = _FakeContractsCollection()
    monkeypatch.setattr("backend.routes.contracts.contracts_collection", fake)
    app.dependency_overrides[get_current_user] = lambda: ClerkUser(user_id="user_abc")
    try:
        response = client.get(f"/contracts/{VALID_OBJECT_ID}")
        assert response.status_code == 404
        assert fake.find_one_query["owner_id"] == "user_abc"
    finally:
        app.dependency_overrides.clear()


def test_auth_disabled_keeps_legacy_unfiltered_behavior(client, monkeypatch):
    monkeypatch.setattr(auth_module, "AUTH_DISABLED", True)
    fake = _FakeContractsCollection()
    monkeypatch.setattr("backend.routes.contracts.contracts_collection", fake)
    response = client.get("/contracts/")
    assert response.status_code == 200
    assert fake.find_filter == {}
