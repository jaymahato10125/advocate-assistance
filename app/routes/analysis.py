from bson import ObjectId
from fastapi import APIRouter, HTTPException

from app.config import GEMINI_API_KEY
from app.database import analysis_collection, contracts_collection
from app.service.gemini_analyse import analyze_contract as analyze_contract_service

router = APIRouter(
    prefix="/analysis",
    tags=["Analysis"],
)

@router.post("/analyze/{contract_id}")
async def analyze_contract_endpoint(contract_id: str):
    """
    Analyze a specific contract by ID.
    """
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="Gemini API key is not configured.")
    if not ObjectId.is_valid(contract_id):
        raise HTTPException(status_code=400, detail="Invalid contract ID.")

    object_id = ObjectId(contract_id)
    contract = contracts_collection.find_one({"_id": object_id})

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
