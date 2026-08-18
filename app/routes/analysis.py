from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException

from app.auth import ClerkUser, get_current_user, owner_filter
from app.config import GEMINI_API_KEY
from app.database import analysis_collection, contracts_collection
from app.models import AnalysisResult
from app.service.gemini_analyse import analyze_contract as analyze_contract_service

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

@router.post("/analyze/{contract_id}")
async def analyze_contract_endpoint(contract_id: str, user: ClerkUser = Depends(get_current_user)):
    """
    Analyze one of the caller's contracts by ID.
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
    contracts_collection.update_one(
        {"_id": object_id},
        {"$set": {"status": "analyzing"}},
    )

    try:
        result = await analyze_contract_service(contract_id, contract["text_content"])
    except Exception as exc:
        contracts_collection.update_one(
            {"_id": object_id},
            {"$set": {"status": "error"}},
        )
        raise HTTPException(
            status_code=502, detail=f"Contract analysis failed: {exc}"
        ) from exc

    doc = result.model_dump(exclude={"id"})
    insert_result = analysis_collection.insert_one(doc)
    result.id = str(insert_result.inserted_id)

    contracts_collection.update_one(
        {"_id": object_id},
        {"$set": {"status": "analyzed"}},
    )

    return {
        "message": "Contract analyzed successfully.",
        "analysis": result,
        "id": result.id
    }


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
