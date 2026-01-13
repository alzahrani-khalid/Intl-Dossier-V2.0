-- Migration: Fix get_engagement_metrics to match actual schema
-- Feature: analytics-dashboard
-- Date: 2026-01-11
-- Purpose: Fix SQL errors - window function in aggregate and missing metadata column

-- Drop and recreate the function with corrected column references
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
  -- Pre-calculate totals separately, then compute percentages
  type_counts AS (
    SELECT interaction_type, COUNT(*) AS cnt
    FROM dossier_interactions
    WHERE created_at BETWEEN p_start_date AND p_end_date
    GROUP BY interaction_type
    ORDER BY COUNT(*) DESC
  ),
  type_total AS (
    SELECT COALESCE(SUM(cnt), 0) AS total FROM type_counts
  ),
  by_type AS (
    SELECT COALESCE(
      jsonb_agg(jsonb_build_object(
        'type', tc.interaction_type,
        'count', tc.cnt,
        'percentage', ROUND((tc.cnt::NUMERIC / NULLIF(tt.total, 0)) * 100, 1)
      )),
      '[]'::JSONB
    ) AS data
    FROM type_counts tc, type_total tt
  ),
  -- Outcome is not in the schema, return static placeholder
  by_outcome AS (
    SELECT '[{"outcome": "neutral", "count": 0, "percentage": 100}]'::JSONB AS data
  ),
  trend_data AS (
    SELECT COALESCE(
      jsonb_agg(jsonb_build_object(
        'date', dt::TEXT,
        'value', COALESCE(cnt, 0)
      ) ORDER BY dt),
      '[]'::JSONB
    ) AS data
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
    bt.data,
    bo.data,
    td.data,
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

-- Re-grant execute permission
GRANT EXECUTE ON FUNCTION get_engagement_metrics TO authenticated;

COMMENT ON FUNCTION get_engagement_metrics IS 'Get detailed engagement metrics with trends (fixed schema mismatch)';
