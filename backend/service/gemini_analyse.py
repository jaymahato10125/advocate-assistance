import json
import os

import httpx

from backend.config import GEMINI_API_KEY
from backend.models import AnalysisResult, ClauseAnalysis, RiskFlag, RiskLevel
from backend.service.prompt import CONTRACT_ANALYSIS_PROMPT


# Note: older models (gemini-2.0-flash, gemini-2.5-flash) are retired for this
# API; override via the GEMINI_MODEL env var when Google rotates models again.
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.6-flash")
GEMINI_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    f"{GEMINI_MODEL}:generateContent"
)


class NotAContractError(RuntimeError):
    """Raised when Gemini determines the uploaded text is not a legal contract."""


async def analyze_contract(contract_id: str, text_content: str) -> AnalysisResult:
    """Analyze contract text and return a validated analysis model."""
    api_key = GEMINI_API_KEY or os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY is not configured.")
    if not text_content.strip():
        raise ValueError("Contract text is empty.")

    prompt = CONTRACT_ANALYSIS_PROMPT.format(contract_text=text_content[:15000])
    request_body = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "maxOutputTokens": 4096,
            "responseMimeType": "application/json",
        },
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            response = await client.post(
                GEMINI_URL,
                headers={"x-goog-api-key": api_key},
                json=request_body,
            )
            response.raise_for_status()
        except httpx.HTTPStatusError as exc:
            detail = exc.response.text.strip().replace("\n", " ")
            raise RuntimeError(
                f"Gemini API returned HTTP {exc.response.status_code}: {detail[:1000]}"
            ) from exc
        except httpx.RequestError as exc:
            raise RuntimeError(f"Could not reach the Gemini API: {exc}") from exc

    try:
        response_data = response.json()
        raw_text = response_data["candidates"][0]["content"]["parts"][0]["text"]
    except (ValueError, KeyError, IndexError, TypeError) as exc:
        raise RuntimeError("Gemini returned an unexpected response format.") from exc

    if not isinstance(raw_text, str) or not raw_text.strip():
        raise RuntimeError("Gemini returned an empty analysis.")

    raw_text = raw_text.strip()
    if raw_text.startswith("```"):
        raw_text = raw_text.split("\n", 1)[-1]
    if raw_text.endswith("```"):
        raw_text = raw_text[:-3]

    try:
        analysis_data = json.loads(raw_text.strip())
    except json.JSONDecodeError as exc:
        raise RuntimeError("Gemini returned invalid JSON.") from exc

    if not isinstance(analysis_data, dict):
        raise RuntimeError("Gemini returned a JSON value instead of an object.")

    # The prompt asks Gemini to self-classify before analyzing. A non-contract
    # must never be saved as an analysis — the caller turns this into a
    # "not_a_contract" status on the contract instead.
    is_contract = analysis_data.get("is_contract", True)
    if is_contract is False or (
        isinstance(is_contract, str) and is_contract.strip().lower() == "false"
    ):
        what_it_is = str(analysis_data.get("summary", "")).strip()
        raise NotAContractError(
            "The uploaded document does not appear to be a legal contract."
            + (f" Gemini's take: {what_it_is}" if what_it_is else "")
        )

    key_clauses = [
        ClauseAnalysis(**clause)
        for clause in analysis_data.get("key_clauses", [])
    ]

    risk_flags = [
        RiskFlag(**risk)
        for risk in analysis_data.get("risk_flags", [])
    ]

    result = AnalysisResult(
        contract_id=contract_id,
        summary=analysis_data.get("summary", ""),
        contract_type=analysis_data.get("contract_type", "Unknown"),
        key_clauses=key_clauses,
        risk_flags=risk_flags,
        overall_risk_level=analysis_data.get("overall_risk_level", RiskLevel.LOW),
        recommendations=analysis_data.get("recommendations", []),
    )
    return result
