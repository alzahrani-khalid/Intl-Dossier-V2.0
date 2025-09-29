# Tasks — Dossiers Hub

## Backend

- [ ] Add migrations for `dossiers` (+ RLS) and `dossier_links` (or confirm existing).
- [ ] Implement `backend/src/api/dossiers.ts` with CRUD + timeline aggregation.
- [ ] Implement `DossierService` (hydrate timeline, stats, relations).
- [ ] Wire `BriefService` for `/briefs` action.

## Frontend

- [ ] Routes `/_protected/dossiers` and `/_protected/dossiers/:id`.
- [ ] Components for header, stats, timeline, actions; i18n toggles.
- [ ] “Add to Dossier” entry points from Events/MoUs/Positions lists.

## AI

- [ ] Executive summary generation (EN/AR) with explicit prompt schema.
- [ ] Next‑best‑action suggestions endpoint.

## Tests

- [ ] E2E: create dossier, see timeline, generate brief, check health.
