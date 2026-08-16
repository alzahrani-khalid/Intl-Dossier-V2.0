/**
 * Phase 94 Plan 03 (WRITE-04) — the single source for the commitment
 * stage → status mapping and the drop decision that precedes every write.
 *
 * SHARED ON PURPOSE. Two enforcement points consume this module — the kanban
 * mutation layer (`useUnifiedKanban.ts`) and the droppable predicate added by
 * plan 94-08 — so the condition exists once and cannot drift (D-33).
 *
 * It mirrors the database; it never replaces it. Both DB rules below stay in
 * force and remain the real enforcement.
 *
 * Result-shape law (~/.claude/rules/core.md): this module returns a
 * discriminated union and never throws.
 */

import type { WorkflowStage } from '@/types/work-item.types'

/**
 * The commitment lifecycle, RE-DERIVED live against staging
 * `zkrcjzdemdmwhearhfgg` on 2026-08-16 (D-03 — never trusted from a document):
 *
 *   SELECT pg_get_constraintdef(oid) FROM pg_constraint
 *   WHERE conrelid = 'public.aa_commitments'::regclass
 *     AND conname = 'aa_commitments_status_check';
 *
 *   CHECK ((status = ANY (ARRAY['pending','in_progress','completed','cancelled','overdue'])))
 *
 * FIVE values, and no `review`. That is the whole defect: only the board's
 * Review column lacks a counterpart, so this map has three cells and not four
 * (D-30). `cancelled` is a valid status but is not a board column
 * (`WorkBoard.tsx` STAGES), so it is unreachable by drag and gets no cell.
 * `overdue` is DB-owned and auto-applied — never written from the client.
 */
export const COMMITMENT_STAGE_TO_STATUS: Partial<Record<WorkflowStage, CommitmentWriteStatus>> = {
  todo: 'pending',
  in_progress: 'in_progress',
  done: 'completed',
}

/** The only statuses this client is ever allowed to write to `aa_commitments`. */
export type CommitmentWriteStatus = 'pending' | 'in_progress' | 'completed'

export type CommitmentDropRejectReason = 'no_review_counterpart' | 'past_due_coercion'

export type CommitmentDropDecision =
  | { ok: true; status: CommitmentWriteStatus }
  | { ok: false; reason: CommitmentDropRejectReason }

/**
 * Everything the decision needs from a commitment card. `deadline` on a
 * commitment work item is `aa_commitments.due_date::TIMESTAMPTZ` — verified
 * live in `get_unified_work_kanban`.
 */
export interface CommitmentDropCandidate {
  deadline: string | null
}

/**
 * True when the DB would consider the row past due.
 *
 * `due_date` is a DATE and the staging database runs `TimeZone = UTC`
 * (verified live), so `CURRENT_DATE` is the UTC day — compare UTC day parts.
 * A malformed or absent date is not past due, which matches SQL: `NULL <
 * CURRENT_DATE` is NULL, not true.
 */
function isPastDue(deadline: string | null): boolean {
  if (deadline == null) return false
  const dueDay = deadline.slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDay)) return false
  return dueDay < new Date().toISOString().slice(0, 10)
}

/**
 * Decide whether dragging `item` onto `targetStage` may be written.
 *
 * Mirrors the `BEFORE UPDATE` trigger `commitment_overdue_check`, whose body
 * `check_commitment_overdue()` is, VERBATIM:
 *
 *   IF NEW.due_date < CURRENT_DATE AND NEW.status IN ('pending','in_progress') THEN
 *     NEW.status := 'overdue';
 *   END IF;
 *
 * That trigger is correct and stays (D-33). Without this guard the write
 * succeeds, the trigger silently rewrites it, and the card snaps back to Todo
 * after a success toast (D-32) — so the refusal must happen before the write,
 * not after an error. If the trigger ever changes, change this predicate in
 * the same edit: it is a mirror, not a paraphrase.
 */
export function resolveCommitmentDropDecision(
  item: CommitmentDropCandidate,
  targetStage: WorkflowStage,
): CommitmentDropDecision {
  const status = COMMITMENT_STAGE_TO_STATUS[targetStage]
  if (status === undefined) {
    return { ok: false, reason: 'no_review_counterpart' }
  }

  if (isPastDue(item.deadline) && (status === 'pending' || status === 'in_progress')) {
    return { ok: false, reason: 'past_due_coercion' }
  }

  return { ok: true, status }
}
