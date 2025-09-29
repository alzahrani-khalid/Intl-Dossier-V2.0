# 009 — Dossiers Hub — Spec

Purpose: elevate Dossier to a first‑class feature with CRUD, timeline, and a hub view aggregating engagements, positions, MoUs, signals, commitments, and files.

## Goals
- CRUD and search for dossiers (country/org/forum/theme).
- Timeline of interactions and related artifacts with filters.
- Executive summary, owners, sensitivity, review cadence; bilingual.
- One‑click actions: generate brief, add engagement, log intelligence, create task.

## UX
- Dossier list with facets (type, status, sensitivity, owner, tags).
- Dossier detail: header (EN/AR), summary, stats, tabs: Timeline, Positions, MoUs, Commitments, Files, Intelligence.
- Right rail: key contacts, open items, relationship health.

## UI (frontend)
- Route: `/_protected/dossiers` and `/_protected/dossiers/:id`
- Components: `DossierCard`, `DossierHeader`, `DossierTimeline`, `DossierStats`, `DossierActions`.

## API
- `GET /api/dossiers` (filters, pagination)
- `POST /api/dossiers` (create)
- `GET /api/dossiers/:id` (with `include=timeline,stats,relations`)
- `PUT /api/dossiers/:id` (update)
- `DELETE /api/dossiers/:id` (archive)
- `GET /api/dossiers/:id/summary` (exec summary)
- `POST /api/dossiers/:id/briefs` (generate brief)

## Services
- `DossierService`: aggregates: events, positions, mous, commitments, documents, signals.
- Uses existing `RelationshipHealthService` for health score.
- Integrates `BriefService` for summary/briefs.

## AI
- Summary generator (both languages) based on sections + recent activity.
- Next‑best‑action suggestions (e.g., follow‑up commitment, renew MoU, schedule engagement).
- Auto‑tagging and sensitivity hints.

## Acceptance
- Dossier hub loads < 1.5s with timeline of last 90 days.
- One‑click brief creates bilingual brief attached to dossier.
- Health score and open commitments visible; filters persist.

