---
phase: 90-cors-edge-migration
plan: 32
subsystem: security
tags: [cors, deploy, staging, smoke, cors-02, batch-a]
status: complete
released: orchestrator 2026-07-13
---

# 90-32 — Batch A deploy + CORS smoke (Group-A, 170 functions)

> Orchestrator-executed checkpoint (workers can't deploy). Deployed the migrated Group-A code
> from a detached worktree at run HEAD `f0d1cf0d` (all migrations merged) via the Supabase CLI.

## Deploy

- **170 / 170 Group-A functions deployed** to staging `zkrcjzdemdmwhearhfgg` — zero failures.
- Method: `supabase functions deploy <fn> --project-ref zkrcjzdemdmwhearhfgg --use-api`
  (server-side bundle, no Docker), one function at a time for robustness; each uploads
  `index.ts` + the shared `_shared/cors.ts`. Log: `deployA_final.log` (170 OK).
- Precondition CORS-01 (90-01) green — `ALLOWED_ORIGINS` verified — before deploy.

## Smoke (live, staging) — origin validation confirmed

OPTIONS preflight against representative functions:

| Function | Allowed origin `http://138.197.195.242` | Evil origin `https://evil.example` |
|---|---|---|
| access-review-detail | 204, `ACAO: http://138.197.195.242` (echoed) | `ACAO: null` |
| advanced-search | 204, echoed | `ACAO: null` |
| after-actions-approve-edit | 204, echoed | `ACAO: null` |
| watchlist | echoed | `ACAO: null` |
| word-assistant | echoed | `ACAO: null` |

**Allowed origin echoed (never `*`, never `null`); disallowed origin → `null`.** No functional
regression from allowed origins. CORS-02 (Group-A) verified live.

## Requirements

CORS-02 (Batch A) — complete. Batches B (90-33) + C (90-34) follow.
