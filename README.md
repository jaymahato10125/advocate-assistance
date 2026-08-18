# Vakeel Contracts API

Vakeel Contracts API is a FastAPI service for uploading contracts (PDF/TXT), extracting their text, and analyzing them with Google Gemini (key clauses, risk flags, recommendations). It uses MongoDB to store contracts and analysis records.

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
GEMINI_API_KEY=your-google-ai-studio-api-key
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

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `MONGODB_URI` | Yes | — | MongoDB connection string. It must start with `mongodb://` or `mongodb+srv://`. |
| `GEMINI_API_KEY` | Yes (for analysis) | — | Google AI Studio API key. `GOOGLE_API_KEY` is accepted as a fallback. |
| `GEMINI_MODEL` | No | `gemini-3.6-flash` | Gemini model used for analysis. Older models (`gemini-2.0-flash`, `gemini-2.5-flash`) are retired by Google and return `404`. |
| `UPLOADS_DIR` | No | `uploads` | Directory where uploaded files are stored. |
| `ALLOWED_EXTENSIONS` | No | `[".pdf", ".txt"]` | Allowed upload extensions (JSON array or comma-separated). |
| `MAX_FILE_SIZE_MB` | No | `10` | Maximum upload size in megabytes. |

The included Compose file uses the development credentials `root` / `mypassword`, exposes MongoDB on port `27017`, and stores its data in a named Docker volume.

Stop the MongoDB container with:

```bash
docker compose down
```

## API documentation

Interactive documentation is available while the API is running:

- Swagger UI: <http://127.0.0.1:8000/docs>
- ReDoc: <http://127.0.0.1:8000/redoc>

## API endpoints

The implemented endpoints are:

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/` | Returns the API name, version, and endpoint list. |
| `POST` | `/contracts/upload` | Upload a PDF or TXT contract; extracts and stores its text. |
| `GET` | `/contracts/` | List uploaded contracts (without text content). |
| `GET` | `/contracts/{id}` | Retrieve a contract by its MongoDB `_id`. |
| `POST` | `/analysis/analyze/{contract_id}` | Analyze a contract with Gemini and store the result. |

Not implemented yet:

- `GET /analysis/{analysis_id}` — Retrieve analysis results
- `GET /analysis/contracts/{contract_id}` — List analysis results for a contract

## How it works

1. `POST /contracts/upload` saves the file to `UPLOADS_DIR`, extracts text (`pypdf` for PDFs), and stores a contract document with status `uploaded`.
2. `POST /analysis/analyze/{contract_id}` sets the status to `analyzing`, sends the extracted text to Gemini with a structured legal-analysis prompt, and stores the parsed result (summary, contract type, key clauses, risk flags, overall risk level, recommendations) in the `analysis` collection. The contract status becomes `analyzed` on success or `error` on failure (the `502` response includes the underlying cause).
3. Contracts and analyses are identified by MongoDB's built-in `_id`. On startup, legacy unique indexes on the unused `contract_id` / `analysis_id` fields are dropped automatically if present (they caused `E11000 duplicate key` errors because a missing field is indexed as `null`).

## Troubleshooting

- `Invalid URI scheme`: check that `MONGODB_URI` starts with `mongodb://` or `mongodb+srv://`.
- MongoDB connection errors: confirm that the MongoDB container is running with `docker compose ps`.
- Import errors: run `uvicorn app.main:app --reload` from the project root, not from inside `app/`.
- `E11000 duplicate key error ... contract_id: null`: a stale unique index from an older version — restart the app (startup drops it automatically) or drop the `contract_id_1` / `analysis_id_1` indexes manually.
- Analysis returns `502`: the response `detail` now includes the underlying cause. A `404` from the Gemini API means the configured `GEMINI_MODEL` has been retired — check the current model name in Google AI Studio docs and update `GEMINI_MODEL`.

## Project structure

```text
.
├── app/
│   ├── __init__.py             # Python package marker
│   ├── config.py               # Environment configuration
│   ├── database.py             # MongoDB client, collections, and startup index cleanup
│   ├── main.py                 # FastAPI application setup
│   ├── models.py               # Pydantic models (Contact, AnalysisResult, ...)
│   ├── routes/
│   │   ├── contracts.py        # Upload / list / get contract endpoints
│   │   └── analysis.py         # Gemini analysis endpoint
│   ├── service/
│   │   ├── document_parser.py  # PDF/TXT text extraction
│   │   ├── gemini_analyse.py   # Gemini API client and response parsing
│   │   └── prompt.py           # Analysis prompts
│   └── uploads/                # Uploaded contract files
├── docker-compose.yml          # Local MongoDB service
├── requirements.txt            # Pinned Python dependencies
└── README.md
```

## License

No license has been specified yet.
