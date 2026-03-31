-- =============================================================================
-- Operations Hub RPC Functions
-- Phase 10: Operations Hub Dashboard
--
-- 4 RPC functions that power the Operations Hub zones:
--   1. get_attention_items   - Overdue, due-soon, SLA-at-risk, stalled
--   2. get_upcoming_events   - Timeline events within N days
--   3. get_engagement_stage_counts - Engagements grouped by lifecycle stage
--   4. get_dashboard_stats   - Summary counts for Quick Stats bar
-- =============================================================================

-- =============================================================================
-- 1. get_attention_items
-- Returns items needing attention: overdue work, due-soon work, SLA-at-risk
-- intake tickets, and stalled engagements (14+ days in same stage).
-- =============================================================================

CREATE OR REPLACE FUNCTION get_attention_items(
  p_user_id UUID DEFAULT NULL,
  p_threshold_hours INTEGER DEFAULT 48
)
RETURNS TABLE (
  id UUID,
  item_type TEXT,
  severity TEXT,
  title TEXT,
  title_ar TEXT,
  entity_id UUID,
  entity_type TEXT,
  deadline TIMESTAMPTZ,
  days_overdue NUMERIC,
  days_in_stage NUMERIC,
  lifecycle_stage TEXT,
  engagement_name TEXT,
  engagement_name_ar TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Overdue work items (red severity)
  RETURN QUERY
  SELECT
    wi.id,
    'overdue_work'::TEXT AS item_type,
    'red'::TEXT AS severity,
    wi.title,
    wi.title_ar,
    wi.id AS entity_id,
    wi.source::TEXT AS entity_type,
    wi.deadline,
    EXTRACT(EPOCH FROM (NOW() - wi.deadline)) / 86400 AS days_overdue,
    NULL::NUMERIC AS days_in_stage,
    wi.lifecycle_stage::TEXT,
    NULL::TEXT AS engagement_name,
    NULL::TEXT AS engagement_name_ar
  FROM unified_work_items_view wi
  WHERE wi.is_overdue = true
    AND wi.status NOT IN ('completed', 'cancelled')
    AND (p_user_id IS NULL OR wi.assignee_id = p_user_id);

  -- Due-soon work items (yellow severity)
  RETURN QUERY
  SELECT
    wi.id,
    'due_soon_work'::TEXT AS item_type,
    'yellow'::TEXT AS severity,
    wi.title,
    wi.title_ar,
    wi.id AS entity_id,
    wi.source::TEXT AS entity_type,
    wi.deadline,
    NULL::NUMERIC AS days_overdue,
    NULL::NUMERIC AS days_in_stage,
    wi.lifecycle_stage::TEXT,
    NULL::TEXT AS engagement_name,
    NULL::TEXT AS engagement_name_ar
  FROM unified_work_items_view wi
  WHERE wi.is_overdue = false
    AND wi.deadline IS NOT NULL
    AND wi.deadline <= NOW() + (p_threshold_hours || ' hours')::INTERVAL
    AND wi.status NOT IN ('completed', 'cancelled')
    AND (p_user_id IS NULL OR wi.assignee_id = p_user_id);

  -- SLA-at-risk intake tickets (yellow severity)
  RETURN QUERY
  SELECT
    it.id,
    'sla_at_risk'::TEXT AS item_type,
    'yellow'::TEXT AS severity,
    it.title,
    it.title_ar,
    it.id AS entity_id,
    'intake'::TEXT AS entity_type,
    it.sla_deadline AS deadline,
    NULL::NUMERIC AS days_overdue,
    NULL::NUMERIC AS days_in_stage,
    NULL::TEXT AS lifecycle_stage,
    NULL::TEXT AS engagement_name,
    NULL::TEXT AS engagement_name_ar
  FROM intake_tickets it
  WHERE it.tracking_type = 'sla'
    AND it.sla_deadline IS NOT NULL
    AND it.sla_deadline <= NOW() + (p_threshold_hours || ' hours')::INTERVAL
    AND it.status NOT IN ('resolved', 'closed', 'cancelled')
    AND (p_user_id IS NULL OR it.assignee_id = p_user_id);

  -- Stalled engagements (orange severity) - 14+ days in same non-terminal stage
  RETURN QUERY
  SELECT
    ed.id,
    'stalled_engagement'::TEXT AS item_type,
    'orange'::TEXT AS severity,
    d.name_en AS title,
    d.name_ar AS title_ar,
    ed.id AS entity_id,
    'engagement'::TEXT AS entity_type,
    NULL::TIMESTAMPTZ AS deadline,
    NULL::NUMERIC AS days_overdue,
    EXTRACT(EPOCH FROM (NOW() - lt.transitioned_at)) / 86400 AS days_in_stage,
    ed.lifecycle_stage::TEXT,
    d.name_en AS engagement_name,
    d.name_ar AS engagement_name_ar
  FROM engagement_dossiers ed
  JOIN dossiers d ON d.id = ed.id
  LEFT JOIN LATERAL (
    SELECT ltr.transitioned_at
    FROM lifecycle_transitions ltr
    WHERE ltr.engagement_id = ed.id
    ORDER BY ltr.transitioned_at DESC
    LIMIT 1
  ) lt ON true
  WHERE ed.lifecycle_stage != 'closed'
    AND d.status = 'active'
    AND lt.transitioned_at IS NOT NULL
    AND lt.transitioned_at <= NOW() - INTERVAL '14 days'
    AND (p_user_id IS NULL OR EXISTS (
      SELECT 1 FROM dossier_members dm
      WHERE dm.dossier_id = ed.id AND dm.user_id = p_user_id
    ));
END;
$$;

-- =============================================================================
-- 2. get_upcoming_events
-- Returns engagement events and calendar entries within the specified window.
-- =============================================================================

CREATE OR REPLACE FUNCTION get_upcoming_events(
  p_user_id UUID DEFAULT NULL,
  p_days_ahead INTEGER DEFAULT 14
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  title_ar TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  event_type TEXT,
  engagement_id UUID,
  engagement_name TEXT,
  engagement_name_ar TEXT,
  lifecycle_stage TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Engagement dossiers with upcoming start dates
  RETURN QUERY
  SELECT
    ed.id,
    d.name_en AS title,
    d.name_ar AS title_ar,
    ed.start_date,
    ed.end_date,
    ed.engagement_type::TEXT AS event_type,
    ed.id AS engagement_id,
    d.name_en AS engagement_name,
    d.name_ar AS engagement_name_ar,
    ed.lifecycle_stage::TEXT
  FROM engagement_dossiers ed
  JOIN dossiers d ON d.id = ed.id
  WHERE ed.start_date IS NOT NULL
    AND ed.start_date >= NOW()
    AND ed.start_date <= NOW() + (p_days_ahead || ' days')::INTERVAL
    AND d.status = 'active'
    AND (p_user_id IS NULL OR EXISTS (
      SELECT 1 FROM dossier_members dm
      WHERE dm.dossier_id = ed.id AND dm.user_id = p_user_id
    ))
  ORDER BY ed.start_date ASC;

  -- Calendar entries within the window
  RETURN QUERY
  SELECT
    ce.id,
    ce.title,
    ce.title_ar,
    ce.start_date,
    ce.end_date,
    ce.event_type::TEXT,
    ce.engagement_id,
    NULL::TEXT AS engagement_name,
    NULL::TEXT AS engagement_name_ar,
    NULL::TEXT AS lifecycle_stage
  FROM calendar_entries ce
  WHERE ce.start_date IS NOT NULL
    AND ce.start_date >= NOW()
    AND ce.start_date <= NOW() + (p_days_ahead || ' days')::INTERVAL
    AND (p_user_id IS NULL OR ce.user_id = p_user_id)
  ORDER BY ce.start_date ASC;
END;
$$;

-- =============================================================================
-- 3. get_engagement_stage_counts
-- Groups active engagements by lifecycle stage with top 5 per stage.
-- =============================================================================

CREATE OR REPLACE FUNCTION get_engagement_stage_counts(
  p_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
  stage TEXT,
  stage_count INTEGER,
  top_engagements JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ed.lifecycle_stage::TEXT AS stage,
    COUNT(*)::INTEGER AS stage_count,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', ed.id,
          'name_en', d.name_en,
          'name_ar', d.name_ar,
          'engagement_type', ed.engagement_type,
          'updated_at', d.updated_at
        )
        ORDER BY d.updated_at DESC
      ) FILTER (WHERE rn <= 5),
      '[]'::JSONB
    ) AS top_engagements
  FROM (
    SELECT
      ed_inner.*,
      ROW_NUMBER() OVER (
        PARTITION BY ed_inner.lifecycle_stage
        ORDER BY d_inner.updated_at DESC
      ) AS rn
    FROM engagement_dossiers ed_inner
    JOIN dossiers d_inner ON d_inner.id = ed_inner.id
    WHERE d_inner.status = 'active'
      AND (p_user_id IS NULL OR EXISTS (
        SELECT 1 FROM dossier_members dm
        WHERE dm.dossier_id = ed_inner.id AND dm.user_id = p_user_id
      ))
  ) ed
  JOIN dossiers d ON d.id = ed.id
  GROUP BY ed.lifecycle_stage;
END;
$$;

-- =============================================================================
-- 4. get_dashboard_stats
-- Returns a single row with summary counts for the Quick Stats bar.
-- =============================================================================

CREATE OR REPLACE FUNCTION get_dashboard_stats(
  p_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
  active_engagements INTEGER,
  open_tasks INTEGER,
  sla_at_risk INTEGER,
  upcoming_week INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    -- Active engagements count
    (
      SELECT COUNT(*)::INTEGER
      FROM engagement_dossiers ed
      JOIN dossiers d ON d.id = ed.id
      WHERE d.status = 'active'
        AND ed.lifecycle_stage != 'closed'
        AND (p_user_id IS NULL OR EXISTS (
          SELECT 1 FROM dossier_members dm
          WHERE dm.dossier_id = ed.id AND dm.user_id = p_user_id
        ))
    ) AS active_engagements,

    -- Open tasks count (from unified work items view)
    (
      SELECT COUNT(*)::INTEGER
      FROM unified_work_items_view wi
      WHERE wi.status NOT IN ('completed', 'cancelled')
        AND (p_user_id IS NULL OR wi.assignee_id = p_user_id)
    ) AS open_tasks,

    -- SLA at risk count
    (
      SELECT COUNT(*)::INTEGER
      FROM intake_tickets it
      WHERE it.tracking_type = 'sla'
        AND it.sla_deadline IS NOT NULL
        AND it.sla_deadline <= NOW() + INTERVAL '48 hours'
        AND it.status NOT IN ('resolved', 'closed', 'cancelled')
        AND (p_user_id IS NULL OR it.assignee_id = p_user_id)
    ) AS sla_at_risk,

    -- Upcoming events this week
    (
      SELECT COUNT(*)::INTEGER
      FROM (
        SELECT ed2.id
        FROM engagement_dossiers ed2
        JOIN dossiers d2 ON d2.id = ed2.id
        WHERE ed2.start_date IS NOT NULL
          AND ed2.start_date >= NOW()
          AND ed2.start_date <= NOW() + INTERVAL '7 days'
          AND d2.status = 'active'
          AND (p_user_id IS NULL OR EXISTS (
            SELECT 1 FROM dossier_members dm
            WHERE dm.dossier_id = ed2.id AND dm.user_id = p_user_id
          ))
        UNION ALL
        SELECT ce.id
        FROM calendar_entries ce
        WHERE ce.start_date IS NOT NULL
          AND ce.start_date >= NOW()
          AND ce.start_date <= NOW() + INTERVAL '7 days'
          AND (p_user_id IS NULL OR ce.user_id = p_user_id)
      ) events
    ) AS upcoming_week;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_attention_items(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_upcoming_events(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_engagement_stage_counts(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_dashboard_stats(UUID) TO authenticated;
