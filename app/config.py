import json
import os

from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")
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
