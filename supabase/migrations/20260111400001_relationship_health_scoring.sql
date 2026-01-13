-- Migration: Create relationship_health_scores table for bilateral relationship health tracking
-- Feature: relationship-health-scoring
-- Date: 2026-01-11
-- Purpose: Automated scoring system for bilateral relationships based on engagement frequency,
--          commitment compliance, reciprocity, and interaction quality

-- ============================================================================
-- Relationship Health Scores Table
-- ============================================================================

-- Create relationship_health_scores table
CREATE TABLE relationship_health_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- The bilateral relationship being scored (references dossier_relationships)
  relationship_id UUID NOT NULL REFERENCES dossier_relationships(id) ON DELETE CASCADE,

  -- Overall composite score (0-100)
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),

  -- Component scores (each 0-100)
  engagement_frequency_score INTEGER NOT NULL CHECK (engagement_frequency_score >= 0 AND engagement_frequency_score <= 100),
  commitment_compliance_score INTEGER NOT NULL CHECK (commitment_compliance_score >= 0 AND commitment_compliance_score <= 100),
  reciprocity_score INTEGER NOT NULL CHECK (reciprocity_score >= 0 AND reciprocity_score <= 100),
  interaction_quality_score INTEGER NOT NULL CHECK (interaction_quality_score >= 0 AND interaction_quality_score <= 100),
  recency_score INTEGER NOT NULL CHECK (recency_score IN (10, 40, 70, 100)),

  -- Trend indicator: 'improving', 'stable', 'declining'
  trend TEXT NOT NULL DEFAULT 'stable' CHECK (trend IN ('improving', 'stable', 'declining')),

  -- Previous score for trend calculation
  previous_score INTEGER CHECK (previous_score >= 0 AND previous_score <= 100),

  -- Metadata for detailed breakdown
  score_breakdown JSONB DEFAULT '{}'::jsonb,

  -- Calculation timestamps
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,

  -- Standard timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure only one score per relationship at a time
  CONSTRAINT unique_relationship_score UNIQUE (relationship_id)
);

-- ============================================================================
-- Relationship Health History Table (for trend analysis)
-- ============================================================================

CREATE TABLE relationship_health_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  relationship_id UUID NOT NULL REFERENCES dossier_relationships(id) ON DELETE CASCADE,
  overall_score INTEGER NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
  engagement_frequency_score INTEGER NOT NULL,
  commitment_compliance_score INTEGER NOT NULL,
  reciprocity_score INTEGER NOT NULL,
  interaction_quality_score INTEGER NOT NULL,
  recency_score INTEGER NOT NULL,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Index for time-series queries
  CONSTRAINT valid_period CHECK (period_end > period_start)
);

-- ============================================================================
-- Relationship Health Alerts Table
-- ============================================================================

CREATE TABLE relationship_health_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  relationship_id UUID NOT NULL REFERENCES dossier_relationships(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN (
    'score_critical',     -- Score dropped below 30
    'score_declining',    -- Score dropped 20+ points
    'engagement_gap',     -- No engagement in 60+ days
    'commitment_overdue', -- Multiple overdue commitments
    'reciprocity_imbalance', -- One-sided relationship
    'score_improving'     -- Positive alert: score improved significantly
  )),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title_en TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  description_en TEXT NOT NULL,
  description_ar TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  is_dismissed BOOLEAN DEFAULT FALSE,
  alert_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- ============================================================================
-- Indexes
-- ============================================================================

-- Primary lookup indexes
CREATE INDEX idx_relationship_health_scores_relationship_id
  ON relationship_health_scores(relationship_id);
CREATE INDEX idx_relationship_health_scores_overall_score
  ON relationship_health_scores(overall_score);
CREATE INDEX idx_relationship_health_scores_trend
  ON relationship_health_scores(trend);
CREATE INDEX idx_relationship_health_scores_calculated_at
  ON relationship_health_scores(calculated_at);

-- History indexes for trend analysis
CREATE INDEX idx_relationship_health_history_relationship_id
  ON relationship_health_history(relationship_id);
CREATE INDEX idx_relationship_health_history_calculated_at
  ON relationship_health_history(calculated_at DESC);
CREATE INDEX idx_relationship_health_history_period
  ON relationship_health_history(relationship_id, period_end DESC);

-- Alert indexes
CREATE INDEX idx_relationship_health_alerts_relationship_id
  ON relationship_health_alerts(relationship_id);
CREATE INDEX idx_relationship_health_alerts_type
  ON relationship_health_alerts(alert_type);
CREATE INDEX idx_relationship_health_alerts_unread
  ON relationship_health_alerts(relationship_id, is_read) WHERE NOT is_read;
CREATE INDEX idx_relationship_health_alerts_active
  ON relationship_health_alerts(relationship_id, is_dismissed, expires_at)
  WHERE NOT is_dismissed;

-- ============================================================================
-- Row-Level Security
-- ============================================================================

ALTER TABLE relationship_health_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE relationship_health_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE relationship_health_alerts ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read health scores
CREATE POLICY relationship_health_scores_read ON relationship_health_scores
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Only service role can write health scores (calculated by system)
CREATE POLICY relationship_health_scores_write ON relationship_health_scores
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- History read policy
CREATE POLICY relationship_health_history_read ON relationship_health_history
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- History write policy (service role only)
CREATE POLICY relationship_health_history_write ON relationship_health_history
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Alerts read policy
CREATE POLICY relationship_health_alerts_read ON relationship_health_alerts
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Alerts can be updated by any authenticated user (to mark as read/dismissed)
CREATE POLICY relationship_health_alerts_update ON relationship_health_alerts
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Only service role can insert alerts
CREATE POLICY relationship_health_alerts_insert ON relationship_health_alerts
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- Trigger for updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_relationship_health_scores_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER relationship_health_scores_updated_at
  BEFORE UPDATE ON relationship_health_scores
  FOR EACH ROW
  EXECUTE FUNCTION update_relationship_health_scores_updated_at();

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE relationship_health_scores IS 'Current health scores for bilateral relationships with component breakdown';
COMMENT ON COLUMN relationship_health_scores.overall_score IS 'Composite health score (0-100) calculated from weighted components';
COMMENT ON COLUMN relationship_health_scores.engagement_frequency_score IS 'Score based on meeting/interaction frequency (0-100)';
COMMENT ON COLUMN relationship_health_scores.commitment_compliance_score IS 'Score based on on-time commitment fulfillment rate (0-100)';
COMMENT ON COLUMN relationship_health_scores.reciprocity_score IS 'Score based on balanced engagement from both parties (0-100)';
COMMENT ON COLUMN relationship_health_scores.interaction_quality_score IS 'Score based on engagement outcomes and positive indicators (0-100)';
COMMENT ON COLUMN relationship_health_scores.recency_score IS 'Score based on days since last engagement: 100 (≤30d), 70 (30-90d), 40 (90-180d), 10 (>180d)';
COMMENT ON COLUMN relationship_health_scores.trend IS 'Trend indicator based on 30-day comparison';
COMMENT ON COLUMN relationship_health_scores.score_breakdown IS 'Detailed JSON breakdown of score calculation factors';

COMMENT ON TABLE relationship_health_history IS 'Historical health scores for trend analysis and reporting';
COMMENT ON TABLE relationship_health_alerts IS 'Proactive alerts for relationship health issues';
