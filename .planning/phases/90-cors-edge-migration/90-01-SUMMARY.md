---
phase: 90-cors-edge-migration
plan: 01
subsystem: security
tags: [cors, allowed-origins, secret-verify, checkpoint, cors-01]

requires: []
provides:
  - CORS-01 gate satisfied — ALLOWED_ORIGINS verified present + correct; deploy checkpoints (90-32/33/34) unblocked

status: complete
released: operator (via overseer) 2026-07-13
---

# 90-01 — CORS-01 secret-verify gate (satisfied)

> Manual/checkpoint task (`autonomous: false`). Resolved by the operator via the overseer —
> NOT self-approved (Supabase MCP exposes no secret-read tool; the deploy-target/prod question
> was operator-knowledge). Read-only verification; no secret written by this task, no deploy.

## Verified facts (operator-supplied, 2026-07-13)

- **Deploy target = `zkrcjzdemdmwhearhfgg` (Intl-Dossier) ONLY.** There is **no separate prod
  Supabase project** — the production DigitalOcean droplet uses this same project. So the roadmap's
  "staging AND prod" collapses to this single project for edge-function CORS purposes.
- **`ALLOWED_ORIGINS` is PRESENT and correct** — re-set by the overseer to the known origin
  allow-list (verified `updated_at` 2026-07-13T09:54:56Z):
  ```
  http://138.197.195.242,http://localhost,http://localhost:5173,http://127.0.0.1,http://127.0.0.1:5173
  ```
  Comma-separated, real app origins (prod droplet + local dev), **no `*` wildcard entry**, no stray
  whitespace. `_shared/cors.ts` `getAllowedOrigins()` will therefore return this real allow-list.

## Gate outcome

CORS-01 GREEN → the batch deploy checkpoints (90-32/33/34) are unblocked. **Binding smoke assertions
for every deploy batch** (operator directive): (1) an **evil/unknown origin is REJECTED** (no
`Access-Control-Allow-Origin` echo, or `null`); (2) the **droplet origin `http://138.197.195.242`
is ALLOWED** (echoed back); (3) **no `*` wildcard** on any migrated function's CORS response.

## Requirements

CORS-01 — complete.
