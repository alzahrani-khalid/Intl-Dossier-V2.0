-- Migration: Create materialized views for relationship health statistics
-- Feature: relationship-health-scoring
-- Date: 2026-01-11
-- Purpose: Pre-compute engagement and commitment stats per bilateral relationship

-- ============================================================================
-- Materialized View: Relationship Engagement Stats
-- ============================================================================

CREATE MATERIALIZED VIEW relationship_engagement_stats AS
WITH relationship_engagements AS (
  -- Get all engagements involving dossiers in relationships
  SELECT
    dr.id AS relationship_id,
    dr.source_dossier_id,
    dr.target_dossier_id,
    di.id AS engagement_id,
    di.dossier_id AS engaged_dossier_id,
    di.created_at AS engagement_date,
    di.interaction_type,
    COALESCE(di.metadata->>'outcome', 'neutral') AS outcome
  FROM dossier_relationships dr
  -- Filter only bilateral relationships
  WHERE dr.relationship_type = 'bilateral_relation'
    AND dr.status = 'active'
  -- Join engagements for either source or target dossier
  LEFT JOIN dossier_interactions di ON (
    di.dossier_id = dr.source_dossier_id OR
    di.dossier_id = dr.target_dossier_id
  )
)
SELECT
  relationship_id,
  source_dossier_id,
  target_dossier_id,

  -- Total engagements in last 365 days
  COUNT(DISTINCT engagement_id) FILTER (
    WHERE engagement_date >= NOW() - INTERVAL '365 days'
  ) AS total_engagements_365d,

  -- Recent engagements in last 90 days
  COUNT(DISTINCT engagement_id) FILTER (
    WHERE engagement_date >= NOW() - INTERVAL '90 days'
  ) AS recent_engagements_90d,

  -- Engagements in last 30 days
  COUNT(DISTINCT engagement_id) FILTER (
    WHERE engagement_date >= NOW() - INTERVAL '30 days'
  ) AS recent_engagements_30d,

  -- Latest engagement date
  MAX(engagement_date) AS latest_engagement_date,

  -- Days since last engagement
  EXTRACT(DAY FROM NOW() - MAX(engagement_date))::INTEGER AS days_since_last_engagement,

  -- Engagements by source dossier (for reciprocity calculation)
  COUNT(DISTINCT engagement_id) FILTER (
    WHERE engaged_dossier_id = source_dossier_id
      AND engagement_date >= NOW() - INTERVAL '365 days'
  ) AS source_engagements_365d,

  -- Engagements by target dossier (for reciprocity calculation)
  COUNT(DISTINCT engagement_id) FILTER (
    WHERE engaged_dossier_id = target_dossier_id
      AND engagement_date >= NOW() - INTERVAL '365 days'
  ) AS target_engagements_365d,

  -- Positive outcome engagements
  COUNT(DISTINCT engagement_id) FILTER (
    WHERE engagement_date >= NOW() - INTERVAL '365 days'
      AND outcome = 'positive'
  ) AS positive_engagements_365d,

  -- Neutral outcome engagements
  COUNT(DISTINCT engagement_id) FILTER (
    WHERE engagement_date >= NOW() - INTERVAL '365 days'
      AND outcome = 'neutral'
  ) AS neutral_engagements_365d,

  -- Negative outcome engagements
  COUNT(DISTINCT engagement_id) FILTER (
    WHERE engagement_date >= NOW() - INTERVAL '365 days'
      AND outcome = 'negative'
  ) AS negative_engagements_365d,

  -- Normalized engagement frequency score (0-100)
  -- 50 engagements/year = 100 points, linear scaling
  LEAST(100, (COUNT(DISTINCT engagement_id) FILTER (
    WHERE engagement_date >= NOW() - INTERVAL '365 days'
  )::NUMERIC * 2)::INTEGER) AS engagement_frequency_score,

  -- Reciprocity score (0-100)
  -- Perfect balance = 100, complete imbalance = 0
  CASE
    WHEN COUNT(DISTINCT engagement_id) FILTER (WHERE engagement_date >= NOW() - INTERVAL '365 days') = 0 THEN 50
    ELSE GREATEST(0, LEAST(100,
      100 - ABS(
        (COUNT(DISTINCT engagement_id) FILTER (WHERE engaged_dossier_id = source_dossier_id AND engagement_date >= NOW() - INTERVAL '365 days')::NUMERIC /
         NULLIF(COUNT(DISTINCT engagement_id) FILTER (WHERE engagement_date >= NOW() - INTERVAL '365 days'), 0) * 100) - 50
      ) * 2
    ))::INTEGER
  END AS reciprocity_score,

  -- Interaction quality score (0-100)
  -- Based on outcome distribution: positive=100, neutral=50, negative=0
  CASE
    WHEN COUNT(DISTINCT engagement_id) FILTER (WHERE engagement_date >= NOW() - INTERVAL '365 days') = 0 THEN 50
    ELSE (
      (COUNT(DISTINCT engagement_id) FILTER (WHERE outcome = 'positive' AND engagement_date >= NOW() - INTERVAL '365 days') * 100 +
       COUNT(DISTINCT engagement_id) FILTER (WHERE outcome = 'neutral' AND engagement_date >= NOW() - INTERVAL '365 days') * 50)::NUMERIC /
      NULLIF(COUNT(DISTINCT engagement_id) FILTER (WHERE engagement_date >= NOW() - INTERVAL '365 days'), 0)
    )::INTEGER
  END AS interaction_quality_score

FROM relationship_engagements
GROUP BY relationship_id, source_dossier_id, target_dossier_id;

-- Create unique index for concurrent refresh
CREATE UNIQUE INDEX idx_relationship_engagement_stats_id
  ON relationship_engagement_stats(relationship_id);

-- ============================================================================
-- Materialized View: Relationship Commitment Stats
-- ============================================================================

CREATE MATERIALIZED VIEW relationship_commitment_stats AS
WITH relationship_commitments AS (
  -- Get all commitments for dossiers in bilateral relationships
  SELECT
    dr.id AS relationship_id,
    dr.source_dossier_id,
    dr.target_dossier_id,
    c.id AS commitment_id,
    c.dossier_id AS committed_dossier_id,
    c.status AS commitment_status,
    c.due_date,
    c.created_at,
    CASE
      WHEN c.status = 'completed' AND c.completed_at <= c.due_date THEN 'on_time'
      WHEN c.status = 'completed' AND c.completed_at > c.due_date THEN 'late'
      WHEN c.status IN ('pending', 'in_progress') AND c.due_date < NOW() THEN 'overdue'
      ELSE 'pending'
    END AS compliance_status
  FROM dossier_relationships dr
  WHERE dr.relationship_type = 'bilateral_relation'
    AND dr.status = 'active'
  LEFT JOIN aa_commitments c ON (
    c.dossier_id = dr.source_dossier_id OR
    c.dossier_id = dr.target_dossier_id
  )
  WHERE c.status != 'cancelled' OR c.status IS NULL
)
SELECT
  relationship_id,
  source_dossier_id,
  target_dossier_id,

  -- Total commitments (non-cancelled)
  COUNT(DISTINCT commitment_id) FILTER (
    WHERE commitment_status IS NOT NULL
  ) AS total_commitments,

  -- Active commitments (pending or in_progress)
  COUNT(DISTINCT commitment_id) FILTER (
    WHERE commitment_status IN ('pending', 'in_progress')
  ) AS active_commitments,

  -- Completed commitments
  COUNT(DISTINCT commitment_id) FILTER (
    WHERE commitment_status = 'completed'
  ) AS completed_commitments,

  -- Overdue commitments
  COUNT(DISTINCT commitment_id) FILTER (
    WHERE compliance_status = 'overdue'
  ) AS overdue_commitments,

  -- On-time completions
  COUNT(DISTINCT commitment_id) FILTER (
    WHERE compliance_status = 'on_time'
  ) AS on_time_completions,

  -- Late completions
  COUNT(DISTINCT commitment_id) FILTER (
    WHERE compliance_status = 'late'
  ) AS late_completions,

  -- Commitments by source dossier
  COUNT(DISTINCT commitment_id) FILTER (
    WHERE committed_dossier_id = source_dossier_id
  ) AS source_commitments,

  -- Commitments by target dossier
  COUNT(DISTINCT commitment_id) FILTER (
    WHERE committed_dossier_id = target_dossier_id
  ) AS target_commitments,

  -- Commitment compliance score (0-100)
  -- Based on on-time completion rate, with penalty for overdue
  CASE
    WHEN COUNT(DISTINCT commitment_id) FILTER (WHERE commitment_status IS NOT NULL) = 0 THEN 100
    ELSE GREATEST(0, LEAST(100,
      (
        -- Completed on-time: full credit
        COUNT(DISTINCT commitment_id) FILTER (WHERE compliance_status = 'on_time') * 100 +
        -- Completed late: 50% credit
        COUNT(DISTINCT commitment_id) FILTER (WHERE compliance_status = 'late') * 50 +
        -- Pending (not overdue): 75% credit (benefit of the doubt)
        COUNT(DISTINCT commitment_id) FILTER (WHERE compliance_status = 'pending') * 75
        -- Overdue: 0 credit
      )::NUMERIC /
      COUNT(DISTINCT commitment_id) FILTER (WHERE commitment_status IS NOT NULL)
    ))::INTEGER
  END AS commitment_compliance_score

FROM relationship_commitments
GROUP BY relationship_id, source_dossier_id, target_dossier_id;

-- Create unique index for concurrent refresh
CREATE UNIQUE INDEX idx_relationship_commitment_stats_id
  ON relationship_commitment_stats(relationship_id);

-- ============================================================================
-- Combined Relationship Health View
-- ============================================================================

CREATE OR REPLACE VIEW relationship_health_summary AS
SELECT
  dr.id AS relationship_id,
  dr.source_dossier_id,
  dr.target_dossier_id,
  dr.relationship_type,
  dr.status AS relationship_status,
  dr.effective_from,

  -- Source dossier info
  sd.name_en AS source_name_en,
  sd.name_ar AS source_name_ar,
  sd.type AS source_type,

  -- Target dossier info
  td.name_en AS target_name_en,
  td.name_ar AS target_name_ar,
  td.type AS target_type,

  -- Engagement stats
  COALESCE(es.total_engagements_365d, 0) AS total_engagements_365d,
  COALESCE(es.recent_engagements_90d, 0) AS recent_engagements_90d,
  COALESCE(es.recent_engagements_30d, 0) AS recent_engagements_30d,
  es.latest_engagement_date,
  COALESCE(es.days_since_last_engagement, 999) AS days_since_last_engagement,
  COALESCE(es.engagement_frequency_score, 0) AS engagement_frequency_score,
  COALESCE(es.reciprocity_score, 50) AS reciprocity_score,
  COALESCE(es.interaction_quality_score, 50) AS interaction_quality_score,

  -- Commitment stats
  COALESCE(cs.total_commitments, 0) AS total_commitments,
  COALESCE(cs.active_commitments, 0) AS active_commitments,
  COALESCE(cs.completed_commitments, 0) AS completed_commitments,
  COALESCE(cs.overdue_commitments, 0) AS overdue_commitments,
  COALESCE(cs.commitment_compliance_score, 100) AS commitment_compliance_score,

  -- Recency score
  CASE
    WHEN COALESCE(es.days_since_last_engagement, 999) <= 30 THEN 100
    WHEN COALESCE(es.days_since_last_engagement, 999) <= 90 THEN 70
    WHEN COALESCE(es.days_since_last_engagement, 999) <= 180 THEN 40
    ELSE 10
  END AS recency_score,

  -- Overall health score (weighted average)
  -- Formula: (Frequency × 0.25) + (Compliance × 0.35) + (Reciprocity × 0.15) + (Quality × 0.10) + (Recency × 0.15)
  CASE
    WHEN COALESCE(es.total_engagements_365d, 0) < 3 THEN NULL -- Insufficient data
    ELSE ROUND(
      (COALESCE(es.engagement_frequency_score, 0) * 0.25) +
      (COALESCE(cs.commitment_compliance_score, 100) * 0.35) +
      (COALESCE(es.reciprocity_score, 50) * 0.15) +
      (COALESCE(es.interaction_quality_score, 50) * 0.10) +
      (CASE
        WHEN COALESCE(es.days_since_last_engagement, 999) <= 30 THEN 100
        WHEN COALESCE(es.days_since_last_engagement, 999) <= 90 THEN 70
        WHEN COALESCE(es.days_since_last_engagement, 999) <= 180 THEN 40
        ELSE 10
      END * 0.15)
    )::INTEGER
  END AS overall_health_score,

  -- Current cached scores (if available)
  hs.trend,
  hs.previous_score,
  hs.calculated_at AS score_calculated_at

FROM dossier_relationships dr
JOIN dossiers sd ON dr.source_dossier_id = sd.id
JOIN dossiers td ON dr.target_dossier_id = td.id
LEFT JOIN relationship_engagement_stats es ON dr.id = es.relationship_id
LEFT JOIN relationship_commitment_stats cs ON dr.id = cs.relationship_id
LEFT JOIN relationship_health_scores hs ON dr.id = hs.relationship_id
WHERE dr.relationship_type = 'bilateral_relation'
  AND dr.status = 'active';

-- ============================================================================
-- Function: Refresh Relationship Stats
-- ============================================================================

CREATE OR REPLACE FUNCTION refresh_relationship_health_stats()
RETURNS void AS $$
BEGIN
  -- Refresh materialized views concurrently
  REFRESH MATERIALIZED VIEW CONCURRENTLY relationship_engagement_stats;
  REFRESH MATERIALIZED VIEW CONCURRENTLY relationship_commitment_stats;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Function: Calculate and Cache Health Scores
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_relationship_health_scores(
  p_relationship_ids UUID[] DEFAULT NULL
)
RETURNS TABLE (
  relationship_id UUID,
  overall_score INTEGER,
  trend TEXT
) AS $$
DECLARE
  v_now TIMESTAMPTZ := NOW();
  v_period_start TIMESTAMPTZ := NOW() - INTERVAL '365 days';
BEGIN
  -- First, refresh the stats
  PERFORM refresh_relationship_health_stats();

  -- Calculate and upsert scores
  RETURN QUERY
  WITH calculated_scores AS (
    SELECT
      rhs.relationship_id,
      rhs.overall_health_score AS new_overall_score,
      rhs.engagement_frequency_score,
      rhs.commitment_compliance_score,
      rhs.reciprocity_score,
      rhs.interaction_quality_score,
      rhs.recency_score,
      hs.overall_score AS current_score,
      -- Calculate trend
      CASE
        WHEN hs.overall_score IS NULL THEN 'stable'
        WHEN rhs.overall_health_score > hs.overall_score + 5 THEN 'improving'
        WHEN rhs.overall_health_score < hs.overall_score - 5 THEN 'declining'
        ELSE 'stable'
      END AS calculated_trend,
      jsonb_build_object(
        'engagements_365d', rhs.total_engagements_365d,
        'commitments_total', rhs.total_commitments,
        'overdue_commitments', rhs.overdue_commitments,
        'days_since_engagement', rhs.days_since_last_engagement
      ) AS breakdown
    FROM relationship_health_summary rhs
    LEFT JOIN relationship_health_scores hs ON rhs.relationship_id = hs.relationship_id
    WHERE rhs.overall_health_score IS NOT NULL
      AND (p_relationship_ids IS NULL OR rhs.relationship_id = ANY(p_relationship_ids))
  )
  INSERT INTO relationship_health_scores (
    relationship_id,
    overall_score,
    engagement_frequency_score,
    commitment_compliance_score,
    reciprocity_score,
    interaction_quality_score,
    recency_score,
    trend,
    previous_score,
    score_breakdown,
    calculated_at,
    period_start,
    period_end
  )
  SELECT
    cs.relationship_id,
    cs.new_overall_score,
    cs.engagement_frequency_score,
    cs.commitment_compliance_score,
    cs.reciprocity_score,
    cs.interaction_quality_score,
    cs.recency_score,
    cs.calculated_trend,
    cs.current_score,
    cs.breakdown,
    v_now,
    v_period_start,
    v_now
  FROM calculated_scores cs
  ON CONFLICT (relationship_id) DO UPDATE SET
    overall_score = EXCLUDED.overall_score,
    engagement_frequency_score = EXCLUDED.engagement_frequency_score,
    commitment_compliance_score = EXCLUDED.commitment_compliance_score,
    reciprocity_score = EXCLUDED.reciprocity_score,
    interaction_quality_score = EXCLUDED.interaction_quality_score,
    recency_score = EXCLUDED.recency_score,
    trend = EXCLUDED.trend,
    previous_score = relationship_health_scores.overall_score,
    score_breakdown = EXCLUDED.score_breakdown,
    calculated_at = v_now,
    period_start = v_period_start,
    period_end = v_now
  RETURNING
    relationship_health_scores.relationship_id,
    relationship_health_scores.overall_score,
    relationship_health_scores.trend;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON MATERIALIZED VIEW relationship_engagement_stats IS 'Pre-computed engagement metrics per bilateral relationship';
COMMENT ON MATERIALIZED VIEW relationship_commitment_stats IS 'Pre-computed commitment metrics per bilateral relationship';
COMMENT ON VIEW relationship_health_summary IS 'Combined view of all relationship health metrics';
COMMENT ON FUNCTION refresh_relationship_health_stats IS 'Refreshes materialized views for relationship stats';
COMMENT ON FUNCTION calculate_relationship_health_scores IS 'Calculates and caches health scores for bilateral relationships';
