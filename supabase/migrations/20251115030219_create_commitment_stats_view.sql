-- Migration: Create dossier_commitment_stats materialized view
-- Feature: 030-health-commitment
-- Date: 2025-11-15
-- Purpose: Pre-compute commitment aggregations per dossier for stats queries and health calculations

-- Create materialized view for commitment statistics
-- Note: Uses aa_commitments table (actual schema - After-Action commitments)
CREATE MATERIALIZED VIEW dossier_commitment_stats AS
SELECT
  c.dossier_id,
  -- Total commitments (excluding cancelled)
  COUNT(*) FILTER (WHERE c.status != 'cancelled') AS total_commitments,
  -- Active commitments (pending or in_progress)
  COUNT(*) FILTER (WHERE c.status IN ('pending', 'in_progress')) AS active_commitments,
  -- Overdue commitments (past due date and not completed/cancelled)
  COUNT(*) FILTER (WHERE c.due_date::date < CURRENT_DATE AND c.status NOT IN ('completed', 'cancelled')) AS overdue_commitments,
  -- Fulfilled commitments (completed status)
  COUNT(*) FILTER (WHERE c.status = 'completed') AS fulfilled_commitments,
  -- Upcoming commitments (due within 30 days and not completed/cancelled)
  COUNT(*) FILTER (
    WHERE c.due_date::date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
    AND c.status NOT IN ('completed', 'cancelled')
  ) AS upcoming_commitments,
  -- Fulfillment rate (0-100 scale)
  -- Formula: (fulfilled / total non-cancelled) * 100
  -- Edge case: If no commitments, default to 100% (spec requirement)
  CASE
    WHEN COUNT(*) FILTER (WHERE c.status != 'cancelled') = 0 THEN 100
    ELSE (
      COUNT(*) FILTER (WHERE c.status = 'completed')::numeric /
      COUNT(*) FILTER (WHERE c.status != 'cancelled')::numeric * 100
    )::integer
  END AS fulfillment_rate
FROM aa_commitments c
GROUP BY c.dossier_id;

-- Create unique index required for CONCURRENTLY option
CREATE UNIQUE INDEX idx_dossier_commitment_stats_dossier_id
ON dossier_commitment_stats(dossier_id);

-- Add comments for documentation
COMMENT ON MATERIALIZED VIEW dossier_commitment_stats IS 'Pre-computed commitment metrics per dossier. Refreshed every 15 minutes via scheduled job.';
COMMENT ON COLUMN dossier_commitment_stats.total_commitments IS 'Count of non-cancelled commitments';
COMMENT ON COLUMN dossier_commitment_stats.active_commitments IS 'Count of pending or in_progress commitments';
COMMENT ON COLUMN dossier_commitment_stats.overdue_commitments IS 'Count of commitments past due date (not completed/cancelled)';
COMMENT ON COLUMN dossier_commitment_stats.fulfilled_commitments IS 'Count of completed commitments';
COMMENT ON COLUMN dossier_commitment_stats.upcoming_commitments IS 'Count of commitments due within 30 days (not completed/cancelled)';
COMMENT ON COLUMN dossier_commitment_stats.fulfillment_rate IS 'Percentage of completed commitments (100 if no commitments per spec)';
