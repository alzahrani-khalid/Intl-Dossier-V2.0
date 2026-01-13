-- Migration: Analytics Dashboard Views and Functions
-- Feature: analytics-dashboard
-- Date: 2026-01-11
-- Purpose: Create views and functions for analytics dashboard metrics

-- ============================================================================
-- View: Engagement Analytics
-- ============================================================================

CREATE OR REPLACE VIEW engagement_analytics AS
SELECT
  DATE_TRUNC('day', di.created_at) AS engagement_date,
  di.interaction_type,
  COALESCE(di.metadata->>'outcome', 'neutral') AS outcome,
  COUNT(*) AS engagement_count,
  d.type AS dossier_type,
  EXTRACT(DOW FROM di.created_at) AS day_of_week,
  EXTRACT(WEEK FROM di.created_at) AS week_number,
  EXTRACT(MONTH FROM di.created_at) AS month_number,
  EXTRACT(YEAR FROM di.created_at) AS year_number
FROM dossier_interactions di
JOIN dossiers d ON di.dossier_id = d.id
WHERE di.created_at >= NOW() - INTERVAL '365 days'
GROUP BY
  DATE_TRUNC('day', di.created_at),
  di.interaction_type,
  di.metadata->>'outcome',
  d.type,
  EXTRACT(DOW FROM di.created_at),
  EXTRACT(WEEK FROM di.created_at),
  EXTRACT(MONTH FROM di.created_at),
  EXTRACT(YEAR FROM di.created_at);

-- ============================================================================
-- View: Commitment Analytics
-- ============================================================================

CREATE OR REPLACE VIEW commitment_analytics AS
SELECT
  c.id AS commitment_id,
  c.status,
  c.tracking_mode,
  c.due_date,
  c.created_at,
  c.completed_at,
  c.dossier_id,
  d.type AS dossier_type,
  -- Calculate completion metrics
  CASE
    WHEN c.status = 'completed' AND c.completed_at <= c.due_date THEN 'on_time'
    WHEN c.status = 'completed' AND c.completed_at > c.due_date THEN 'late'
    WHEN c.status IN ('pending', 'in_progress') AND c.due_date < NOW() THEN 'overdue'
    ELSE 'pending'
  END AS completion_status,
  -- Calculate days to complete
  CASE
    WHEN c.completed_at IS NOT NULL THEN
      EXTRACT(DAY FROM c.completed_at - c.created_at)::INTEGER
    ELSE NULL
  END AS days_to_complete,
  -- Calculate days overdue
  CASE
    WHEN c.status IN ('pending', 'in_progress') AND c.due_date < NOW() THEN
      EXTRACT(DAY FROM NOW() - c.due_date)::INTEGER
    ELSE 0
  END AS days_overdue
FROM aa_commitments c
LEFT JOIN dossiers d ON c.dossier_id = d.id
WHERE c.status != 'cancelled';

-- ============================================================================
-- View: Work Item Analytics
-- ============================================================================

CREATE OR REPLACE VIEW work_item_analytics AS
SELECT
  a.id AS work_item_id,
  a.user_id AS assignee_id,
  u.email AS assignee_email,
  COALESCE(p.full_name_en, u.email) AS assignee_name,
  a.status,
  a.priority,
  a.due_date,
  a.created_at,
  a.updated_at,
  -- Calculate overdue status
  CASE
    WHEN a.status NOT IN ('completed', 'cancelled') AND a.due_date < NOW() THEN TRUE
    ELSE FALSE
  END AS is_overdue,
  -- Calculate days until due
  CASE
    WHEN a.due_date IS NOT NULL THEN
      EXTRACT(DAY FROM a.due_date - NOW())::INTEGER
    ELSE NULL
  END AS days_until_due
FROM assignments a
LEFT JOIN auth.users u ON a.user_id = u.id
LEFT JOIN profiles p ON a.user_id = p.id
WHERE a.status NOT IN ('completed', 'cancelled');

-- ============================================================================
-- Function: Get Analytics Summary
-- ============================================================================

CREATE OR REPLACE FUNCTION get_analytics_summary(
  p_start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
  p_end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
  total_engagements BIGINT,
  engagements_change NUMERIC,
  avg_health_score NUMERIC,
  health_score_change NUMERIC,
  fulfillment_rate NUMERIC,
  fulfillment_rate_change NUMERIC,
  total_active_work BIGINT,
  active_work_change NUMERIC,
  critical_alerts BIGINT,
  overdue_items BIGINT,
  relationships_needing_attention BIGINT
) AS $$
DECLARE
  v_period_days INTEGER;
  v_prev_start TIMESTAMPTZ;
  v_prev_end TIMESTAMPTZ;
BEGIN
  -- Calculate period duration
  v_period_days := EXTRACT(DAY FROM p_end_date - p_start_date)::INTEGER;
  v_prev_start := p_start_date - (p_end_date - p_start_date);
  v_prev_end := p_start_date;

  RETURN QUERY
  WITH current_period AS (
    -- Engagements in current period
    SELECT COUNT(*) AS engagements
    FROM dossier_interactions
    WHERE created_at BETWEEN p_start_date AND p_end_date
  ),
  previous_period AS (
    -- Engagements in previous period
    SELECT COUNT(*) AS engagements
    FROM dossier_interactions
    WHERE created_at BETWEEN v_prev_start AND v_prev_end
  ),
  commitment_stats AS (
    -- Commitment fulfillment stats
    SELECT
      COUNT(*) FILTER (WHERE status = 'completed') AS completed,
      COUNT(*) FILTER (WHERE status != 'cancelled') AS total,
      COUNT(*) FILTER (WHERE status IN ('pending', 'in_progress') AND due_date < NOW()) AS overdue
    FROM aa_commitments
    WHERE created_at <= p_end_date
  ),
  previous_commitment_stats AS (
    -- Previous period commitment stats
    SELECT
      COUNT(*) FILTER (WHERE status = 'completed') AS completed,
      COUNT(*) FILTER (WHERE status != 'cancelled') AS total
    FROM aa_commitments
    WHERE created_at <= v_prev_end
  ),
  health_stats AS (
    -- Current relationship health
    SELECT
      AVG(overall_score)::NUMERIC AS avg_score,
      COUNT(*) FILTER (WHERE overall_score < 40) AS critical_count
    FROM relationship_health_scores
  ),
  work_stats AS (
    -- Active work items
    SELECT
      COUNT(*) AS active_count,
      COUNT(*) FILTER (WHERE due_date < NOW()) AS overdue_count
    FROM assignments
    WHERE status NOT IN ('completed', 'cancelled')
  ),
  previous_work_stats AS (
    -- Previous period work items (approximation)
    SELECT COUNT(*) AS active_count
    FROM assignments
    WHERE created_at <= v_prev_end
      AND (completed_at IS NULL OR completed_at > v_prev_end)
      AND status != 'cancelled'
  )
  SELECT
    cp.engagements,
    CASE
      WHEN pp.engagements > 0 THEN
        ROUND(((cp.engagements - pp.engagements)::NUMERIC / pp.engagements) * 100, 1)
      ELSE 0
    END AS engagements_change,
    COALESCE(hs.avg_score, 0) AS avg_health_score,
    0::NUMERIC AS health_score_change, -- Would need historical data
    CASE
      WHEN cs.total > 0 THEN
        ROUND((cs.completed::NUMERIC / cs.total) * 100, 1)
      ELSE 100
    END AS fulfillment_rate,
    CASE
      WHEN pcs.total > 0 AND cs.total > 0 THEN
        ROUND(
          ((cs.completed::NUMERIC / cs.total) - (pcs.completed::NUMERIC / pcs.total)) * 100,
          1
        )
      ELSE 0
    END AS fulfillment_rate_change,
    ws.active_count,
    CASE
      WHEN pws.active_count > 0 THEN
        ROUND(((ws.active_count - pws.active_count)::NUMERIC / pws.active_count) * 100, 1)
      ELSE 0
    END AS active_work_change,
    COALESCE(hs.critical_count, 0),
    ws.overdue_count,
    COALESCE(hs.critical_count, 0)
  FROM current_period cp
  CROSS JOIN previous_period pp
  CROSS JOIN commitment_stats cs
  CROSS JOIN previous_commitment_stats pcs
  CROSS JOIN health_stats hs
  CROSS JOIN work_stats ws
  CROSS JOIN previous_work_stats pws;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Function: Get Engagement Metrics
-- ============================================================================

CREATE OR REPLACE FUNCTION get_engagement_metrics(
  p_start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
  p_end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
  total_engagements BIGINT,
  avg_per_week NUMERIC,
  engagements_by_type JSONB,
  engagements_by_outcome JSONB,
  engagement_trend JSONB,
  change_from_previous NUMERIC
) AS $$
DECLARE
  v_weeks NUMERIC;
  v_prev_start TIMESTAMPTZ;
  v_prev_end TIMESTAMPTZ;
BEGIN
  v_weeks := GREATEST(EXTRACT(DAY FROM p_end_date - p_start_date) / 7, 1);
  v_prev_start := p_start_date - (p_end_date - p_start_date);
  v_prev_end := p_start_date;

  RETURN QUERY
  WITH current_engagements AS (
    SELECT
      COUNT(*) AS total,
      COUNT(*) / v_weeks AS avg_weekly
    FROM dossier_interactions
    WHERE created_at BETWEEN p_start_date AND p_end_date
  ),
  previous_engagements AS (
    SELECT COUNT(*) AS total
    FROM dossier_interactions
    WHERE created_at BETWEEN v_prev_start AND v_prev_end
  ),
  by_type AS (
    SELECT jsonb_agg(jsonb_build_object(
      'type', interaction_type,
      'count', cnt,
      'percentage', ROUND((cnt::NUMERIC / NULLIF(SUM(cnt) OVER (), 0)) * 100, 1)
    )) AS data
    FROM (
      SELECT interaction_type, COUNT(*) AS cnt
      FROM dossier_interactions
      WHERE created_at BETWEEN p_start_date AND p_end_date
      GROUP BY interaction_type
      ORDER BY cnt DESC
    ) t
  ),
  by_outcome AS (
    SELECT jsonb_agg(jsonb_build_object(
      'outcome', outcome,
      'count', cnt,
      'percentage', ROUND((cnt::NUMERIC / NULLIF(SUM(cnt) OVER (), 0)) * 100, 1)
    )) AS data
    FROM (
      SELECT COALESCE(metadata->>'outcome', 'neutral') AS outcome, COUNT(*) AS cnt
      FROM dossier_interactions
      WHERE created_at BETWEEN p_start_date AND p_end_date
      GROUP BY metadata->>'outcome'
      ORDER BY cnt DESC
    ) t
  ),
  trend_data AS (
    SELECT jsonb_agg(jsonb_build_object(
      'date', dt::TEXT,
      'value', COALESCE(cnt, 0)
    ) ORDER BY dt) AS data
    FROM generate_series(
      DATE_TRUNC('day', p_start_date),
      DATE_TRUNC('day', p_end_date),
      '1 day'::INTERVAL
    ) AS dt
    LEFT JOIN (
      SELECT DATE_TRUNC('day', created_at) AS day, COUNT(*) AS cnt
      FROM dossier_interactions
      WHERE created_at BETWEEN p_start_date AND p_end_date
      GROUP BY DATE_TRUNC('day', created_at)
    ) daily ON dt = daily.day
  )
  SELECT
    ce.total,
    ROUND(ce.avg_weekly, 1),
    COALESCE(bt.data, '[]'::JSONB),
    COALESCE(bo.data, '[]'::JSONB),
    COALESCE(td.data, '[]'::JSONB),
    CASE
      WHEN pe.total > 0 THEN
        ROUND(((ce.total - pe.total)::NUMERIC / pe.total) * 100, 1)
      ELSE 0
    END
  FROM current_engagements ce
  CROSS JOIN previous_engagements pe
  CROSS JOIN by_type bt
  CROSS JOIN by_outcome bo
  CROSS JOIN trend_data td;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Function: Get Relationship Health Trends
-- ============================================================================

CREATE OR REPLACE FUNCTION get_relationship_health_trends(
  p_start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
  p_end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
  avg_score NUMERIC,
  previous_avg_score NUMERIC,
  health_distribution JSONB,
  by_health_level JSONB,
  by_trend JSONB,
  score_trend JSONB,
  critical_count BIGINT,
  improving_count BIGINT,
  declining_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH current_health AS (
    SELECT
      AVG(overall_score)::NUMERIC AS avg_score,
      COUNT(*) FILTER (WHERE overall_score >= 80) AS excellent,
      COUNT(*) FILTER (WHERE overall_score >= 60 AND overall_score < 80) AS good,
      COUNT(*) FILTER (WHERE overall_score >= 40 AND overall_score < 60) AS fair,
      COUNT(*) FILTER (WHERE overall_score >= 20 AND overall_score < 40) AS poor,
      COUNT(*) FILTER (WHERE overall_score < 20) AS critical,
      COUNT(*) FILTER (WHERE overall_score IS NULL) AS unknown,
      COUNT(*) FILTER (WHERE trend = 'improving') AS improving,
      COUNT(*) FILTER (WHERE trend = 'stable') AS stable,
      COUNT(*) FILTER (WHERE trend = 'declining') AS declining,
      COUNT(*) AS total
    FROM relationship_health_scores
  ),
  health_levels AS (
    SELECT jsonb_agg(jsonb_build_object(
      'level', level,
      'count', cnt,
      'percentage', ROUND((cnt::NUMERIC / NULLIF(total, 0)) * 100, 1),
      'color', color
    ) ORDER BY sort_order) AS data
    FROM (
      SELECT 'excellent' AS level, ch.excellent AS cnt, ch.total, '#10B981' AS color, 1 AS sort_order FROM current_health ch
      UNION ALL
      SELECT 'good', ch.good, ch.total, '#34D399', 2 FROM current_health ch
      UNION ALL
      SELECT 'fair', ch.fair, ch.total, '#FBBF24', 3 FROM current_health ch
      UNION ALL
      SELECT 'poor', ch.poor, ch.total, '#F97316', 4 FROM current_health ch
      UNION ALL
      SELECT 'critical', ch.critical, ch.total, '#EF4444', 5 FROM current_health ch
    ) levels
  ),
  trend_breakdown AS (
    SELECT jsonb_agg(jsonb_build_object(
      'trend', trend_name,
      'count', cnt,
      'percentage', ROUND((cnt::NUMERIC / NULLIF(total, 0)) * 100, 1)
    ) ORDER BY sort_order) AS data
    FROM (
      SELECT 'improving' AS trend_name, ch.improving AS cnt, ch.total, 1 AS sort_order FROM current_health ch
      UNION ALL
      SELECT 'stable', ch.stable, ch.total, 2 FROM current_health ch
      UNION ALL
      SELECT 'declining', ch.declining, ch.total, 3 FROM current_health ch
    ) trends
  ),
  score_history AS (
    -- Get historical scores from health history if available
    SELECT jsonb_agg(jsonb_build_object(
      'date', calculated_at::DATE::TEXT,
      'value', ROUND(AVG(overall_score)::NUMERIC, 1)
    ) ORDER BY calculated_at::DATE) AS data
    FROM relationship_health_scores_history
    WHERE calculated_at BETWEEN p_start_date AND p_end_date
    GROUP BY calculated_at::DATE
  )
  SELECT
    ROUND(COALESCE(ch.avg_score, 0), 1),
    COALESCE(ch.avg_score, 0)::NUMERIC, -- Would need historical comparison
    jsonb_build_object(
      'excellent', ch.excellent,
      'good', ch.good,
      'fair', ch.fair,
      'poor', ch.poor,
      'critical', ch.critical,
      'unknown', ch.unknown
    ),
    COALESCE(hl.data, '[]'::JSONB),
    COALESCE(tb.data, '[]'::JSONB),
    COALESCE(sh.data, '[]'::JSONB),
    ch.critical,
    ch.improving,
    ch.declining
  FROM current_health ch
  CROSS JOIN health_levels hl
  CROSS JOIN trend_breakdown tb
  LEFT JOIN score_history sh ON TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Function: Get Commitment Fulfillment
-- ============================================================================

CREATE OR REPLACE FUNCTION get_commitment_fulfillment(
  p_start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
  p_end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
  total_commitments BIGINT,
  completed_on_time BIGINT,
  completed_late BIGINT,
  overdue BIGINT,
  pending BIGINT,
  fulfillment_rate NUMERIC,
  on_time_rate NUMERIC,
  avg_completion_days NUMERIC,
  fulfillment_trend JSONB,
  by_source JSONB,
  by_tracking_type JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH commitment_stats AS (
    SELECT
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE status = 'completed' AND completed_at <= due_date) AS on_time,
      COUNT(*) FILTER (WHERE status = 'completed' AND completed_at > due_date) AS late,
      COUNT(*) FILTER (WHERE status IN ('pending', 'in_progress') AND due_date < NOW()) AS overdue_count,
      COUNT(*) FILTER (WHERE status IN ('pending', 'in_progress') AND (due_date >= NOW() OR due_date IS NULL)) AS pending_count,
      COUNT(*) FILTER (WHERE status = 'completed') AS completed,
      AVG(CASE
        WHEN completed_at IS NOT NULL THEN
          EXTRACT(DAY FROM completed_at - created_at)
        ELSE NULL
      END)::NUMERIC AS avg_days
    FROM aa_commitments
    WHERE status != 'cancelled'
      AND created_at <= p_end_date
  ),
  trend_data AS (
    SELECT jsonb_agg(jsonb_build_object(
      'date', dt::TEXT,
      'value', COALESCE(rate, 0)
    ) ORDER BY dt) AS data
    FROM generate_series(
      DATE_TRUNC('week', p_start_date),
      DATE_TRUNC('week', p_end_date),
      '1 week'::INTERVAL
    ) AS dt
    LEFT JOIN (
      SELECT
        DATE_TRUNC('week', completed_at) AS week,
        ROUND(
          (COUNT(*) FILTER (WHERE completed_at <= due_date)::NUMERIC /
           NULLIF(COUNT(*), 0)) * 100,
          1
        ) AS rate
      FROM aa_commitments
      WHERE status = 'completed'
        AND completed_at BETWEEN p_start_date AND p_end_date
      GROUP BY DATE_TRUNC('week', completed_at)
    ) weekly ON dt = weekly.week
  ),
  by_tracking AS (
    SELECT jsonb_agg(jsonb_build_object(
      'trackingType', tracking_mode,
      'total', total,
      'completed', completed,
      'fulfillmentRate', ROUND((completed::NUMERIC / NULLIF(total, 0)) * 100, 1)
    )) AS data
    FROM (
      SELECT
        COALESCE(tracking_mode, 'delivery') AS tracking_mode,
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status = 'completed') AS completed
      FROM aa_commitments
      WHERE status != 'cancelled'
        AND created_at <= p_end_date
      GROUP BY tracking_mode
    ) t
  )
  SELECT
    cs.total,
    cs.on_time,
    cs.late,
    cs.overdue_count,
    cs.pending_count,
    ROUND((cs.completed::NUMERIC / NULLIF(cs.total, 0)) * 100, 1),
    ROUND((cs.on_time::NUMERIC / NULLIF(cs.completed, 0)) * 100, 1),
    ROUND(COALESCE(cs.avg_days, 0), 1),
    COALESCE(td.data, '[]'::JSONB),
    '[]'::JSONB, -- by_source would need work items union
    COALESCE(bt.data, '[]'::JSONB)
  FROM commitment_stats cs
  CROSS JOIN trend_data td
  CROSS JOIN by_tracking bt;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Function: Get Workload Distribution
-- ============================================================================

CREATE OR REPLACE FUNCTION get_workload_distribution()
RETURNS TABLE (
  total_active_items BIGINT,
  avg_items_per_user NUMERIC,
  max_items_per_user BIGINT,
  overloaded_users BIGINT,
  idle_users BIGINT,
  by_user JSONB,
  by_priority JSONB,
  by_status JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH user_workload AS (
    SELECT
      a.user_id,
      COALESCE(p.full_name_en, u.email) AS user_name,
      p.full_name_ar AS user_name_ar,
      p.avatar_url,
      COUNT(*) AS total_items,
      COUNT(*) FILTER (WHERE a.due_date < NOW()) AS overdue_items,
      COUNT(*) FILTER (WHERE a.priority IN ('high', 'urgent')) AS high_priority_items
    FROM assignments a
    LEFT JOIN auth.users u ON a.user_id = u.id
    LEFT JOIN profiles p ON a.user_id = p.id
    WHERE a.status NOT IN ('completed', 'cancelled')
    GROUP BY a.user_id, p.full_name_en, u.email, p.full_name_ar, p.avatar_url
  ),
  workload_stats AS (
    SELECT
      SUM(total_items) AS total_active,
      AVG(total_items)::NUMERIC AS avg_per_user,
      MAX(total_items) AS max_per_user,
      COUNT(*) FILTER (WHERE total_items > 20) AS overloaded,
      COUNT(*) FILTER (WHERE total_items = 0) AS idle
    FROM user_workload
  ),
  user_data AS (
    SELECT jsonb_agg(jsonb_build_object(
      'userId', user_id,
      'userName', user_name,
      'userNameAr', user_name_ar,
      'avatarUrl', avatar_url,
      'totalItems', total_items,
      'overdueItems', overdue_items,
      'highPriorityItems', high_priority_items,
      'workloadPercentage', ROUND((total_items::NUMERIC / NULLIF(ws.max_per_user, 0)) * 100, 0)
    ) ORDER BY total_items DESC) AS data
    FROM user_workload, workload_stats ws
  ),
  priority_data AS (
    SELECT jsonb_agg(jsonb_build_object(
      'priority', priority,
      'count', cnt,
      'percentage', ROUND((cnt::NUMERIC / NULLIF(total, 0)) * 100, 1),
      'color', CASE priority
        WHEN 'urgent' THEN '#EF4444'
        WHEN 'high' THEN '#F59E0B'
        WHEN 'medium' THEN '#3B82F6'
        ELSE '#9CA3AF'
      END
    ) ORDER BY sort_order) AS data
    FROM (
      SELECT priority, COUNT(*) AS cnt, SUM(COUNT(*)) OVER() AS total,
        CASE priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END AS sort_order
      FROM assignments
      WHERE status NOT IN ('completed', 'cancelled')
      GROUP BY priority
    ) t
  ),
  status_data AS (
    SELECT jsonb_agg(jsonb_build_object(
      'status', status,
      'count', cnt,
      'percentage', ROUND((cnt::NUMERIC / NULLIF(total, 0)) * 100, 1)
    )) AS data
    FROM (
      SELECT status, COUNT(*) AS cnt, SUM(COUNT(*)) OVER() AS total
      FROM assignments
      WHERE status NOT IN ('completed', 'cancelled')
      GROUP BY status
    ) t
  )
  SELECT
    COALESCE(ws.total_active, 0),
    ROUND(COALESCE(ws.avg_per_user, 0), 1),
    COALESCE(ws.max_per_user, 0),
    COALESCE(ws.overloaded, 0),
    COALESCE(ws.idle, 0),
    COALESCE(ud.data, '[]'::JSONB),
    COALESCE(pd.data, '[]'::JSONB),
    COALESCE(sd.data, '[]'::JSONB)
  FROM workload_stats ws
  CROSS JOIN user_data ud
  CROSS JOIN priority_data pd
  CROSS JOIN status_data sd;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Create history table for health scores (if not exists)
-- ============================================================================

CREATE TABLE IF NOT EXISTS relationship_health_scores_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  relationship_id UUID NOT NULL REFERENCES dossier_relationships(id) ON DELETE CASCADE,
  overall_score INTEGER,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_health_scores_history_relationship
  ON relationship_health_scores_history(relationship_id);

CREATE INDEX IF NOT EXISTS idx_health_scores_history_calculated_at
  ON relationship_health_scores_history(calculated_at);

-- ============================================================================
-- Trigger: Archive health scores to history
-- ============================================================================

CREATE OR REPLACE FUNCTION archive_health_score()
RETURNS TRIGGER AS $$
BEGIN
  -- Archive the old score before update
  IF TG_OP = 'UPDATE' AND OLD.overall_score IS DISTINCT FROM NEW.overall_score THEN
    INSERT INTO relationship_health_scores_history (
      relationship_id,
      overall_score,
      calculated_at
    ) VALUES (
      OLD.relationship_id,
      OLD.overall_score,
      OLD.calculated_at
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS archive_health_score_trigger ON relationship_health_scores;

CREATE TRIGGER archive_health_score_trigger
  BEFORE UPDATE ON relationship_health_scores
  FOR EACH ROW
  EXECUTE FUNCTION archive_health_score();

-- ============================================================================
-- RLS Policies
-- ============================================================================

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_analytics_summary TO authenticated;
GRANT EXECUTE ON FUNCTION get_engagement_metrics TO authenticated;
GRANT EXECUTE ON FUNCTION get_relationship_health_trends TO authenticated;
GRANT EXECUTE ON FUNCTION get_commitment_fulfillment TO authenticated;
GRANT EXECUTE ON FUNCTION get_workload_distribution TO authenticated;

-- Enable RLS on history table
ALTER TABLE relationship_health_scores_history ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view history
CREATE POLICY "Allow authenticated users to view health history"
  ON relationship_health_scores_history
  FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON VIEW engagement_analytics IS 'Pre-computed engagement metrics for analytics dashboard';
COMMENT ON VIEW commitment_analytics IS 'Pre-computed commitment metrics with completion status';
COMMENT ON VIEW work_item_analytics IS 'Pre-computed work item metrics for workload distribution';
COMMENT ON FUNCTION get_analytics_summary IS 'Get high-level analytics summary for dashboard';
COMMENT ON FUNCTION get_engagement_metrics IS 'Get detailed engagement metrics with trends';
COMMENT ON FUNCTION get_relationship_health_trends IS 'Get relationship health trends and distribution';
COMMENT ON FUNCTION get_commitment_fulfillment IS 'Get commitment fulfillment rates and trends';
COMMENT ON FUNCTION get_workload_distribution IS 'Get workload distribution across users';
COMMENT ON TABLE relationship_health_scores_history IS 'Historical record of relationship health scores';
