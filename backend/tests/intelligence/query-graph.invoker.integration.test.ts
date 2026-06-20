/**
 * GRAPH-04 — query_graph SECURITY INVOKER direct-invocation test (RED until 71-02/03).
 *
 * The agent-tool contract (D-06): `query_graph` is verified by DIRECT RPC
 * invocation under the caller's JWT — exactly how Mastra will reach it in P72.
 * Invoked under a USER-CONTEXT (anon-key) client, NOT service-role, so RLS /
 * the RPC's inline clearance gate is live. A low-clearance caller must see ZERO
 * above-clearance nodes; a high-clearance caller MUST see the same
 * above-clearance node — proving the gate is real enforcement, not merely empty
 * data on staging.
 *
 * Mechanism mirrors the clearance suite: one real test user signed in via the
 * anon key, clearance flipped via service-role between runs and restored after.
 * The RF-7 fixture's forum is sensitivity-3, so it is the above-clearance node
 * for a clearance-1 caller and within-clearance for a clearance-3 caller.
 *
 * EXPECTED RED NOW: `query_graph` does not exist → `.rpc('query_graph')` errors
 * under the caller client → assertions fail. GREEN after 71-02 + 71-03.
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import {
  createServiceRoleClient,
  restoreAnalyticGraphFixture,
  seedAnalyticGraphFixture,
  type AnalyticGraphFixtureIds,
} from './fixtures/analytic-graph-seed'

interface QueryGraphNode {
  id?: string
  sensitivity_level?: number
}

interface QueryGraphResult {
  nodes?: QueryGraphNode[]
}

/** The forum fixture is seeded at sensitivity_level 3 — the above-clearance marker. */
const ABOVE_CLEARANCE_LEVEL = 3
const LOW_CLEARANCE = 1

function requireEnv(name: string): string {
  const value = process.env[name]
  if (value == null || value === '') {
    throw new Error(`query-graph.invoker: ${name} must be set (populate backend/.env.test)`)
  }
  return value
}

async function setClearance(service: SupabaseClient, userId: string, level: number): Promise<void> {
  const { error } = await service
    .from('profiles')
    .update({ clearance_level: level })
    .eq('user_id', userId)
  if (error != null) {
    throw new Error(`query-graph.invoker: failed to set clearance_level=${level}: ${error.message}`)
  }
}

describe('query_graph GRAPH-04 — SECURITY INVOKER caller-JWT enforcement', () => {
  let service: SupabaseClient
  let callerClient: SupabaseClient
  let ids: AnalyticGraphFixtureIds
  let testUserId: string
  let originalClearance: number | null = null

  beforeAll(async () => {
    service = createServiceRoleClient()
    ids = await seedAnalyticGraphFixture(service)

    const url = requireEnv('SUPABASE_URL')
    const anonKey = requireEnv('SUPABASE_ANON_KEY')
    const email = requireEnv('TEST_USER_EMAIL')
    const password = requireEnv('TEST_USER_PASSWORD')

    callerClient = createClient(url, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    const { data: signIn, error: signInError } = await callerClient.auth.signInWithPassword({
      email,
      password,
    })
    if (signInError != null || signIn.user == null) {
      throw new Error(`query-graph.invoker: sign-in failed: ${signInError?.message ?? 'no user'}`)
    }
    testUserId = signIn.user.id

    const { data: profile } = await service
      .from('profiles')
      .select('clearance_level')
      .eq('user_id', testUserId)
      .maybeSingle()
    originalClearance = (profile as { clearance_level?: number } | null)?.clearance_level ?? null
  })

  afterAll(async () => {
    if (testUserId != null && originalClearance != null) {
      await setClearance(service, testUserId, originalClearance)
    }
    if (ids != null) {
      await restoreAnalyticGraphFixture(service, ids)
    }
  })

  it('returns ZERO above-clearance nodes when invoked directly under a low-clearance JWT', async () => {
    await setClearance(service, testUserId, LOW_CLEARANCE)

    const { data, error } = await callerClient.rpc('query_graph', {
      p_query_type: 'forum_membership',
      p_entity_id: ids.anchorDossierId,
    })

    expect(error).toBeNull()
    const result = data as QueryGraphResult
    const nodes = Array.isArray(result.nodes) ? result.nodes : []

    // No returned node may carry a sensitivity above the caller's clearance.
    for (const node of nodes) {
      if (typeof node.sensitivity_level === 'number') {
        expect(node.sensitivity_level).toBeLessThanOrEqual(LOW_CLEARANCE)
      }
    }
    // The sensitivity-3 forum specifically must be absent for a clearance-1 caller.
    expect(nodes.map((node) => node.id)).not.toContain(ids.forumDossierId)
  })

  it('returns the above-clearance node under a high-clearance JWT (gate is real, not empty data)', async () => {
    await setClearance(service, testUserId, ABOVE_CLEARANCE_LEVEL)

    const { data, error } = await callerClient.rpc('query_graph', {
      p_query_type: 'forum_membership',
      p_entity_id: ids.anchorDossierId,
    })

    expect(error).toBeNull()
    const result = data as QueryGraphResult
    const nodes = Array.isArray(result.nodes) ? result.nodes : []

    expect(nodes.map((node) => node.id)).toContain(ids.forumDossierId)
  })
})
