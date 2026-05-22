---
name: edge-function-add
description: >-
  Use when adding or changing an Edge Function under supabase/functions/.
  Walks the gateway conventions — Zod validation, shared CORS helper, JWT
  verify via supabase.auth.getUser, MCP-only deploy.
paths: supabase/functions/**
---

# Adding a Supabase Edge Function

Activates for work in `supabase/functions/`. Follow these steps in order.

1. **Create the function directory** — `supabase/functions/<name>/index.ts`. Name in `kebab-case`.
2. **Handler signature:** `export default async (req: Request): Promise<Response> => { … }`. Deno runtime.
3. **Validate inputs with Zod BEFORE any work.** Parse the URL/query/body into a schema; reject malformed input with a 400 + helpful error envelope.
4. **CORS via the shared helper** in `supabase/functions/_shared/cors.ts`. Never inline `Access-Control-Allow-*` headers per-function.
5. **JWT verify via `supabase.auth.getUser(token)`** — never trust the JWT payload. Extract the token from `Authorization: Bearer …`, hand it to the SDK, get back the user (or a 401).
6. **Secrets via `Deno.env.get('NAME')`** with explicit null check. Missing secret → 500 with a server-side log; never expose env state in the response.
7. **Deploy via Supabase MCP** (`deploy_edge_function`). Local `supabase functions deploy` is for the platform team only.

Full worked example: [references/function-checklist.md](references/function-checklist.md).
