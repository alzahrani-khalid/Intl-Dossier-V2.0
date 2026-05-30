---
id: 260530-dua
slug: dossier-unified-activity-auth-401
date: 2026-05-30
type: quick
status: complete
---

# Summary: Fix edge-function auth 401 (`getUser` pattern)

## Outcome

Fixed the `401 "Invalid or expired token"` failure mode in two Supabase Edge
Functions on staging (`zkrcjzdemdmwhearhfgg`):

- **`dossier-unified-activity`** — was actively breaking the dossier-overview
  activity-timeline panel. **Verified: was 401, now 200.**
- **`work-item-dossiers`** — identical latent pattern, fixed pre-emptively in the
  same PR. **Verified: returns 200** (`{"links":[],"primary_dossier":null}`).

## Changes (same 2-line fix in each `index.ts`)

1. `@supabase/supabase-js@2.39.3` → `@2` — align with working sibling functions.
2. `supabase.auth.getUser()` → `supabase.auth.getUser(token)` — validate the JWT
   explicitly instead of relying on the client lib threading the global
   `Authorization` header (the failure mode under the pinned 2.39.3 build). The
   global header is kept for RLS on subsequent queries.

Deno semicolon style preserved; request/response contracts unchanged.

## Deploys

- `dossier-unified-activity` → Supabase MCP `deploy_edge_function`, **version 3
  ACTIVE**, `verify_jwt: true`. Only `index.ts` changed in the bundle.
- `work-item-dossiers` → Supabase CLI `functions deploy` (script 62.78kB), JWT
  verification on.

## Verification (evidence)

Authenticated the test user against staging Auth, then called each deployed
function with the minted bearer token:

- `dossier-unified-activity?dossier_id=<uuid>&limit=20` → **200**,
  `{"activities":[],"next_cursor":null,"has_more":false,...}` (was 401).
- `work-item-dossiers?work_item_type=task&work_item_id=<uuid>` → **200**,
  `{"links":[],"primary_dossier":null}`.

Root cause for `dossier-unified-activity` confirmed via `get_edge_function`:
deployed v2 matched the pre-fix repo code (bare `getUser()` + `@2.39.3`) — not a
stale deploy. `work-item-dossiers` shared the identical code, fixed by analogy
and verified working post-deploy.

## Follow-ups (optional, not done)

- Six other edge functions reconstruct `Bearer ${token}` but validate via a
  different path (not bare `getUser()`); not affected, no action needed.
- Consider standardizing all edge functions on `@2` + `getUser(token)` via a
  shared auth helper to prevent recurrence.

## Notes

- Not caused by the droplet redeploy — edge functions live on Supabase infra and
  drift independently.
- The `OverdueCommitments dossierType` console warning and the `sw.js` /
  `content.js` errors in the original console dump are unrelated (known tracked
  warning + browser-extension noise).
