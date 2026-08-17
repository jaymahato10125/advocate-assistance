from fastapi import APIRouter, HTTPException, UploadFile, File
import os
import uuid
from config import ALLOWED_EXTENSIONS, MAX_FILE_SIZE_MB, UPLOADS_DIR
from service.document_parser import extract_text    

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
