import { SetMetricsSchema, type SetMetrics } from '../schemas/score.js'

/**
 * Pure precision / recall / F1 over query_graph edge sets (Phase 74, Plan 74-01, EVAL-02).
 *
 * EVAL-02 (per D1) measures P71 analytic-graph link discovery as COMPUTED set-overlap —
 * no LLM, no judge, no network, no process.env. The subject is the edge[] a query_graph
 * response carries (forum_membership / shared_committees / engagement_chain /
 * shortest_path); we compare the returned set to a human-curated golden set.
 *
 * Threat T-74-01-03 (accept): nothing here reads env, opens a socket, or builds a
 * Supabase client — it cannot reach RLS or service-role, so there is nothing to elevate.
 */

/** Minimal edge shape the metric keys on. Extra response fields (weight, label, …) are ignored. */
export interface GraphEdge {
  source: string
  target: string
  type?: string
}

/**
 * The graph query types whose edges are UNDIRECTED for set-comparison purposes.
 *
 * For these relationships A↔B is the same fact as B↔A (co-membership in a forum, a
 * shared committee, two endpoints of a path), so the canonical key sorts the endpoint
 * pair and `forum_membership`/`A,B` collides with `forum_membership`/`B,A`.
 * engagement_chain is the lone DIRECTED type (an ordered hop A→B is distinct from B→A),
 * so its endpoints are NOT sorted.
 */
const UNDIRECTED_EDGE_TYPES: ReadonlySet<string> = new Set([
  'forum_membership',
  'shared_committees',
  'shared_committee',
  'shortest_path',
])

/**
 * Stable canonical key for an edge.
 *
 * Directedness is decided by `type`: undirected types sort their {source,target} pair so
 * A→B and B→A collide; directed types (engagement_chain) keep endpoint order. The `type`
 * is appended so a forum_membership A,B never collides with a shortest_path A,B. A missing
 * `type` defaults to a sentinel and is treated as undirected (the conservative choice —
 * it folds reciprocal edges together rather than double-counting them).
 */
export function edgeKey(edge: GraphEdge): string {
  const type = edge.type ?? '_untyped'
  const directed = !UNDIRECTED_EDGE_TYPES.has(type)
  if (directed) {
    return `${type}::${edge.source}->${edge.target}`
  }
  const [a, b] = [edge.source, edge.target].sort()
  return `${type}::${a}--${b}`
}

/**
 * Compute precision / recall / F1 of a returned edge set against a golden edge set.
 *
 * Both inputs are de-duplicated via `edgeKey` before comparison so a response that lists
 * the same edge twice is not double-counted.
 *
 * Divide-by-zero conventions (documented, deterministic):
 *   - precision = TP / (TP + FP). If returned is empty (TP+FP = 0): precision = 1 ONLY
 *     when golden is also empty (a correct "no edges" answer), else 0.
 *   - recall = TP / (TP + FN). If golden is empty (TP+FN = 0): recall = 1 (there is
 *     nothing to recall, so any answer perfectly recalls the empty set).
 *   - f1 = harmonic mean; 0 when precision+recall = 0.
 *
 * The result is validated through SetMetricsSchema before returning, so a malformed
 * metric (NaN, out-of-range) throws here rather than silently passing a rubric.
 */
export function computeSetMetrics(returned: GraphEdge[], golden: GraphEdge[]): SetMetrics {
  const returnedKeys = new Set(returned.map(edgeKey))
  const goldenKeys = new Set(golden.map(edgeKey))

  let truePositives = 0
  for (const key of returnedKeys) {
    if (goldenKeys.has(key)) {
      truePositives += 1
    }
  }
  const falsePositives = returnedKeys.size - truePositives
  const falseNegatives = goldenKeys.size - truePositives

  const precisionDenominator = truePositives + falsePositives
  const recallDenominator = truePositives + falseNegatives

  const precision =
    precisionDenominator === 0 ? (goldenKeys.size === 0 ? 1 : 0) : truePositives / precisionDenominator
  const recall = recallDenominator === 0 ? 1 : truePositives / recallDenominator

  const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall)

  return SetMetricsSchema.parse({
    precision,
    recall,
    f1,
    truePositives,
    falsePositives,
    falseNegatives,
  })
}
