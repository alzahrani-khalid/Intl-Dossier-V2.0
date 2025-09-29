# 011 — Positions & Talking Points Lifecycle — Spec

Purpose: provide end‑to‑end drafting (bilingual), approvals, versioning, publication, and consistency checks.

## Goals

- CRUD for positions with provenance and bilingual content.
- Approval chains with status transitions and step‑up on approve.
- Versioning with compare and supersede; publish for internal audiences.
- Integrate existing consistency analysis endpoints.

## UX

- List with facets (thematic, status, last updated, owner).
- Draft editor: EN/AR side‑by‑side, rationale, alignment, attachments.
- Approval view: diffs, comments, sign‑off.
- Consistency panel: conflicts with suggested resolutions.

## UI

- Routes: `/_protected/positions`, `/_protected/positions/:id`.
- Components: `PositionEditor`, `VersionDiff`, `ApprovalChain`, `ConsistencyPanel`.

## API

- `GET/POST /api/positions` (CRUD)
- `PUT /api/positions/:id/submit` (for review)
- `PUT /api/positions/:id/approve` (requires step‑up)
- `PUT /api/positions/:id/publish`
- `GET /api/positions/:id/versions`
- Consistency endpoints exist; add `PUT /api/positions/consistency/:id/reconcile` usage in UI.

## AI

- Drafting assistant: initial bilingual text with citations.
- Translator with terminology memory; strength/stance calibration.
- Contradiction/ambiguity detection (feeds PositionConsistencyService).

## Acceptance

- Create → submit → approve → publish flow; versions tracked; step‑up enforced on approve.
- Consistency conflicts surfaced and reconciled; score updated.
