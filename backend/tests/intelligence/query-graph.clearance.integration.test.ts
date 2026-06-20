/**
 * GRAPH-03 — clearance-reduction dual-account integration test (RED until 71-02/03).
 *
 * Proves the analytic graph is clearance-gated by construction: the IDENTICAL
 * query, run by a low-clearance caller and a high-clearance caller, returns
 * STRICTLY FEWER nodes/edges for the low-clearance caller — and NOTHING in the
 * payload reveals that anything was withheld (indistinguishable-empty,
 * 71-UI-SPEC "Clearance-reduction copy contract").
 *
 * Dual-account mechanism (the plan's sanctioned path): a single real test user
 * (TEST_USER_EMAIL) is signed in via the ANON key so `query_graph` runs under a
 * genuine caller JWT (auth.uid() resolves, clearance read from
 * profiles.clearance_level). Service-role then TEMPORARILY sets that user's
 * clearance_level to 1, the query is captured, clearance is raised to 4, the
 * query is re-captured, and the original clearance is RESTORED in afterAll.
 * Counts must strictly increase between the two runs because the RF-7 fixture
 * hangs a sensitivity-3 forum + sensitivity-4 engagement off the anchor.
 *
 * EXPECTED RED NOW: `query_graph` does not exist → both runs error → the
 * strictly-increasing assertion fails. GREEN after 71-02 RPC + 71-03 apply.
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import {
  createServiceRoleClient,
  restoreAnalyticGraphFixture,
  seedAnalyticGraphFixture,
  type AnalyticGraphFixtureIds,
} from './fixtures/analytic-graph-seed'

interface QueryGraphResult {
  query_type?: string
  nodes?: Array<Record<string, unknown>>
  edges?: unknown[]
  stats?: Record<string, unknown>
}

/** Total node + edge count — the clearance-reduction signal. */
function countNodesAndEdges(result: QueryGraphResult | null): number {
  const nodes = Array.isArray(result?.nodes) ? result!.nodes.length : 0
  const edges = Array.isArray(result?.edges) ? result!.edges.length : 0
  return nodes + edges
}

function requireEnv(name: string): string {
  const value = process.env[name]
  if (value == null || value === '') {
    throw new Error(`query-graph.clearance: ${name} must be set (populate backend/.env.test)`)
  }
  return value
}

async function setClearance(service: SupabaseClient, userId: string, level: number): Promise<void> {
  const { error } = await service
    .from('profiles')
    .update({ clearance_level: level })
    .eq('user_id', userId)
  if (error != null) {
    throw new Error(
      `query-graph.clearance: failed to set clearance_level=${level}: ${error.message}`,
    )
  }
}

describe('query_graph GRAPH-03 — clearance reduction (strictly increasing counts)', () => {
  let service: SupabaseClient
  let callerClient: SupabaseClient
  let ids: AnalyticGraphFixtureIds
  let testUserId: string
  let originalClearance: number | null = null

  beforeAll(async () => {
    service = createServiceRoleClient()
    ids = await seedAnalyticGraphFixture(service)

    // Sign in the real test user via the ANON key so query_graph runs under a
    // genuine caller JWT (auth.uid() populated, clearance enforced by the RPC).
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
      throw new Error(`query-graph.clearance: sign-in failed: ${signInError?.message ?? 'no user'}`)
    }
    testUserId = signIn.user.id

    // Capture the user's existing clearance so afterAll can restore it exactly.
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

  it('returns strictly more nodes/edges to a higher-clearance caller for the identical query', async () => {
    // Low clearance (1): the sensitivity-3 forum must be invisible.
    await setClearance(service, testUserId, 1)
    const low = await callerClient.rpc('query_graph', {
      p_query_type: 'forum_membership',
      p_entity_id: ids.anchorDossierId,
    })
    expect(low.error).toBeNull()
    const lowCount = countNodesAndEdges(low.data as QueryGraphResult)

    // High clearance (4): the sensitivity-3 forum (and any sensitivity-4 hop)
    // becomes visible — strictly more rows than the low-clearance run.
    await setClearance(service, testUserId, 4)
    const high = await callerClient.rpc('query_graph', {
      p_query_type: 'forum_membership',
      p_entity_id: ids.anchorDossierId,
    })
    expect(high.error).toBeNull()
    const highCount = countNodesAndEdges(high.data as QueryGraphResult)

    expect(highCount).toBeGreaterThan(lowCount)
  })

  it('never reveals that rows were withheld (indistinguishable-empty contract)', async () => {
    await setClearance(service, testUserId, 1)
    const { data } = await callerClient.rpc('query_graph', {
      p_query_type: 'forum_membership',
      p_entity_id: ids.anchorDossierId,
    })

    // The entire serialized payload must contain NO clearance-revealing string,
    // neither as a key nor as a value (GRAPH-03 / P68 D-09).
    const serialized = JSON.stringify(data ?? {})
    expect(serialized).not.toMatch(/clearance|filtered|restricted/i)
  })
})
