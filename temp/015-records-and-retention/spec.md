# 015 — Records & Retention — Spec

Purpose: apply class‑based retention across briefs, minutes, positions, MoUs; uniform archive and disposition events with audit.

## Goals

- Ensure every content class has `retention_category`, `retention_until`, and `archived_at`.
- Nightly job to transition to archive and emit disposition events when due.
- Records officer UI to view upcoming dispositions and hold items.

## UX

- Records dashboard: upcoming disposals, holds, exceptions; filters by class.

## API

- `GET /api/records/schedule`, `POST /api/records/hold`, `POST /api/records/release`.

## Acceptance

- Retention metadata present on briefs/minutes/positions/MoUs; job archives due items; holds respected.
