-- Migration: Create health_scores table for caching relationship health calculations
-- Feature: 030-health-commitment
-- Date: 2025-11-15
-- Purpose: Store calculated health scores with component breakdown for fast queries

-- Create health_scores table
CREATE TABLE health_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dossier_id UUID NOT NULL UNIQUE REFERENCES dossiers(id) ON DELETE CASCADE,
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
  engagement_frequency INTEGER NOT NULL CHECK (engagement_frequency >= 0 AND engagement_frequency <= 100),
  commitment_fulfillment INTEGER NOT NULL CHECK (commitment_fulfillment >= 0 AND commitment_fulfillment <= 100),
  recency_score INTEGER NOT NULL CHECK (recency_score IN (10, 40, 70, 100)),
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for query optimization
CREATE INDEX idx_health_scores_dossier_id ON health_scores(dossier_id);
CREATE INDEX idx_health_scores_calculated_at ON health_scores(calculated_at);
CREATE INDEX idx_health_scores_overall_score ON health_scores(overall_score);

-- Enable Row-Level Security (constitutional requirement: Article V)
ALTER TABLE health_scores ENABLE ROW LEVEL SECURITY;

-- RLS Policy: All authenticated users can read health scores
CREATE POLICY health_scores_read ON health_scores
FOR SELECT USING (auth.uid() IS NOT NULL);

-- RLS Policy: Only service role can write health scores
CREATE POLICY health_scores_write ON health_scores
FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Create trigger function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_health_scores_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call update function before updates
CREATE TRIGGER health_scores_updated_at
BEFORE UPDATE ON health_scores
FOR EACH ROW
EXECUTE FUNCTION update_health_scores_updated_at();

-- Add comments for documentation
COMMENT ON TABLE health_scores IS 'Cached relationship health scores calculated from engagement and commitment metrics';
COMMENT ON COLUMN health_scores.overall_score IS 'Composite health score (0-100). NULL if insufficient data (<3 engagements or 0 commitments)';
COMMENT ON COLUMN health_scores.engagement_frequency IS 'Engagement frequency component (0-100 scale)';
COMMENT ON COLUMN health_scores.commitment_fulfillment IS 'Commitment fulfillment rate component (0-100 scale)';
COMMENT ON COLUMN health_scores.recency_score IS 'Recency component: 100 (≤30d), 70 (30-90d), 40 (90-180d), 10 (>180d)';
COMMENT ON COLUMN health_scores.calculated_at IS 'Timestamp when health score was last calculated (for staleness detection)';
