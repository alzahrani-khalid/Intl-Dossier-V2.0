-- P94 / WRITE-06: break the custom_reports <-> report_shares RLS recursion (42P17).
--
-- THE CYCLE (re-derived live from pg_policies on staging zkrcjzdemdmwhearhfgg, 2026-08-16, at
-- execution time — the research copy is evidence, not a substitute):
--   custom_reports SELECT qual  -> EXISTS (SELECT 1 FROM report_shares ...)
--   report_shares  SELECT qual  -> EXISTS (SELECT 1 FROM custom_reports ...)
-- Evaluating either applies the other's policy, which re-applies the first ->
--   42P17 "infinite recursion detected in policy for relation \"custom_reports\"".
-- Observed live, HTTP 500, as a real authenticated identity through PostgREST before this
-- migration (94-05 SUMMARY, task-1 RED baseline). Every by-id report read, every report insert
-- with return=representation, and the scheduled-report picker rejected for EVERY id.
--
-- THE FIX — break ONE direction, by construction, without widening the visible row set (D-22).
-- report_shares' three quals stop referencing custom_reports and call a SECURITY DEFINER helper
-- instead. The definer reads ONE row's created_by and compares it to the caller; it returns a
-- boolean and no data. That is semantically the predicate it replaces, so the row set is unchanged
-- by construction -- and the two-sided proof is scripts/probe-report-rls.mjs (A sees own+shared,
-- B sees exactly the row shared with them, C sees NONE).
--
-- Once report_shares no longer references custom_reports every evaluation path terminates:
--   custom_reports    -> report_shares -> is_report_owner -> done
--   report_executions -> custom_reports -> report_shares  -> is_report_owner -> done
-- custom_reports' and report_executions' own policies are therefore left untouched.
--
-- Precedent for the definer posture in this schema: get_user_clearance_level
-- (20260614000001_p68_clearance_canonical.sql). This one additionally pins search_path, so every
-- reference below is schema-qualified.

CREATE OR REPLACE FUNCTION public.is_report_owner(p_report_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT cr.created_by = auth.uid()
  FROM public.custom_reports cr
  WHERE cr.id = p_report_id
$$;

COMMENT ON FUNCTION public.is_report_owner(uuid) IS
  'P94/WRITE-06: owner check for one custom_reports row, used by report_shares policies to break '
  'the custom_reports <-> report_shares 42P17 recursion. SECURITY DEFINER with a pinned empty '
  'search_path; returns a boolean only, never row data. Scope must stay a single-row owner check.';

GRANT EXECUTE ON FUNCTION public.is_report_owner(uuid) TO authenticated;

-- The three report_shares policies, re-created with the EXISTS-over-custom_reports clause (and
-- ONLY that clause) replaced by is_report_owner(report_id). Every other clause is preserved
-- verbatim from the live definitions.

-- was: shared_with = auth.uid() OR shared_by = auth.uid()
--      OR EXISTS (SELECT 1 FROM custom_reports
--                 WHERE custom_reports.id = report_shares.report_id
--                   AND custom_reports.created_by = auth.uid())
DROP POLICY IF EXISTS "Users can view shares for their reports" ON public.report_shares;
CREATE POLICY "Users can view shares for their reports" ON public.report_shares
  FOR SELECT
  USING (
    shared_with = auth.uid()
    OR shared_by = auth.uid()
    OR public.is_report_owner(report_id)
  );

-- was: shared_by = auth.uid()
--      AND EXISTS (SELECT 1 FROM custom_reports
--                  WHERE custom_reports.id = report_shares.report_id
--                    AND custom_reports.created_by = auth.uid())
DROP POLICY IF EXISTS "Users can share their own reports" ON public.report_shares;
CREATE POLICY "Users can share their own reports" ON public.report_shares
  FOR INSERT
  WITH CHECK (
    shared_by = auth.uid()
    AND public.is_report_owner(report_id)
  );

-- was: shared_by = auth.uid()
--      OR EXISTS (SELECT 1 FROM custom_reports
--                 WHERE custom_reports.id = report_shares.report_id
--                   AND custom_reports.created_by = auth.uid())
DROP POLICY IF EXISTS "Users can delete shares for their reports" ON public.report_shares;
CREATE POLICY "Users can delete shares for their reports" ON public.report_shares
  FOR DELETE
  USING (
    shared_by = auth.uid()
    OR public.is_report_owner(report_id)
  );
