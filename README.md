# Advocate Contracts

Advocate Contracts is a full-stack legal-tech app for uploading, reviewing, analyzing, and deleting contracts (PDF/TXT). It extracts text and uses Google Gemini to identify key clauses, severity-tagged risk flags, an overall risk level, and recommendations:

- **Backend** (this directory, `app/`) — FastAPI + MongoDB API.
- **Frontend** (`frontend/`) — Next.js 15 (App Router, TypeScript, Tailwind CSS v4, TanStack Query, Framer Motion).

## Requirements

- Python 3.10+ and `pip`
- Node.js 18.18+ and `npm` (for the frontend)
- A MongoDB Atlas cluster

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
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@YOUR_CLUSTER.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB_NAME=mydb
GEMINI_API_KEY=your-google-ai-studio-api-key
```

For MongoDB Atlas, create a database user, allow the API server's IP address in
Atlas **Network Access**, and replace the placeholders in `MONGODB_URI`. If the
username or password contains characters such as `@`, `:`, `/`, or `#`, URL-encode
them before putting them in the connection string. Do not commit `.env`.

Start the API from the project root—the directory containing `app/`:

```bash
uvicorn app.main:app --reload
```

The API is available at <http://127.0.0.1:8000>.

Then start the frontend (in a second terminal):

```bash
cd frontend
npm install
npm run dev
```

The frontend is available at <http://localhost:3000>. In development, it proxies `/api/*` to the FastAPI server at `http://127.0.0.1:8000/*`, so no CORS setup is needed—just start the backend first. For production, set `NEXT_PUBLIC_API_BASE_URL` to the deployed API origin (see `frontend/.env.example`).

## Frontend

The frontend uses:

- **Next.js 15** (App Router) with strict TypeScript.
- **Tailwind CSS v4** with shadcn/ui-style Radix primitives.
- **TanStack Query** for API queries and mutations.
- **Framer Motion** for page reveals, result animations, and the risk gauge.
- **react-dropzone** and **zod** for validated uploads.
- Confirmation-based contract deletion with storage and analysis cleanup.
- **sonner**, **lucide-react**, and **next-themes** for notifications, icons, and theme switching.

Frontend-specific environment variables belong in `frontend/.env.local` (or
`frontend/.env`):

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | Deployed FastAPI API origin. In development, leave it unset to use the `/api` proxy. |
| `API_PROXY_TARGET` | Development proxy target; defaults to `http://127.0.0.1:8000`. |
| `NEXT_PUBLIC_SITE_URL` | Public site URL used for metadata and sharing images. |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key (safe for the browser). |
| `CLERK_SECRET_KEY` | Clerk secret key — must match the backend's `CLERK_SECRET_KEY`. Server-only. |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` / `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Auth page paths (`/sign-in`, `/sign-up`). |

The frontend mirrors the backend upload constraints in `frontend/lib/config.ts`.
If `ALLOWED_EXTENSIONS` or `MAX_FILE_SIZE_MB` changes in the backend, update the
frontend values as well.

Analysis results are persisted in MongoDB and reloaded through
`GET /analysis/contracts/{contract_id}`. The frontend also keeps the result in
the TanStack Query cache for the current session.

### Authentication (Clerk)

The app uses [Clerk](https://clerk.com) for authentication. Next.js middleware
(`frontend/middleware.ts`) protects `/dashboard/*`, and the browser attaches a
Clerk session token (`Authorization: Bearer <token>`) to every API call through
`frontend/lib/auth.ts`. The FastAPI backend verifies the token with the Clerk
Python SDK (`app/auth.py`) and scopes every contract and analysis to its
owner's Clerk user id — users only ever see their own documents.

To enable it: create a Clerk application, set `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
and `CLERK_SECRET_KEY` in `frontend/.env.local`, and set the same
`CLERK_SECRET_KEY` in the backend `.env` (see `.env.example` and
`frontend/.env.example`). For local development without Clerk, set
`AUTH_DISABLED=true` in the backend `.env` — every request is then treated as a
fixed dev user and all documents stay visible. **Never enable `AUTH_DISABLED`
in production.**

## Configuration

The application reads configuration from `.env` using `python-dotenv`:

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `MONGODB_URI` | Yes | — | MongoDB connection string. Atlas uses a `mongodb+srv://` URI. |
| `MONGODB_DB_NAME` | No | `mydb` | Database name used by the API. |
| `GEMINI_API_KEY` | Yes (for analysis) | — | Google AI Studio API key. `GOOGLE_API_KEY` is accepted as a fallback. |
| `GEMINI_MODEL` | No | `gemini-3.6-flash` | Gemini model used for analysis. Older models (`gemini-2.0-flash`, `gemini-2.5-flash`) are retired by Google and return `404`. |
| `R2_ENDPOINT_URL` | No | — | Cloudflare R2 S3-compatible endpoint. When all R2 variables are set, uploads use R2 automatically. |
| `R2_BUCKET_NAME` | No | — | Private R2 bucket name, for example `advocate-contracts`. |
| `R2_ACCESS_KEY_ID` | No | — | R2 API token access key. |
| `R2_SECRET_ACCESS_KEY` | No | — | R2 API token secret. Never commit this value. |
| `STORAGE_BACKEND` | No | auto | Set to `r2` or `local`; auto selects R2 when all R2 variables are present. |
| `UPLOADS_DIR` | No | `uploads` | Local upload directory used only when `STORAGE_BACKEND=local`. |
| `ALLOWED_EXTENSIONS` | No | `[".pdf", ".txt"]` | Allowed upload extensions (JSON array or comma-separated). |
| `MAX_FILE_SIZE_MB` | No | `10` | Maximum upload size in megabytes. |
| `CLERK_SECRET_KEY` | Yes (unless `AUTH_DISABLED=true`) | — | Clerk secret key used to verify session tokens. Must match the frontend's key. |
| `CLERK_AUTHORIZED_PARTIES` | No | `["http://localhost:3000"]` | Origins allowed in the session token's `azp` claim (JSON array or comma-separated). |
| `CORS_ORIGINS` | No | `["http://localhost:3000"]` | Browser origins allowed to call the API directly (production; the dev proxy makes this a no-op locally). |
| `AUTH_DISABLED` | No | `false` | Local-dev escape hatch: skips Clerk verification and treats every request as a fixed dev user. Never `true` in production. |

## API documentation

Interactive documentation is available while the API is running:

- Swagger UI: <http://127.0.0.1:8000/docs>
- ReDoc: <http://127.0.0.1:8000/redoc>

## API endpoints

The implemented endpoints are (all except `GET /` require a Clerk session token
as `Authorization: Bearer <token>`):

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/` | Returns the API name, version, and endpoint list. |
| `POST` | `/contracts/upload` | Upload a PDF or TXT contract; extracts and stores its text. |
| `GET` | `/contracts/` | List uploaded contracts (without text content). |
| `GET` | `/contracts/{id}` | Retrieve a contract by its MongoDB `_id`. |
| `DELETE` | `/contracts/{id}` | Permanently delete a contract, its stored file, and all saved analyses; returns `204 No Content`. |
| `POST` | `/analysis/analyze/{contract_id}` | Analyze a contract with Gemini and store the result. |
| `GET` | `/analysis/contracts/{contract_id}` | Retrieve the latest saved analysis for a contract. |
| `GET` | `/analysis/{analysis_id}` | Retrieve a saved analysis by its MongoDB `_id`. |

## How it works

1. `POST /contracts/upload` stores the file in private Cloudflare R2 when configured (or `UPLOADS_DIR` locally), extracts text (`pypdf` for PDFs), and stores a contract document with status `uploaded`.
2. `POST /analysis/analyze/{contract_id}` sets the status to `analyzing`, sends the extracted text to Gemini with a structured legal-analysis prompt, and stores the parsed result (summary, contract type, key clauses, risk flags, overall risk level, recommendations) in the `analysis` collection. The contract status becomes `analyzed` on success or `error` on failure (the `502` response includes the underlying cause).
3. `DELETE /contracts/{contract_id}` removes the contract document, its R2/local object, and associated analysis documents after the user confirms the action in the frontend.
4. Contracts and analyses are identified by MongoDB's built-in `_id`. On startup, legacy unique indexes on the unused `contract_id` / `analysis_id` fields are dropped automatically if present (they caused `E11000 duplicate key` errors because a missing field is indexed as `null`).

## Troubleshooting

- `Invalid URI scheme`: check that `MONGODB_URI` starts with `mongodb://` or `mongodb+srv://`.
- MongoDB connection errors: confirm your Atlas IP access list, database user, and `MONGODB_URI`.
- Import errors: run `uvicorn app.main:app --reload` from the project root, not from inside `app/`.
- `E11000 duplicate key error ... contract_id: null`: a stale unique index from an older version — restart the app (startup drops it automatically) or drop the `contract_id_1` / `analysis_id_1` indexes manually.
- Contract deletion returns `503`: verify the R2 endpoint, bucket name, and bucket-scoped API token in `.env`; the contract remains in MongoDB if its stored file cannot be deleted.
- Analysis returns `502`: the response `detail` includes the underlying Gemini API cause. Gemini 3.6 Flash does not need a `temperature` parameter; keep the request compatible with the current Gemini API and verify the API key, quota, and model name.
- API returns `401 Not authenticated`: the request is missing a valid Clerk session token — sign in through the frontend and confirm `CLERK_SECRET_KEY` matches between backend and frontend (or set `AUTH_DISABLED=true` for local dev).

## Project structure

```text
.
├── app/                        # FastAPI backend
│   ├── __init__.py             # Python package marker
│   ├── auth.py                 # Clerk session-token verification (get_current_user)
│   ├── config.py               # Environment configuration
│   ├── database.py             # MongoDB client, collections, and startup index cleanup
│   ├── main.py                 # FastAPI application setup
│   ├── models.py               # Pydantic models (Contact, AnalysisResult, ...)
│   ├── routes/
│   │   ├── contracts.py        # Upload / list / get / delete contract endpoints
│   │   └── analysis.py         # Gemini analysis endpoint
│   ├── service/
│   │   ├── document_parser.py  # PDF/TXT text extraction
│   │   ├── gemini_analyse.py   # Gemini API client and response parsing
│   │   ├── storage.py          # R2/local upload and deletion adapter
│   │   └── prompt.py           # Analysis prompts
├── uploads/                    # Local files when STORAGE_BACKEND=local
├── frontend/                   # Next.js 15 frontend
│   ├── app/                    # App Router pages (marketing, dashboard)
│   ├── components/             # UI, contract, and analysis components
│   ├── hooks/                  # TanStack Query hooks
│   ├── lib/                    # API client, config, validation, Clerk auth
│   ├── types/                  # Frontend API response types
│   ├── middleware.ts           # Clerk route protection for /dashboard/*
│   └── next.config.ts          # Dev proxy: /api/* → http://127.0.0.1:8000/*
├── tests/                      # Pytest suite (auth and owner scoping)
├── clerkAuth.md                # Clerk authentication implementation plan
├── requirements.txt            # Pinned Python dependencies
└── README.md
```

## License

No license has been specified yet.
