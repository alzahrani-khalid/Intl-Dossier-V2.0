-- Phase 96 · 96-07 · COUNT-01 (criterion 4) — get_dashboard_stats tells one truth per KPI.
--
-- WHY. Live same-clock measurement 2026-08-17: the KPI strip said 3 active engagements while
-- /engagements rendered 5. Both numbers were "correct" for their own filter — which is exactly the
-- class criterion 4 kills. A KPI carrying a general label over a narrower population is a wrong
-- number, not a different opinion. This migration re-points that one KPI at the population the
-- list renders and WRITES DOWN the source relation + filter of every KPI in the row, so the next
-- reader compares filters instead of re-deriving them.
--
-- Base: the LIVE prosrc pulled from pg_proc on 2026-08-17 (never the stale migration copy).
-- Diff: ONE expression (active_engagements). Everything else is byte-preserved.
--
-- ============================================================================================
-- KPI POPULATION TABLE — every KPI's source relation and filter (the filter-seam record)
-- ============================================================================================
--
-- 1. active_engagements  [CHANGED HERE]
--      NOW:    public.dossiers WHERE type = 'engagement' AND status = 'active'
--              — verbatim the population the engagements LIST renders (one number, one
--                population). Measured 2026-08-17: 5.
--      BEFORE: engagement_dossiers ed JOIN dossiers d ON d.id = ed.id
--              WHERE d.status = 'active' AND ed.lifecycle_stage != 'closed'  → measured 3.
--      -- seam closed: the lifecycle-filtered count was a narrower population wearing a general
--         label. A dossier of type 'engagement' with no engagement_dossiers extension row was
--         also silently dropped by the join (the COUNT-02 extension-row class, 96-10) — the new
--         expression cannot drop it, because it never joins.
--
-- 2. open_tasks  [UNCHANGED — already the /my-work active definition, verified, not assumed]
--      unified_work_items WHERE status NOT IN ('completed','cancelled','closed','converted')
--                           AND (p_user_id IS NULL OR assigned_to = p_user_id)
--      This IS the derivation the /my-work badge/footer/rows now share (96-07 Task 2 points the
--      page at this same four-value exclusion), so KPI-vs-badge agreement is by shared
--      derivation, not by coincidence. Measured 2026-08-17 for the TEST_USER: 18.
--      -- seam (stated, NOT silently changed): public.user_work_summary.total_active — the RPC
--         behind the "Total Active" tile — excludes FIVE values
--         ('completed','cancelled','resolved','closed','done'): it adds 'resolved'/'done' and
--         omits 'converted'. The two lists agree today (18 = 18, zero rows carry a status in the
--         symmetric difference, measured) but they are not the same predicate. The tile keeps its
--         own label ("Total Active" = the summary population); the badge/footer/rows keep this
--         one. Unifying the view is a schema change no decision authorises here.
--
-- 3. sla_at_risk  [UNCHANGED]
--      intake_tickets WHERE external_deadline IS NOT NULL
--                       AND external_deadline <= NOW() + INTERVAL '48 hours'
--                       AND status NOT IN ('closed','converted','merged')
--                       AND (p_user_id IS NULL OR assigned_to = p_user_id)
--      -- seam: 'merged' is excluded here but NOT by open_tasks' four-value list. Deliberate:
--         these are different questions (deadline pressure vs open work), stated so the two
--         intake numbers are never read as one population.
--
-- 4. upcoming_week  [UNCHANGED]
--      engagement_dossiers ed2 JOIN dossiers d2 ON d2.id = ed2.id
--        WHERE ed2.start_date BETWEEN NOW() AND NOW() + INTERVAL '7 days' AND d2.status='active'
--      UNION ALL
--      calendar_entries ce WHERE ce.event_date BETWEEN NOW()::DATE AND (NOW()+7d)::DATE
--                            AND (p_user_id IS NULL OR ce.organizer_id = p_user_id)
--      -- seam: the engagement arm ignores p_user_id while the calendar arm applies it, so this
--         KPI is org-wide in one half and personal in the other. Recorded, not changed — no
--         decision in this phase names it, and changing it would move a number no criterion
--         compares. `calendar_entries.event_date` is the correct column (D-04); calendar_events
--         is a separate, empty forum model and is NOT read here.
--
-- SECURITY POSTURE: unchanged. SECURITY DEFINER, no search_path pin (as live), no new relation
-- read that the function did not already read — `dossiers` was already joined by two of the four
-- sub-selects. CREATE OR REPLACE preserves the existing ACL; the GRANT below re-states the
-- authenticated grant rather than relying on that (T-96-16).

CREATE OR REPLACE FUNCTION public.get_dashboard_stats(p_user_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(active_engagements integer, open_tasks integer, sla_at_risk integer, upcoming_week integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY SELECT
    -- KPI 1 — the engagements LIST population, verbatim (see the population table above).
    (SELECT COUNT(*)::INTEGER FROM public.dossiers d
     WHERE d.type = 'engagement' AND d.status = 'active'),
    (SELECT COUNT(*)::INTEGER FROM unified_work_items wi
     WHERE wi.status::TEXT NOT IN ('completed', 'cancelled', 'closed', 'converted')
     AND (p_user_id IS NULL OR wi.assigned_to = p_user_id)),
    (SELECT COUNT(*)::INTEGER FROM intake_tickets it
     WHERE it.external_deadline IS NOT NULL
     AND it.external_deadline <= NOW() + INTERVAL '48 hours'
     AND it.status::TEXT NOT IN ('closed', 'converted', 'merged')
     AND (p_user_id IS NULL OR it.assigned_to = p_user_id)),
    (SELECT COUNT(*)::INTEGER FROM (
      SELECT ed2.id FROM engagement_dossiers ed2
      JOIN dossiers d2 ON d2.id = ed2.id
      WHERE ed2.start_date IS NOT NULL AND ed2.start_date >= NOW()
      AND ed2.start_date <= NOW() + INTERVAL '7 days' AND d2.status = 'active'
      UNION ALL
      SELECT ce.id FROM calendar_entries ce
      WHERE ce.event_date IS NOT NULL AND ce.event_date >= NOW()::DATE
      AND ce.event_date <= (NOW() + INTERVAL '7 days')::DATE
      AND (p_user_id IS NULL OR ce.organizer_id = p_user_id)
    ) events);
END;
$function$;

GRANT EXECUTE ON FUNCTION public.get_dashboard_stats(uuid) TO authenticated;
