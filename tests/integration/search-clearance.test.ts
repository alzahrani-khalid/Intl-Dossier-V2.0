/**
 * REMED-02: Clearance-gated semantic search RPC (Phase 68).
 *
 * Plan 68-03 creates `search_semantic_clearance_gated` as a SECURITY INVOKER RPC
 * that joins ai_embeddings(1024) -> dossiers under canonical clearance gating, so
 * retrieval honours the caller's RLS instead of leaking above-clearance content
 * (the SECURITY DEFINER leak in the legacy search_entities_semantic).
 *
 * The prosecdef catalog read goes through the `get_function_security(p_proname)`
 * helper RPC (PostgREST cannot read pg_catalog directly). Both the helper and the
 * gated RPC are created by plan 68-03, so this test starts RED (helper missing /
 * function missing) and flips GREEN after that migration is applied.
 */
import { describe, it, expect, beforeAll } from 'vitest'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

describe('REMED-02: search_semantic_clearance_gated is SECURITY INVOKER', () => {
  let supabaseAdmin: SupabaseClient

  beforeAll(() => {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return
    }
    supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  })

  it('exists and is SECURITY INVOKER (prosecdef = false)', async () => {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return
    }
    const { data, error } = await supabaseAdmin.rpc('get_function_security', {
      p_proname: 'search_semantic_clearance_gated',
    })

    // RED until plan 68-03: the get_function_security helper does not exist yet, so
    // PostgREST returns a "function not found" error.
    expect(
      error,
      `get_function_security helper missing (RED until plan 68-03): ${error?.message}`,
    ).toBeNull()

    const rows = (data ?? []) as Array<{ proname: string; prosecdef: boolean }>
    const fn = rows.find((r) => r.proname === 'search_semantic_clearance_gated')
    expect(
      fn,
      'search_semantic_clearance_gated does not exist yet (RED until plan 68-03 applies migration)',
    ).toBeDefined()
    expect(fn?.prosecdef, 'gated RPC must be SECURITY INVOKER (prosecdef=false)').toBe(false)
  })

  it.todo('low-clearance JWT returns 0 above-clearance semantic results (live UAT — plan 68-08)')
})
