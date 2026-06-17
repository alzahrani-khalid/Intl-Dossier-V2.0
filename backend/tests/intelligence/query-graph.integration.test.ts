/**
 * GRAPH-01 — query_graph RPC row-shape integration test (RED until plan 71-02).
 *
 * Mirrors the live-staging integration harness (createClient from
 * @supabase/supabase-js + service-role key from `.env.test`; `tests/setup.ts`
 * mocks `@/config/supabase` but NOT `@supabase/supabase-js`, so a client built
 * here hits live staging zkrcjzdemdmwhearhfgg). Invokes the multiplexed
 * `query_graph(p_query_type, p_entity_id, p_entity_id_2, p_window_days)`
 * SECURITY INVOKER RPC under a SERVICE-ROLE client (RLS-bypassing) so every
 * seeded row is visible and the JSONB SHAPE is asserted independent of
 * clearance — the clearance gate itself is proven in the clearance + invoker
 * suites.
 *
 * Seeds the RF-7 fixture in beforeAll and restores it in afterAll.
 *
 * EXPECTED RED NOW: `query_graph` does not exist, so every `.rpc('query_graph')`
 * resolves with a PostgREST "Could not find the function" error and these
 * assertions fail. They turn GREEN when 71-02 lands the RPC and 71-03 applies
 * the migration to staging.
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  createServiceRoleClient,
  restoreAnalyticGraphFixture,
  seedAnalyticGraphFixture,
  type AnalyticGraphFixtureIds,
} from './fixtures/analytic-graph-seed'

interface QueryGraphNode {
  id?: string
  type?: string
  name_en?: string
  name_ar?: string
  relationship_type?: string
  sensitivity_level?: number
  start_date?: string
}

interface QueryGraphResult {
  query_type?: string
  entity_id?: string
  nodes?: QueryGraphNode[]
  edges?: unknown[]
  stats?: Record<string, unknown>
  path?: string[]
  relationship_path?: string[]
  path_length?: number
}

describe('query_graph GRAPH-01 — RPC row shape on seeded data', () => {
  let client: SupabaseClient
  let ids: AnalyticGraphFixtureIds

  // RED contract: this seeds against live staging. Until 71-03 applies the
  // query_graph migration, the RPC is missing and every `it` fails. When
  // staging credentials are absent (no backend/.env.test), the service-role
  // client throws here so the suite still fails loudly rather than passing
  // vacuously — the test must never be green before query_graph exists.
  beforeAll(async () => {
    client = createServiceRoleClient()
    ids = await seedAnalyticGraphFixture(client)
  })

  afterAll(async () => {
    if (ids != null) {
      await restoreAnalyticGraphFixture(client, ids)
    }
  })

  it('forum_membership returns a non-empty nodes array containing the seeded forum', async () => {
    const { data, error } = await client.rpc('query_graph', {
      p_query_type: 'forum_membership',
      p_entity_id: ids.anchorDossierId,
    })

    expect(error).toBeNull()
    const result = data as QueryGraphResult
    expect(result.query_type).toBe('forum_membership')
    expect(Array.isArray(result.nodes)).toBe(true)
    expect(result.nodes!.length).toBeGreaterThan(0)
    expect(result.nodes!.map((node) => node.id)).toContain(ids.forumDossierId)
  })

  it('shared_committees returns the working group both entities belong to', async () => {
    const { data, error } = await client.rpc('query_graph', {
      p_query_type: 'shared_committees',
      p_entity_id: ids.orgDossierIdA,
      p_entity_id_2: ids.orgDossierIdB,
    })

    expect(error).toBeNull()
    const result = data as QueryGraphResult
    expect(result.query_type).toBe('shared_committees')
    expect(Array.isArray(result.nodes)).toBe(true)
    expect(result.nodes!.map((node) => node.id)).toContain(ids.workingGroupDossierId)
  })

  it('engagement_chain returns the seeded engagement within the time window', async () => {
    const { data, error } = await client.rpc('query_graph', {
      p_query_type: 'engagement_chain',
      p_entity_id: ids.anchorDossierId,
      p_entity_id_2: null,
      p_window_days: 90,
    })

    expect(error).toBeNull()
    const result = data as QueryGraphResult
    expect(result.query_type).toBe('engagement_chain')
    expect(Array.isArray(result.nodes)).toBe(true)
    expect(result.nodes!.map((node) => node.id)).toContain(ids.engagementDossierId)
  })

  it('shortest_path returns a path array (or empty) between two entities', async () => {
    const { data, error } = await client.rpc('query_graph', {
      p_query_type: 'shortest_path',
      p_entity_id: ids.anchorDossierId,
      p_entity_id_2: ids.forumDossierId,
    })

    expect(error).toBeNull()
    const result = data as QueryGraphResult
    expect(result.query_type).toBe('shortest_path')
    // Either a resolved path (array of dossier ids) or an empty/absent path when
    // no within-clearance route exists — both are valid shapes for this query.
    if (result.path != null) {
      expect(Array.isArray(result.path)).toBe(true)
    }
  })
})
