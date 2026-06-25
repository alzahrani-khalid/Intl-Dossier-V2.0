import { createTool } from '@mastra/core/tools'
import { z } from 'zod'
import * as supa from './_supabase.js'
import { isUuidShape } from './_uuid.js'

// Re-export the keystone helper; the body calls `supa.createUserClient(...)` so the
// tests' `vi.mock('./_supabase.js')` intercepts every client build.
export const createUserClient = supa.createUserClient

// Whitelisted graph query types (analytic-graph/index.ts L18, P71). A Zod enum so the
// model cannot dispatch an arbitrary query_type string.
const GRAPH_QUERY_TYPES = [
  'forum_membership',
  'shared_committees',
  'engagement_chain',
  'shortest_path',
] as const

// The neutral empty JSONB the P71 RPC returns on no-data — mirrored here so a missing
// JWT / error path is indistinguishable from "no relationships found". No
// clearance/filtered/restricted key anywhere (P71 GRAPH-03 lock).
const EMPTY_GRAPH = {
  nodes: [] as unknown[],
  edges: [] as unknown[],
  stats: { node_count: 0, edge_count: 0 },
} as const

/**
 * query_graph (D-07, AGENT-02) — wraps the P71 `query_graph` SECURITY INVOKER RPC under
 * the caller's JWT. Clearance is enforced INLINE in the RPC at every dossiers join, so
 * this tool adds none of its own.
 *
 * Live signature (staging, 2026-06-18, INVOKER):
 *   query_graph(p_query_type text, p_entity_id uuid, p_entity_id_2 uuid, p_window_days int) -> JSONB
 *
 * The RPC returns a JSONB object whose keys vary by query_type (query_type, entity_id,
 * nodes, edges, stats, and path/window_days for some types). We pass it through verbatim
 * under `result` so the model sees the full structured answer.
 *
 * Indistinguishable-empty: on no-data, above-clearance, missing JWT, or error the tool
 * returns the SAME neutral empty graph — no clearance/filtered/restricted field.
 */
export const queryGraphTool = createTool({
  id: 'query_graph',
  description:
    'Traverse relationships between entities the caller is cleared to see: forum membership, shared committees, engagement chains, or the shortest path between two entities.',
  inputSchema: z.object({
    queryType: z
      .enum(GRAPH_QUERY_TYPES)
      .describe('Which relationship traversal to run (one of the four supported types)'),
    entityId: z
      .string()
      .describe('The primary entity (dossier) UUID to traverse from (a UUID from a lookup, never a name)'),
    entityId2: z
      .string()
      .optional()
      .describe('The second entity UUID — required only for shortest_path'),
    windowDays: z
      .number()
      .int()
      .min(1)
      .max(365)
      .default(90)
      .describe('Time window in days for engagement-chain traversal'),
  }),
  outputSchema: z.object({
    result: z.record(z.string(), z.unknown()),
  }),
  execute: async (input, context) => {
    const authorization = supa.getAuthorization(context?.requestContext ?? { get: () => undefined })
    if (!authorization) {
      return { result: { ...EMPTY_GRAPH } }
    }

    const args = input as {
      queryType: (typeof GRAPH_QUERY_TYPES)[number]
      entityId: string
      entityId2?: string
      windowDays?: number
    }

    // Lenient UUID-shape gate: the primary entity must be UUID-shaped (incl. non-RFC-4122 seed
    // ids the model takes from a lookup); a name/placeholder yields the neutral empty graph
    // before any client/RPC. The optional second entity is only passed when it is UUID-shaped.
    const entityId = args.entityId.trim()
    if (!isUuidShape(entityId)) {
      return { result: { ...EMPTY_GRAPH } }
    }
    const entityId2 =
      typeof args.entityId2 === 'string' && isUuidShape(args.entityId2) ? args.entityId2.trim() : null

    try {
      const sb = supa.createUserClient(authorization)
      const { data, error } = await sb.rpc('query_graph', {
        p_query_type: args.queryType,
        p_entity_id: entityId,
        p_entity_id_2: entityId2,
        p_window_days: args.windowDays ?? 90,
      })
      // The RPC returns a JSONB object; coerce anything non-object (null, array, scalar)
      // to the neutral empty graph so the output stays well-shaped and indistinguishable.
      if (error || data == null || typeof data !== 'object' || Array.isArray(data)) {
        return { result: { ...EMPTY_GRAPH } }
      }
      return { result: data as Record<string, unknown> }
    } catch {
      return { result: { ...EMPTY_GRAPH } }
    }
  },
})

export default queryGraphTool
