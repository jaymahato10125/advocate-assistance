# Build Prompt: Advocate Contracts API — Next.js Frontend

---

## Role & Objective

You are a senior frontend engineer building a production-grade Next.js frontend for **Advocate Contracts API** — a FastAPI backend that lets users upload legal contracts (PDF/TXT), extracts their text, and analyzes them with Google Gemini to surface key clauses, risk flags, an overall risk level, and recommendations.

Build a **modern, premium, SaaS-grade** interface — the polish level of Linear, Vercel, or Ramp, not a generic admin CRUD panel. Restrained color, confident typography, purposeful motion, zero visual clutter. This is a legal-tech product, so the aesthetic should read as *trustworthy and precise*, not playful.

## Tech Stack

- **Next.js 15**, App Router, TypeScript strict mode. Server Components by default; `"use client"` only where interactivity/hooks are needed.
- **Tailwind CSS** + **shadcn/ui** (Radix primitives) for accessible, composable components.
- **Framer Motion** for page transitions, scroll reveals, and micro-interactions.
- **TanStack Query** for all data fetching, caching, and mutations against the API.
- **react-dropzone** for the upload flow.
- **sonner** for toast notifications.
- **lucide-react** for icons.
- **recharts** (or a hand-rolled SVG gauge) for the risk-level visualization.
- **next-themes** for dark/light mode.
- **zod** for client-side validation of upload constraints.

## Backend contract

Verify exact shapes against the running API's `/docs` Swagger UI — treat that as the source of truth.

| Method | Path | Purpose |
|---|---|---|
| GET | `/` | API name, version, endpoint list |
| POST | `/contracts/upload` | Upload a PDF/TXT contract; extracts and stores text |
| GET | `/contracts/` | List contracts (text content omitted) |
| GET | `/contracts/{id}` | Get one contract, including full extracted text |
| POST | `/analysis/analyze/{contract_id}` | Runs Gemini analysis, stores and returns the result |
| GET | `/analysis/contracts/{contract_id}` | Retrieves the latest saved analysis for a contract |
| GET | `/analysis/{analysis_id}` | Retrieves a saved analysis by MongoDB ID |

**Backend realities to design around:**

1. **Analysis results are persisted.** Load them through `GET /analysis/contracts/{contract_id}` and keep them in the TanStack Query cache for the current session. Show a clean empty state only when no saved analysis exists.
2. **Contract status is a state machine**: `uploaded → analyzing → analyzed | error`. Reflect it everywhere a contract appears with distinct colors/icons per state.
3. **Analysis failures return `502` with a `detail` field** containing the real cause — very often a retired Gemini model. Surface that message verbatim in a toast and an inline banner; do not paper over it with a generic error.
4. **Upload constraints are configurable server-side**: `ALLOWED_EXTENSIONS` (default `.pdf`, `.txt`) and `MAX_FILE_SIZE_MB` (default `10`). Validate client-side before the request fires, and keep both as named constants in `lib/config.ts` so they are one-line changes if the backend env vars differ.
5. **No auth exists in this API.** Do not build a login flow — this is a single-tenant internal tool for now. Leave a clearly marked seam (`lib/auth.ts` stub) so auth can be added later without a rewrite.
6. **CORS/dev proxy**: the FastAPI dev server runs on `127.0.0.1:8000`, Next.js on `3000`. Add a `rewrites()` entry in `next.config.ts` proxying `/api/:path*` → `http://127.0.0.1:8000/:path*` so the frontend does not need CORS in development, and read `NEXT_PUBLIC_API_BASE_URL` in production.

## Inferred data model

Confirm field names against `/docs` before wiring up new requests:

```ts
interface Contract {
  id: string;
  filename: string;
  status: "uploaded" | "analyzing" | "analyzed" | "error";
  uploaded_at: string;
  text?: string; // present only on GET /contracts/{id}
}

interface AnalysisResult {
  summary: string;
  contract_type: string;
  key_clauses: { title: string; content: string }[];
  risk_flags: { description: string; severity: "low" | "medium" | "high" }[];
  overall_risk_level: "low" | "medium" | "high";
  recommendations: string[];
}
```

## Information Architecture

- **`/`** — Marketing/landing page with a hero, how-it-works section, feature grid, and CTA into `/dashboard`.
- **`/dashboard`** — Contract list as the home base. Include search, status filters, sorting, an upload button, and table/card views.
- **`/dashboard/contracts/[id]`** — Tabbed Overview, Document, and Analysis views. The Analysis tab should show saved results when available, otherwise a prominent “Analyze with Gemini” action.
- **`not-found.tsx`**, **`error.tsx`**, and **`loading.tsx`** at dashboard and contract-detail route segments — skeleton loaders should mirror the final layout.

## Design Direction

**Palette** — deep, precise, legal-adjacent. Charcoal/near-black (`#0B0F14`–`#0F1620`) surfaces for dark mode, warm off-white (`#FAFAF8`) for light mode, and a confident emerald or muted gold accent. Reserve red/amber strictly for risk severity.

**Typography** — pair a refined serif for display headings (Fraunces, Newsreader, or Instrument Serif) with a clean grotesk for UI text (Inter or Geist Sans).

**Motion** — use scroll-triggered reveals, staggered analysis results, an animated risk gauge, a polished upload dropzone, smooth transitions, and respect `prefers-reduced-motion`.

## Feature Checklist

- Fully responsive, mobile-first layout with a collapsible nav.
- Dark/light mode toggle, persisted.
- Skeleton loading states for every async region.
- Toast notifications for upload and analysis mutations.
- Empty states with an icon and clear next action.
- Semantic HTML, visible focus states, keyboard navigation, and ARIA labels.
- SEO metadata, Open Graph image, and favicon.
- Search, filter, sort, and future pagination on the contracts list.
- Client-side file validation before upload.
- Global and route-level error boundaries with retry actions.
- Consistent 404 page.

## Suggested Folder Structure

```text
app/
  (marketing)/page.tsx
  dashboard/
    page.tsx
    loading.tsx
    contracts/[id]/
      page.tsx
      loading.tsx
      error.tsx
  layout.tsx
  not-found.tsx
components/
  ui/                 # shadcn primitives
  contracts/          # tables, cards, status, upload flow
  analysis/           # gauge, clauses, flags, recommendations
lib/
  api-client.ts       # typed fetch wrapper
  config.ts            # client upload constraints and API URL
  auth.ts              # future auth seam
types/
  contract.ts
hooks/
  use-contracts.ts
  use-analysis.ts
```

## Non-negotiables

- No lorem-ipsum placeholder copy on the landing page.
- No default shadcn spacing/colors left untouched; maintain a distinct visual identity.
- Every async action needs loading, success, and handled error states.
- Always load persisted analysis results from the API when available.
