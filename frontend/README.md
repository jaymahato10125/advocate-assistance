# Vakeel Contracts — Frontend

Production-grade Next.js frontend for the **Vakeel Contracts API** (the FastAPI
backend in the repository root). Upload PDF/TXT contracts, extract their text,
and analyze them with Google Gemini — key clauses, severity-tagged risk flags,
an overall risk level, and recommendations.

## Stack

- **Next.js 15** (App Router) + **TypeScript** strict mode
- **Tailwind CSS v4** + shadcn/ui-style primitives (Radix)
- **TanStack Query** for all data fetching/mutations
- **Framer Motion** for reveals, staggered results, and the animated risk gauge
- **react-dropzone** + **zod** for the validated upload flow
- **sonner** toasts, **lucide-react** icons, **next-themes** dark/light mode

## Run it

```bash
npm install
npm run dev
```

The app runs on <http://localhost:3000>. In development, `next.config.ts`
proxies `/api/*` to the FastAPI server at `http://127.0.0.1:8000/*`, so start
the backend first (`uvicorn app.main:app --reload` from the repo root) — no
CORS setup needed.

For production, set `NEXT_PUBLIC_API_BASE_URL` to the deployed API origin (see
`.env.example`) and the proxy is unused.

## Notes on backend realities

- **There is no GET endpoint for analysis results.** An analysis lives only in
  the TanStack Query cache (keyed by contract id) for the session. Reloading
  the page shows a clean "not analyzed yet" state — by design, until the API
  grows `GET /analysis/...` endpoints.
- **Analysis failures return 502 with a `detail` message** (often a retired
  Gemini model). That message is surfaced verbatim in a toast and an inline
  banner.
- **Upload constraints are mirrored client-side** in `lib/config.ts`
  (`ALLOWED_EXTENSIONS`, `MAX_FILE_SIZE_MB`) so a backend env change is a
  one-line edit here.
- **No auth** — `lib/auth.ts` is a marked seam for dropping it in later.

## Structure

```text
app/
  (marketing)/        landing page + OG image
  dashboard/          contract list (table/grid, search, filter, sort, pagination)
    contracts/[id]/   detail: Overview / Document / Analysis tabs
components/
  ui/                 shadcn-style primitives
  contracts/          table, card, status badge, upload dropzone + dialog
  analysis/           risk gauge, clause/flag/recommendation lists, panel
hooks/                TanStack Query hooks (use-contracts, use-analysis)
lib/                  api-client, config, validation, auth stub
types/                API response shapes (verified against the FastAPI models)
```
