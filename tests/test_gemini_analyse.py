"""Tests for the Gemini analysis service's response handling — especially the
is_contract self-classification guard that rejects non-contract documents.

httpx.AsyncClient is replaced with a fake, so no real API calls are made.
Async tests run on asyncio via the anyio pytest plugin.
"""

import json

import pytest

import backend.service.gemini_analyse as gemini_module
from backend.service.gemini_analyse import NotAContractError, analyze_contract


class _FakeResponse:
    def __init__(self, payload):
        self._payload = payload

    def raise_for_status(self):
        pass

    def json(self):
        return self._payload


class _FakeClient:
    def __init__(self, payload):
        self._payload = payload

    async def __aenter__(self):
        return self

    async def __aexit__(self, *args):
        return False

    async def post(self, url, headers=None, json=None):
        return _FakeResponse(self._payload)


@pytest.fixture
def fake_gemini(monkeypatch):
    """Install a fake Gemini endpoint returning the given analysis dict."""
    monkeypatch.setattr(gemini_module, "GEMINI_API_KEY", "test-key")

    def install(analysis: dict):
        payload = {
            "candidates": [
                {"content": {"parts": [{"text": json.dumps(analysis)}]}}
            ]
        }
        monkeypatch.setattr(
            gemini_module.httpx,
            "AsyncClient",
            lambda *args, **kwargs: _FakeClient(payload),
        )

    return install


@pytest.fixture
def anyio_backend():
    return "asyncio"


CONTRACT_JSON = {
    "is_contract": True,
    "summary": "An NDA between two parties.",
    "contract_type": "NDA",
    "key_clauses": [
        {
            "clause_title": "Confidentiality",
            "clause_text": "The parties shall keep information confidential.",
            "explanation": "Standard NDA clause.",
            "is_standard": True,
        }
    ],
    "risk_flags": [],
    "overall_risk_level": "low",
    "recommendations": ["Keep it signed."],
}

NON_CONTRACT_JSON = {
    "is_contract": False,
    "summary": "This document is a pancake recipe.",
    "contract_type": "Not a contract",
    "key_clauses": [],
    "risk_flags": [],
    "overall_risk_level": "low",
    "recommendations": [],
}


@pytest.mark.anyio
async def test_non_contract_raises_not_a_contract_error(fake_gemini):
    fake_gemini(NON_CONTRACT_JSON)

    with pytest.raises(NotAContractError) as exc_info:
        await analyze_contract("c" * 24, "Flour, sugar, eggs, mix well.")

    assert "not appear to be a legal contract" in str(exc_info.value)
    assert "pancake recipe" in str(exc_info.value)  # Gemini's take is included.


@pytest.mark.anyio
async def test_is_contract_string_false_also_rejected(fake_gemini):
    fake_gemini({**NON_CONTRACT_JSON, "is_contract": "false"})

    with pytest.raises(NotAContractError):
        await analyze_contract("c" * 24, "Some non-contract text.")


@pytest.mark.anyio
async def test_contract_returns_analysis_result(fake_gemini):
    fake_gemini(CONTRACT_JSON)

    result = await analyze_contract("c" * 24, "This Non-Disclosure Agreement…")

    assert result.contract_id == "c" * 24
    assert result.contract_type == "NDA"
    assert result.summary == "An NDA between two parties."
    assert len(result.key_clauses) == 1
    assert result.key_clauses[0].clause_title == "Confidentiality"


@pytest.mark.anyio
async def test_missing_is_contract_defaults_to_contract(fake_gemini):
    payload = {key: value for key, value in CONTRACT_JSON.items() if key != "is_contract"}
    fake_gemini(payload)

    result = await analyze_contract("c" * 24, "This Service Agreement…")

    assert result.contract_type == "NDA"
