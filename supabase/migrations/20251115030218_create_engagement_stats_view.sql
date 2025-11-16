-- Migration: Create dossier_engagement_stats materialized view
-- Feature: 030-health-commitment
-- Date: 2025-11-15
-- Purpose: Pre-compute engagement aggregations per dossier for fast stats queries

-- Create materialized view for engagement statistics
-- Note: Uses dossier_interactions table (actual schema)
CREATE MATERIALIZED VIEW dossier_engagement_stats AS
SELECT
  di.dossier_id,
  -- Total interactions in last 365 days
  COUNT(*) FILTER (WHERE di.created_at >= NOW() - INTERVAL '365 days') AS total_engagements_365d,
  -- Recent interactions in last 90 days
  COUNT(*) FILTER (WHERE di.created_at >= NOW() - INTERVAL '90 days') AS recent_engagements_90d,
  -- Latest interaction date for recency calculation
  MAX(di.created_at) AS latest_engagement_date,
  -- Normalized engagement frequency score (0-100 scale)
  -- Formula: 50 interactions/year = 100 points, linear scaling
  LEAST(100, (COUNT(*) FILTER (WHERE di.created_at >= NOW() - INTERVAL '365 days')::numeric * 2)::integer) AS engagement_frequency_score
FROM dossier_interactions di
GROUP BY di.dossier_id;

-- Create unique index required for CONCURRENTLY option
CREATE UNIQUE INDEX idx_dossier_engagement_stats_dossier_id
ON dossier_engagement_stats(dossier_id);

-- Add comments for documentation
COMMENT ON MATERIALIZED VIEW dossier_engagement_stats IS 'Pre-computed engagement metrics per dossier. Refreshed every 15 minutes via scheduled job.';
COMMENT ON COLUMN dossier_engagement_stats.total_engagements_365d IS 'Count of engagements in last 365 days';
COMMENT ON COLUMN dossier_engagement_stats.recent_engagements_90d IS 'Count of engagements in last 90 days (for stats display)';
COMMENT ON COLUMN dossier_engagement_stats.latest_engagement_date IS 'Most recent engagement timestamp (NULL if no engagements)';
COMMENT ON COLUMN dossier_engagement_stats.engagement_frequency_score IS 'Normalized score (0-100): 50 engagements/year = 100 points';
