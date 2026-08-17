# Vakeel Contracts API

Vakeel Contracts API is a FastAPI service for contract upload, analysis, and analysis-result management. It uses MongoDB to store contracts and analysis records.

## Requirements

- Python 3.10+
- `pip`
- Docker Desktop with Docker Compose, or a local MongoDB installation

## Quick start

Create and activate a virtual environment, then install the project dependencies:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

On Windows, activate the environment with:

```powershell
.venv\Scripts\Activate.ps1
```

Create a `.env` file in the project root:

```env
MONGODB_URI=mongodb://root:mypassword@localhost:27017
```

Start MongoDB with the included Docker Compose configuration:

```bash
docker compose up -d mongo
```

Start the API from the project root—the directory containing `app/`:

```bash
uvicorn app.main:app --reload
```

The API is available at <http://127.0.0.1:8000>.

## Configuration

The application reads configuration from `.env` using `python-dotenv`:

| Variable | Required | Description |
| --- | --- | --- |
| `MONGODB_URI` | Yes | MongoDB connection string. It must start with `mongodb://` or `mongodb+srv://`. |

The included Compose file uses the development credentials `root` / `mypassword`, exposes MongoDB on port `27017`, and stores its data in a named Docker volume.

Stop the MongoDB container with:

```bash
docker compose down
```

## API documentation

Interactive documentation is available while the API is running:

- Swagger UI: <http://127.0.0.1:8000/docs>
- ReDoc: <http://127.0.0.1:8000/redoc>

## API status

The currently implemented endpoint is:

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

On startup, the application connects to MongoDB and creates unique indexes for `contract_id` and `analysis_id`.

## Troubleshooting

- `Invalid URI scheme`: check that `MONGODB_URI` starts with `mongodb://` or `mongodb+srv://`.
- MongoDB connection errors: confirm that the MongoDB container is running with `docker compose ps`.
- Import errors: run `uvicorn app.main:app --reload` from the project root, not from inside `app/`.

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
