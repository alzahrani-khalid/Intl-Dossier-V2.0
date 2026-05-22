# Edge Function — worked example

```ts
// supabase/functions/example/index.ts
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const Body = z.object({
  dossierId: z.string().uuid(),
  payload: z.record(z.unknown()),
})

export default async (req: Request): Promise<Response> => {
  // 1. CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // 2. Auth — verify with the SDK, do not trust the payload
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return json({ error: 'missing_token' }, 401)
  }
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authHeader } },
  })
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) {
    return json({ error: 'invalid_token' }, 401)
  }

  // 3. Validate body
  let parsed: z.infer<typeof Body>
  try {
    parsed = Body.parse(await req.json())
  } catch (e) {
    return json({ error: 'validation_failed', details: e.issues }, 400)
  }

  // 4. Business logic (orchestrate; don't put DB queries inline if there's a domain layer)

  // 5. Response
  return json({ ok: true, dossierId: parsed.dossierId }, 200)
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
```

## Deploy

Via the Supabase MCP in your Claude Code session:

```
mcp__plugin_supabase_supabase__deploy_edge_function({
  project_id: "zkrcjzdemdmwhearhfgg",
  function_name: "example",
  source: <contents of index.ts>,
});
```

## Common mistakes

- **Inlining CORS headers per-function** — breaks consistency, easy to drop one.
- **Reading `Deno.env.get(...)` without null-check** — runtime crash in prod that maps to a generic 500.
- **Returning a body without `Content-Type: application/json`** — some clients treat the response as plain text.
- **Catching `userError` but proceeding anyway** — auth bypass; never do this.
