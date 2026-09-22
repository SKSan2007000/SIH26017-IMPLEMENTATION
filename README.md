# LandGuard AI — Frontend Prototype

**SIH26017 — Predictive Analytics System for Early Detection of Land Acquisition Delays**

Frontend-only decision-support prototype. All data is fictional demo/simulation
data (`DEMO OWNER-###`, `LG-P####`, invented coordinates). No real government
records, Aadhaar data, or land-ownership data is used or modeled anywhere in
this repo.

## ⚠️ Important: this repo has not been built or run yet

This project was generated in a sandboxed environment with **no network
access to the npm registry**, so `npm install`, `npm run dev`, and
`npm run build` could not be executed here. Every file was hand-written to be
correct, and the source tree was verified as much as possible without a real
install:

- All 57 `.ts`/`.tsx` files parse with the TypeScript compiler (zero syntax errors).
- Every local/`@/` import resolves to a real file.
- Every named import matches a real export in its target file.
- No unused imports.
- Every interactive component has the `'use client'` directive it needs.

What could **not** be verified here: a real `tsc` type-check against the
actual installed package types (`maplibre-gl`, `cesium`, `framer-motion`,
`zustand`, `next`, `react` types aren't present without `npm install`), and
a real `next build`/`next dev`. **Run the steps below in an environment
with network access before treating this as done** — that's the real test.

## Connecting a real backend

`lib/api/index.ts` now supports two modes:

- **Default (no config needed)** — returns mock data, exactly as before.
- **Real backend** — copy `.env.local.example` to `.env.local`, set
  `NEXT_PUBLIC_API_BASE_URL` to your FastAPI server, restart `npm run dev`.
  Every `api.*` call then hits the real endpoint instead, and errors
  propagate instead of silently falling back to mock data.

The exact endpoint contract the FastAPI backend needs to implement is in
[`docs/BACKEND_API.md`](./docs/BACKEND_API.md).

**Known gap:** the switch above is real, but most components today still
import mock data directly from `lib/mock/*` (synchronous reads) rather than
calling `api.*` (which returns Promises). Making the *whole* app actually
follow `NEXT_PUBLIC_API_BASE_URL` requires refactoring those call sites to
fetch via `api.*` with loading states — that hasn't been done yet. See the
"Known gap" section at the bottom of `docs/BACKEND_API.md`.

## Setup

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

If `npm run build` or `npm run dev` surfaces errors, they'll almost certainly
be in one of these categories (in order of likelihood):

1. **Cesium + webpack asset paths** (`next.config.mjs`) — the
   `copy-webpack-plugin` patterns copy from `node_modules/cesium/Build/Cesium/*`
   into `public/cesium/*`. If Cesium's package layout has changed since
   `cesium@1.120`, adjust the `cesiumSource` path there.
2. **Minor type mismatches** against the real MapLibre/Cesium/Zustand type
   definitions, since those weren't available to check against here — these
   are typically one-line fixes (`tsc --noEmit` will point at them exactly).
3. **Tailwind/CSS variable wiring** between `tailwind.config.ts` (which
   references `var(--font-display)` etc.) and the Next fonts set up in
   `app/layout.tsx` — double-check the class names actually apply if the
   fonts don't render as expected.

## What's implemented (this milestone)

- **App shell**: collapsible sidebar (all nav items), top bar with
  state/district/project filters, search, AI status, notifications, user chip.
- **Command Center** (`/`): stat cards, live MapLibre map (CARTO dark
  basemap — free, no API key) with projects/parcels/risk zones/route, layer
  toggles, risk filter, at-risk project list.
- **Project Creation** (`/projects/new`): form → generates a fictional
  Project ID client-side. Not persisted; no downstream workflow triggers.
- **Route Planning** (`/route-planning`): 4 AI route alternatives (A–D) with
  full metrics, comparison table, Route C flagged `AI-SUGGESTED OPTION`, and
  a live 2D GIS preview that updates affected parcels when a route is selected.
- **2D GIS** (`/gis`): dedicated MapLibre map, parcel click → impact panel,
  route highlighting driven by the same global store as Route Planning.
- **3D Project Twin** (`/twin`): CesiumJS scene (OpenStreetMap imagery, no
  Ion token required), parcels as extruded blocks colored by impact, route
  corridor, fictional infrastructure/stakeholder/field markers, 2D/3D/
  Satellite + per-layer toggles, camera reset. Selecting a route in Route
  Planning filters which parcels/route show here too (shared Zustand store).
- **AI Delay Risk** (`/risk`): risk gauge, trend, category breakdown,
  "Why is this project at risk?" contribution bars, delay timeline with
  bottleneck highlighted, and a What-If simulation panel (toggle
  interventions → see a `SIMULATED ESTIMATE` risk change).
- **Mock data architecture** (`lib/mock/`): 12 projects, 4 authored routes
  + full metrics, 58 parcels, 34 stakeholders, 36 field verification cases,
  documents/OCR records, notifications, officer scores, analytics snapshot,
  audit trail, citizen reports — typed via `types/index.ts`.
- **API abstraction** (`lib/api/index.ts`): async functions returning mock
  data today; swap the implementation for real `fetch` calls to a FastAPI
  backend later without touching any call site.

## What's scaffolded but not built (next milestone)

Stakeholders, Field Verification, Documents (OCR UI), Citizen Reports,
Notifications Center, Analytics dashboards, Officer Performance
(contribution score — explicitly a **prototype accountability/motivation
mechanism**, not a real government policy), Audit Trail, Settings. Each has
a nav entry and a stub page (`components/ui/Primitives.tsx` → `ModuleStub`)
so navigation doesn't dead-end; none have UI built yet, per the instruction
to prioritize Command Center → Route Planning → 2D GIS → 3D Twin → AI Risk
first.

## Security/data rules honored throughout

No Aadhaar authentication or numbers, no real property ownership data, no
real government database calls, no automatic legal/compensation/approval
decisions. Every AI-generated number is explicitly labeled `AI PREDICTION —
HUMAN DECISION REQUIRED` or `SIMULATED ESTIMATE`.
