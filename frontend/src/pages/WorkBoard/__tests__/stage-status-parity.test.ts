/**
 * Phase 96 Plan 08 (COUNT-03) — the client half of the stage→status parity oracle.
 *
 * `trg_sync_task_status` (BEFORE UPDATE on public.tasks) derives `status` from
 * `workflow_stage`. Two independent TypeScript copies of that mapping exist —
 * WorkBoard.tsx's exported STAGE_TO_STATUS and supabase/functions/tasks-update's
 * in-function copy — which agree with the trigger by AUTHORSHIP, not construction.
 *
 * This test pins the CLIENT copy to the five pairs read out of the live trigger's
 * `prosrc` (recorded in 96-08-SUMMARY §Three-way parity). A drift on the client side
 * fails here; a drift on the DB side fails the recorded derivation.
 *
 * POPULATION: the five `workflow_stage` values the trigger's CASE enumerates.
 * OUTSIDE: INSERT-time (no INSERT trigger on tasks — mitigated by the writer rule,
 * not by a new trigger; verify-not-build), and the Deno copy in tasks-update
 * (not importable from vitest — proven by the recorded side-by-side instead).
 *
 * Pure data: no render, no i18n, no router mocks.
 */

import { describe, it, expect } from 'vitest'

import { STAGE_TO_STATUS } from '../WorkBoard'

// The live trigger CASE, transcribed from prosrc (2026-08-17, staging zkrcjzdemdmwhearhfgg):
//   WHEN 'todo' THEN 'pending' · 'in_progress' THEN 'in_progress' · 'review' THEN 'review'
//   WHEN 'done' THEN 'completed' (+ completed_at := NOW() when null) · 'cancelled' THEN 'cancelled'
const TRIGGER_CASE: Array<[string, string]> = [
  ['todo', 'pending'],
  ['in_progress', 'in_progress'],
  ['review', 'review'],
  ['done', 'completed'],
  ['cancelled', 'cancelled'],
]

describe('STAGE_TO_STATUS parity with trg_sync_task_status', () => {
  it('carries exactly the five stages the trigger enumerates — no more, no fewer', () => {
    expect(Object.keys(STAGE_TO_STATUS).sort()).toEqual(TRIGGER_CASE.map(([s]) => s).sort())
  })

  it.each(TRIGGER_CASE)('maps stage %s → status %s', (stage, status) => {
    expect(STAGE_TO_STATUS[stage as keyof typeof STAGE_TO_STATUS]).toBe(status)
  })

  it('agrees cell-for-cell with the trigger CASE', () => {
    expect(Object.entries(STAGE_TO_STATUS).sort()).toEqual([...TRIGGER_CASE].sort())
  })
})
