# Clerk Authentication — Implementation Plan

Status: **Implemented** · Scope: FastAPI backend (`backend/`) + Next.js 15 frontend (`frontend/`)

> Implemented with `@clerk/nextjs` v7 (Core 3): `<Show when="signed-in|out">`
> replaces the removed `<SignedIn>`/`<SignedOut>` components, and `UserButton`
> no longer takes `afterSignOutUrl`. Backend uses `clerk-backend-api` 7.0.0.
> Remaining manual step: Phase 0 — create the Clerk application and drop real
> keys into `frontend/.env.local` and the backend `.env` (then set
> `AUTH_DISABLED=false`).


## 1. Current State

- **No auth anywhere.** All API routes (`/contracts/*`, `/analysis/*`) are publicly
  accessible; MongoDB documents have no owner field.
- **Frontend has a deliberate auth seam**: `frontend/lib/auth.ts` exports
  `getSession()` and `getAuthHeaders()` stubs. The README and the module docstring
  state this is the intended integration point — inject auth headers in the fetch
  wrapper (`frontend/lib/api-client.ts`) so no hooks/components change.
- **Two request paths need the token** (easy to miss the second one):
  1. `request<T>()` fetch wrapper in `api-client.ts`
  2. `uploadContract()` — uses raw `XMLHttpRequest` for upload-progress events
- **Dev proxy**: `next.config.ts` rewrites `/api/*` → `http://127.0.0.1:8000/*`, so
  the browser never hits CORS in development. Production uses
  `NEXT_PUBLIC_API_BASE_URL` and **will need CORS middleware** on FastAPI once
  browsers send `Authorization` headers cross-origin.
- No `frontend/middleware.ts`, no sign-in/sign-up pages, no user UI in
  `components/site-header.tsx`.

## 2. Target Architecture

```
Browser                  Next.js (3000)              FastAPI (8000)
  │  sign-in ───────────▶ Clerk hosted components         │
  │  session JWT (auto-refresh, ~60s TTL)                 │
  │  API call + Authorization: Bearer <session JWT> ─────▶│
  │                                                       │ verify JWT via Clerk
  │                                                       │ SDK (JWKS), check azp+exp
  │                                                       │ scope MongoDB by owner_id
  │  200 / 401 / 404 ◀─────────────────────────────────── │
```

- **Clerk** owns identity: sign-up/sign-in UI, session tokens (JWTs), user profile.
- **Frontend** (`@clerk/nextjs`): `ClerkProvider`, route-protection middleware,
  auth pages, `UserButton` in the header, and a short-lived session JWT attached
  to every API call through the existing `lib/auth.ts` seam.
- **Backend**: a FastAPI dependency verifies the Clerk session JWT on every
  request and returns the Clerk `user_id`; all contract/analysis queries are
  scoped to that user. No local user table required for MVP (ownership is keyed
  by Clerk user id).

## 3. Phase 0 — Clerk Dashboard Setup (no code)

1. Create a Clerk application at https://dashboard.clerk.com (development instance).
2. Enable sign-in strategies: Email + password (minimum); Google OAuth (optional).
3. Copy **Publishable Key** and **Secret Key** (API Keys page).
4. Under *Allowed redirect URLs / Authorized parties*, add `http://localhost:3000`
   (and the production domain later). This feeds the backend `azp` check.
5. Use the **default session token** — no custom JWT template needed for MVP.

## 4. Phase 1 — Frontend Integration

> ⚠️ `frontend/AGENTS.md` warns this Next.js version has breaking changes vs.
> training data. Before writing middleware/provider code, check
> `frontend/node_modules/next/dist/docs/` and the `@clerk/nextjs` README for the
> exact installed-version APIs (`clerkMiddleware`, `auth.protect()`).

### 4.1 Install & environment

- `cd frontend && npm install @clerk/nextjs`
- Create `frontend/.env.local` (never commit) and `frontend/.env.local.example`:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/dashboard
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/dashboard
```

### 4.2 Provider

- `app/layout.tsx`: wrap the tree in `<ClerkProvider>` (outermost, around
  `<Providers>`). Keeps all existing providers untouched.

### 4.3 Route protection — new `frontend/middleware.ts`

- Use `clerkMiddleware` + `createRouteMatcher(["/dashboard(.*)"])`; call
  `await auth.protect()` only for protected routes.
- The marketing page `app/(marketing)/page.tsx` stays public.
- Keep Clerk's default `matcher` config (static assets excluded). Note: `/api/*`
  requests pass through middleware **unprotected** — intentional, because the
  Next layer only proxies them and FastAPI enforces auth itself.

### 4.4 Auth pages & header UI

- `app/sign-in/[[...sign-in]]/page.tsx` → `<SignIn />` (centered, matches theme).
- `app/sign-up/[[...sign-up]]/page.tsx` → `<SignUp />`.
- `components/site-header.tsx`: replace the always-visible "Open dashboard"
  button with Clerk states:
  - `<SignedOut>` → `<SignInButton>` (and hide the dashboard nav link, or let
    middleware redirect).
  - `<SignedIn>` → `<UserButton afterSignOutUrl="/" />` next to `ModeToggle`.

### 4.5 Token injection through the existing seam

- `frontend/lib/auth.ts`: implement `getAuthHeaders()` via the Clerk client
  singleton so it works outside React components:

```ts
export async function getAuthHeaders(): Promise<Record<string, string>> {
  if (typeof window === "undefined") return {};
  const token = await window.Clerk?.session?.getToken(); // cached; auto-refreshes
  return token ? { Authorization: `Bearer ${token}` } : {};
}
```

  (`getToken()` is called per request on purpose — Clerk returns the cached token
  or refreshes it when expired. Do not cache it yourself.)

- `frontend/lib/api-client.ts` (only other file that changes):
  - `request()`: `headers: { Accept: "application/json", ...(await getAuthHeaders()), ...init?.headers }`
  - `uploadContract()`: `await getAuthHeaders()` before `xhr.send()`, then
    `xhr.setRequestHeader("Authorization", ...)` when a token exists.
  - **No hook or component call sites change** — exactly as the seam intended.
- 401 handling: an `ApiError` with status 401 while signed out triggers
  `window.Clerk.redirectToSignIn()` (or a toast). TanStack Query already refuses
  to retry 4xx (`components/providers.tsx`), so no provider changes needed.


## 5. Phase 2 — Backend JWT Verification (FastAPI)

### 5.1 Dependencies

- Add the official Clerk Python SDK to `requirements.txt` and `venv`:
  `clerk-backend-api` (provides `authenticate_request` with JWKS verification).
- Alternative (if we prefer minimal deps): `PyJWT[crypto]` + Clerk's JWKS
  endpoint (`https://<clerk-frontend-api>/.well-known/jwks.json`). Same claims
  checks either way — pick the SDK unless it conflicts with pinned deps.

### 5.2 Config — `backend/config.py` (follow existing env-validation pattern)

```python
CLERK_SECRET_KEY = os.getenv("CLERK_SECRET_KEY", "").strip()
CLERK_AUTHORIZED_PARTIES = _parse_allowed_extensions(  # reuse JSON/CSV parser
    os.getenv("CLERK_AUTHORIZED_PARTIES", '["http://localhost:3000"]')
)
# Dev/test escape hatch ONLY — must be false in production.
AUTH_DISABLED = os.getenv("AUTH_DISABLED", "false").strip().lower() == "true"

if not AUTH_DISABLED and not CLERK_SECRET_KEY:
    raise RuntimeError("CLERK_SECRET_KEY is required (or set AUTH_DISABLED=true for local dev).")
```

### 5.3 New `backend/auth.py` — FastAPI dependency

- `ClerkUser` model: `user_id` (JWT `sub`), `session_id`, `claims: dict`.
- `get_current_user(request: Request) -> ClerkUser`:
  1. If `AUTH_DISABLED`, return a fixed dev user (keeps local dev/tests simple).
  2. Build an `httpx.Request` from the Starlette request (method, url, headers)
     and call `clerk.authenticate_request(..., AuthenticateRequestOptions(authorized_parties=CLERK_AUTHORIZED_PARTIES))`.
  3. If the request state is not signed in → `HTTPException(401,
     detail="Not authenticated.", headers={"WWW-Authenticate": "Bearer"})`.
     The `detail` string surfaces verbatim in the frontend `ApiError`, matching
     the existing error-handling convention.
  4. Return `ClerkUser` from the verified token payload.
- Instantiate the Clerk SDK client once at module level (like the Mongo client
  in `backend/database.py`), not per request.

### 5.4 Protect routes

- `backend/routes/contracts.py` and `backend/routes/analysis.py`: add
  `dependencies=[Depends(get_current_user)]` to each `APIRouter(...)`, and inject
  `user: ClerkUser = Depends(get_current_user)` into handlers that need the id
  (Phase 3). Router-level dependency = no route is accidentally left public.
- Keep `GET /` (root listing) public; update its copy to note auth is required.

### 5.5 CORS (production only, but configure now)

- Add `CORSMiddleware` in `backend/main.py` driven by `CORS_ORIGINS` env
  (JSON/CSV list, default `["http://localhost:3000"]`), with
  `allow_headers=["Authorization", "Content-Type"]`. In dev the Next proxy makes
  this a no-op; in production the browser calls the API directly with a Bearer
  token, so this is mandatory.

## 6. Phase 3 — User-Scoped Data (multi-tenancy)

1. **`backend/models.py`**: add `owner_id: str = ""` to `Contact` (Clerk user id).
   Analysis documents inherit ownership through their parent contract — no
   schema change needed on `AnalysisResult`.
2. **Upload** (`POST /contracts/upload`): set `owner_id=user.user_id`.
3. **List** (`GET /contracts/`): filter `{"owner_id": user.user_id}`.
4. **Get / Delete** (`/contracts/{id}`): query by `_id` **and** `owner_id`;
   return **404 (not 403)** when another user's id is requested — avoids
   leaking that the id exists (id-enumeration hardening).
5. **Analysis routes**: resolve the parent contract with the same owner filter
   before analyzing or returning results (`/analysis/analyze/{id}`,
   `/analysis/contracts/{contract_id}`). `/analysis/{analysis_id}` must join
   back to its contract for the ownership check.
6. **`backend/database.py` `init_db()`**: create a non-unique index on
   `contracts.owner_id` alongside the existing legacy-index cleanup.
7. **Migration of existing documents**: current documents have no `owner_id`.
   One-off script (or mongo shell) to backfill `owner_id` to a chosen Clerk
   user id; documents left without an owner become invisible to everyone.
   Decision needed: backfill vs. wipe dev data.
8. **Optional**: prefix R2/local object keys with the user id
   (`contracts/{user_id}/{uuid}.pdf`) for storage-level isolation.


## 7. Phase 4 — Optional: Clerk Webhooks (user sync)

Not required for MVP (ownership is keyed by Clerk user id, no local user table).
Add only if we later need profile data offline or cleanup on account deletion:

  - `POST /webhooks/clerk` in a new `backend/routes/webhooks.py`, verifying the
  signature with the `svix` package against `CLERK_WEBHOOK_SIGNING_SECRET`.
- Handle `user.deleted` → delete that user's contracts, analyses, and R2 files
  (reuse the existing `delete_upload` service). This route stays **outside** the
  Bearer-token dependency — it authenticates via Svix signature instead.

## 8. Phase 5 — Testing & Documentation

- **Backend** (repo has no tests yet — introduce `pytest` + `httpx` TestClient):
  - `app.dependency_overrides[get_current_user]` to inject a fake user.
  - Cases: no token → 401; bad token → 401; valid user only sees own contracts;
    cross-user id → 404; `AUTH_DISABLED=true` keeps old behavior.
- **Frontend**: unit-test `getAuthHeaders()` with a mocked `window.Clerk`;
  lint (`npm run lint`) and `next build` must pass.
- **Manual E2E checklist**: sign up → upload PDF → analyze → delete → sign out →
  dashboard redirects to `/sign-in` → second account sees an empty dashboard.
- **Docs**: update `README.md` config table + auth section, root `.env.example`,
  and add `frontend/.env.local.example`.

## 9. Environment Variable Summary

| Variable | Where | Required | Notes |
|---|---|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | frontend | Yes | Safe for browser. |
| `CLERK_SECRET_KEY` | frontend **and** backend | Yes | Server-only; never commit. |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` / `..._SIGN_UP_URL` | frontend | Yes | `/sign-in`, `/sign-up`. |
| `CLERK_AUTHORIZED_PARTIES` | backend | Yes | JSON/CSV list of allowed `azp` origins. |
| `AUTH_DISABLED` | backend | No (`false`) | Dev/test escape hatch — never true in prod. |
| `CORS_ORIGINS` | backend | Prod | Allowed browser origins for direct API calls. |
| `CLERK_WEBHOOK_SIGNING_SECRET` | backend | Phase 4 only | Svix signature verification. |

## 10. File-by-File Checklist

| File | Action |
|---|---|
| `frontend/package.json` | Add `@clerk/nextjs` |
| `frontend/.env.local` + `.env.local.example` | Create (Clerk keys) |
| `frontend/app/layout.tsx` | Wrap in `<ClerkProvider>` |
| `frontend/middleware.ts` | **Create** — protect `/dashboard(.*)` |
| `frontend/app/sign-in/[[...sign-in]]/page.tsx` | **Create** |
| `frontend/app/sign-up/[[...sign-up]]/page.tsx` | **Create** |
| `frontend/components/site-header.tsx` | `SignedIn`/`SignedOut`/`UserButton` |
| `frontend/lib/auth.ts` | Implement `getAuthHeaders()` (async) |
| `frontend/lib/api-client.ts` | Await auth headers in `request()` + XHR upload; 401 handling |
| `requirements.txt` | Add `clerk-backend-api` (or `PyJWT[crypto]`) |
| `.env.example` | Add backend Clerk vars |
| `backend/config.py` | Clerk config + `AUTH_DISABLED` + `CORS_ORIGINS` |
| `backend/auth.py` | **Create** — `get_current_user` dependency |
| `backend/main.py` | Add `CORSMiddleware` |
| `backend/routes/contracts.py`, `backend/routes/analysis.py` | Router-level auth dependency + owner scoping |
| `backend/models.py` | `Contact.owner_id` |
| `backend/database.py` | Index on `owner_id` |
| `README.md` | Auth setup docs |

## 11. Security Notes

- `CLERK_SECRET_KEY` is server-only on both sides; only `NEXT_PUBLIC_*` reaches
  the browser.
- Always verify `azp` (authorized parties) so tokens minted for another Clerk
  application are rejected.
- 404 (not 403) for cross-user resource access — don't leak existence.
- Session tokens expire in ~60s; the frontend calls `getToken()` per request and
  the backend verifies per request — never cache verification results.
- `AUTH_DISABLED=true` must never reach production; consider a startup warning
  log when it is set.
- Add rate limiting on upload/analyze in a follow-up (out of scope here).

## 12. Rollout Order

1. Phase 0 (Clerk dashboard) → 2. Phase 1 (frontend) → 3. Phase 2 (backend
   verification) → 4. Phase 3 (owner scoping + migration) → 5. Phase 5
   (tests/docs). Phase 4 (webhooks) any time after launch.
2. Between Phase 2 and 3 the API is authenticated but data is still shared —
   acceptable briefly in dev, **do not deploy to production in that state**.
