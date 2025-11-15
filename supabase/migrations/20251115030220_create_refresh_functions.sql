-- Migration: Create database functions for materialized view refresh
-- Feature: 030-health-commitment
-- Date: 2025-11-15
-- Purpose: Wrapper functions to refresh materialized views with concurrent mode

-- Function to refresh engagement stats materialized view
CREATE OR REPLACE FUNCTION refresh_engagement_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY dossier_engagement_stats;
END;
$$;

-- Function to refresh commitment stats materialized view
CREATE OR REPLACE FUNCTION refresh_commitment_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY dossier_commitment_stats;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION refresh_engagement_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_commitment_stats() TO authenticated;

-- Add comments for documentation
COMMENT ON FUNCTION refresh_engagement_stats() IS 'Refreshes dossier_engagement_stats materialized view concurrently (no read locks). Called by scheduled job every 15 minutes.';
COMMENT ON FUNCTION refresh_commitment_stats() IS 'Refreshes dossier_commitment_stats materialized view concurrently (no read locks). Called by scheduled job every 15 minutes.';
