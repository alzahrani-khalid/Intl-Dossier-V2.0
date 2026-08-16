/**
 * Phase 94 Plan 03 — behavioural oracle for the commitment stage guard (WRITE-04).
 *
 * The guard mirrors TWO DB rules that live in `public.aa_commitments`:
 *
 *  1. `aa_commitments_status_check` — re-derived live against staging
 *     `zkrcjzdemdmwhearhfgg` on 2026-08-16:
 *       CHECK ((status = ANY (ARRAY['pending','in_progress','completed','cancelled','overdue'])))
 *     FIVE values, and there is no `review`. The board's Review column is the
 *     one broken cell (D-30).
 *
 *  2. the BEFORE UPDATE trigger `commitment_overdue_check` →
 *     `check_commitment_overdue()`:
 *       IF NEW.due_date < CURRENT_DATE AND NEW.status IN ('pending','in_progress')
 *       THEN NEW.status := 'overdue'
 *     A drag the trigger would coerce must be refused BEFORE the write, or the
 *     user gets a success toast followed by a snap-back (D-32).
 *
 * Time is pinned so the past-due predicate is deterministic. `deadline` on a
 * commitment WorkItem is `aa_commitments.due_date::TIMESTAMPTZ` (verified live
 * in `get_unified_work_kanban`), and the staging DB runs `TimeZone = UTC`, so
 * the guard compares UTC day parts to mirror `CURRENT_DATE`.
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'

import {
  COMMITMENT_STAGE_TO_STATUS,
  resolveCommitmentDropDecision,
} from '../commitment-stage-guard'

const TODAY = '2026-08-16'
const PAST_DUE = { deadline: '2026-08-10T00:00:00+00:00' }
const DUE_TODAY = { deadline: `${TODAY}T00:00:00+00:00` }
const FUTURE = { deadline: '2026-09-01T00:00:00+00:00' }
const NO_DEADLINE = { deadline: null }

beforeAll(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(`${TODAY}T09:00:00Z`))
})

afterAll(() => {
  vi.useRealTimers()
})

describe('COMMITMENT_STAGE_TO_STATUS', () => {
  it('maps exactly the three stages that have a lifecycle counterpart', () => {
    expect(COMMITMENT_STAGE_TO_STATUS).toEqual({
      todo: 'pending',
      in_progress: 'in_progress',
      done: 'completed',
    })
  })

  it('has no cell whose value is the DB-owned "overdue" status', () => {
    expect(Object.values(COMMITMENT_STAGE_TO_STATUS)).not.toContain('overdue')
  })
})

describe('resolveCommitmentDropDecision — permitted drags', () => {
  it.each([
    ['todo', 'pending'],
    ['in_progress', 'in_progress'],
    ['done', 'completed'],
  ] as const)('a not-yet-due commitment dropped on %s writes %s', (stage, status) => {
    expect(resolveCommitmentDropDecision(FUTURE, stage)).toEqual({ ok: true, status })
  })

  it('a commitment with no due date is never treated as past due', () => {
    expect(resolveCommitmentDropDecision(NO_DEADLINE, 'todo')).toEqual({
      ok: true,
      status: 'pending',
    })
  })
})

describe('resolveCommitmentDropDecision — reject (i): no review counterpart', () => {
  it('refuses the Review column for a not-yet-due commitment', () => {
    expect(resolveCommitmentDropDecision(FUTURE, 'review')).toEqual({
      ok: false,
      reason: 'no_review_counterpart',
    })
  })

  it('refuses Review for a past-due commitment too — the missing stage decides first', () => {
    expect(resolveCommitmentDropDecision(PAST_DUE, 'review')).toEqual({
      ok: false,
      reason: 'no_review_counterpart',
    })
  })
})

describe('resolveCommitmentDropDecision — reject (ii): the coercion case', () => {
  // RULING-P94-03 order 2 makes this case mandatory: the write succeeds and the
  // trigger silently rewrites it, so "no error" would pass a broken board.

  it('refuses a past-due commitment dropped on To do (the insidious row)', () => {
    // Nothing visibly moves: `pending` is coerced to `overdue`, and `overdue`
    // renders in Todo via resolveBoardStage's default branch. The card looks
    // right while the stored value is NOT what was written.
    expect(resolveCommitmentDropDecision(PAST_DUE, 'todo')).toEqual({
      ok: false,
      reason: 'past_due_coercion',
    })
  })

  it('refuses a past-due commitment dropped on In progress', () => {
    expect(resolveCommitmentDropDecision(PAST_DUE, 'in_progress')).toEqual({
      ok: false,
      reason: 'past_due_coercion',
    })
  })

  it('permits Done for the same past-due commitment — the one drag the trigger allows', () => {
    expect(resolveCommitmentDropDecision(PAST_DUE, 'done')).toEqual({
      ok: true,
      status: 'completed',
    })
  })

  it('boundary: due exactly today is not past due (the trigger needs due_date < CURRENT_DATE)', () => {
    expect(resolveCommitmentDropDecision(DUE_TODAY, 'todo')).toEqual({
      ok: true,
      status: 'pending',
    })
    expect(resolveCommitmentDropDecision(DUE_TODAY, 'in_progress')).toEqual({
      ok: true,
      status: 'in_progress',
    })
  })
})

describe('resolveCommitmentDropDecision — invariants', () => {
  it('never returns the DB-owned "overdue" status on any stage', () => {
    const stages = ['todo', 'in_progress', 'review', 'done', 'cancelled'] as const
    const items = [PAST_DUE, DUE_TODAY, FUTURE, NO_DEADLINE]
    for (const item of items) {
      for (const stage of stages) {
        const decision = resolveCommitmentDropDecision(item, stage)
        if (decision.ok) expect(decision.status).not.toBe('overdue')
      }
    }
  })

  it('never throws — it returns a result union for every input (core.md result-shape law)', () => {
    expect(() => resolveCommitmentDropDecision({ deadline: 'not-a-date' }, 'todo')).not.toThrow()
    expect(resolveCommitmentDropDecision({ deadline: 'not-a-date' }, 'todo')).toEqual({
      ok: true,
      status: 'pending',
    })
  })
})
