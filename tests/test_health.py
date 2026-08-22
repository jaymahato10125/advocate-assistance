"""Tests for the lightweight health check and root endpoints."""

from fastapi.testclient import TestClient
from backend.main import app


def test_health_check():
    """Verify GET /health returns 200 and {'status': 'ok'} without auth."""
    # Ensure no dependency overrides leak into public endpoint testing
    app.dependency_overrides.clear()
    client = TestClient(app)
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_root_endpoint():
    """Verify GET / returns 200 and contains endpoint metadata."""
    app.dependency_overrides.clear()
    client = TestClient(app)
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["app"] == "Advocate Contracts API"
    assert "GET /health" in data["endpoints"]
