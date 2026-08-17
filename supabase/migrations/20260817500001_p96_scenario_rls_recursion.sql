-- P96 / SANDBOX-500-01: break the scenarios <-> scenario_collaborators RLS recursion (42P17).
--
-- THE CYCLE (re-derived live from pg_policy on staging zkrcjzdemdmwhearhfgg, 2026-08-17, at
-- execution time — the research copy is evidence, not a substitute):
--   scenarios               SELECT qual -> EXISTS (SELECT 1 FROM scenario_collaborators ...)
--   scenario_collaborators  SELECT qual -> EXISTS (SELECT 1 FROM scenarios ...)
-- Evaluating either applies the other's policy, which re-applies the first ->
--   42P17 "infinite recursion detected in policy for relation \"scenarios\"".
-- Observed live, as a real authenticated identity through PostgREST, before this migration:
--   GET /rest/v1/scenarios?select=*&limit=1  (user JWT) -> 42P17 infinite recursion
--   GET /functions/v1/scenario-sandbox       (user JWT) -> HTTP 500 {"code":"FETCH_FAILED"}
--   scripts/probe-edge-auth.sh scenario-sandbox         -> "scenario-sandbox -> 500"
-- That 500 is the P95-recorded FETCH_FAILED mask, reproduced: the deployed function source is
-- correct and needs no change — the failure originates in PostgREST evaluating these policies.
-- Origin of both policies: 20260114300001_scenario_sandbox.sql (not edited; superseded here).
--
-- THE FIX — break ONE direction, by construction, without widening the visible row set (D-12/D-22).
-- scenario_collaborators' three quals stop referencing scenarios and call a SECURITY DEFINER helper
-- instead. The definer reads ONE row's created_by and compares it to the caller; it returns a
-- boolean and no data. That is semantically the predicate it replaces, so the row set is unchanged
-- by construction -- and the two-sided proof is scripts/probe-scenario-rls.mjs (A sees
-- own+collaborated, B sees exactly the scenario collaborated to them, C the stranger sees NONE).
--
-- Once scenario_collaborators no longer references scenarios every evaluation path terminates:
--   scenarios                                   -> scenario_collaborators -> is_scenario_owner -> done
--   scenario_variables / _outcomes / _snapshots -> scenarios -> scenario_collaborators
--                                                            -> is_scenario_owner -> done
-- The scenarios-side SELECT policy `scenarios_select_own_or_collaborated` is therefore UNTOUCHED,
-- and must stay so (96-RESEARCH Pitfall 1: breaking the wrong direction leaves the cycle alive
-- through the other evaluation path, or widens the visible row set). The child-table policies
-- (scenario_variables / scenario_outcomes / scenario_snapshots / scenario_comparisons) are
-- untouched for the same reason — they terminate through the collaborators side once it does.
--
-- Precedent — same defect class, same staging DB, one day earlier:
-- 20260816500001_p94_report_rls_recursion.sql, whose is_report_owner this mirrors name-for-name.

CREATE OR REPLACE FUNCTION public.is_scenario_owner(p_scenario_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT s.created_by = auth.uid()
  FROM public.scenarios s
  WHERE s.id = p_scenario_id
$$;

COMMENT ON FUNCTION public.is_scenario_owner(uuid) IS
  'P96/SANDBOX-500-01: owner check for one scenarios row, used by scenario_collaborators policies '
  'to break the scenarios <-> scenario_collaborators 42P17 recursion. SECURITY DEFINER with a '
  'pinned empty search_path; returns a boolean only, never row data. Scope must stay a single-row '
  'owner check.';

GRANT EXECUTE ON FUNCTION public.is_scenario_owner(uuid) TO authenticated;

-- The three scenario_collaborators policies, re-created with the EXISTS-over-scenarios clause (and
-- ONLY that clause) replaced by is_scenario_owner(scenario_id). Every other clause is preserved
-- verbatim from the live definitions quoted below. All three are PERMISSIVE with no TO clause
-- (polroles = PUBLIC, live-verified) — re-created the same way.

-- was: (user_id = auth.uid())
--      OR EXISTS (SELECT 1 FROM scenarios
--                 WHERE scenarios.id = scenario_collaborators.scenario_id
--                   AND scenarios.created_by = auth.uid())
DROP POLICY IF EXISTS "scenario_collaborators_select" ON public.scenario_collaborators;
CREATE POLICY "scenario_collaborators_select" ON public.scenario_collaborators
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR public.is_scenario_owner(scenario_id)
  );

-- was: EXISTS (SELECT 1 FROM scenarios
--              WHERE scenarios.id = scenario_collaborators.scenario_id
--                AND scenarios.created_by = auth.uid())
DROP POLICY IF EXISTS "scenario_collaborators_insert" ON public.scenario_collaborators;
CREATE POLICY "scenario_collaborators_insert" ON public.scenario_collaborators
  FOR INSERT
  WITH CHECK (
    public.is_scenario_owner(scenario_id)
  );

-- was: EXISTS (SELECT 1 FROM scenarios
--              WHERE scenarios.id = scenario_collaborators.scenario_id
--                AND scenarios.created_by = auth.uid())
DROP POLICY IF EXISTS "scenario_collaborators_delete" ON public.scenario_collaborators;
CREATE POLICY "scenario_collaborators_delete" ON public.scenario_collaborators
  FOR DELETE
  USING (
    public.is_scenario_owner(scenario_id)
  );
