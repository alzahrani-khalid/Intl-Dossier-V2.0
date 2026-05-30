---
id: 260530-dua
slug: dossier-unified-activity-auth-401
date: 2026-05-30
type: quick
status: complete
---

# Summary: Fix `dossier-unified-activity` edge function 401

## Outcome

Fixed the `401 "Invalid or expired token"` on the `dossier-unified-activity`
Supabase Edge Function. Verified live on staging (`zkrcjzdemdmwhearhfgg`):
**was 401, now 200**.

## Changes

`supabase/functions/dossier-unified-activity/index.ts` (2 lines):

1. `@supabase/supabase-js@2.39.3` → `@2` — align with working sibling functions.
2. `supabase.auth.getUser()` → `supabase.auth.getUser(token)` — validate the JWT
   explicitly instead of relying on the client lib threading the global
   `Authorization` header (the failure mode under the pinned 2.39.3 build).

Redeployed via Supabase MCP → **version 3 ACTIVE**, `verify_jwt: true` preserved.
Only `index.ts` changed in the deployed bundle (shared `cors.ts` unchanged).

## Verification (evidence)

- Authenticated test user against staging Auth → minted access token.
- `GET /functions/v1/dossier-unified-activity?dossier_id=<uuid>&limit=20` with
  that bearer token → **HTTP 200**, body
  `{"activities":[],"next_cursor":null,"has_more":false,...}`.
- Root cause confirmed by `get_edge_function`: deployed v2 matched the pre-fix
  repo code (bare `getUser()` + `@2.39.3`) — not a stale deploy.

## Follow-ups (filed, not done here)

- `work-item-dossiers/index.ts` shares the identical latent pattern
  (`@2.39.3` + bare `getUser()`) — fix if/when it surfaces a 401.
- Consider standardizing all edge functions on `@2` + `getUser(token)` and a
  shared auth helper to prevent recurrence.

## Notes

- Not caused by the droplet redeploy (edge functions live on Supabase infra).
- The `OverdueCommitments dossierType` console warning and the `sw.js` /
  `content.js` errors seen in the same console dump are unrelated (known
  tracked warning + browser-extension noise).
