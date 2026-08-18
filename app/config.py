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
