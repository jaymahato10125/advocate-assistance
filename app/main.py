import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import AUTH_DISABLED, CORS_ORIGINS
from app.database import init_db

from app.routes.contracts import router as contracts_router
from app.routes.analysis import router as analysis_router

logger = logging.getLogger(__name__)

app = FastAPI(
    title="Advocate contract API",
    description="AI- Powered Contact Analysis and Management System",
    version="1.0.0",
)

# In development the Next.js proxy (/api/*) makes requests same-origin, so this
# is a no-op; in production the browser calls the API directly with an
# Authorization header, which requires explicit CORS permission.
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)

@app.on_event("startup")
async def startup_event():
    if AUTH_DISABLED:
        logger.warning(
            "AUTH_DISABLED=true — API requests are NOT authenticated. "
            "Never enable this in production."
        )
    init_db()  # Initialize the database and create indexes


@app.get("/")   
async def root():
    return {
        "app": "Advocate Contracts API",
        "version": "1.0.0",
        "auth": "All /contracts and /analysis endpoints require a Clerk session token (Authorization: Bearer <token>).",
        "endpoints": {
            "POST /contracts/upload": "Upload a contract for analysis (PDF, TXT)",
            "GET /contracts/": "Retrieve a list of all uploaded contracts",
            "GET /contracts/{id}": "Retrieve a specific contract by ID",
            "POST /analysis/analyze/{contract_id}": "Analyze a specific contract by ID"
        }
    }

app.include_router(contracts_router)
app.include_router(analysis_router)
