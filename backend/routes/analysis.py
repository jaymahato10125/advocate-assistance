import logging
from datetime import datetime, timedelta

from bson import ObjectId
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException

from backend.auth import ClerkUser, get_current_user, owner_filter
from backend.config import GEMINI_API_KEY
from backend.database import analysis_collection, contracts_collection
from backend.models import AnalysisResult
from backend.service.gemini_analyse import (
    NotAContractError,
    analyze_contract as analyze_contract_service,
)

logger = logging.getLogger(__name__)

# An "analyzing" status older than this is considered stale (e.g. the server
# restarted mid-analysis) and may be restarted; fresher runs are left alone.
ANALYSIS_STALE_MINUTES = 10

router = APIRouter(
    prefix="/analysis",
    tags=["Analysis"],
    dependencies=[Depends(get_current_user)],
)


def _analysis_from_document(doc: dict) -> AnalysisResult:
    """Convert a MongoDB analysis document into the public API model."""
    doc = {**doc, "id": str(doc["_id"])}
    doc.pop("_id", None)
    return AnalysisResult(**doc)

async def _run_analysis(contract_id: str, text_content: str) -> None:
    """Background worker: run Gemini, persist the result, flip the status.

    The HTTP request that scheduled this has long returned — failures are
    recorded on the contract itself (status -> "error") instead of an HTTP
    response, and logged for the operator.
    """
    object_id = ObjectId(contract_id)
    try:
        result = await analyze_contract_service(contract_id, text_content)
    except NotAContractError as exc:
        # Not a failure — the document simply isn't a contract, so no analysis
        # is saved and the contract gets a distinct status the UI can explain.
        logger.info("Contract %s rejected as non-contract: %s", contract_id, exc)
        contracts_collection.update_one(
            {"_id": object_id},
            {"$set": {"status": "not_a_contract"}},
        )
        return
    except Exception:
        logger.exception("Contract analysis failed for %s", contract_id)
        contracts_collection.update_one(
            {"_id": object_id},
            {"$set": {"status": "error"}},
        )
        return

    doc = result.model_dump(exclude={"id"})
    analysis_collection.insert_one(doc)

    contracts_collection.update_one(
        {"_id": object_id},
        {"$set": {"status": "analyzed"}},
    )


def _analysis_in_progress(contract: dict) -> bool:
    """True when a fresh (non-stale) analysis run is already underway."""
    if contract.get("status") != "analyzing":
        return False
    started_at_raw = contract.get("analysis_started_at")
    if not started_at_raw:
        return True  # No timestamp — assume it just started.
    try:
        started_at = datetime.fromisoformat(started_at_raw)
    except (TypeError, ValueError):
        return True
    return datetime.now(started_at.tzinfo) - started_at < timedelta(
        minutes=ANALYSIS_STALE_MINUTES
    )


@router.post("/analyze/{contract_id}", status_code=202)
async def analyze_contract_endpoint(
    contract_id: str,
    background_tasks: BackgroundTasks,
    user: ClerkUser = Depends(get_current_user),
):
    """
    Kick off analysis of one of the caller's contracts by ID.

    Gemini can take minutes on large documents — longer than browsers and
    dev proxies keep a request open — so the analysis runs as a background
    task. This endpoint answers 202 immediately; clients poll the contract
    status (analyzing -> analyzed | error) and then fetch the saved analysis.
    """
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="Gemini API key is not configured.")
    if not ObjectId.is_valid(contract_id):
        raise HTTPException(status_code=400, detail="Invalid contract ID.")

    object_id = ObjectId(contract_id)
    contract = contracts_collection.find_one({"_id": object_id, **owner_filter(user)})

    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found.")

    if not contract.get("text_content"):
        raise HTTPException(status_code=400, detail="Contract has no text content to analyze.")

    if _analysis_in_progress(contract):
        return {"message": "Analysis already in progress.", "status": "analyzing"}

    contracts_collection.update_one(
        {"_id": object_id},
        {
            "$set": {
                "status": "analyzing",
                "analysis_started_at": datetime.now().isoformat(),
            }
        },
    )
    background_tasks.add_task(_run_analysis, contract_id, contract["text_content"])

    return {"message": "Analysis started.", "status": "analyzing"}


@router.get("/contracts/{contract_id}", response_model=AnalysisResult)
async def get_latest_contract_analysis(contract_id: str, user: ClerkUser = Depends(get_current_user)):
    """Return the most recent saved analysis for one of the caller's contracts."""
    if not ObjectId.is_valid(contract_id):
        raise HTTPException(status_code=400, detail="Invalid contract ID.")

    # Analyses inherit ownership from their parent contract.
    if not contracts_collection.find_one({"_id": ObjectId(contract_id), **owner_filter(user)}):
        raise HTTPException(status_code=404, detail="Contract not found.")

    doc = analysis_collection.find_one(
        {"contract_id": contract_id},
        sort=[("analysis_date", -1), ("_id", -1)],
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Analysis not found.")

    return _analysis_from_document(doc)


@router.get("/{analysis_id}", response_model=AnalysisResult)
async def get_analysis(analysis_id: str, user: ClerkUser = Depends(get_current_user)):
    """Return a saved analysis by its MongoDB ID, if it belongs to the caller."""
    if not ObjectId.is_valid(analysis_id):
        raise HTTPException(status_code=400, detail="Invalid analysis ID.")

    doc = analysis_collection.find_one({"_id": ObjectId(analysis_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Analysis not found.")

    # Ownership is enforced through the parent contract.
    contract_id = doc.get("contract_id", "")
    owns_contract = ObjectId.is_valid(contract_id) and contracts_collection.find_one(
        {"_id": ObjectId(contract_id), **owner_filter(user)}
    )
    if not owns_contract:
        raise HTTPException(status_code=404, detail="Analysis not found.")

    return _analysis_from_document(doc)
