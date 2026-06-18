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

/**
 * Enable pgvector 0.8 iterative scans on the per-request client so the dense HNSW scan
 * inside `hybrid_rag_search` keeps finding RLS-passing rows instead of stopping early
 * (Pitfall 4 — RLS post-filter collapsing recall for high-clearance callers on
 * selective filters). RESEARCH L455: "set inside the RPC via set_config or session GUC."
 *
 * This is a RECALL optimization, not a clearance gate — RLS remains the correctness
 * floor regardless of whether the GUC takes effect. It is therefore best-effort: under
 * PostgREST connection pooling a session-level GUC may land on a different backend than
 * the subsequent rpc() call, so a missing `set_config` helper or a pooling miss must
 * NOT fail the search. The durable fix is to fold
 * `set_config('hnsw.iterative_scan','relaxed_order',true)` into the hybrid_rag_search
 * RPC body in a follow-up migration (the executor lacks the Supabase MCP to alter it
 * here); tracked in the 72-06 SUMMARY.
 */
export async function setIterativeScanGucs(sb: SupabaseClient): Promise<void> {
  try {
    await sb.rpc('set_config', {
      setting_name: 'hnsw.iterative_scan',
      new_value: 'relaxed_order',
      is_local: false,
    })
    await sb.rpc('set_config', {
      setting_name: 'hnsw.max_scan_tuples',
      new_value: '20000',
      is_local: false,
    })
  } catch {
    // Best-effort: the GUC only tunes recall; RLS is the floor. Never block the search.
  }
}
