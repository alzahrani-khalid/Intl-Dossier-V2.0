---
phase: 90-cors-edge-migration
plan: 01
requirement: CORS-01
status: complete
completed: 2026-07-13
---

# Phase 90 Plan 01: CORS deploy-gate verification

## Result

**PASS — the deploy gate is OPEN.** `ALLOWED_ORIGINS` is present and correct for both staging and
production before any CORS migration batch is deployed.

## Environment verification

| Environment | Supabase project                        | `ALLOWED_ORIGINS` | Verification                                                                                                                                                             |
| ----------- | --------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Staging     | `zkrcjzdemdmwhearhfgg` (`Intl-Dossier`) | **PRESENT**       | Read-only secret listing returned the named secret (updated `2026-07-13T09:54:56.179Z`).                                                                                 |
| Production  | `zkrcjzdemdmwhearhfgg` (shared backend) | **PRESENT**       | The live app at `http://138.197.195.242` returned HTTP 200 and its current JS bundle references this same project, so production consumes the same project-level secret. |

The repository's recorded topology says staging doubles as the production backend, and the live
production bundle confirms that topology. There is therefore one shared Supabase secret scope, not
a second production project secret to inspect.

## Value verification

The effective origin list was verified through the already-migrated `reactivate-user` preflight
path, which calls `_shared/cors.ts`:

- `Origin: http://138.197.195.242` -> HTTP 204 with
  `Access-Control-Allow-Origin: http://138.197.195.242`.
- `Origin: http://localhost:5173` -> HTTP 204 with that exact allowed origin.
- `Origin: http://127.0.0.1:5173` -> HTTP 204 with that exact allowed origin.
- `Origin: *` -> HTTP 204 with `Access-Control-Allow-Origin: null` and OPTIONS-only methods.

This confirms the secret is a comma-parsed allow-list containing the real production droplet plus
development web origins (remaining entries redacted), and contains no `*` wildcard entry. The
documented HTTPS hostname candidates are not live DNS hosts and were rejected by the helper; the
current production web origin is the bare droplet origin above.

## Read-only compliance

Verification used only Supabase project/branch listing, `supabase secrets list`, HTTP HEAD, and
HTTP OPTIONS requests. No secret was set, updated, rotated, or removed. No Edge Function was
deployed.

## Gate decision

CORS-01 is satisfied. Deploy checkpoints 90-32, 90-33, and 90-34 may proceed.
