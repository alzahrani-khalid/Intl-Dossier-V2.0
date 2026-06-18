import { createTool } from '@mastra/core/tools'
import { z } from 'zod'
import { createUserClient, getAuthorization } from './_supabase.js'

export { createUserClient }

// Whitelisted graph query types (analytic-graph/index.ts L18, P71).
const GRAPH_QUERY_TYPES = [
  'forum_membership',
  'shared_committees',
  'engagement_chain',
  'shortest_path',
] as const

/**
 * query_graph — STUB (typed placeholder, TODO: 72-06).
 *
 * Wraps the P71 `query_graph(p_query_type, p_entity_id, p_entity_id_2, p_window_days)`
 * RPC (SECURITY INVOKER + inline clearance + indistinguishable-empty) under the
 * caller's JWT. 72-06 fills the body. The P71 RPC already returns the neutral
 * empty shape (no clearance keys), preserved here.
 */
export const queryGraphTool = createTool({
  id: 'query_graph',
  description:
    'Traverse relationships between entities the caller is cleared to see (forum membership, shared committees, engagement chains, shortest path).',
  inputSchema: z.object({
    queryType: z.enum(GRAPH_QUERY_TYPES),
    entityId: z.string().uuid(),
    entityId2: z.string().uuid().optional(),
    windowDays: z.number().int().max(365).default(90),
  }),
  outputSchema: z.object({
    nodes: z.array(z.unknown()),
    edges: z.array(z.unknown()),
  }),
  execute: async (_input, context) => {
    const authorization = getAuthorization(context?.requestContext ?? { get: () => undefined })
    if (!authorization) {
      return { nodes: [], edges: [] }
    }
    // TODO: 72-06 — const sb = createUserClient(authorization)
    //   const { data } = await sb.rpc('query_graph', { p_query_type, p_entity_id, ... })
    return { nodes: [], edges: [] }
  },
})

export default queryGraphTool
