# 016 — Guest Users & JML — Spec

Purpose: support guest access with stricter policies and implement Joiner–Mover–Leaver flows.

## Goals

- Invite guest with scoped access (view‑only to specific dossiers/engagements).
- JML automations: on role change/leave, revoke tokens, reassign ownership, audit.

## API

- `POST /api/admin/guests/invite` → email link; `DELETE /api/admin/guests/:id` (revoke).
- `POST /api/admin/jml/execute` (idempotent hook for sync from HRIS).

## RLS

- Separate role `guest`; policies limited to shared objects via share table.

## Acceptance

- Guest can only see explicitly shared items; JML script reassigns and locks correctly.
