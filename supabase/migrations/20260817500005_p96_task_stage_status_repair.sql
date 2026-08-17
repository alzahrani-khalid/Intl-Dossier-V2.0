-- Phase 96 Plan 08 (COUNT-03) — DATA REPAIR ONLY. No schema, no new trigger.
-- Verify-not-build: `trg_sync_task_status` (BEFORE UPDATE ON public.tasks) already derives
-- status from workflow_stage. This migration repairs rows that a status-direct writer left
-- behind; it writes NO status literal — the trigger performs the derivation and stamps
-- completed_at when null.
--
-- POPULATION: public.tasks rows with status = 'completed' AND workflow_stage <> 'done'
--   (NULL-safe: `IS DISTINCT FROM`). Re-derived at apply time; the authoring-time census
--   below is a FLOOR pinned to 2026-08-17 on staging zkrcjzdemdmwhearhfgg:
--     workflow_stage | status     | n
--     in_progress    | in_progress| 2
--     todo           | pending    | 4
--     todo           | completed  | 3   <- THE POPULATION (completed, still bucketed Todo)
--   OUTSIDE the population: every other (stage, status) pair — all four remaining rows
--   already satisfy the trigger's five-pair table; commitments (`aa_commitments`, its own
--   five-value lifecycle, owned by 96-02); INSERT-time divergence (tasks have no INSERT-time
--   sync — mitigated by the writer rule in Plan 96-08 Task 2, not by a new trigger).
--
-- CAUSE, ATTRIBUTED BEFORE THE ROWS ARE TOUCHED (ACCEPTANCE-P96-EXEC condition 8):
--   `supabase/functions/tasks-update/index.ts` — the status-only branch (`if (body.status
--   !== undefined) updateData.status = body.status`) with no workflow_stage, driven by the
--   done-checkbox on /my-work (`pages/MyTasks.tsx:117`) and the dashboard MyTasks widget
--   (`pages/Dashboard/widgets/MyTasks.tsx:113-116`), both of which send `{ status }` alone
--   through `useUpdateTask` -> `tasksAPI.updateTask` -> PUT functions/v1/tasks-update.
--   `workflow_stage` never changes, so the trigger's `IS DISTINCT FROM OLD` guard never
--   fires and the stage stays stale.
--   Derivation: `audit_log` (the `audit_tasks` AFTER trigger) records the changed-column set
--   of each of the three UPDATEs as exactly
--     {status: pending->completed, updated_at, updated_by, completed_at, completed_by}
--   with NO workflow_stage. That signature eliminates every other candidate writer:
--     - tasks.service.ts:695 updateTaskStatusFromCommitment — writes no updated_by/completed_by
--     - workflow-executor executeUpdateStatus — writes only {status, updated_at}
--     - useUnifiedKanban.ts:398-426 drag path — writes workflow_stage too (benign dual-write)
--     - tasks-api.ts completeTask — sends workflow_stage:'done'
--     - tasks.service.ts:352 updateTask — column-signature-IDENTICAL, eliminated only by
--       reachability: no frontend surface calls the Express /tasks routes (every
--       `baseUrl: 'express'` caller is ai / elected-officials / analytics / notifications /
--       monitoring). Stated as such — not claimed impossible.
--   Repair direction follows the recorded intent: the user completed the task (status was
--   written directly, completed_at/completed_by stamped), so the stage moves to 'done'.
--
-- Idempotent: re-running matches zero rows once the population is repaired.

UPDATE public.tasks
   SET workflow_stage = 'done'
 WHERE status = 'completed'
   AND workflow_stage IS DISTINCT FROM 'done';
