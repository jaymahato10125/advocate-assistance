# Build Prompt: Vakeel Contracts API — Next.js Frontend


---

## Role & Objective

You are a senior frontend engineer building a production-grade Next.js frontend for **Vakeel Contracts API** — a FastAPI backend that lets users upload legal contracts (PDF/TXT), extracts their text, and analyzes them with Google Gemini to surface key clauses, risk flags, an overall risk level, and recommendations.

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

## Backend contract (verify exact shapes against the running API's `/docs` Swagger UI — treat that as source of truth over this doc)

| Method | Path | Purpose |
|---|---|---|
| GET | `/` | API name, version, endpoint list |
| POST | `/contracts/upload` | Upload a PDF/TXT contract; extracts and stores text |
| GET | `/contracts/` | List contracts (text content omitted) |
| GET | `/contracts/{id}` | Get one contract, including full extracted text |
| POST | `/analysis/analyze/{contract_id}` | Runs Gemini analysis, stores and returns the result |

**Backend realities to design around — these matter:**

1. **There is no GET endpoint for analysis results yet.** `GET /analysis/{analysis_id}` and `GET /analysis/contracts/{contract_id}` are both explicitly "not implemented" in the README. The *only* place the frontend ever sees an analysis is the direct JSON response of the `POST /analysis/analyze/{contract_id}` call. Don't build a "reload past analysis on page refresh" flow — the backend can't serve it yet. Cache the result client-side (TanStack Query mutation result, keyed by contract id, or lifted into a small store) for the session, and show a clean "not analyzed yet — run analysis" empty state whenever it isn't in cache, even for contracts whose status is already `analyzed` server-side.
2. **Contract status is a state machine**: `uploaded → analyzing → analyzed | error`. Reflect it everywhere a contract appears (list, detail, badges) with distinct colors/icons per state.
3. **Analysis failures return `502` with a `detail` field** containing the real cause — very often a retired Gemini model. Surface that message verbatim in a toast and an inline banner; don't paper over it with a generic "something went wrong."
4. **Upload constraints are configurable server-side**: `ALLOWED_EXTENSIONS` (default `.pdf`, `.txt`) and `MAX_FILE_SIZE_MB` (default `10`). Validate client-side before the request fires so users get instant feedback, and keep both as named constants in `lib/config.ts` so they're a one-line change if the backend env vars differ.
5. **No auth exists in this API.** Don't build a login flow — this is a single-tenant internal tool for now. Leave a clearly marked seam (`lib/auth.ts` stub) so auth can be dropped in later without a rewrite.
6. **CORS/dev proxy**: the FastAPI dev server runs on `127.0.0.1:8000`, Next.js on `3000`. Add a `rewrites()` entry in `next.config.js` proxying `/api/:path*` → `http://127.0.0.1:8000/:path*` so the frontend never has to deal with CORS in dev, and reads one `NEXT_PUBLIC_API_BASE_URL` env var in prod.

## Inferred data model

Reasonable starting shapes — confirm field names against `/docs` before wiring up real requests:

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

- **`/`** — Marketing/landing page. Hero with a compelling headline + subhead, a short "how it works" 3-step section (upload → extract → analyze), a feature grid, and a CTA into `/dashboard`. This is the only page that needs to sell the product; everything else is the working tool.
- **`/dashboard`** — Contract list as the home base. Table/card-grid toggle, search by filename, filter by status, sort by upload date, an "Upload contract" button that opens the upload flow (modal or drawer, not a separate page — keep the loop tight).
- **`/dashboard/contracts/[id]`** — The core screen. Tabbed or sectioned view: *Overview* (metadata + status), *Document* (extracted text, scrollable, monospace-adjacent reading view), *Analysis* (empty state with a prominent "Analyze with Gemini" button if no cached result yet; once run, show summary, contract type, risk gauge, expandable key-clause list, severity-tagged risk flags, recommendations list).
- **`not-found.tsx`**, **`error.tsx`**, and **`loading.tsx`** at both the dashboard and contract-detail route segments — skeleton loaders that mirror the final layout, not spinners.

## Design Direction

**Palette** — deep, precise, legal-adjacent. Charcoal/near-black (`#0B0F14`–`#0F1620`) surfaces for dark mode, warm off-white (`#FAFAF8`) for light mode, one confident accent — a deep emerald or muted gold reads "trustworthy/premium" better than a generic SaaS blue or purple. Reserve red/amber strictly for risk severity, never for brand color.

**Typography** — pair a refined serif for display headings (Fraunces, Newsreader, or Instrument Serif) with a clean grotesk for UI text (Inter or Geist Sans). The serif-for-headlines choice is what separates "legal document gravitas" from "generic dashboard."

**Motion** — this needs to feel expensive, not just animated:
- Scroll-triggered fade/slide-up reveals on the landing page sections (Framer Motion `whileInView`).
- Staggered reveal when the analysis results render (clauses and risk flags cascade in, ~40–60ms stagger).
- An animated risk gauge that sweeps to its value rather than snapping.
- A genuinely well-designed upload dropzone: dashed border that glows/tightens on drag-over, inline progress bar during upload, success checkmark micro-animation.
- Smooth route transitions (`AnimatePresence`) between dashboard and detail views.
- Respect `prefers-reduced-motion` throughout.

## Feature Checklist ("all the features a modern site should have")

- Fully responsive, mobile-first layout with a collapsible nav
- Dark/light mode toggle, persisted
- Skeleton loading states for every async region (never a bare spinner)
- Toast notifications for every mutation (upload success/failure, analysis success/failure)
- Empty states with an icon + clear next action (no contracts yet, no analysis yet, no search results)
- Accessible by default: semantic HTML, visible focus states, keyboard-navigable dropzone and tables, ARIA labels on icon-only buttons
- SEO metadata via `generateMetadata` on the landing page, Open Graph image, favicon
- Search, filter, and sort on the contracts list; pagination or infinite scroll once the list grows
- Client-side file validation (extension + size) before the upload request fires
- Global error boundary plus route-level `error.tsx` with a retry action
- 404 page consistent with the rest of the design system

## Suggested Folder Structure

```
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
  contracts/
    contract-table.tsx
    contract-card.tsx
    status-badge.tsx
    upload-dropzone.tsx
  analysis/
    risk-gauge.tsx
    key-clause-list.tsx
    risk-flag-list.tsx
    recommendations-list.tsx
lib/
  api-client.ts        # typed fetch wrapper, base URL from env
  config.ts             # ALLOWED_EXTENSIONS, MAX_FILE_SIZE_MB mirrors
  auth.ts                # stub seam, unused for now
types/
  contract.ts
hooks/
  use-contracts.ts       # TanStack Query hooks
  use-analysis.ts
```

## Non-negotiables

- No lorem-ipsum placeholder copy on the landing page — write real, specific copy about what this tool does.
- No default shadcn spacing/colors left untouched — this needs a distinct visual identity, not the out-of-the-box template look.
- Every async action (upload, analyze) needs a loading state, a success state, and a handled error state — all three, every time.
- Don't build the "reload past analysis" feature described in the backend caveat above — it isn't supported yet.