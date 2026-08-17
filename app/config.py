from dotenv import load_dotenv
import os

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")
UPLOADS_DIR = os.getenv("UPLOADS_DIR", "uploads")
ALLOWED_EXTENSIONS = os.getenv("ALLOWED_EXTENSIONS", "['.pdf', '.txt']").strip("[]").replace("'", "").split(",")
MAX_FILE_SIZE_MB = int(os.getenv("MAX_FILE_SIZE_MB", "10"))  # Maximum file size in megabytes