"""Tests for the asynchronous contract-analysis flow (backend/routes/analysis.py).

The analyze endpoint answers 202 immediately and runs Gemini as a background
task; TestClient waits for background tasks, so each POST returns with the
run already finished — letting tests assert the final contract status and
the persisted analysis without a real Gemini or MongoDB.
"""

from datetime import datetime, timedelta
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient

import backend.routes.analysis as analysis_module
from backend.auth import ClerkUser, get_current_user
from backend.main import app
from backend.models import AnalysisResult

VALID_OBJECT_ID = "a" * 24


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture(autouse=True)
def _authenticated_and_configured(monkeypatch):
    """Signed-in user, configured Gemini key, and fake collections per test."""
    app.dependency_overrides[get_current_user] = lambda: ClerkUser(user_id="user_abc")
    monkeypatch.setattr(analysis_module, "GEMINI_API_KEY", "test-gemini-key")
    yield
    app.dependency_overrides.clear()


class _FakeContractsCollection:
    """Holds one in-memory contract document and records update calls."""

    def __init__(self, document=None):
        self.document = document
        self.updates = []

    def find_one(self, query, projection=None):
        return self.document

    def update_one(self, query, update):
        self.updates.append(update)
        if self.document is not None:
            self.document.update(update.get("$set", {}))


class _FakeAnalysisCollection:
    def __init__(self):
        self.inserted = []

    def insert_one(self, doc):
        self.inserted.append(doc)
        return SimpleNamespace(inserted_id="b" * 24)


def _contract_document(**overrides):
    document = {
        "_id": VALID_OBJECT_ID,
        "owner_id": "user_abc",
        "text_content": "This is the extracted contract text.",
        "status": "uploaded",
    }
    document.update(overrides)
    return document


def _stub_analysis_result(contract_id=VALID_OBJECT_ID):
    return AnalysisResult(
        contract_id=contract_id,
        summary="A short summary.",
        contract_type="NDA",
    )


def _install_fakes(monkeypatch, contract_document):
    contracts = _FakeContractsCollection(contract_document)
    analyses = _FakeAnalysisCollection()
    monkeypatch.setattr(analysis_module, "contracts_collection", contracts)
    monkeypatch.setattr(analysis_module, "analysis_collection", analyses)
    return contracts, analyses


# --- Starting an analysis ----------------------------------------------------


def test_analyze_returns_202_and_completes_in_background(client, monkeypatch):
    contracts, analyses = _install_fakes(monkeypatch, _contract_document())
    calls = []

    async def fake_service(contract_id, text_content):
        calls.append((contract_id, text_content))
        return _stub_analysis_result(contract_id)

    monkeypatch.setattr(analysis_module, "analyze_contract_service", fake_service)

    response = client.post(f"/analysis/analyze/{VALID_OBJECT_ID}")

    assert response.status_code == 202
    assert response.json() == {"message": "Analysis started.", "status": "analyzing"}
    # TestClient waits for background tasks: the run has already finished.
    assert calls == [(VALID_OBJECT_ID, "This is the extracted contract text.")]
    assert len(analyses.inserted) == 1
    assert analyses.inserted[0]["contract_id"] == VALID_OBJECT_ID
    assert contracts.document["status"] == "analyzed"
    assert "analysis_started_at" in contracts.document


def test_analyze_failure_marks_contract_error(client, monkeypatch):
    contracts, analyses = _install_fakes(monkeypatch, _contract_document())

    async def failing_service(contract_id, text_content):
        raise RuntimeError("Gemini API returned HTTP 500")

    monkeypatch.setattr(analysis_module, "analyze_contract_service", failing_service)

    response = client.post(f"/analysis/analyze/{VALID_OBJECT_ID}")

    assert response.status_code == 202
    assert contracts.document["status"] == "error"
    assert analyses.inserted == []


def test_analyze_already_in_progress_does_not_duplicate(client, monkeypatch):
    contracts, analyses = _install_fakes(
        monkeypatch,
        _contract_document(
            status="analyzing",
            analysis_started_at=datetime.now().isoformat(),
        ),
    )

    async def fake_service(contract_id, text_content):  # pragma: no cover
        raise AssertionError("Service must not run for a fresh in-progress run")

    monkeypatch.setattr(analysis_module, "analyze_contract_service", fake_service)

    response = client.post(f"/analysis/analyze/{VALID_OBJECT_ID}")

    assert response.status_code == 202
    assert response.json() == {
        "message": "Analysis already in progress.",
        "status": "analyzing",
    }
    assert contracts.updates == []  # Status left untouched.
    assert analyses.inserted == []


def test_analyze_stale_run_is_restarted(client, monkeypatch):
    stale_started_at = (
        datetime.now()
        - timedelta(minutes=analysis_module.ANALYSIS_STALE_MINUTES + 1)
    ).isoformat()
    contracts, analyses = _install_fakes(
        monkeypatch,
        _contract_document(status="analyzing", analysis_started_at=stale_started_at),
    )
    calls = []

    async def fake_service(contract_id, text_content):
        calls.append(contract_id)
        return _stub_analysis_result(contract_id)

    monkeypatch.setattr(analysis_module, "analyze_contract_service", fake_service)

    response = client.post(f"/analysis/analyze/{VALID_OBJECT_ID}")

    assert response.status_code == 202
    assert calls == [VALID_OBJECT_ID]
    assert contracts.document["status"] == "analyzed"
    assert len(analyses.inserted) == 1


# --- Validation --------------------------------------------------------------


def test_analyze_rejects_invalid_contract_id(client):
    response = client.post("/analysis/analyze/not-an-object-id")
    assert response.status_code == 400
    assert response.json()["detail"] == "Invalid contract ID."


def test_analyze_missing_contract_returns_404(client, monkeypatch):
    _install_fakes(monkeypatch, None)
    response = client.post(f"/analysis/analyze/{VALID_OBJECT_ID}")
    assert response.status_code == 404
    assert response.json()["detail"] == "Contract not found."


def test_analyze_contract_without_text_returns_400(client, monkeypatch):
    _install_fakes(monkeypatch, _contract_document(text_content=""))
    response = client.post(f"/analysis/analyze/{VALID_OBJECT_ID}")
    assert response.status_code == 400
    assert response.json()["detail"] == "Contract has no text content to analyze."


def test_analyze_without_gemini_key_returns_500(client, monkeypatch):
    monkeypatch.setattr(analysis_module, "GEMINI_API_KEY", None)
    _install_fakes(monkeypatch, _contract_document())
    response = client.post(f"/analysis/analyze/{VALID_OBJECT_ID}")
    assert response.status_code == 500
    assert response.json()["detail"] == "Gemini API key is not configured."
