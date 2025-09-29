# Tasks — Front Door Intake

## Backend
- [ ] Migrations for `intake_*` tables and views.
- [ ] Router `backend/src/api/intake.ts` with endpoints per api-spec.
- [ ] Services: `IntakeService` (triage, dedupe, conversion), `SLAService`.
- [ ] Hook step‑up middleware for convert/close on confidential/secret.
- [ ] Emit audit events and SLA events.

## Frontend
- [ ] Route `/_protected/front-door` and child routes for detail.
- [ ] EN/AR forms with validation and preview.
- [ ] Queue view with filters (unit, status, type, SLA risk).
- [ ] Conversion wizard flows.
- [ ] Surface AI suggestions (triage, dedupe) with confidence + accept/override.

## AI
- [ ] Classifier endpoint `/api/intake/ai/triage` using existing vector/embeddings service.
- [ ] Dedupe endpoint `/api/intake/ai/dedupe` (semantic + fuzzy).
- [ ] Contextualizer to fetch dossier summary for brief stub.

## QA / E2E
- [ ] Playwright: intake submit, triage accept, convert to engagement, SLA clocks visible.
- [ ] Contract tests for api-spec.

