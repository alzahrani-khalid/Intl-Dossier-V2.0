-- 20260610000001_capture_unified_work_stack.sql
-- Capture the live unified-work-item stack as a forward migration (live-only drift, my-work #3).
--
-- These 6 objects exist LIVE on staging (zkrcjzdemdmwhearhfgg) and are present in the
-- generated database.types.ts, but NO repo migration ever created them:
--   * VIEW  public.unified_work_items       (commitments + tasks + intake, unified)
--   * VIEW  public.user_work_summary        (per-user active/overdue/source counts; reads unified_work_items)
--   * MATVIEW public.user_productivity_metrics  (30d/all-time completion metrics; reads unified_work_items)
--   * FUNCTION public.get_unified_work_items (paginated, filtered reader of unified_work_items)
--   * FUNCTION public.get_user_work_summary  (reads user_work_summary)
--   * FUNCTION public.get_user_productivity_metrics (reads user_productivity_metrics)
-- (plus the matview's UNIQUE index + refresh helper refresh_user_productivity_metrics).
--
-- This migration captures the live definitions VERBATIM (via pg_get_viewdef /
-- pg_matviews.definition / pg_get_functiondef) so the repo reproduces what the
-- my-work UI already reads. Applied to staging 2026-06-10.
--
-- Idempotent no-op against live: CREATE OR REPLACE VIEW / CREATE MATERIALIZED VIEW
-- IF NOT EXISTS / CREATE OR REPLACE FUNCTION reproduce the existing objects without
-- altering them. Order is dependency-first: main view -> dependent view -> matview ->
-- index -> functions -> refresh helper.
--
-- NOTE (verified live, not the plan's assumption): the three get_* reader functions
-- are plain `LANGUAGE plpgsql` (NOT SECURITY DEFINER, NO `SET search_path`) on live.
-- They are reproduced exactly as they run today. Only refresh_user_productivity_metrics
-- is SECURITY DEFINER live, and that line is preserved.

BEGIN;

-- ---------------------------------------------------------------------------
-- Main view: unified_work_items (commitments + tasks + intake)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.unified_work_items AS
 SELECT c.id,
    'commitment'::work_source AS source,
    c.title,
    c.description,
    c.priority,
    c.status,
    c.owner_user_id AS assigned_to,
    c.due_date::timestamp with time zone AS deadline,
    c.completed_at,
    c.created_at,
    c.updated_at,
    c.dossier_id,
        CASE c.tracking_mode
            WHEN 'we_deliver'::text THEN 'delivery'::tracking_type
            WHEN 'they_deliver'::text THEN 'follow_up'::tracking_type
            ELSE 'delivery'::tracking_type
        END AS tracking_type,
        CASE
            WHEN (c.status <> ALL (ARRAY['completed'::text, 'cancelled'::text])) AND c.due_date < CURRENT_DATE THEN true
            ELSE false
        END AS is_overdue,
        CASE
            WHEN c.due_date IS NOT NULL THEN c.due_date - CURRENT_DATE
            ELSE NULL::integer
        END AS days_until_due,
    jsonb_build_object('proof_required', c.proof_required, 'proof_url', c.proof_url, 'evidence_submitted_at', c.evidence_submitted_at, 'tracking_mode', c.tracking_mode, 'after_action_id', c.after_action_id) AS metadata
   FROM aa_commitments c
  WHERE c.owner_user_id IS NOT NULL
UNION ALL
 SELECT t.id,
    'task'::work_source AS source,
    t.title,
    t.description,
    t.priority::text AS priority,
    t.status::text AS status,
    t.assignee_id AS assigned_to,
    t.sla_deadline AS deadline,
    t.completed_at,
    t.created_at,
    t.updated_at,
    (t.source ->> 'dossier_id'::text)::uuid AS dossier_id,
        CASE
            WHEN t.sla_deadline IS NOT NULL THEN 'sla'::tracking_type
            ELSE 'delivery'::tracking_type
        END AS tracking_type,
        CASE
            WHEN (t.status::text <> ALL (ARRAY['completed'::text, 'cancelled'::text, 'done'::text])) AND t.sla_deadline IS NOT NULL AND t.sla_deadline < now() THEN true
            ELSE false
        END AS is_overdue,
        CASE
            WHEN t.sla_deadline IS NOT NULL THEN EXTRACT(day FROM t.sla_deadline - now())::integer
            ELSE NULL::integer
        END AS days_until_due,
    jsonb_build_object('type', t.type::text, 'workflow_stage', t.workflow_stage, 'engagement_id', t.engagement_id, 'work_item_type', t.work_item_type, 'work_item_id', t.work_item_id) AS metadata
   FROM tasks t
  WHERE t.is_deleted = false AND t.assignee_id IS NOT NULL
UNION ALL
 SELECT i.id,
    'intake'::work_source AS source,
    i.title,
    i.description,
    i.priority::text AS priority,
    i.status::text AS status,
    i.assigned_to,
        CASE i.urgency::text
            WHEN 'critical'::text THEN i.submitted_at + '24:00:00'::interval
            WHEN 'high'::text THEN i.submitted_at + '48:00:00'::interval
            WHEN 'medium'::text THEN i.submitted_at + '72:00:00'::interval
            WHEN 'low'::text THEN i.submitted_at + '7 days'::interval
            ELSE i.submitted_at + '72:00:00'::interval
        END AS deadline,
    i.resolved_at AS completed_at,
    i.created_at,
    i.updated_at,
    i.dossier_id,
    'sla'::tracking_type AS tracking_type,
        CASE
            WHEN (i.status::text <> ALL (ARRAY['resolved'::text, 'closed'::text, 'cancelled'::text])) AND
            CASE i.urgency::text
                WHEN 'critical'::text THEN i.submitted_at + '24:00:00'::interval
                WHEN 'high'::text THEN i.submitted_at + '48:00:00'::interval
                WHEN 'medium'::text THEN i.submitted_at + '72:00:00'::interval
                WHEN 'low'::text THEN i.submitted_at + '7 days'::interval
                ELSE i.submitted_at + '72:00:00'::interval
            END < now() THEN true
            ELSE false
        END AS is_overdue,
        CASE
            WHEN i.submitted_at IS NOT NULL THEN EXTRACT(day FROM
            CASE i.urgency::text
                WHEN 'critical'::text THEN i.submitted_at + '24:00:00'::interval
                WHEN 'high'::text THEN i.submitted_at + '48:00:00'::interval
                WHEN 'medium'::text THEN i.submitted_at + '72:00:00'::interval
                WHEN 'low'::text THEN i.submitted_at + '7 days'::interval
                ELSE i.submitted_at + '72:00:00'::interval
            END - now())::integer
            ELSE NULL::integer
        END AS days_until_due,
    jsonb_build_object('ticket_number', i.ticket_number, 'request_type', i.request_type::text, 'urgency', i.urgency::text, 'sensitivity', i.sensitivity::text, 'assigned_unit', i.assigned_unit, 'source', i.source::text) AS metadata
   FROM intake_tickets i
  WHERE i.assigned_to IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Dependent view: user_work_summary (reads unified_work_items)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.user_work_summary AS
 SELECT assigned_to AS user_id,
    count(*) FILTER (WHERE status <> ALL (ARRAY['completed'::text, 'cancelled'::text, 'resolved'::text, 'closed'::text, 'done'::text])) AS total_active,
    count(*) FILTER (WHERE is_overdue = true) AS overdue_count,
    count(*) FILTER (WHERE (status <> ALL (ARRAY['completed'::text, 'cancelled'::text, 'resolved'::text, 'closed'::text, 'done'::text])) AND deadline IS NOT NULL AND deadline::date = CURRENT_DATE) AS due_today,
    count(*) FILTER (WHERE (status <> ALL (ARRAY['completed'::text, 'cancelled'::text, 'resolved'::text, 'closed'::text, 'done'::text])) AND deadline IS NOT NULL AND deadline::date >= CURRENT_DATE AND deadline::date <= (CURRENT_DATE + '7 days'::interval)) AS due_this_week,
    count(*) FILTER (WHERE source = 'commitment'::work_source AND (status <> ALL (ARRAY['completed'::text, 'cancelled'::text]))) AS commitment_count,
    count(*) FILTER (WHERE source = 'task'::work_source AND (status <> ALL (ARRAY['completed'::text, 'cancelled'::text, 'done'::text]))) AS task_count,
    count(*) FILTER (WHERE source = 'intake'::work_source AND (status <> ALL (ARRAY['resolved'::text, 'closed'::text, 'cancelled'::text]))) AS intake_count,
    count(*) FILTER (WHERE tracking_type = 'delivery'::tracking_type AND (status <> ALL (ARRAY['completed'::text, 'cancelled'::text, 'done'::text]))) AS delivery_count,
    count(*) FILTER (WHERE tracking_type = 'follow_up'::tracking_type AND (status <> ALL (ARRAY['completed'::text, 'cancelled'::text, 'done'::text]))) AS follow_up_count,
    count(*) FILTER (WHERE tracking_type = 'sla'::tracking_type AND (status <> ALL (ARRAY['completed'::text, 'cancelled'::text, 'resolved'::text, 'closed'::text, 'done'::text]))) AS sla_count,
    count(*) FILTER (WHERE (priority = ANY (ARRAY['high'::text, 'critical'::text, 'urgent'::text])) AND (status <> ALL (ARRAY['completed'::text, 'cancelled'::text, 'resolved'::text, 'closed'::text, 'done'::text]))) AS high_priority_count
   FROM unified_work_items
  GROUP BY assigned_to;

-- ---------------------------------------------------------------------------
-- Materialized view: user_productivity_metrics (reads unified_work_items)
-- ---------------------------------------------------------------------------
CREATE MATERIALIZED VIEW IF NOT EXISTS public.user_productivity_metrics AS
 WITH completed_items AS (
         SELECT unified_work_items.assigned_to AS user_id,
            unified_work_items.source,
            unified_work_items.tracking_type,
            unified_work_items.completed_at,
            unified_work_items.deadline,
            unified_work_items.created_at,
                CASE
                    WHEN ((unified_work_items.deadline IS NOT NULL) AND (unified_work_items.completed_at IS NOT NULL)) THEN (unified_work_items.completed_at <= unified_work_items.deadline)
                    ELSE true
                END AS on_time,
                CASE
                    WHEN ((unified_work_items.completed_at IS NOT NULL) AND (unified_work_items.created_at IS NOT NULL)) THEN (EXTRACT(epoch FROM (unified_work_items.completed_at - unified_work_items.created_at)) / (3600)::numeric)
                    ELSE NULL::numeric
                END AS completion_hours
           FROM unified_work_items
          WHERE (unified_work_items.completed_at IS NOT NULL)
        ), recent_metrics AS (
         SELECT completed_items.user_id,
            count(*) AS completed_count_30d,
            count(*) FILTER (WHERE (completed_items.on_time = true)) AS on_time_count_30d,
            avg(completed_items.completion_hours) FILTER (WHERE ((completed_items.completion_hours IS NOT NULL) AND (completed_items.completion_hours > (0)::numeric))) AS avg_completion_hours_30d
           FROM completed_items
          WHERE (completed_items.completed_at >= (now() - '30 days'::interval))
          GROUP BY completed_items.user_id
        ), all_time_metrics AS (
         SELECT completed_items.user_id,
            count(*) AS completed_count_all,
            count(*) FILTER (WHERE (completed_items.on_time = true)) AS on_time_count_all,
            avg(completed_items.completion_hours) FILTER (WHERE ((completed_items.completion_hours IS NOT NULL) AND (completed_items.completion_hours > (0)::numeric))) AS avg_completion_hours_all,
            min(completed_items.completed_at) AS first_completion,
            max(completed_items.completed_at) AS last_completion
           FROM completed_items
          GROUP BY completed_items.user_id
        ), source_breakdown AS (
         SELECT completed_items.user_id,
            count(*) FILTER (WHERE (completed_items.source = 'commitment'::work_source)) AS commitment_completed,
            count(*) FILTER (WHERE (completed_items.source = 'task'::work_source)) AS task_completed,
            count(*) FILTER (WHERE (completed_items.source = 'intake'::work_source)) AS intake_completed
           FROM completed_items
          WHERE (completed_items.completed_at >= (now() - '30 days'::interval))
          GROUP BY completed_items.user_id
        )
 SELECT COALESCE(r.user_id, a.user_id, s.user_id) AS user_id,
    COALESCE(r.completed_count_30d, (0)::bigint) AS completed_count_30d,
        CASE
            WHEN (COALESCE(r.completed_count_30d, (0)::bigint) > 0) THEN round((((COALESCE(r.on_time_count_30d, (0)::bigint))::numeric / (r.completed_count_30d)::numeric) * (100)::numeric), 1)
            ELSE (0)::numeric
        END AS on_time_rate_30d,
    round(COALESCE(r.avg_completion_hours_30d, (0)::numeric), 1) AS avg_completion_hours_30d,
    COALESCE(a.completed_count_all, (0)::bigint) AS completed_count_all,
        CASE
            WHEN (COALESCE(a.completed_count_all, (0)::bigint) > 0) THEN round((((COALESCE(a.on_time_count_all, (0)::bigint))::numeric / (a.completed_count_all)::numeric) * (100)::numeric), 1)
            ELSE (0)::numeric
        END AS on_time_rate_all,
    round(COALESCE(a.avg_completion_hours_all, (0)::numeric), 1) AS avg_completion_hours_all,
    a.first_completion,
    a.last_completion,
    COALESCE(s.commitment_completed, (0)::bigint) AS commitment_completed_30d,
    COALESCE(s.task_completed, (0)::bigint) AS task_completed_30d,
    COALESCE(s.intake_completed, (0)::bigint) AS intake_completed_30d,
    now() AS last_refreshed_at
   FROM ((recent_metrics r
     FULL JOIN all_time_metrics a ON ((r.user_id = a.user_id)))
     FULL JOIN source_breakdown s ON ((COALESCE(r.user_id, a.user_id) = s.user_id)));

-- UNIQUE index required for REFRESH MATERIALIZED VIEW CONCURRENTLY
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_productivity_metrics_user_id ON public.user_productivity_metrics USING btree (user_id);

-- ---------------------------------------------------------------------------
-- RPC: get_unified_work_items (paginated, filtered reader of unified_work_items)
-- Reproduced VERBATIM from live: plain LANGUAGE plpgsql (no definer/search_path live).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_unified_work_items(p_user_id uuid DEFAULT auth.uid(), p_sources work_source[] DEFAULT NULL::work_source[], p_tracking_types tracking_type[] DEFAULT NULL::tracking_type[], p_statuses text[] DEFAULT NULL::text[], p_priorities text[] DEFAULT NULL::text[], p_is_overdue boolean DEFAULT NULL::boolean, p_dossier_id uuid DEFAULT NULL::uuid, p_search_query text DEFAULT NULL::text, p_cursor_deadline timestamp with time zone DEFAULT NULL::timestamp with time zone, p_cursor_id uuid DEFAULT NULL::uuid, p_limit integer DEFAULT 50, p_sort_by text DEFAULT 'deadline'::text, p_sort_order text DEFAULT 'asc'::text)
 RETURNS TABLE(id uuid, source work_source, title text, description text, priority text, status text, assigned_to uuid, deadline timestamp with time zone, completed_at timestamp with time zone, created_at timestamp with time zone, updated_at timestamp with time zone, dossier_id uuid, tracking_type tracking_type, is_overdue boolean, days_until_due integer, metadata jsonb, has_more boolean)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  WITH filtered_items AS (
    SELECT
      w.id,
      w.source,
      w.title::text,
      w.description::text,
      w.priority::text,
      w.status::text,
      w.assigned_to,
      w.deadline,
      w.completed_at,
      w.created_at,
      w.updated_at,
      w.dossier_id,
      w.tracking_type,
      w.is_overdue,
      w.days_until_due,
      w.metadata
    FROM unified_work_items w
    WHERE w.assigned_to = p_user_id
    AND (p_sources IS NULL OR w.source = ANY(p_sources))
    AND (p_tracking_types IS NULL OR w.tracking_type = ANY(p_tracking_types))
    AND (p_statuses IS NULL OR w.status = ANY(p_statuses))
    AND (p_priorities IS NULL OR w.priority = ANY(p_priorities))
    AND (p_is_overdue IS NULL OR w.is_overdue = p_is_overdue)
    AND (p_dossier_id IS NULL OR w.dossier_id = p_dossier_id)
    AND (p_search_query IS NULL OR w.title ILIKE '%' || p_search_query || '%' OR w.description ILIKE '%' || p_search_query || '%')
    AND (
      p_cursor_deadline IS NULL
      OR (w.deadline > p_cursor_deadline)
      OR (w.deadline = p_cursor_deadline AND w.id > p_cursor_id)
      OR (w.deadline IS NULL AND p_cursor_deadline IS NOT NULL)
    )
    ORDER BY
      CASE WHEN p_sort_order = 'asc' THEN w.deadline END ASC NULLS LAST,
      CASE WHEN p_sort_order = 'desc' THEN w.deadline END DESC NULLS LAST,
      w.id ASC
    LIMIT p_limit + 1
  ),
  counted AS (
    SELECT fi.*, COUNT(*) OVER() AS total_count
    FROM filtered_items fi
  )
  SELECT
    c.id,
    c.source,
    c.title,
    c.description,
    c.priority,
    c.status,
    c.assigned_to,
    c.deadline,
    c.completed_at,
    c.created_at,
    c.updated_at,
    c.dossier_id,
    c.tracking_type,
    c.is_overdue,
    c.days_until_due,
    c.metadata,
    (c.total_count > p_limit)::boolean AS has_more
  FROM counted c
  LIMIT p_limit;
END;
$function$;

-- ---------------------------------------------------------------------------
-- RPC: get_user_work_summary (reads user_work_summary). Verbatim from live.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_user_work_summary(p_user_id uuid DEFAULT auth.uid())
 RETURNS TABLE(user_id uuid, total_active bigint, overdue_count bigint, due_today bigint, due_this_week bigint, commitment_count bigint, task_count bigint, intake_count bigint, delivery_count bigint, follow_up_count bigint, sla_count bigint, high_priority_count bigint)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    ws.user_id,
    ws.total_active,
    ws.overdue_count,
    ws.due_today,
    ws.due_this_week,
    ws.commitment_count,
    ws.task_count,
    ws.intake_count,
    ws.delivery_count,
    ws.follow_up_count,
    ws.sla_count,
    ws.high_priority_count
  FROM user_work_summary ws
  WHERE ws.user_id = p_user_id;
END;
$function$;

-- ---------------------------------------------------------------------------
-- RPC: get_user_productivity_metrics (reads user_productivity_metrics). Verbatim from live.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_user_productivity_metrics(p_user_id uuid DEFAULT auth.uid())
 RETURNS TABLE(user_id uuid, completed_count_30d bigint, on_time_rate_30d numeric, avg_completion_hours_30d numeric, completed_count_all bigint, on_time_rate_all numeric, avg_completion_hours_all numeric, commitment_completed_30d bigint, task_completed_30d bigint, intake_completed_30d bigint, last_refreshed_at timestamp with time zone)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    pm.user_id,
    pm.completed_count_30d,
    pm.on_time_rate_30d,
    pm.avg_completion_hours_30d,
    pm.completed_count_all,
    pm.on_time_rate_all,
    pm.avg_completion_hours_all,
    pm.commitment_completed_30d,
    pm.task_completed_30d,
    pm.intake_completed_30d,
    pm.last_refreshed_at
  FROM user_productivity_metrics pm
  WHERE pm.user_id = p_user_id;
END;
$function$;

-- ---------------------------------------------------------------------------
-- Refresh helper for the matview (SECURITY DEFINER live — preserved verbatim).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.refresh_user_productivity_metrics()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY user_productivity_metrics;
END;
$function$;

-- ---------------------------------------------------------------------------
-- Grants (authenticated-only; no anon widening — the my-work UI is authenticated).
-- Live carries broader default grants on these objects; this migration does not
-- revoke them, it only re-asserts the authenticated grants the UI relies on.
-- ---------------------------------------------------------------------------
GRANT SELECT ON public.unified_work_items TO authenticated;
GRANT SELECT ON public.user_work_summary TO authenticated;
GRANT SELECT ON public.user_productivity_metrics TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_unified_work_items(uuid, work_source[], tracking_type[], text[], text[], boolean, uuid, text, timestamp with time zone, uuid, integer, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_work_summary(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_productivity_metrics(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_user_productivity_metrics() TO authenticated;

COMMIT;
