---
id: 260530-dua
slug: dossier-unified-activity-auth-401
date: 2026-05-30
type: quick
status: complete
---

# Quick Task: Fix `dossier-unified-activity` edge function 401

## Problem

The `dossier-unified-activity` Supabase Edge Function (staging
`zkrcjzdemdmwhearhfgg`) returned `401 "Invalid or expired token"`, breaking the
activity-timeline panel on the dossier overview page. Surfaced in the browser
console during a post-deploy smoke test:

```
GET .../functions/v1/dossier-unified-activity?dossier_id=...&limit=20 401 (Unauthorized)
Error fetching activity timeline: UnifiedActivityAPIError: Invalid or expired token
```

## Root cause (evidence-based)

- **Not an expired session, not the droplet redeploy.** Live staging
  edge-function logs showed the _same_ user token getting `200` on sibling
  authed functions (`activity-feed`, `tasks-get`, `engagement-dossiers`,
  `persons`, `calendar-get`) at the same time. Edge functions are not deployed
  by the droplet, and this function was not among the 52 commits redeployed.
- **Function-specific auth handling.** The deployed `dossier-unified-activity`
  (version 2) pinned `@supabase/supabase-js@2.39.3` and called
  `supabase.auth.getUser()` with **no argument**, relying on the client library
  threading the global `Authorization` header. Under the pinned 2.39.3 build
  this rejected tokens that the working siblings (on `@2`) accept. Confirmed the
  deployed bundle matched the pre-fix repo code — i.e. the code itself was the
  cause, not a stale deploy.

## Fix (surgical, `supabase/functions/dossier-unified-activity/index.ts`)

1. Bump the import from `@supabase/supabase-js@2.39.3` → `@2` (match working
   siblings).
2. Pass the JWT explicitly: `supabase.auth.getUser(token)` instead of bare
   `getUser()`, so validation does not depend on global-header threading.

No request/response contract change; file keeps its existing Deno semicolon
style. `verify_jwt: true` preserved on redeploy.

## Same-bug-class scan (follow-up, not fixed here)

`work-item-dossiers/index.ts` shares the identical latent pattern
(`@2.39.3` + bare `getUser()`); six others reconstruct `Bearer ${token}` but do
not use a bare `getUser()`. None are confirmed failing in logs. Listed as a
follow-up rather than scope-creeping this fix.

## Verification

Authenticated the test user against staging Auth, then called the deployed
function with the minted bearer token:

- Before: `401 Invalid or expired token`
- After (version 3): **`200 OK`**, body
  `{"activities":[],"next_cursor":null,"has_more":false,...}`

## Out of scope

- No UI changes. No source-table column renames. Droplet (frontend/backend)
  untouched.
