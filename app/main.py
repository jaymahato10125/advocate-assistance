from fastapi import FastAPI

from app.database import init_db

from app.routes.contracts import router as contracts_router

app = FastAPI(
    title="Advocate contract API",
    description="AI- Powered Contact Analysis and Management System",
    version="1.0.0",
)

@app.on_event("startup")
async def startup_event():
    init_db()  # Initialize the database and create indexes


@app.get("/")   
async def root():
    return {
        "app": "Vakeel Contracts API",
        "version": "1.0.0",
        "endponts": {
            "POST /contracts/upload": "Upload a contract for analysis(PDF, TXT)",
            "GET /contracts/": "Retrieve a list of all upload contracts",
            "GET /contracts/{id}": "Retrieve a specific contract by ID",
            "POST /analyze/analyze/{contract_id}": "Analyze a specific contract by ID",
            "GET /analysis/{analysis_id}": "Retrieve the analysis results for a specific contract by ID",
            "GET /analysis/contracts/{contract_id}": "Retrieve a list of all analysis results"
        }
    }

app.include_router(contracts_router)
