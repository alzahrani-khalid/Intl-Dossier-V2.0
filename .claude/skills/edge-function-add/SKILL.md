---
name: edge-function-add
description: Add a new Supabase Edge Function to the Intl-Dossier V2.0 repo. Use when creating a function under supabase/functions/ — covers the directory layout, the supabase-js @2 + getUser(token) auth pattern, origin-validated CORS via the ALLOWED_ORIGINS secret, deploy via Supabase CLI/MCP, and the RETURNS TABLE varchar/text 42804 cast gotcha for companion RPCs.
---

# Add a Supabase Edge Function (Intl-Dossier V2.0)

Edge Functions in this repo are Deno + TypeScript handlers under
`supabase/functions/<name>/index.ts`. They run against the staging Supabase
project `zkrcjzdemdmwhearhfgg` (region eu-west-2). They are the app's primary
data path from the frontend, so RLS — not service-role — is the default security
posture (a function builds a JWT-scoped client and lets RLS enforce).

Read this whole file before creating a function. Use
`references/checklist.md` as the final pass.

## 1. Layout

- One directory per function, containing **only `index.ts`**. No per-function
  `deno.json`, `package.json`, or import map exists in this repo — dependencies
  are imported inline as full URLs.
- Shared helpers live in `supabase/functions/_shared/`. The two you almost always
  want: `cors.ts` (CORS) and `auth.ts` (`validateJWT`, `createUserClient`,
  `createServiceClient`). Others: `logger.ts`, `rate-limit.ts`,
  `validation-schemas.ts`, `onprem-llm.ts`, `ai-interaction-logger.ts`.

## 2. Template to copy

Copy the current-convention shape from
`supabase/functions/tasks-get/index.ts`. It uses `jsr:@supabase/supabase-js@2`,
the origin-validating CORS helpers, `Deno.serve`, and a header-injected
JWT-scoped client. Minimal skeleton:

```ts
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  // Preflight first.
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req)
  }

  // Pre-merge CORS headers into every response (origin-validated).
  const headers = { ...getCorsHeaders(req), 'Content-Type': 'application/json' }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers,
      })
    }

    // JWT-scoped client: forward the caller's token so RLS applies.
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } },
    )

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers })
    }

    // ...feature logic; queries run as the user, RLS enforces tenant/clearance...

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers })
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers,
    })
  }
})
```

## 3. Auth: the `@2` + `getUser(token)` gotcha

Two valid auth shapes exist in the repo. Pick one and do not mix them:

- **Header-injected client** (used by `tasks-get`): pass the `Authorization`
  header into `createClient(..., { global: { headers } })`, then call
  `getUser()` with **no argument** — the client reads the token from the injected
  header. RLS-scoped queries work because the token rides on every request.
- **Explicit token** (the `_shared/auth.ts` `validateJWT` helper): strip
  `Bearer ` and call `getUser(token)` with the token **passed explicitly**.

Do NOT create a plain anon client and call bare `getUser()` without either
injecting the header or passing the token. On older supabase-js (`@2.39.3`) a
bare `getUser()` returns **401 on valid tokens** — that was a real bug here. If
you pin an older version, prefer `_shared/auth.ts`'s `validateJWT` /
`createUserClient`, both of which pass the token correctly.

Use the service-role client (`createServiceClient()` from `_shared/auth.ts`, or a
`SUPABASE_SERVICE_ROLE_KEY` client) **only** when you deliberately need to bypass
RLS (e.g. cron-triggered batch jobs). It is the exception, not the default — and
when you use it, you must enforce org/clearance scoping in code yourself.

## 4. CORS: use the origin-validated helpers, not the wildcard

`_shared/cors.ts` exports `getCorsHeaders(request)` and
`handleCorsPreflightRequest(request)`. They read the **`ALLOWED_ORIGINS`**
Supabase secret (comma-separated) and reflect the request origin only if it is
allowed; unknown origins get `Access-Control-Allow-Origin: null`. In
`ENVIRONMENT === 'development'` all origins pass.

- Use `getCorsHeaders(req)` / `handleCorsPreflightRequest(req)` in new functions.
- Do NOT use the deprecated static `corsHeaders` export (wildcard `*`) — much of
  the older tree still imports it, but new code should not.
- **`ALLOWED_ORIGINS` lives as a Supabase secret, not in the repo.** If it is
  unset in a deployed environment, every non-localhost origin is rejected
  (`ACAO: null`) and the function "works" locally but fails in the browser. Set it
  with `supabase secrets set ALLOWED_ORIGINS=...` per environment.

## 5. JWT verification at the gateway (`config.toml`)

`supabase/config.toml` `[functions]` sets per-function `verify_jwt`. Only three
functions are listed; **every unlisted function defaults to `verify_jwt = true`**
(the platform default). That means the gateway already rejects unauthenticated
requests for a normal function — your in-handler `getUser()` check is the second
layer that also gives you the user id. If your function must be callable
unauthenticated (a public/health endpoint), add an explicit
`"<name>" = { verify_jwt = false }` entry, mirroring `health-check`.

## 6. Companion RPCs: the RETURNS TABLE varchar/text 42804 cast

If your function calls a SQL function via `.rpc(...)` that you also add in a
migration, and that function `RETURNS TABLE (... col text ...)` while selecting a
`varchar` column — most commonly `auth.users.email`, which is `varchar(255)` —
Postgres throws **42804** (`structure of query does not match function result
type ... character varying(255) does not match expected type text`) at
`RETURN QUERY` time. It compiles fine and **mocked unit tests will not catch it**;
it only fails against the live DB.

Fix: cast the column to `::text` in the SELECT, e.g. `u.email::text AS
user_email`. Real precedent:
`supabase/migrations/20260531120000_fix_get_team_workload_email_text_cast.sql`.
See the migration-safety skill for the deeper RPC + RLS conventions.

## 7. Deploy

Functions deploy via the **Supabase CLI** (or the `mcp__supabase__deploy_edge_function`
MCP tool) — not `git push`. Migrations go through the MCP; functions go through
the CLI/MCP.

```bash
# Single function (staging ref shown):
supabase functions deploy <name> --project-ref zkrcjzdemdmwhearhfgg
```

Prerequisites: `supabase` CLI installed, `supabase login` done. `supabase/deploy-functions.sh`
is an example deploy script (scoped to one feature's function list) and also
documents which secrets must exist in Dashboard → Edge Functions → Secrets.

After deploy, set any new secrets the function reads (`supabase secrets set
KEY=value`) — including `ALLOWED_ORIGINS` if this environment lacks it. If the
function is meant to run on a schedule, wire it via pg_cron per
`supabase/CRON_SETUP.md`.

## House conventions

Follow the root `/CLAUDE.md`: bilingual fields are `*_en` / `*_ar`; work-item
terminology is fixed (`assignee_id`, `deadline`, `priority` = low/medium/high/
urgent, etc.) — but respect the source-table carve-outs (commitments use
`due_date`/`owner_*`, tasks use `sla_deadline`/`workflow_stage`, intake tickets
have their own `status`/`urgency`). No `console.log` of secrets; sentence-case
copy; no emoji in user-visible strings.
