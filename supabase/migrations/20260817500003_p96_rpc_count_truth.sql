-- Phase 96 (COUNT-04 / COUNT-03 / DEAD-05) — RPC count truth.
--
-- Three functions, each re-created from its LIVE prosrc (pulled from pg_proc 2026-08-17 against
-- staging zkrcjzdemdmwhearhfgg, never from a stale migration copy) with the minimal diff. Each
-- keeps its existing SECURITY posture and RETURNS TABLE signature verbatim; GRANT EXECUTE is
-- re-stated. Companion to 20260817500002_p96_commitment_overdue_insert_gap.sql — the two land
-- together by necessity (see FULFILLMENT below).
--
-- ============================ THE WINNING NOTION, PER SURFACE ============================
-- (RULING-P96-01 condition 3 — the unification's own record.)
--   COMMITMENTS, everywhere (kanban card badge + toolbar chip, /commitments tabs, the analytics
--     fulfillment chart): the STORED `aa_commitments.status = 'overdue'` WINS. The trigger
--     `commitment_overdue_check` is authoritative — bidirectional on UPDATE (its ELSIF reverts
--     overdue -> in_progress when the due date is extended) and, since the companion migration,
--     INSERT-time too.
--   TASKS: the COMPUTED comparison WINS — `sla_deadline < NOW()` and not completed/cancelled.
--     No stored overdue notion exists for tasks.
--   INTAKE: the COMPUTED comparison WINS, and there is now ONE formula — the urgency-scaled SLA
--     (critical 24h / high 48h / medium 72h / low 7d / else 72h) the `unified_work_items` view
--     already uses. The kanban RPC's flat `submitted_at + 3 days` is replaced by it.
--   The COUNT-04 refusal interaction ships BYTE-UNCHANGED (branch (a), D-10). A future
--   allow-and-reflect revisit is a post-close mutation that must NAME the gates whose subjects it
--   changes — at minimum this plan's gates and 96-09's badge/chip oracles.
--
-- ================================ FILTER SEAMS (D-15) ==================================
-- 1. get_commitment_fulfillment — relation `aa_commitments` (outer filter `status <> 'cancelled'
--    AND created_at <= p_end_date`, UNCHANGED).
--      was: overdue bucket = COUNT(*) FILTER (WHERE status IN ('pending','in_progress')
--                                             AND due_date < NOW())
--      now: overdue bucket = COUNT(*) FILTER (WHERE status = 'overdue')
--    WHY IT MUST CHANGE HERE: the old filter is blind to stored `overdue` — it reported 2 (the
--    INSERT-gap rows) against 8 stored. The companion migration empties the past-due
--    pending/in_progress class permanently, which would have driven this chart series to 0
--    FOREVER, silently. Who else reads a different filter: the `unified_work_items` view's
--    commitments arm and `PersonalCommitmentsDashboard.tsx` still compute
--    `due_date < CURRENT_DATE AND status NOT IN (completed,cancelled)` — at rest those now agree
--    with the stored status because the trigger keeps them in lockstep; that view body is NOT
--    changed by this migration (falls outside).
--
-- 2. get_unified_work_kanban — relations `tasks`, `aa_commitments`, `intake_tickets`.
--      was: tasks arm       WHERE status NOT IN ('completed','cancelled')
--           commitments arm WHERE status NOT IN ('completed','cancelled')
--      now: tasks arm       WHERE status <> 'cancelled'
--           commitments arm WHERE status <> 'cancelled'
--      was: commitments is_overdue = due_date < CURRENT_DATE AND status NOT IN (completed,cancelled)
--      now: commitments is_overdue = status = 'overdue'
--      was: intake deadline/is_overdue/days_until_due = flat `submitted_at + INTERVAL '3 days'`
--      now: intake deadline/is_overdue/days_until_due = the urgency-scaled SLA, copied from the
--           `unified_work_items` view. All three adopt it together: leaving `deadline` flat while
--           `is_overdue` scaled would print a card whose shown date contradicts its own badge.
--    UNCHANGED, a STATED SEAM not a drop: the intake arm's own lifecycle filtering stays
--    `status NOT IN ('converted','closed','merged')` (the view uses ('resolved','closed',
--    'cancelled') for its own is_overdue predicate — intake's lifecycle is out of scope here).
--    A SECOND STATED SEAM, pre-existing and untouched: a commitment stored `overdue` maps to
--    column_key 'overdue', which is not one of the board's columns — that CASE is byte-unchanged
--    by this migration and is named here so its silence is not read as a finding.
--
-- 3. get_kanban_column_counts — same three relations; the SAME tasks/commitments filter change,
--    so its per-column counts agree with the board rows BY CONSTRUCTION rather than by
--    authorship. Its intake arm carries no overdue expression, so the SLA change does not apply.
--
-- =========================== SC5 DONE SEMANTICS, DECIDED ================================
-- The kanban Done column SHOWS COMPLETED WORK. Today the `completed -> 'done'` column_key mapping
-- is dead code: every arm excludes completed rows, so the column is structurally starved and only
-- an invariant-VIOLATING row could ever render there. Changing the exclusion to
-- `status <> 'cancelled'` makes the existing mapping live. No recency bound (staging volumes are
-- small); adding one later is a post-close mutation that must name this migration's gates and
-- 96-07 / 96-09's agreement oracles as its changed subjects.
--
-- ===================== SC4 RECONCILIATION RULE (stated where the population changes) =========
-- This filter change makes the board's TOTAL population structurally UNEQUAL to the SC4
-- active-work surfaces: the board now holds completed rows in Done that no other compared surface
-- counts. THE RULE: the SC4 kanban leg compares the board's ACTIVE population — rows in columns
-- EXCLUDING Done (`column_key <> 'done'`; cancelled is never returned) — the same-work subset,
-- measured same-clock by 96-07 Task 3's kanban leg (Test 4) with the completed-rows-in-Done seam
-- and the client-identity seam stated in its capture (ACCEPTANCE condition 7's seam-stated
-- branch). Comparing the board's TOTAL against an active-work surface would be a false
-- disagreement manufactured by this migration.
--
-- FORBIDDEN SHAPES, named (condition 8): no client-side re-implementation of what the trigger
-- enforces — this migration touches only DB objects; `commitment_status_history` is never read as
-- user-intent evidence (BEFORE triggers fire alphabetically; the audit reads the REWRITTEN status
-- by design).

-- =============================================================================
-- 1. get_commitment_fulfillment — the overdue bucket counts the STORED fact.
-- =============================================================================
CREATE OR REPLACE FUNCTION public.get_commitment_fulfillment(
  p_start_date timestamp with time zone DEFAULT (now() - '30 days'::interval),
  p_end_date timestamp with time zone DEFAULT now()
)
RETURNS TABLE(
  total_commitments bigint, completed_on_time bigint, completed_late bigint, overdue bigint,
  pending bigint, fulfillment_rate numeric, on_time_rate numeric, avg_completion_days numeric,
  fulfillment_trend jsonb, by_source jsonb, by_tracking_type jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  WITH commitment_stats AS (
    SELECT
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE status = 'completed' AND completed_at <= due_date) AS on_time,
      COUNT(*) FILTER (WHERE status = 'completed' AND completed_at > due_date) AS late,
      -- P96 COUNT-04: the STORED notion wins for commitments (was: status IN
      -- ('pending','in_progress') AND due_date < NOW() — blind to stored 'overdue').
      COUNT(*) FILTER (WHERE status = 'overdue') AS overdue_count,
      COUNT(*) FILTER (WHERE status IN ('pending', 'in_progress') AND (due_date >= NOW() OR due_date IS NULL)) AS pending_count,
      COUNT(*) FILTER (WHERE status = 'completed') AS completed,
      AVG(CASE WHEN completed_at IS NOT NULL THEN EXTRACT(DAY FROM completed_at - created_at) ELSE NULL END)::NUMERIC AS avg_days
    FROM aa_commitments WHERE status != 'cancelled' AND created_at <= p_end_date
  ),
  trend_data AS (
    SELECT COALESCE(jsonb_agg(jsonb_build_object('date', dt::TEXT, 'value', COALESCE(rate, 0)) ORDER BY dt), '[]'::JSONB) AS data
    FROM generate_series(DATE_TRUNC('week', p_start_date), DATE_TRUNC('week', p_end_date), '1 week'::INTERVAL) AS dt
    LEFT JOIN (SELECT DATE_TRUNC('week', completed_at) AS week, ROUND((COUNT(*) FILTER (WHERE completed_at <= due_date)::NUMERIC / NULLIF(COUNT(*), 0)) * 100, 1) AS rate
      FROM aa_commitments WHERE status = 'completed' AND completed_at BETWEEN p_start_date AND p_end_date GROUP BY DATE_TRUNC('week', completed_at)) weekly ON dt = weekly.week
  ),
  by_tracking AS (
    SELECT COALESCE(jsonb_agg(jsonb_build_object('trackingType', tracking_mode, 'total', total, 'completed', completed, 'fulfillmentRate', ROUND((completed::NUMERIC / NULLIF(total, 0)) * 100, 1))), '[]'::JSONB) AS data
    FROM (SELECT COALESCE(tracking_mode, 'delivery') AS tracking_mode, COUNT(*) AS total, COUNT(*) FILTER (WHERE status = 'completed') AS completed
      FROM aa_commitments WHERE status != 'cancelled' AND created_at <= p_end_date GROUP BY tracking_mode) t
  )
  SELECT cs.total, cs.on_time, cs.late, cs.overdue_count, cs.pending_count,
    ROUND((cs.completed::NUMERIC / NULLIF(cs.total, 0)) * 100, 1),
    ROUND((cs.on_time::NUMERIC / NULLIF(cs.completed, 0)) * 100, 1),
    ROUND(COALESCE(cs.avg_days, 0), 1), td.data, '[]'::JSONB, bt.data
  FROM commitment_stats cs CROSS JOIN trend_data td CROSS JOIN by_tracking bt;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.get_commitment_fulfillment(timestamp with time zone, timestamp with time zone) TO authenticated;

-- =============================================================================
-- 2. get_unified_work_kanban — Done can fill; stored-overdue commitments arm;
--    one intake SLA formula.
-- =============================================================================
CREATE OR REPLACE FUNCTION public.get_unified_work_kanban(
  p_context_type kanban_context_type,
  p_context_id uuid DEFAULT NULL::uuid,
  p_column_mode kanban_column_mode DEFAULT 'status'::kanban_column_mode,
  p_source_filter text[] DEFAULT NULL::text[],
  p_search_query text DEFAULT NULL::text,
  p_limit_per_column integer DEFAULT 50
)
RETURNS TABLE(
  id uuid, source text, title text, title_ar text, description text, priority text, status text,
  workflow_stage text, column_key text, tracking_type text, deadline timestamp with time zone,
  is_overdue boolean, days_until_due integer, assignee_id uuid, assignee_name text,
  assignee_avatar_url text, dossier_id uuid, engagement_id uuid,
  created_at timestamp with time zone, updated_at timestamp with time zone, metadata jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_user_id UUID := auth.uid();
  v_search TEXT := NULLIF(TRIM(p_search_query), '');
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  RETURN QUERY
  WITH base_items AS (
    -- TASKS (cast title varchar->text, priority/status enum->text)
    SELECT
      t.id,
      'task'::TEXT as source,
      t.title::TEXT,
      NULL::TEXT as title_ar,
      t.description,
      t.priority::TEXT,
      t.status::TEXT,
      t.workflow_stage,
      CASE p_column_mode
        WHEN 'status' THEN COALESCE(t.workflow_stage, t.status::TEXT)
        WHEN 'priority' THEN t.priority::TEXT
        WHEN 'tracking_type' THEN
          CASE WHEN t.sla_deadline IS NOT NULL THEN 'sla' ELSE 'delivery' END
      END as column_key,
      CASE WHEN t.sla_deadline IS NOT NULL THEN 'sla' ELSE 'delivery' END as tracking_type,
      t.sla_deadline as deadline,
      -- Tasks: the COMPUTED notion wins (unchanged). Completed rows now reach this expression
      -- and correctly evaluate false.
      t.sla_deadline < NOW() AND t.status NOT IN ('completed', 'cancelled') as is_overdue,
      CASE
        WHEN t.sla_deadline IS NULL THEN NULL
        ELSE EXTRACT(DAY FROM t.sla_deadline - NOW())::INT
      END as days_until_due,
      t.assignee_id,
      u.full_name as assignee_name,
      u.avatar_url as assignee_avatar_url,
      NULL::UUID as dossier_id,
      t.engagement_id,
      t.created_at,
      t.updated_at,
      jsonb_build_object(
        'type', t.type,
        'work_item_type', t.work_item_type,
        'work_item_id', t.work_item_id
      ) as metadata
    FROM tasks t
    LEFT JOIN users u ON t.assignee_id = u.id
    WHERE t.is_deleted = FALSE
      -- P96 SC5: Done shows completed work (was: status NOT IN ('completed','cancelled')).
      AND t.status <> 'cancelled'
      AND (
        (p_context_type = 'personal' AND t.assignee_id = v_user_id)
        OR (p_context_type = 'engagement' AND t.engagement_id = p_context_id)
        OR (p_context_type = 'dossier' AND t.work_item_type = 'dossier' AND t.work_item_id = p_context_id)
      )
      AND (p_source_filter IS NULL OR 'task' = ANY(p_source_filter))
      AND (v_search IS NULL OR t.title ILIKE '%' || v_search || '%' OR t.description ILIKE '%' || v_search || '%')

    UNION ALL

    -- AA_COMMITMENTS (cast title varchar->text, use owner_user_id, due_date)
    SELECT
      c.id,
      'commitment'::TEXT as source,
      c.title::TEXT,
      c.title_ar,
      c.description,
      c.priority,
      c.status,
      NULL::TEXT as workflow_stage,
      CASE p_column_mode
        WHEN 'status' THEN
          CASE c.status
            WHEN 'completed' THEN 'done'
            WHEN 'cancelled' THEN 'cancelled'
            ELSE c.status
          END
        WHEN 'priority' THEN c.priority
        WHEN 'tracking_type' THEN c.tracking_mode
      END as column_key,
      c.tracking_mode as tracking_type,
      c.due_date::TIMESTAMPTZ as deadline,
      -- P96 COUNT-04: the STORED notion wins for commitments (was: due_date < CURRENT_DATE AND
      -- status NOT IN ('completed','cancelled')). The trigger is authoritative.
      c.status = 'overdue' as is_overdue,
      CASE
        WHEN c.due_date IS NULL THEN NULL
        ELSE (c.due_date - CURRENT_DATE)::INT
      END as days_until_due,
      c.owner_user_id as assignee_id,
      u.full_name as assignee_name,
      u.avatar_url as assignee_avatar_url,
      c.dossier_id,
      NULL::UUID as engagement_id,
      c.created_at,
      c.updated_at,
      jsonb_build_object(
        'proof_required', c.proof_required,
        'proof_url', c.proof_url,
        'evidence_submitted_at', c.evidence_submitted_at,
        'tracking_mode', c.tracking_mode,
        'after_action_id', c.after_action_id
      ) as metadata
    FROM aa_commitments c
    LEFT JOIN users u ON c.owner_user_id = u.id
    WHERE c.is_deleted = FALSE
      -- P96 SC5: Done shows completed work (was: status NOT IN ('completed','cancelled')).
      AND c.status <> 'cancelled'
      AND (
        (p_context_type = 'personal' AND c.owner_user_id = v_user_id)
        OR (p_context_type = 'dossier' AND c.dossier_id = p_context_id)
      )
      AND (p_source_filter IS NULL OR 'commitment' = ANY(p_source_filter))
      AND (v_search IS NULL OR c.title ILIKE '%' || v_search || '%' OR c.description ILIKE '%' || v_search || '%' OR c.title_ar ILIKE '%' || v_search || '%')

    UNION ALL

    -- INTAKE_TICKETS (cast priority/status enum->text)
    SELECT
      i.id,
      'intake'::TEXT as source,
      i.title,
      i.title_ar,
      i.description,
      i.priority::TEXT,
      i.status::TEXT,
      NULL::TEXT as workflow_stage,
      CASE p_column_mode
        WHEN 'status' THEN
          CASE i.status::TEXT
            WHEN 'converted' THEN 'done'
            WHEN 'closed' THEN 'cancelled'
            WHEN 'merged' THEN 'cancelled'
            WHEN 'draft' THEN 'todo'
            WHEN 'submitted' THEN 'todo'
            WHEN 'triaged' THEN 'todo'
            WHEN 'assigned' THEN 'in_progress'
            WHEN 'in_progress' THEN 'in_progress'
            ELSE 'todo'
          END
        WHEN 'priority' THEN i.priority::TEXT
        WHEN 'tracking_type' THEN 'sla'
      END as column_key,
      'sla'::TEXT as tracking_type,
      -- P96 COUNT-04: ONE intake SLA formula. The urgency-scaled deadline is copied from the
      -- unified_work_items view (was: flat `submitted_at + INTERVAL '3 days'` on all three of
      -- deadline / is_overdue / days_until_due).
      CASE i.urgency::TEXT
        WHEN 'critical' THEN i.submitted_at + INTERVAL '24 hours'
        WHEN 'high' THEN i.submitted_at + INTERVAL '48 hours'
        WHEN 'medium' THEN i.submitted_at + INTERVAL '72 hours'
        WHEN 'low' THEN i.submitted_at + INTERVAL '7 days'
        ELSE i.submitted_at + INTERVAL '72 hours'
      END as deadline,
      (
        CASE i.urgency::TEXT
          WHEN 'critical' THEN i.submitted_at + INTERVAL '24 hours'
          WHEN 'high' THEN i.submitted_at + INTERVAL '48 hours'
          WHEN 'medium' THEN i.submitted_at + INTERVAL '72 hours'
          WHEN 'low' THEN i.submitted_at + INTERVAL '7 days'
          ELSE i.submitted_at + INTERVAL '72 hours'
        END
      ) < NOW()
        AND i.status NOT IN ('converted', 'closed', 'merged') as is_overdue,
      CASE
        WHEN i.submitted_at IS NULL THEN NULL
        ELSE EXTRACT(DAY FROM (
          CASE i.urgency::TEXT
            WHEN 'critical' THEN i.submitted_at + INTERVAL '24 hours'
            WHEN 'high' THEN i.submitted_at + INTERVAL '48 hours'
            WHEN 'medium' THEN i.submitted_at + INTERVAL '72 hours'
            WHEN 'low' THEN i.submitted_at + INTERVAL '7 days'
            ELSE i.submitted_at + INTERVAL '72 hours'
          END
        ) - NOW())::INT
      END as days_until_due,
      i.assigned_to as assignee_id,
      u.full_name as assignee_name,
      u.avatar_url as assignee_avatar_url,
      i.dossier_id,
      NULL::UUID as engagement_id,
      i.created_at,
      i.updated_at,
      jsonb_build_object(
        'ticket_number', i.ticket_number,
        'request_type', i.request_type,
        'urgency', i.urgency,
        'sensitivity', i.sensitivity,
        'assigned_unit', i.assigned_unit
      ) as metadata
    FROM intake_tickets i
    LEFT JOIN users u ON i.assigned_to = u.id
    -- Intake lifecycle filtering UNCHANGED (stated seam, not a drop).
    WHERE i.status NOT IN ('converted', 'closed', 'merged')
      AND (
        (p_context_type = 'personal' AND i.assigned_to = v_user_id)
        OR (p_context_type = 'dossier' AND i.dossier_id = p_context_id)
      )
      AND (p_source_filter IS NULL OR 'intake' = ANY(p_source_filter))
      AND (v_search IS NULL OR i.title ILIKE '%' || v_search || '%' OR i.description ILIKE '%' || v_search || '%' OR i.title_ar ILIKE '%' || v_search || '%')
  ),
  ranked_items AS (
    SELECT
      bi.*,
      ROW_NUMBER() OVER (
        PARTITION BY bi.column_key
        ORDER BY
          bi.is_overdue DESC NULLS LAST,
          bi.deadline ASC NULLS LAST,
          bi.created_at ASC
      ) as rn
    FROM base_items bi
  )
  SELECT
    ri.id,
    ri.source,
    ri.title,
    ri.title_ar,
    ri.description,
    ri.priority,
    ri.status,
    ri.workflow_stage,
    ri.column_key,
    ri.tracking_type,
    ri.deadline,
    ri.is_overdue,
    ri.days_until_due,
    ri.assignee_id,
    ri.assignee_name,
    ri.assignee_avatar_url,
    ri.dossier_id,
    ri.engagement_id,
    ri.created_at,
    ri.updated_at,
    ri.metadata
  FROM ranked_items ri
  WHERE ri.rn <= p_limit_per_column
  ORDER BY
    ri.column_key,
    ri.is_overdue DESC NULLS LAST,
    ri.deadline ASC NULLS LAST;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.get_unified_work_kanban(kanban_context_type, uuid, kanban_column_mode, text[], text, integer) TO authenticated;

-- =============================================================================
-- 3. get_kanban_column_counts — the SAME filter change, so the per-column counts
--    agree with the board rows by construction.
-- =============================================================================
CREATE OR REPLACE FUNCTION public.get_kanban_column_counts(
  p_context_type kanban_context_type,
  p_context_id uuid DEFAULT NULL::uuid,
  p_column_mode kanban_column_mode DEFAULT 'status'::kanban_column_mode,
  p_source_filter text[] DEFAULT NULL::text[],
  p_search_query text DEFAULT NULL::text
)
RETURNS TABLE(column_key text, total_count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_user_id UUID := auth.uid();
  v_search TEXT := NULLIF(TRIM(p_search_query), '');
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  RETURN QUERY
  WITH base_items AS (
    SELECT
      CASE p_column_mode
        WHEN 'status' THEN COALESCE(t.workflow_stage, t.status::TEXT)
        WHEN 'priority' THEN t.priority::TEXT
        WHEN 'tracking_type' THEN
          CASE WHEN t.sla_deadline IS NOT NULL THEN 'sla' ELSE 'delivery' END
      END as col_key
    FROM tasks t
    WHERE t.is_deleted = FALSE
      -- P96 SC5: matches get_unified_work_kanban's tasks arm (was: NOT IN ('completed','cancelled')).
      AND t.status <> 'cancelled'
      AND (
        (p_context_type = 'personal' AND t.assignee_id = v_user_id)
        OR (p_context_type = 'engagement' AND t.engagement_id = p_context_id)
        OR (p_context_type = 'dossier' AND t.work_item_type = 'dossier' AND t.work_item_id = p_context_id)
      )
      AND (p_source_filter IS NULL OR 'task' = ANY(p_source_filter))
      AND (v_search IS NULL OR t.title ILIKE '%' || v_search || '%' OR t.description ILIKE '%' || v_search || '%')

    UNION ALL

    SELECT
      CASE p_column_mode
        WHEN 'status' THEN
          CASE c.status
            WHEN 'completed' THEN 'done'
            WHEN 'cancelled' THEN 'cancelled'
            ELSE c.status
          END
        WHEN 'priority' THEN c.priority
        WHEN 'tracking_type' THEN c.tracking_mode
      END as col_key
    FROM aa_commitments c
    WHERE c.is_deleted = FALSE
      -- P96 SC5: matches get_unified_work_kanban's commitments arm.
      AND c.status <> 'cancelled'
      AND (
        (p_context_type = 'personal' AND c.owner_user_id = v_user_id)
        OR (p_context_type = 'dossier' AND c.dossier_id = p_context_id)
      )
      AND (p_source_filter IS NULL OR 'commitment' = ANY(p_source_filter))
      AND (v_search IS NULL OR c.title ILIKE '%' || v_search || '%' OR c.description ILIKE '%' || v_search || '%' OR c.title_ar ILIKE '%' || v_search || '%')

    UNION ALL

    SELECT
      CASE p_column_mode
        WHEN 'status' THEN
          CASE i.status::TEXT
            WHEN 'converted' THEN 'done'
            WHEN 'closed' THEN 'cancelled'
            WHEN 'merged' THEN 'cancelled'
            WHEN 'draft' THEN 'todo'
            WHEN 'submitted' THEN 'todo'
            WHEN 'triaged' THEN 'todo'
            WHEN 'assigned' THEN 'in_progress'
            WHEN 'in_progress' THEN 'in_progress'
            ELSE 'todo'
          END
        WHEN 'priority' THEN i.priority::TEXT
        WHEN 'tracking_type' THEN 'sla'
      END as col_key
    FROM intake_tickets i
    WHERE i.status NOT IN ('converted', 'closed', 'merged')
      AND (
        (p_context_type = 'personal' AND i.assigned_to = v_user_id)
        OR (p_context_type = 'dossier' AND i.dossier_id = p_context_id)
      )
      AND (p_source_filter IS NULL OR 'intake' = ANY(p_source_filter))
      AND (v_search IS NULL OR i.title ILIKE '%' || v_search || '%' OR i.description ILIKE '%' || v_search || '%' OR i.title_ar ILIKE '%' || v_search || '%')
  )
  SELECT bi.col_key as column_key, COUNT(*) as total_count
  FROM base_items bi
  GROUP BY bi.col_key;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.get_kanban_column_counts(kanban_context_type, uuid, kanban_column_mode, text[], text) TO authenticated;
