from bson import ObjectId
from fastapi import APIRouter, Depends, File, HTTPException, Response, UploadFile
import os
import tempfile
import uuid
from app.models import Contact
from app.auth import ClerkUser, get_current_user, owner_filter
from app.config import ALLOWED_EXTENSIONS, MAX_FILE_SIZE_MB
from app.service.document_parser import extract_text
from app.service.storage import StorageError, delete_upload, save_upload
from app.database import analysis_collection, contracts_collection

router = APIRouter(
    prefix="/contracts",
    tags=["Contracts"],
    dependencies=[Depends(get_current_user)],
)

@router.post("/upload")
async def upload_contract(
    file: UploadFile = File(...),
    user: ClerkUser = Depends(get_current_user),
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
    
    unique_name = f"{uuid.uuid4().hex}{ext}"
    object_key = f"contracts/{unique_name}"

    try:
        save_upload(
            object_key=object_key,
            content=content,
            content_type=file.content_type,
        )
        # The parser currently accepts a file path. Keep the uploaded object in
        # R2 while using a short-lived local temporary file for text extraction.
        with tempfile.NamedTemporaryFile(suffix=ext) as temporary_file:
            temporary_file.write(content)
            temporary_file.flush()
            parsed = extract_text(temporary_file.name)
    except StorageError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except (OSError, ValueError) as exc:
        raise HTTPException(status_code=422, detail=f"Could not process the file: {exc}") from exc

    contract_data = Contact(
        owner_id=user.user_id,
        filename=object_key,
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
async def list_contracts(user: ClerkUser = Depends(get_current_user)):
    """
    List the caller's uploaded contracts.
    """
    contracts = []
    for doc in contracts_collection.find(owner_filter(user), {"text_content": 0}):  # Exclude text content for listing
        contract = Contact(**doc)
        contract.id = str(doc["_id"])
        contracts.append(contract.model_dump())
    return contracts

@router.get("/{contract_id}")
async def get_contract(contract_id: str, user: ClerkUser = Depends(get_current_user)):
    """
    Get details of a specific contract by its ID.

    Other users' contracts return 404 (not 403) so ids cannot be enumerated.
    """
    if not ObjectId.is_valid(contract_id):
        raise HTTPException(status_code=400, detail="Invalid contract ID.")

    doc = contracts_collection.find_one({"_id": ObjectId(contract_id), **owner_filter(user)})
    if not doc:
        raise HTTPException(status_code=404, detail="Contract not found.")
    
    contract = Contact(**doc)
    contract.id = str(doc["_id"])
    return contract.model_dump()


@router.delete("/{contract_id}", status_code=204)
async def delete_contract(contract_id: str, user: ClerkUser = Depends(get_current_user)) -> Response:
    """Delete one of the caller's contracts, its stored file, and all saved analyses."""
    if not ObjectId.is_valid(contract_id):
        raise HTTPException(status_code=400, detail="Invalid contract ID.")

    object_id = ObjectId(contract_id)
    doc = contracts_collection.find_one(
        {"_id": object_id, **owner_filter(user)}, {"filename": 1}
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Contract not found.")

    try:
        delete_upload(object_key=doc.get("filename", ""))
    except StorageError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    analysis_collection.delete_many({"contract_id": contract_id})
    contracts_collection.delete_one({"_id": object_id})
    return Response(status_code=204)
