// Phase 71 (GRAPH-01) — useAnalyticGraph
// TanStack Query wrapper over the live `analytic-graph` edge function. Mirrors the
// `fetchGraphData` + `useQuery(['graph-traversal',…])` pattern in
// RelationshipGraphPage.tsx (L93-154): session token → edge-fn fetch → 30s cache.
// Clearance is enforced server-side in the SECURITY INVOKER `query_graph` RPC under
// the caller JWT; a reduced-clearance caller silently receives fewer/zero rows.
import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

/** The four analytic query templates exposed by the picker (D-01). */
export type AnalyticQueryType =
  | 'forum_membership'
  | 'shared_committees'
  | 'engagement_chain'
  | 'shortest_path'

/** A graph node returned by the analytic-graph edge fn (DB-sourced, clearance-filtered). */
export interface AnalyticNode {
  id: string
  type?: string
  name_en?: string
  name_ar?: string
  status?: string
  start_date?: string
  end_date?: string
  [key: string]: unknown
}

/** A graph edge returned by the analytic-graph edge fn. */
export interface AnalyticEdge {
  source_id: string
  target_id: string
  relationship_type?: string
  [key: string]: unknown
}

/** The shape returned by `query_graph` (via the edge fn), keyed by query type. */
export interface AnalyticGraphResult {
  query_type?: AnalyticQueryType
  nodes: AnalyticNode[]
  edges: AnalyticEdge[]
  /** Present for shortest_path results only. */
  path?: string[]
  relationship_path?: string[]
  path_length?: number
  stats: {
    node_count: number
    edge_count: number
    query_time_ms: number
    performance_warning: string | null
  }
}

/** Parameters forwarded to the analytic-graph edge function. */
export interface AnalyticGraphParams {
  queryType: AnalyticQueryType
  entityId: string | undefined
  entityId2?: string
  windowDays?: number
}

/**
 * Calls `/functions/v1/analytic-graph` under the user's session token. Mirrors
 * `fetchGraphData` (RelationshipGraphPage L94-130) — throws if unauthenticated,
 * builds URLSearchParams, throws on a non-ok response, returns the parsed body.
 */
async function fetchAnalyticGraph({
  queryType,
  entityId,
  entityId2,
  windowDays,
}: AnalyticGraphParams): Promise<AnalyticGraphResult> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) {
    throw new Error('Not authenticated')
  }

  const params = new URLSearchParams({ queryType })
  if (entityId != null && entityId.length > 0) {
    params.append('entityId', entityId)
  }
  if (entityId2 != null && entityId2.length > 0) {
    params.append('entityId2', entityId2)
  }
  if (windowDays != null) {
    params.append('windowDays', windowDays.toString())
  }

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analytic-graph?${params}`,
    {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    },
  )

  if (!response.ok) {
    const error = await response.json().catch((): { error?: string } => ({}))
    throw new Error(error.error ?? 'Failed to run analysis')
  }

  return response.json() as Promise<AnalyticGraphResult>
}

/** Two-entity templates require entityId2 before the request is satisfiable; the edge fn 400s otherwise. */
const TWO_ENTITY_QUERIES: ReadonlySet<AnalyticQueryType> = new Set([
  'shared_committees',
  'shortest_path',
])

/**
 * Runs an analytic graph query. Disabled until a primary `entityId` is provided
 * (mirrors `enabled: !!startDossierId`). Two-entity templates (shared_committees,
 * shortest_path) additionally require `entityId2` — gated here as well as in the
 * picker, so a stale/hand-edited deep-link (e.g. query=shortest_path with no
 * entity2) does not fire a request that 400s.
 */
export function useAnalyticGraph(
  params: AnalyticGraphParams,
): UseQueryResult<AnalyticGraphResult, Error> {
  const { queryType, entityId, entityId2, windowDays } = params

  return useQuery<AnalyticGraphResult, Error>({
    queryKey: ['analytic-graph', queryType, entityId, entityId2, windowDays],
    queryFn: () => fetchAnalyticGraph(params),
    enabled:
      entityId != null &&
      entityId.length > 0 &&
      (!TWO_ENTITY_QUERIES.has(queryType) || (entityId2 != null && entityId2.length > 0)),
    staleTime: 30000, // 30s cache — same precedent as graph-traversal
  })
}
