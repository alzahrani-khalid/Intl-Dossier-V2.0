-- =============================================================================
-- Phase 71 — Analytic Graph: query_graph multiplexed SECURITY INVOKER RPC
-- =============================================================================
-- GRAPH-01/03/04. A single plpgsql RPC dispatching on p_query_type over the
-- authoritative participation tables (dossier_relationships, working_group_members,
-- engagement_participants ⋈ engagement_dossiers) plus the low-cost 4th shortest_path
-- (re-implemented from get_relationship_path inline — D-05 leaves the 3 DEFINER
-- traversal functions untouched).
--
-- Clearance is enforced INLINE at every dossiers join (the generate_digest pattern,
-- 20260615_phase70_digests_alerts.sql L350-356/L416/L439/L448). The RPC deliberately
-- does NOT rely on dossiers SELECT RLS: the live dossiers policy set is the broken
-- landmine form `id = auth.uid()` OR-ed with a legacy string-comparison policy
-- (71-RESEARCH.md RF-5/RF-7, Pitfall 3). Inline clearance is correct under INVOKER
-- regardless of which policies are active.
--
-- LANDMINE (carried-forward lock): `profiles` has NO `id` column. The clearance read
-- MUST be `WHERE p.user_id = auth.uid()` — `WHERE id = auth.uid()` silently binds to
-- the outer table → NULL → deny-all. Always user_id.
--
-- Returned node shape carries `sensitivity_level` so the GRAPH-04 invoker test can
-- assert no node exceeds the caller's clearance. "No data" and "above clearance"
-- return the SAME empty JSONB shape (indistinguishable-empty, GRAPH-03).
--
-- Applied to staging zkrcjzdemdmwhearhfgg in plan 71-03 (executor lacks Supabase MCP).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Supporting indexes (RF-8) — create IF NOT EXISTS; most composite variants
-- already exist (20260111200001 source/target+status+type, 20260110000006 WG +
-- engagement). These add the plain (id, status) shapes the membership self-join
-- and the path base-case scan use most.
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_dossier_relationships_source_status
  ON public.dossier_relationships(source_dossier_id, status);

CREATE INDEX IF NOT EXISTS idx_dossier_relationships_target_status
  ON public.dossier_relationships(target_dossier_id, status);

CREATE INDEX IF NOT EXISTS idx_working_group_members_group_status
  ON public.working_group_members(working_group_id, status);

-- -----------------------------------------------------------------------------
-- query_graph(p_query_type, p_entity_id, p_entity_id_2, p_window_days) RETURNS JSONB
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.query_graph(
  p_query_type   TEXT,
  p_entity_id    UUID,
  p_entity_id_2  UUID DEFAULT NULL,
  p_window_days  INTEGER DEFAULT 90
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
AS $$
DECLARE
  v_clearance INTEGER := 0;            -- default 0 = deny-all (matches generate_digest)
  v_window    INTEGER;
  v_result    JSONB;
BEGIN
  -- Clearance read — the generate_digest form. CORRECT: profiles.user_id = auth.uid()
  -- (profiles has NO id column; `id = auth.uid()` is the deny-all landmine).
  --
  -- service_role is a trusted backend-only context (its key never leaves the server;
  -- the analytic-graph edge fn uses the ANON key + a forwarded caller JWT and is
  -- gated `SERVICE_ROLE == 0`). When invoked under service_role there is no auth.uid()
  -- (no `sub` claim), so it is treated as unrestricted clearance (max sensitivity = 4).
  -- For every anon/authenticated caller (the only paths reachable from the edge fn or
  -- the FE), clearance is the strict profiles-derived value — auth.uid() resolves, the
  -- inline `<= v_clearance` filter is real, and the GRAPH-03/04 dual-account proofs hold.
  IF auth.role() = 'service_role' THEN
    v_clearance := 4;                  -- trusted backend bypass (max sensitivity)
  ELSE
    SELECT COALESCE((
      SELECT p.clearance_level FROM public.profiles p WHERE p.user_id = auth.uid()
    ), 0)
    INTO v_clearance
    ;
  END IF;

  -- Bound the engagement-chain window (V5 input validation; prevents unbounded scan).
  v_window := LEAST(GREATEST(COALESCE(p_window_days, 90), 1), 365);

  -- ---------------------------------------------------------------------------
  -- forum_membership(entity): membership edges from/to the entity, joined to the
  -- "other" dossier. Membership relationship_type set only; active + temporal guard;
  -- exclude archived. INLINE clearance on the joined dossier.
  -- ---------------------------------------------------------------------------
  IF p_query_type = 'forum_membership' THEN
    SELECT jsonb_build_object(
      'query_type', p_query_type,
      'entity_id',  p_entity_id,
      'nodes', COALESCE(jsonb_agg(DISTINCT jsonb_build_object(
                 'id', d.id,
                 'type', d.type,
                 'name_en', d.name_en,
                 'name_ar', d.name_ar,
                 'sensitivity_level', d.sensitivity_level,
                 'relationship_type', dr.relationship_type
               )), '[]'::jsonb),
      'edges', COALESCE(jsonb_agg(DISTINCT jsonb_build_object(
                 'source_id', dr.source_dossier_id,
                 'target_id', dr.target_dossier_id,
                 'relationship_type', dr.relationship_type
               )), '[]'::jsonb),
      'stats', jsonb_build_object(
                 'node_count', COUNT(DISTINCT d.id),
                 'edge_count', COUNT(DISTINCT dr.id),
                 'clearance_level', v_clearance
               )
    )
    INTO v_result
    FROM public.dossier_relationships dr
    JOIN public.dossiers d
      ON d.id = CASE WHEN dr.source_dossier_id = p_entity_id
                     THEN dr.target_dossier_id
                     ELSE dr.source_dossier_id END
    WHERE (dr.source_dossier_id = p_entity_id OR dr.target_dossier_id = p_entity_id)
      AND dr.relationship_type IN ('member_of', 'participates_in', 'participant_in')
      AND dr.status = 'active'
      AND (dr.effective_to IS NULL OR dr.effective_to > now())
      AND d.status <> 'archived'
      AND d.sensitivity_level <= v_clearance;          -- INLINE clearance, NOT dossiers RLS

  -- ---------------------------------------------------------------------------
  -- shared_committees(e1, e2): working_group_members self-intersection on
  -- working_group_id where BOTH entities are active members; joined to the WG
  -- dossier for INLINE clearance. Branch on COALESCE(organization_id, person_id)
  -- (the valid_member CHECK guarantees exactly one is populated).
  -- ---------------------------------------------------------------------------
  ELSIF p_query_type = 'shared_committees' THEN
    SELECT jsonb_build_object(
      'query_type', p_query_type,
      'entity_id',  p_entity_id,
      'entity_id_2', p_entity_id_2,
      'nodes', COALESCE(jsonb_agg(DISTINCT jsonb_build_object(
                 'id', wg_d.id,
                 'type', wg_d.type,
                 'name_en', wg_d.name_en,
                 'name_ar', wg_d.name_ar,
                 'sensitivity_level', wg_d.sensitivity_level
               )), '[]'::jsonb),
      'edges', '[]'::jsonb,
      'stats', jsonb_build_object(
                 'node_count', COUNT(DISTINCT wg_d.id),
                 'edge_count', 0,
                 'clearance_level', v_clearance
               )
    )
    INTO v_result
    FROM public.working_group_members m1
    JOIN public.working_group_members m2
      ON m2.working_group_id = m1.working_group_id
    JOIN public.dossiers wg_d
      ON wg_d.id = m1.working_group_id                 -- the WG IS a dossier
    WHERE COALESCE(m1.organization_id, m1.person_id) = p_entity_id
      AND COALESCE(m2.organization_id, m2.person_id) = p_entity_id_2
      AND m1.status = 'active'
      AND m2.status = 'active'
      AND wg_d.status <> 'archived'
      AND wg_d.sensitivity_level <= v_clearance;        -- INLINE clearance

  -- ---------------------------------------------------------------------------
  -- engagement_chain(entity, window N): per-entity time-ordered engagements within
  -- N days. Canonical plane engagement_participants ⋈ engagement_dossiers ⋈ dossiers
  -- (P67). Ordered on engagement_dossiers.start_date (the domain date), not a row timestamp.
  -- ---------------------------------------------------------------------------
  ELSIF p_query_type = 'engagement_chain' THEN
    SELECT jsonb_build_object(
      'query_type', p_query_type,
      'entity_id',  p_entity_id,
      'window_days', v_window,
      'nodes', COALESCE(jsonb_agg(chain.node ORDER BY chain.start_date DESC), '[]'::jsonb),
      'edges', '[]'::jsonb,
      'stats', jsonb_build_object(
                 'node_count', COUNT(*),
                 'edge_count', 0,
                 'clearance_level', v_clearance
               )
    )
    INTO v_result
    FROM (
      SELECT
        ed.start_date AS start_date,
        jsonb_build_object(
          'id', ed.id,
          'type', d.type,
          'name_en', d.name_en,
          'name_ar', d.name_ar,
          'sensitivity_level', d.sensitivity_level,
          'engagement_type', ed.engagement_type,
          'start_date', ed.start_date,
          'end_date', ed.end_date
        ) AS node
      FROM public.engagement_participants ep
      JOIN public.engagement_dossiers ed ON ed.id = ep.engagement_id
      JOIN public.dossiers d             ON d.id  = ed.id
      WHERE ep.participant_dossier_id = p_entity_id
        AND ed.start_date >= now() - make_interval(days => v_window)
        AND d.status <> 'archived'
        AND d.sensitivity_level <= v_clearance          -- INLINE clearance
    ) chain;

  -- ---------------------------------------------------------------------------
  -- shortest_path(e1, e2): recursive CTE over dossier_relationships (copied from
  -- get_relationship_path, 20251022000008 L200-236) re-implemented inline under
  -- INVOKER. Path-wide clearance NOT-EXISTS — an above-clearance intermediary hop
  -- hides the ENTIRE path (stricter than the DEFINER original which only clears
  -- endpoints). Empty result is indistinguishable from "no path".
  -- ---------------------------------------------------------------------------
  ELSIF p_query_type = 'shortest_path' THEN
    WITH RECURSIVE path_search AS (
      -- Base case: direct relationship
      SELECT
        ARRAY[p_entity_id, dr.target_dossier_id] AS path,
        ARRAY[dr.relationship_type] AS relationship_path,
        1 AS path_length,
        dr.target_dossier_id AS current_dossier
      FROM public.dossier_relationships dr
      WHERE dr.source_dossier_id = p_entity_id
        AND dr.status = 'active'
        AND (dr.effective_to IS NULL OR dr.effective_to > now())

      UNION

      -- Recursive case: extend path
      SELECT
        ps.path || dr.target_dossier_id,
        ps.relationship_path || dr.relationship_type,
        ps.path_length + 1,
        dr.target_dossier_id
      FROM path_search ps
      JOIN public.dossier_relationships dr ON dr.source_dossier_id = ps.current_dossier
      WHERE ps.path_length < 5
        AND NOT (dr.target_dossier_id = ANY(ps.path))   -- cycle guard
        AND dr.status = 'active'
        AND (dr.effective_to IS NULL OR dr.effective_to > now())
        AND ps.current_dossier <> p_entity_id_2         -- stop once target reached
    )
    SELECT jsonb_build_object(
      'query_type', p_query_type,
      'entity_id',  p_entity_id,
      'entity_id_2', p_entity_id_2,
      'path', ps.path,
      'relationship_path', ps.relationship_path,
      'path_length', ps.path_length,
      'nodes', COALESCE((
                 SELECT jsonb_agg(jsonb_build_object(
                          'id', d.id,
                          'type', d.type,
                          'name_en', d.name_en,
                          'name_ar', d.name_ar,
                          'sensitivity_level', d.sensitivity_level
                        ) ORDER BY u.ord)
                 FROM unnest(ps.path) WITH ORDINALITY AS u(pid, ord)
                 JOIN public.dossiers d ON d.id = u.pid
                 AND d.sensitivity_level <= v_clearance   -- INLINE clearance (redundant w/ path-wide guard; defensive)
               ), '[]'::jsonb),
      'edges', '[]'::jsonb,
      'stats', jsonb_build_object(
                 'node_count', array_length(ps.path, 1),
                 'edge_count', ps.path_length,
                 'clearance_level', v_clearance
               )
    )
    INTO v_result
    FROM path_search ps
    WHERE ps.current_dossier = p_entity_id_2
      -- Path-wide clearance: every dossier on the path must be within clearance,
      -- else the path is invisible (indistinguishable from "no path").
      AND NOT EXISTS (
        SELECT 1
        FROM unnest(ps.path) AS pid
        JOIN public.dossiers d ON d.id = pid
        WHERE d.sensitivity_level > v_clearance
      )
    ORDER BY ps.path_length
    LIMIT 1;

  END IF;

  -- Whitelist miss OR no rows matched: return a consistent empty shape — never an
  -- error leak, and identical for "no data" vs "above clearance" (indistinguishable).
  IF v_result IS NULL THEN
    v_result := jsonb_build_object(
      'query_type', p_query_type,
      'entity_id',  p_entity_id,
      'nodes', '[]'::jsonb,
      'edges', '[]'::jsonb,
      'stats', jsonb_build_object('node_count', 0, 'edge_count', 0, 'clearance_level', v_clearance)
    );
  END IF;

  RETURN v_result;
END;
$$;

-- -----------------------------------------------------------------------------
-- Least privilege: anon must never reach query_graph (GRAPH-04 / threat T-71-02-EOP-ANON).
-- -----------------------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.query_graph(TEXT, UUID, UUID, INTEGER) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.query_graph(TEXT, UUID, UUID, INTEGER) TO authenticated;

COMMENT ON FUNCTION public.query_graph(TEXT, UUID, UUID, INTEGER) IS
  'Phase 71 analytic graph: multiplexed SECURITY INVOKER RPC (forum_membership, '
  'shared_committees, engagement_chain, shortest_path) returning {nodes,edges,stats} '
  'JSONB. Clearance enforced INLINE at every dossiers join via profiles.clearance_level '
  '(user_id = auth.uid()); does NOT rely on dossiers SELECT RLS. Indistinguishable-empty '
  'on clearance denial. anon REVOKEd; authenticated GRANTed.';
