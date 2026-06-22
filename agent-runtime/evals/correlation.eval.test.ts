/**
 * EVAL-02 — correlation accuracy rubric (Phase 74, Plan 74-01).
 *
 * D1 (LOCKED): "correlation accuracy" = P71 analytic-graph link discovery. This rubric
 * computes the PRECISION and RECALL of the edges `query_graph` returns (forum_membership /
 * shared_committees / engagement_chain / shortest_path) against a human-curated golden
 * edge set — pure set-overlap, NO LLM judge. That is what makes EVAL-02 the CI-native
 * rubric: it runs now, with no GPU/gemma stack and no DB/RPC call (the fixtures store the
 * tool's recorded `returned` edges, per D5 seed-style golden data).
 *
 * Requirement: EVAL-02. Subject: agent-runtime/src/mastra/tools/query-graph.ts
 * (GRAPH_QUERY_TYPES). Gate: precision >= 0.75 AND recall >= 0.70 on every golden fixture;
 * the `_degraded.json` fixture must FALL BELOW the gate (positive-failure proof, mirroring
 * the bad-fixture assert at .github/workflows/ci.yml).
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { computeSetMetrics, type GraphEdge } from './lib/set-metrics.js'

// EVAL-02 thresholds (D1). Named constants — no magic numbers in the assertions.
const PRECISION_MIN = 0.75
const RECALL_MIN = 0.7

const FIXTURE_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures', 'correlation')

interface CorrelationFixture {
  queryType: string
  description?: string
  input: { entityId: string; entityId2?: string; windowDays?: number }
  returned: GraphEdge[]
  golden: GraphEdge[]
}

function loadFixture(file: string): CorrelationFixture {
  return JSON.parse(readFileSync(path.join(FIXTURE_DIR, file), 'utf8')) as CorrelationFixture
}

// Golden fixtures = every *.json under fixtures/correlation EXCEPT the leading-underscore
// positive-failure fixtures. Adding a new golden fixture auto-extends coverage.
const goldenFixtureFiles = readdirSync(FIXTURE_DIR)
  .filter((f) => f.endsWith('.json') && !f.startsWith('_'))
  .sort()

describe('EVAL-02 correlation accuracy (query_graph link discovery, D1)', () => {
  it('authored a golden fixture for every GRAPH_QUERY_TYPES member', () => {
    const queryTypes = goldenFixtureFiles.map((f) => loadFixture(f).queryType).sort()
    expect(queryTypes).toEqual([
      'engagement_chain',
      'forum_membership',
      'shared_committees',
      'shortest_path',
    ])
  })

  it.each(goldenFixtureFiles)(
    'golden fixture %s passes the precision/recall gate',
    (file) => {
      const fx = loadFixture(file)
      const m = computeSetMetrics(fx.returned, fx.golden)

      // computeSetMetrics already validates the return through SetMetricsSchema, so
      // reaching here means the metric is well-formed (in-range, integer counts).
      expect(m.precision).toBeGreaterThanOrEqual(PRECISION_MIN)
      expect(m.recall).toBeGreaterThanOrEqual(RECALL_MIN)
    },
  )

  it('REJECTS the degraded fixture (positive-failure proof for the CI eval-gate)', () => {
    const fx = loadFixture('_degraded.json')
    const m = computeSetMetrics(fx.returned, fx.golden)

    // The gate must REJECT a regressed response: at least one of precision/recall is below
    // threshold, so `passed` is false. This proves the rubric fails on a regression rather
    // than rubber-stamping it (cf. ci.yml's `! node check-edge-fn-schema-refs <bad>` assert).
    const passed = m.precision >= PRECISION_MIN && m.recall >= RECALL_MIN
    expect(passed).toBe(false)
  })
})
