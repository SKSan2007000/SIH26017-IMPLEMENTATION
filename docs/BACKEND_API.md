# LandGuard AI — Backend API Contract

This is the contract `lib/api/index.ts` expects once `NEXT_PUBLIC_API_BASE_URL`
is set. Response shapes are the TypeScript interfaces in `types/index.ts` --
treat that file as the source of truth; this doc just maps endpoints to them.

All endpoints are read-only (`GET`) except the What-If simulation, which is
a `POST` that returns a computed result without persisting anything. Nothing
here performs writes, approvals, or automated decisions -- consistent with
the "decision-support system" security rule for this project.

| Method | Path | Returns | Notes |
|---|---|---|---|
| GET | `/api/projects` | `Project[]` | All projects, all states/districts |
| GET | `/api/projects/{id}` | `Project` | 404 if not found |
| GET | `/api/projects/{id}/routes` | `Route[]` | The route alternatives for that project |
| GET | `/api/projects/{id}/parcels` | `Parcel[]` | All parcels for that project |
| GET | `/api/routes/{routeId}/parcels` | `Parcel[]` | Parcels affected by that specific route |
| GET | `/api/projects/{id}/stakeholders` | `Stakeholder[]` | Fictional/anonymized owner refs only -- see security note below |
| GET | `/api/projects/{id}/risk` | `RiskScore` | Includes trend, categories, drivers |
| GET | `/api/projects/{id}/risk/drivers` | `RiskDriver[]` | Subset of the above, exposed separately for the "Why" panel |
| GET | `/api/projects/{id}/recommendations` | `Route[]` | Routes flagged `aiRecommended: true` |
| POST | `/api/projects/{id}/what-if` | `WhatIfLever[]` | Body: `{ leverIds: string[] }`. Must be labeled a simulated estimate downstream -- see below |
| GET | `/api/field-cases?projectId=` | `VerificationCase[]` | `projectId` optional; omit for all cases |
| GET | `/api/documents` | `DocumentRecord[]` | Includes OCR extraction + confidence where applicable |
| GET | `/api/officers` | `Officer[]` | Contribution scores -- prototype mechanism, not a real policy |
| GET | `/api/notifications` | `NotificationItem[]` | |
| GET | `/api/analytics` | `AnalyticsSnapshot` | Aggregate stats, not per-record |
| GET | `/api/projects/{id}/audit` | `AuditEvent[]` | Chronological, ascending |
| GET | `/api/citizen-reports` | `CitizenReport[]` | Never auto-approved server-side -- status transitions require an authorized reviewer action, which is out of scope for this read-only contract |

## Error handling
Any non-2xx response is surfaced to the frontend as a thrown `ApiError`
(`lib/api/httpClient.ts`) with the HTTP status attached. There is currently
no retry or silent-fallback-to-mock behavior when the backend is configured
-- a broken backend should be visible, not hidden.

## Security / data rules (unchanged from the frontend)
- No Aadhaar numbers or authentication.
- No real property-ownership or personal data -- `ownerRef` fields must stay
  fictional/anonymized identifiers (e.g. `DEMO OWNER-024`) end-to-end,
  including whatever the backend actually stores.
- `/what-if` must never auto-apply its result to a project's real risk score
  or trigger any acquisition/compensation/approval action -- it's read-only
  decision support. The frontend already labels every result it displays
  from this endpoint `SIMULATED ESTIMATE`.
- No endpoint here should perform an automatic legal, compensation, or
  acquisition-approval decision.

## Known gap as of this milestone
`lib/api/index.ts` and the mock/real switch exist and are wired to
`NEXT_PUBLIC_API_BASE_URL`, but most page/components today still import
mock data directly from `lib/mock/*` for simplicity (synchronous reads,
no loading states). Pointing the *whole* app at a real backend also
requires refactoring those call sites to call `api.*` (which returns
Promises) with `useEffect`/loading states instead. That refactor has not
been done yet -- treat the API layer as ready, but the UI as not yet wired
to it end-to-end.
