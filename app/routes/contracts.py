from fastapi import APIRouter, HTTPException, UploadFile, File
import os
import uuid
from app.models import Contact
from app.config import ALLOWED_EXTENSIONS, MAX_FILE_SIZE_MB, UPLOADS_DIR
from app.service.document_parser import extract_text
from app.database import contracts_collection

router = APIRouter(
    prefix="/contracts",
    tags=["Contracts"],
)

@router.post("/upload")
async def upload_contract(
    file: UploadFile = File(...),  
):
    """
    Upload a contract file for analysis.
    """
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Invalid file type. Allowed types: {ALLOWED_EXTENSIONS}")
    content = await file.read()

    size_mb = len(content) / (1024 * 1024)
    if size_mb > MAX_FILE_SIZE_MB:
        raise HTTPException(status_code=400, detail=f"File size exceeds the maximum limit of {MAX_FILE_SIZE_MB} MB.")
    
    os.makedirs(UPLOADS_DIR, exist_ok=True)
    unique_name = f"{uuid.uuid4().hex}{ext}"

    file_path = os.path.join(UPLOADS_DIR, unique_name)

    with open(file_path, "wb") as f:
        f.write(content)

    parsed = extract_text(file_path)

    contract_data = Contact(
        filename=unique_name,
        original_name=file.filename,
        text_content=parsed["text"] if isinstance(parsed, dict) else parsed,
        page_count=int(parsed["page_count"]) if isinstance(parsed, dict) else len(parsed.splitlines()),
        word_count=int(parsed["word_count"]) if isinstance(parsed, dict) else len(parsed.split()),
    )

    doc = contract_data.model_dump()
    result = contracts_collection.insert_one(doc)
    contract_data.id = str(result.inserted_id)

    return {
        "message": "File uploaded and processed successfully.", 
        "contract_id": contract_data.model_dump(),
        "id": contract_data.id
        }


@router.get("/")
async def list_contracts():
    """
    List all uploaded contracts.
    """
    contracts = []
    for doc in contracts_collection.find({}, {"text_content": 0}):  # Exclude text content for listing
        contract = Contact(**doc)
        contract.id = str(doc["_id"])
        contracts.append(contract.model_dump())
    return contracts

@router.get("/{contract_id}")
async def get_contract(contract_id: str):
    """
    Get details of a specific contract by its ID.
    """
    from bson import ObjectId
    doc = contracts_collection.find_one({"_id": ObjectId(contract_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Contract not found.")
    
    contract = Contact(**doc)
    contract.id = str(doc["_id"])
    return contract.model_dump()