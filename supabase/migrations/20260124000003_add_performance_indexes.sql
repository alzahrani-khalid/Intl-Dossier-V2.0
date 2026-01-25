-- Migration: Add Performance Indexes and MV Refresh Cron
-- Date: 2026-01-24
-- Purpose: Phase 3 performance improvements

-- ============================================
-- Add Missing Indexes
-- ============================================

-- profiles.clearance_level (for RLS queries)
CREATE INDEX IF NOT EXISTS idx_profiles_clearance_level
ON profiles(clearance_level);

-- work_item_dossiers.inheritance_source (for filtering)
CREATE INDEX IF NOT EXISTS idx_work_item_dossiers_inheritance_source
ON work_item_dossiers(inheritance_source) WHERE deleted_at IS NULL;

-- dossiers frequently filtered columns
CREATE INDEX IF NOT EXISTS idx_dossiers_type ON dossiers(type) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_dossiers_status ON dossiers(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_dossiers_updated_at ON dossiers(updated_at DESC) WHERE deleted_at IS NULL;

-- intake_tickets performance indexes
CREATE INDEX IF NOT EXISTS idx_intake_tickets_status ON intake_tickets(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_intake_tickets_priority ON intake_tickets(priority) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_intake_tickets_assigned_to ON intake_tickets(assigned_to) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_intake_tickets_created_at ON intake_tickets(created_at DESC);

-- audit_logs performance (heavily queried)
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- engagements performance
CREATE INDEX IF NOT EXISTS idx_engagements_date ON engagements(date_from, date_to) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_engagements_status ON engagements(status) WHERE deleted_at IS NULL;

-- positions performance
CREATE INDEX IF NOT EXISTS idx_positions_dossier_id ON positions(dossier_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_positions_status ON positions(status) WHERE deleted_at IS NULL;

-- documents performance
CREATE INDEX IF NOT EXISTS idx_documents_dossier_id ON documents(dossier_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(document_type) WHERE deleted_at IS NULL;

-- ============================================
-- Materialized View Refresh Cron Jobs
-- ============================================

-- Refresh dossier_statistics_mv every 5 minutes (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Check if the MV exists before scheduling
    IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'dossier_statistics_mv') THEN
      PERFORM cron.schedule(
        'refresh_dossier_statistics_full',
        '*/5 * * * *',
        'REFRESH MATERIALIZED VIEW CONCURRENTLY dossier_statistics_mv'
      );
    END IF;

    -- Refresh user_productivity_metrics MV every 15 minutes
    IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'user_productivity_metrics') THEN
      PERFORM cron.schedule(
        'refresh_user_productivity_metrics',
        '*/15 * * * *',
        'REFRESH MATERIALIZED VIEW CONCURRENTLY user_productivity_metrics'
      );
    END IF;
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'pg_cron not available, skipping MV refresh scheduling';
END $$;

-- ============================================
-- Partial Indexes for Soft-Deleted Records
-- ============================================

-- Optimize queries that filter out deleted records
-- These partial indexes exclude soft-deleted records for faster lookups

CREATE INDEX IF NOT EXISTS idx_dossiers_active_name_en
ON dossiers(name_en) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_dossiers_active_name_ar
ON dossiers(name_ar) WHERE deleted_at IS NULL;

-- ============================================
-- BRIN Indexes for Time-Series Data
-- ============================================

-- BRIN indexes are more efficient for time-series data
-- Only use on tables with natural time ordering

-- Audit logs are append-only and time-ordered
DROP INDEX IF EXISTS idx_audit_logs_created_at_brin;
CREATE INDEX idx_audit_logs_created_at_brin ON audit_logs
USING BRIN(created_at) WITH (pages_per_range = 128);

-- ============================================
-- Statistics Targets for Better Query Planning
-- ============================================

-- Increase statistics for frequently filtered columns
ALTER TABLE dossiers ALTER COLUMN type SET STATISTICS 500;
ALTER TABLE dossiers ALTER COLUMN status SET STATISTICS 500;
ALTER TABLE intake_tickets ALTER COLUMN status SET STATISTICS 500;
ALTER TABLE intake_tickets ALTER COLUMN priority SET STATISTICS 500;

-- ============================================
-- Comments
-- ============================================

COMMENT ON INDEX idx_profiles_clearance_level IS 'Optimize RLS clearance level checks';
COMMENT ON INDEX idx_work_item_dossiers_inheritance_source IS 'Filter work items by inheritance source';
COMMENT ON INDEX idx_audit_logs_created_at_brin IS 'BRIN index for time-series audit log queries';
