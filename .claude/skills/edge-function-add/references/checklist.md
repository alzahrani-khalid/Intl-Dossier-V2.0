# Edge function checklist

Final pass before declaring a new `supabase/functions/<name>/index.ts` done.

## Structure

- [ ] Directory is `supabase/functions/<name>/` containing only `index.ts`.
- [ ] Imports are inline full URLs (no per-function `deno.json` / import map added).
- [ ] Started from the `tasks-get/index.ts` shape (`jsr:@supabase/supabase-js@2`,
      `Deno.serve`, `getCorsHeaders` / `handleCorsPreflightRequest`).

## CORS

- [ ] Uses `getCorsHeaders(req)` and `handleCorsPreflightRequest(req)` from
      `_shared/cors.ts` — NOT the deprecated wildcard `corsHeaders`.
- [ ] `OPTIONS` is handled first and returns the preflight response.
- [ ] CORS headers are merged into every response (success and error paths).
- [ ] `ALLOWED_ORIGINS` secret is set for the target environment
      (`supabase secrets set ALLOWED_ORIGINS=...`), or you accept localhost-only.

## Auth

- [ ] Reads the `Authorization` header; 401 if missing.
- [ ] Either injects the header into `createClient(..., { global: { headers } })`
      then calls `getUser()`, OR passes the token explicitly via `getUser(token)`
      / `_shared/auth.ts` `validateJWT`. Never a bare `getUser()` on a plain anon
      client (401 on valid tokens with older supabase-js).
- [ ] Service-role client (`createServiceClient`) used only where RLS bypass is
      intended; org/clearance scoping enforced in code if so.
- [ ] `verify_jwt` entry added to `config.toml` only if the function must be public.

## Data + RPCs

- [ ] Queries run as the user (JWT-scoped client) so RLS applies; tenant/clearance
      filters are not duplicated incorrectly.
- [ ] Any companion `.rpc(...)` whose SQL function `RETURNS TABLE (... text ...)`
      while selecting a `varchar` column (e.g. `auth.users.email`) casts `::text`
      (avoids 42804). New SQL functions go through the migration-safety skill.

## Conventions + deploy

- [ ] Bilingual fields `*_en` / `*_ar`; source-table column carve-outs respected
      (tasks `sla_deadline`/`workflow_stage`, commitments `due_date`/`owner_*`,
      intake `status`/`urgency`).
- [ ] No secrets logged; sentence-case copy; no emoji in user-visible strings.
- [ ] Deployed via `supabase functions deploy <name> --project-ref
    zkrcjzdemdmwhearhfgg` (CLI) or `mcp__supabase__deploy_edge_function` — not
      `git push`.
- [ ] New secrets the function reads are set; cron wiring added per
      `supabase/CRON_SETUP.md` if scheduled.
- [ ] Smoke-tested against the deployed function with a real bearer token
      (browser origin too, to confirm CORS).
