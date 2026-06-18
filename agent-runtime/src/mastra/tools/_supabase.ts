import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * JWT keystone (AGENT-02 / D-10 / RESEARCH Shared Pattern A + Pattern 3).
 *
 * Build a per-request Supabase client scoped to the CALLER's JWT so RLS
 * (sensitivity_level <= clearance_level) enforces clearance under the user's own
 * identity. The runtime NEVER uses the service-role key — that would bypass RLS and
 * leak above-clearance content. ANON_KEY + the forwarded Bearer token is the only
 * path. The authorization header is delivered to the tool via
 * `context.requestContext.get('authorization')` (the spike-proven keystone path on
 * @mastra/core 1.43.0 — RequestContext, NOT runtimeContext).
 *
 * Short-lived per request: no session persistence, no token auto-refresh.
 */
export function createUserClient(authorization: string): SupabaseClient {
  return createClient(process.env.SUPABASE_URL ?? '', process.env.SUPABASE_ANON_KEY ?? '', {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

/**
 * Read the caller authorization header from the Mastra RequestContext. Tools assert
 * this is non-empty before any RPC (the #4465 gate the spike closed): an empty header
 * means the AG-UI bridge dropped the JWT, which must surface as an error, not a
 * silent service-role fallback.
 */
export function getAuthorization(requestContext: { get: (key: string) => unknown }): string {
  const auth = requestContext.get('authorization')
  return typeof auth === 'string' ? auth : ''
}
