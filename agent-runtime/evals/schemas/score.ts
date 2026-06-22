import { z } from 'zod'

/**
 * Shared eval score schemas (Phase 74, Plan 74-01).
 *
 * These are the structured, Zod-validated score envelopes the eval harness produces.
 * Two consumers:
 *   - EVAL-02 (Plan 74-01): `computeSetMetrics` validates its return through
 *     `SetMetricsSchema` so a malformed precision/recall throws at the source.
 *   - EVAL-01 / EVAL-03 (Plan 74-08, D4): the on-prem gemma-4-12B judge returns a
 *     `RubricScore` per dimension; validating through `RubricScoreSchema` rejects a
 *     judge that hallucinates a malformed score (out-of-range, wrong type).
 *
 * zod v4 import style, consistent with agent-runtime/src/mastra/tools/*.
 */

/**
 * Precision / recall / F1 over two edge sets, plus the raw confusion counts.
 * - precision, recall, f1 are proportions in [0, 1].
 * - truePositives / falsePositives / falseNegatives are non-negative integers.
 */
export const SetMetricsSchema = z.object({
  precision: z.number().min(0).max(1),
  recall: z.number().min(0).max(1),
  f1: z.number().min(0).max(1),
  truePositives: z.number().int().min(0),
  falsePositives: z.number().int().min(0),
  falseNegatives: z.number().int().min(0),
})

/**
 * One judged rubric dimension (e.g. EVAL-01 "coverage", EVAL-03 "RTL correctness").
 * `score` is normalized to [0, 1]; `passed` is the threshold decision for that dimension.
 */
export const RubricScoreSchema = z.object({
  dimension: z.string(),
  score: z.number().min(0).max(1),
  passed: z.boolean(),
  notes: z.string().optional(),
})

export type SetMetrics = z.infer<typeof SetMetricsSchema>
export type RubricScore = z.infer<typeof RubricScoreSchema>
