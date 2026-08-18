import json
import os

from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI", "").strip()
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "mydb").strip() or "mydb"

if not MONGODB_URI:
    raise RuntimeError(
        "MONGODB_URI is required. Set it to a mongodb:// or mongodb+srv:// connection string."
    )

if not MONGODB_URI.startswith(("mongodb://", "mongodb+srv://")):
    raise RuntimeError(
        "MONGODB_URI must start with mongodb:// or mongodb+srv://."
    )

UPLOADS_DIR = os.getenv("UPLOADS_DIR", "uploads")

R2_ENDPOINT_URL = os.getenv("R2_ENDPOINT_URL", "").strip()
R2_BUCKET_NAME = os.getenv("R2_BUCKET_NAME", "").strip()
R2_ACCESS_KEY_ID = os.getenv("R2_ACCESS_KEY_ID", "").strip()
R2_SECRET_ACCESS_KEY = os.getenv("R2_SECRET_ACCESS_KEY", "").strip()

_r2_is_configured = all(
    (R2_ENDPOINT_URL, R2_BUCKET_NAME, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY)
)
STORAGE_BACKEND = os.getenv(
    "STORAGE_BACKEND", "r2" if _r2_is_configured else "local"
).strip().lower()

if STORAGE_BACKEND not in {"local", "r2"}:
    raise RuntimeError("STORAGE_BACKEND must be either 'local' or 'r2'.")

if STORAGE_BACKEND == "r2" and not _r2_is_configured:
    raise RuntimeError(
        "R2 storage is enabled but R2_ENDPOINT_URL, R2_BUCKET_NAME, "
        "R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY are not all set."
    )


def _parse_allowed_extensions(value: str) -> list[str]:
    """Parse a JSON or comma-separated extension list from the environment."""
    try:
        extensions = json.loads(value)
    except json.JSONDecodeError:
        extensions = value.strip("[]").split(",")

    if isinstance(extensions, str):
        extensions = [extensions]

    return [
        extension.strip().strip("'\"").lower()
        for extension in extensions
        if extension.strip().strip("'\"")
    ]


ALLOWED_EXTENSIONS = _parse_allowed_extensions(
    os.getenv("ALLOWED_EXTENSIONS", '[".pdf", ".txt"]')
)
MAX_FILE_SIZE_MB = int(os.getenv("MAX_FILE_SIZE_MB", "10"))  # Maximum file size in megabytes

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
