-- Fix work_item_dossiers RLS for commitments + backfill junction rows
--
-- Context: "Overdue commitment triage" workflow inspection (P0 + P1).
--
-- The work_item_dossiers INSERT (WITH CHECK) and SELECT (USING) policies
-- validated the work_item_type = 'commitment' branch against the legacy,
-- EMPTY public.commitments table. The real work-item commitments live in
-- public.aa_commitments. Result: every commitment dossier-link insert was
-- denied (HTTP 500 RLS violation), and any link that did exist was invisible.
--
-- This migration:
--   1. Recreates both policies, rewriting ONLY the 'commitment' CASE branch to
--      target aa_commitments with that table's own access semantics
--      (owner_user_id = auth.uid() OR is_assigned_to_dossier(dossier_id)).
--      task/intake branches, the dossier-clearance EXISTS clause, and the
--      created_by = auth.uid() insert guard are preserved unchanged.
--   2. Idempotently backfills direct/primary junction rows for aa_commitments
--      that carry a dossier_id but have no live junction link yet.

BEGIN;

-- 1a. INSERT policy (WITH CHECK) ------------------------------------------------
DROP POLICY IF EXISTS work_item_dossiers_insert ON public.work_item_dossiers;

CREATE POLICY work_item_dossiers_insert
  ON public.work_item_dossiers
  FOR INSERT
  WITH CHECK (
    (
      EXISTS (
        SELECT 1
        FROM dossiers d
        WHERE d.id = work_item_dossiers.dossier_id
          AND d.status <> 'deleted'::text
          AND get_user_clearance_level(auth.uid()) >= d.sensitivity_level
      )
    )
    AND
    CASE work_item_type
      WHEN 'task'::text THEN (
        work_item_id IN (
          SELECT tasks.id
          FROM tasks
          WHERE tasks.created_by = auth.uid()
            AND tasks.is_deleted = false
        )
      )
      WHEN 'commitment'::text THEN (
        work_item_id IN (
          SELECT ac.id
          FROM aa_commitments ac
          WHERE ac.is_deleted = false
            AND (
              ac.owner_user_id = auth.uid()
              OR is_assigned_to_dossier(ac.dossier_id)
            )
        )
      )
      WHEN 'intake'::text THEN (
        work_item_id IN (
          SELECT intake_tickets.id
          FROM intake_tickets
          WHERE intake_tickets.created_by = auth.uid()
        )
      )
      ELSE false
    END
    AND (created_by = auth.uid())
  );

-- 1b. SELECT policy (USING) -----------------------------------------------------
DROP POLICY IF EXISTS work_item_dossiers_select ON public.work_item_dossiers;

CREATE POLICY work_item_dossiers_select
  ON public.work_item_dossiers
  FOR SELECT
  USING (
    (
      EXISTS (
        SELECT 1
        FROM dossiers d
        WHERE d.id = work_item_dossiers.dossier_id
          AND d.status <> 'deleted'::text
          AND get_user_clearance_level(auth.uid()) >= d.sensitivity_level
      )
    )
    AND
    CASE work_item_type
      WHEN 'task'::text THEN (
        work_item_id IN (
          SELECT tasks.id
          FROM tasks
          WHERE (tasks.assignee_id = auth.uid() OR tasks.created_by = auth.uid())
            AND tasks.is_deleted = false
        )
      )
      WHEN 'commitment'::text THEN (
        work_item_id IN (
          SELECT ac.id
          FROM aa_commitments ac
          WHERE ac.is_deleted = false
            AND (
              ac.owner_user_id = auth.uid()
              OR is_assigned_to_dossier(ac.dossier_id)
            )
        )
      )
      WHEN 'intake'::text THEN (
        work_item_id IN (
          SELECT intake_tickets.id
          FROM intake_tickets
          WHERE intake_tickets.created_by = auth.uid()
            OR intake_tickets.assigned_to = auth.uid()
        )
      )
      ELSE false
    END
  );

-- 2. Backfill junction rows from aa_commitments.dossier_id ----------------------
-- Idempotent: only inserts where no live junction row already links the pair.
INSERT INTO public.work_item_dossiers (
  work_item_type,
  work_item_id,
  dossier_id,
  inheritance_source,
  inheritance_path,
  display_order,
  is_primary,
  created_by,
  updated_by
)
SELECT
  'commitment',
  ac.id,
  ac.dossier_id,
  'direct',
  '[]'::jsonb,
  0,
  true,
  COALESCE(ac.owner_user_id, ac.created_by),
  COALESCE(ac.owner_user_id, ac.created_by)
FROM public.aa_commitments ac
WHERE ac.dossier_id IS NOT NULL
  AND ac.is_deleted = false
  AND COALESCE(ac.owner_user_id, ac.created_by) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM public.work_item_dossiers wid
    WHERE wid.work_item_type = 'commitment'
      AND wid.work_item_id = ac.id
      AND wid.dossier_id = ac.dossier_id
      AND wid.deleted_at IS NULL
  );

COMMIT;
