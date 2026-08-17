# Vakeel Contracts API

Vakeel Contracts API is a FastAPI service for contract upload, analysis, and analysis-result management. It uses MongoDB to store contracts and analysis records.

## Requirements

- Python 3.10+
- `pip`
- Docker Desktop with Docker Compose, or a local MongoDB installation

## Setup

Create and activate a virtual environment, then install the project dependencies:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Create a `.env` file in the project root with the MongoDB connection string:

```env
MONGODB_URI=mongodb://root:mypassword@localhost:27017
```

The URI must start with `mongodb://` or `mongodb+srv://`.

If MongoDB is not already running locally, start the included MongoDB container:

```bash
docker compose up -d mongo
```

The Compose configuration exposes MongoDB on port `27017` and creates the `root` user with password `mypassword`.

On Windows, activate the environment with:

```powershell
.venv\Scripts\Activate.ps1
```

## Run the API

Start the development server from the project root:

```bash
uvicorn app.main:app --reload
```

Run this command from the project root—the directory containing `app/`.

On startup, the application connects to MongoDB and creates unique indexes for `contract_id` and `analysis_id`.

The API is available at <http://127.0.0.1:8000>.

Interactive API documentation is available at:

- Swagger UI: <http://127.0.0.1:8000/docs>
- ReDoc: <http://127.0.0.1:8000/redoc>

## API endpoints

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/` | Returns the API name, version, and planned contract-analysis endpoints. |

The following routes are advertised in the root response but are not implemented yet:

- `POST /contracts/upload` — Upload a PDF or TXT contract for analysis
- `GET /contracts/` — List uploaded contracts
- `GET /contracts/{id}` — Retrieve a contract
- `POST /analyze/analyze/{contract_id}` — Analyze a contract
- `GET /analysis/{analysis_id}` — Retrieve analysis results
- `GET /analysis/contracts/{contract_id}` — List analysis results for a contract

Interactive API documentation is available at `/docs` and `/redoc` when the server is running.

## Project structure

```text
.
├── app/
│   ├── __init__.py       # Python package marker
│   ├── config.py        # Environment configuration
│   ├── database.py      # MongoDB client and indexes
│   └── main.py          # FastAPI application and routes
├── docker-compose.yml    # Local MongoDB service
├── requirements.txt     # Pinned Python dependencies
└── README.md
```

## License

No license has been specified yet.
