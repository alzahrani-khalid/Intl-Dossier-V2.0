-- Migration: Create dossier_statistics materialized view
-- Feature: R13 - Pre-computed aggregate statistics for dossier dashboards
-- Date: 2026-01-19
-- Description: Creates a materialized view that pre-computes aggregate statistics
--              for each dossier including task_count, commitment_count, position_count,
--              relationship_count, event_count, document_count, and last_activity_at.
--              Includes periodic refresh (every 5 minutes) and trigger-based refresh.

-- ============================================================================
-- DROP EXISTING OBJECTS (for idempotent migrations)
-- ============================================================================

DROP MATERIALIZED VIEW IF EXISTS dossier_statistics CASCADE;
DROP FUNCTION IF EXISTS refresh_dossier_statistics() CASCADE;
DROP FUNCTION IF EXISTS schedule_dossier_statistics_refresh() CASCADE;
DROP FUNCTION IF EXISTS get_dossier_statistics(UUID) CASCADE;
DROP FUNCTION IF EXISTS get_dossier_statistics_batch(UUID[]) CASCADE;

-- ============================================================================
-- CREATE MATERIALIZED VIEW: dossier_statistics
-- ============================================================================

CREATE MATERIALIZED VIEW dossier_statistics AS
SELECT
  d.id AS dossier_id,
  d.type AS dossier_type,
  d.status AS dossier_status,
  d.name_en,
  d.name_ar,

  -- Task counts (from work_item_dossiers junction table)
  COALESCE(task_stats.task_count, 0)::INTEGER AS task_count,
  COALESCE(task_stats.pending_task_count, 0)::INTEGER AS pending_task_count,
  COALESCE(task_stats.overdue_task_count, 0)::INTEGER AS overdue_task_count,

  -- Commitment counts (from work_item_dossiers junction table)
  COALESCE(commitment_stats.commitment_count, 0)::INTEGER AS commitment_count,
  COALESCE(commitment_stats.pending_commitment_count, 0)::INTEGER AS pending_commitment_count,
  COALESCE(commitment_stats.overdue_commitment_count, 0)::INTEGER AS overdue_commitment_count,

  -- Intake ticket counts (from work_item_dossiers junction table)
  COALESCE(intake_stats.intake_count, 0)::INTEGER AS intake_count,
  COALESCE(intake_stats.pending_intake_count, 0)::INTEGER AS pending_intake_count,

  -- Position counts (from position_dossier_links)
  COALESCE(position_stats.position_count, 0)::INTEGER AS position_count,
  COALESCE(position_stats.published_position_count, 0)::INTEGER AS published_position_count,

  -- Relationship counts (dossier-to-dossier relationships)
  COALESCE(relationship_stats.relationship_count, 0)::INTEGER AS relationship_count,
  COALESCE(relationship_stats.active_relationship_count, 0)::INTEGER AS active_relationship_count,

  -- Event counts (via engagements or direct)
  COALESCE(event_stats.event_count, 0)::INTEGER AS event_count,
  COALESCE(event_stats.upcoming_event_count, 0)::INTEGER AS upcoming_event_count,

  -- Document/Attachment counts
  COALESCE(document_stats.document_count, 0)::INTEGER AS document_count,

  -- Engagement counts (direct engagement dossiers)
  COALESCE(engagement_stats.engagement_count, 0)::INTEGER AS engagement_count,

  -- MOU counts (related MOUs)
  COALESCE(mou_stats.mou_count, 0)::INTEGER AS mou_count,
  COALESCE(mou_stats.active_mou_count, 0)::INTEGER AS active_mou_count,

  -- Aggregated counts for quick stats
  (
    COALESCE(task_stats.task_count, 0) +
    COALESCE(commitment_stats.commitment_count, 0) +
    COALESCE(intake_stats.intake_count, 0)
  )::INTEGER AS total_work_items,

  (
    COALESCE(task_stats.pending_task_count, 0) +
    COALESCE(commitment_stats.pending_commitment_count, 0) +
    COALESCE(intake_stats.pending_intake_count, 0)
  )::INTEGER AS total_pending_work,

  (
    COALESCE(task_stats.overdue_task_count, 0) +
    COALESCE(commitment_stats.overdue_commitment_count, 0)
  )::INTEGER AS total_overdue,

  -- Last activity timestamp (most recent activity across all work items)
  GREATEST(
    task_stats.last_task_activity,
    commitment_stats.last_commitment_activity,
    intake_stats.last_intake_activity,
    position_stats.last_position_activity,
    relationship_stats.last_relationship_activity,
    engagement_stats.last_engagement_activity,
    d.updated_at
  ) AS last_activity_at,

  -- Refresh metadata
  NOW() AS refreshed_at

FROM dossiers d

-- Task statistics via work_item_dossiers
LEFT JOIN LATERAL (
  SELECT
    COUNT(*)::INTEGER AS task_count,
    COUNT(*) FILTER (WHERE t.status IN ('pending', 'in_progress', 'review'))::INTEGER AS pending_task_count,
    COUNT(*) FILTER (WHERE t.status IN ('pending', 'in_progress') AND t.sla_deadline < NOW())::INTEGER AS overdue_task_count,
    MAX(t.updated_at) AS last_task_activity
  FROM work_item_dossiers wid
  JOIN tasks t ON wid.work_item_id = t.id AND wid.work_item_type = 'task'
  WHERE wid.dossier_id = d.id
    AND wid.deleted_at IS NULL
    AND t.is_deleted = false
) task_stats ON true

-- Commitment statistics via work_item_dossiers
LEFT JOIN LATERAL (
  SELECT
    COUNT(*)::INTEGER AS commitment_count,
    COUNT(*) FILTER (WHERE c.status IN ('pending', 'in_progress'))::INTEGER AS pending_commitment_count,
    COUNT(*) FILTER (WHERE c.status IN ('pending', 'in_progress') AND c.due_date < CURRENT_DATE)::INTEGER AS overdue_commitment_count,
    MAX(c.updated_at) AS last_commitment_activity
  FROM work_item_dossiers wid
  JOIN commitments c ON wid.work_item_id = c.id AND wid.work_item_type = 'commitment'
  WHERE wid.dossier_id = d.id
    AND wid.deleted_at IS NULL
) commitment_stats ON true

-- Intake ticket statistics via work_item_dossiers
LEFT JOIN LATERAL (
  SELECT
    COUNT(*)::INTEGER AS intake_count,
    COUNT(*) FILTER (WHERE it.status IN ('new', 'open', 'in_progress', 'awaiting_response'))::INTEGER AS pending_intake_count,
    MAX(it.updated_at) AS last_intake_activity
  FROM work_item_dossiers wid
  JOIN intake_tickets it ON wid.work_item_id = it.id AND wid.work_item_type = 'intake'
  WHERE wid.dossier_id = d.id
    AND wid.deleted_at IS NULL
) intake_stats ON true

-- Position statistics via position_dossier_links
LEFT JOIN LATERAL (
  SELECT
    COUNT(*)::INTEGER AS position_count,
    COUNT(*) FILTER (WHERE p.status = 'published')::INTEGER AS published_position_count,
    MAX(p.updated_at) AS last_position_activity
  FROM position_dossier_links pdl
  JOIN positions p ON pdl.position_id = p.id
  WHERE pdl.dossier_id = d.id
) position_stats ON true

-- Relationship statistics (dossier-to-dossier)
LEFT JOIN LATERAL (
  SELECT
    COUNT(*)::INTEGER AS relationship_count,
    COUNT(*) FILTER (WHERE dr.status = 'active')::INTEGER AS active_relationship_count,
    MAX(dr.created_at) AS last_relationship_activity
  FROM dossier_relationships dr
  WHERE dr.source_dossier_id = d.id OR dr.target_dossier_id = d.id
) relationship_stats ON true

-- Event statistics (via country/organization links)
LEFT JOIN LATERAL (
  SELECT
    COUNT(*)::INTEGER AS event_count,
    COUNT(*) FILTER (WHERE e.start_datetime > NOW() AND e.status IN ('scheduled', 'ongoing'))::INTEGER AS upcoming_event_count
  FROM events e
  WHERE (
    -- Events for countries
    (d.type = 'country' AND e.country_id IN (SELECT c.id FROM countries c WHERE c.dossier_id = d.id))
    OR
    -- Events by organizations
    (d.type = 'organization' AND e.organizer_id IN (SELECT o.id FROM organizations o WHERE o.dossier_id = d.id))
  )
) event_stats ON true

-- Document/Attachment statistics
LEFT JOIN LATERAL (
  SELECT COUNT(*)::INTEGER AS document_count
  FROM attachments a
  WHERE a.entity_type = 'dossier' AND a.entity_id = d.id
) document_stats ON true

-- Engagement statistics (for engagement-type dossiers or related)
LEFT JOIN LATERAL (
  SELECT
    COUNT(*)::INTEGER AS engagement_count,
    MAX(e.updated_at) AS last_engagement_activity
  FROM engagements e
  WHERE e.dossier_id = d.id
) engagement_stats ON true

-- MOU statistics
LEFT JOIN LATERAL (
  SELECT
    COUNT(*)::INTEGER AS mou_count,
    COUNT(*) FILTER (WHERE m.status = 'active')::INTEGER AS active_mou_count
  FROM mous m
  WHERE m.country_id IN (SELECT c.id FROM countries c WHERE c.dossier_id = d.id)
     OR m.organization_id IN (SELECT o.id FROM organizations o WHERE o.dossier_id = d.id)
) mou_stats ON true

WHERE d.archived = false
  AND d.status != 'deleted';

-- ============================================================================
-- CREATE INDEXES FOR FAST LOOKUPS
-- ============================================================================

-- Unique index required for CONCURRENTLY refresh
CREATE UNIQUE INDEX idx_dossier_statistics_id
  ON dossier_statistics (dossier_id);

-- Index for filtering by dossier type
CREATE INDEX idx_dossier_statistics_type
  ON dossier_statistics (dossier_type);

-- Index for filtering by status
CREATE INDEX idx_dossier_statistics_status
  ON dossier_statistics (dossier_status);

-- Index for sorting by last activity (dashboard relevance)
CREATE INDEX idx_dossier_statistics_last_activity
  ON dossier_statistics (last_activity_at DESC NULLS LAST);

-- Index for dossiers with pending work (attention needed)
CREATE INDEX idx_dossier_statistics_pending
  ON dossier_statistics (total_pending_work DESC)
  WHERE total_pending_work > 0;

-- Index for dossiers with overdue items (urgent)
CREATE INDEX idx_dossier_statistics_overdue
  ON dossier_statistics (total_overdue DESC)
  WHERE total_overdue > 0;

-- Composite index for dashboard queries
CREATE INDEX idx_dossier_statistics_dashboard
  ON dossier_statistics (dossier_type, last_activity_at DESC, total_pending_work DESC);

-- ============================================================================
-- CREATE REFRESH FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION refresh_dossier_statistics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Use CONCURRENTLY to avoid locking during refresh
  REFRESH MATERIALIZED VIEW CONCURRENTLY dossier_statistics;

  -- Log the refresh (optional - for monitoring)
  RAISE NOTICE 'dossier_statistics refreshed at %', NOW();
END;
$$;

COMMENT ON FUNCTION refresh_dossier_statistics() IS
  'Refreshes the dossier_statistics materialized view concurrently without blocking reads';

-- ============================================================================
-- CREATE TRIGGER-BASED REFRESH SCHEDULING FUNCTION
-- ============================================================================

-- This function schedules an async refresh to avoid blocking operations
-- It uses pg_notify to signal a background worker (if configured)
CREATE OR REPLACE FUNCTION schedule_dossier_statistics_refresh()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Notify channel for async processing (can be picked up by background worker)
  PERFORM pg_notify('dossier_statistics_refresh',
    json_build_object(
      'table', TG_TABLE_NAME,
      'operation', TG_OP,
      'timestamp', NOW()
    )::text
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

COMMENT ON FUNCTION schedule_dossier_statistics_refresh() IS
  'Schedules an async refresh of dossier_statistics via pg_notify';

-- ============================================================================
-- CREATE TRIGGERS ON RELATED TABLES
-- ============================================================================

-- Trigger on work_item_dossiers (main junction table)
DROP TRIGGER IF EXISTS trigger_refresh_dossier_stats_on_work_item_dossiers ON work_item_dossiers;
CREATE TRIGGER trigger_refresh_dossier_stats_on_work_item_dossiers
  AFTER INSERT OR UPDATE OR DELETE ON work_item_dossiers
  FOR EACH STATEMENT
  EXECUTE FUNCTION schedule_dossier_statistics_refresh();

-- Trigger on tasks
DROP TRIGGER IF EXISTS trigger_refresh_dossier_stats_on_tasks ON tasks;
CREATE TRIGGER trigger_refresh_dossier_stats_on_tasks
  AFTER INSERT OR UPDATE OF status, sla_deadline, is_deleted OR DELETE ON tasks
  FOR EACH STATEMENT
  EXECUTE FUNCTION schedule_dossier_statistics_refresh();

-- Trigger on commitments
DROP TRIGGER IF EXISTS trigger_refresh_dossier_stats_on_commitments ON commitments;
CREATE TRIGGER trigger_refresh_dossier_stats_on_commitments
  AFTER INSERT OR UPDATE OF status, due_date OR DELETE ON commitments
  FOR EACH STATEMENT
  EXECUTE FUNCTION schedule_dossier_statistics_refresh();

-- Trigger on dossier_relationships
DROP TRIGGER IF EXISTS trigger_refresh_dossier_stats_on_relationships ON dossier_relationships;
CREATE TRIGGER trigger_refresh_dossier_stats_on_relationships
  AFTER INSERT OR UPDATE OR DELETE ON dossier_relationships
  FOR EACH STATEMENT
  EXECUTE FUNCTION schedule_dossier_statistics_refresh();

-- Trigger on positions (via position_dossier_links)
DROP TRIGGER IF EXISTS trigger_refresh_dossier_stats_on_position_links ON position_dossier_links;
CREATE TRIGGER trigger_refresh_dossier_stats_on_position_links
  AFTER INSERT OR UPDATE OR DELETE ON position_dossier_links
  FOR EACH STATEMENT
  EXECUTE FUNCTION schedule_dossier_statistics_refresh();

-- Trigger on positions status changes
DROP TRIGGER IF EXISTS trigger_refresh_dossier_stats_on_positions ON positions;
CREATE TRIGGER trigger_refresh_dossier_stats_on_positions
  AFTER UPDATE OF status ON positions
  FOR EACH STATEMENT
  EXECUTE FUNCTION schedule_dossier_statistics_refresh();

-- Trigger on attachments
DROP TRIGGER IF EXISTS trigger_refresh_dossier_stats_on_attachments ON attachments;
CREATE TRIGGER trigger_refresh_dossier_stats_on_attachments
  AFTER INSERT OR DELETE ON attachments
  FOR EACH STATEMENT
  EXECUTE FUNCTION schedule_dossier_statistics_refresh();

-- Trigger on engagements
DROP TRIGGER IF EXISTS trigger_refresh_dossier_stats_on_engagements ON engagements;
CREATE TRIGGER trigger_refresh_dossier_stats_on_engagements
  AFTER INSERT OR UPDATE OR DELETE ON engagements
  FOR EACH STATEMENT
  EXECUTE FUNCTION schedule_dossier_statistics_refresh();

-- Trigger on dossiers (for status changes)
DROP TRIGGER IF EXISTS trigger_refresh_dossier_stats_on_dossiers ON dossiers;
CREATE TRIGGER trigger_refresh_dossier_stats_on_dossiers
  AFTER INSERT OR UPDATE OF status, archived OR DELETE ON dossiers
  FOR EACH STATEMENT
  EXECUTE FUNCTION schedule_dossier_statistics_refresh();

-- ============================================================================
-- SETUP PG_CRON JOB FOR PERIODIC REFRESH (every 5 minutes)
-- ============================================================================

-- Remove existing job if present
SELECT cron.unschedule('refresh-dossier-statistics')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'refresh-dossier-statistics'
);

-- Schedule new job to run every 5 minutes
SELECT cron.schedule(
  'refresh-dossier-statistics',  -- Job name
  '*/5 * * * *',                  -- Every 5 minutes
  $$SELECT refresh_dossier_statistics();$$
);

COMMENT ON FUNCTION refresh_dossier_statistics IS
  'Scheduled via pg_cron every 5 minutes. Manual refresh: SELECT refresh_dossier_statistics();';

-- ============================================================================
-- CREATE RPC FUNCTIONS FOR FRONTEND ACCESS
-- ============================================================================

-- Get statistics for a single dossier
CREATE OR REPLACE FUNCTION get_dossier_statistics(p_dossier_id UUID)
RETURNS TABLE (
  dossier_id UUID,
  dossier_type TEXT,
  dossier_status TEXT,
  name_en TEXT,
  name_ar TEXT,
  task_count INTEGER,
  pending_task_count INTEGER,
  overdue_task_count INTEGER,
  commitment_count INTEGER,
  pending_commitment_count INTEGER,
  overdue_commitment_count INTEGER,
  intake_count INTEGER,
  pending_intake_count INTEGER,
  position_count INTEGER,
  published_position_count INTEGER,
  relationship_count INTEGER,
  active_relationship_count INTEGER,
  event_count INTEGER,
  upcoming_event_count INTEGER,
  document_count INTEGER,
  engagement_count INTEGER,
  mou_count INTEGER,
  active_mou_count INTEGER,
  total_work_items INTEGER,
  total_pending_work INTEGER,
  total_overdue INTEGER,
  last_activity_at TIMESTAMPTZ,
  refreshed_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ds.dossier_id,
    ds.dossier_type,
    ds.dossier_status,
    ds.name_en,
    ds.name_ar,
    ds.task_count,
    ds.pending_task_count,
    ds.overdue_task_count,
    ds.commitment_count,
    ds.pending_commitment_count,
    ds.overdue_commitment_count,
    ds.intake_count,
    ds.pending_intake_count,
    ds.position_count,
    ds.published_position_count,
    ds.relationship_count,
    ds.active_relationship_count,
    ds.event_count,
    ds.upcoming_event_count,
    ds.document_count,
    ds.engagement_count,
    ds.mou_count,
    ds.active_mou_count,
    ds.total_work_items,
    ds.total_pending_work,
    ds.total_overdue,
    ds.last_activity_at,
    ds.refreshed_at
  FROM dossier_statistics ds
  WHERE ds.dossier_id = p_dossier_id;
END;
$$;

COMMENT ON FUNCTION get_dossier_statistics(UUID) IS
  'Returns pre-computed statistics for a single dossier from the materialized view';

-- Get statistics for multiple dossiers (batch query)
CREATE OR REPLACE FUNCTION get_dossier_statistics_batch(p_dossier_ids UUID[])
RETURNS TABLE (
  dossier_id UUID,
  dossier_type TEXT,
  dossier_status TEXT,
  name_en TEXT,
  name_ar TEXT,
  task_count INTEGER,
  pending_task_count INTEGER,
  overdue_task_count INTEGER,
  commitment_count INTEGER,
  pending_commitment_count INTEGER,
  overdue_commitment_count INTEGER,
  intake_count INTEGER,
  pending_intake_count INTEGER,
  position_count INTEGER,
  published_position_count INTEGER,
  relationship_count INTEGER,
  active_relationship_count INTEGER,
  event_count INTEGER,
  upcoming_event_count INTEGER,
  document_count INTEGER,
  engagement_count INTEGER,
  mou_count INTEGER,
  active_mou_count INTEGER,
  total_work_items INTEGER,
  total_pending_work INTEGER,
  total_overdue INTEGER,
  last_activity_at TIMESTAMPTZ,
  refreshed_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ds.dossier_id,
    ds.dossier_type,
    ds.dossier_status,
    ds.name_en,
    ds.name_ar,
    ds.task_count,
    ds.pending_task_count,
    ds.overdue_task_count,
    ds.commitment_count,
    ds.pending_commitment_count,
    ds.overdue_commitment_count,
    ds.intake_count,
    ds.pending_intake_count,
    ds.position_count,
    ds.published_position_count,
    ds.relationship_count,
    ds.active_relationship_count,
    ds.event_count,
    ds.upcoming_event_count,
    ds.document_count,
    ds.engagement_count,
    ds.mou_count,
    ds.active_mou_count,
    ds.total_work_items,
    ds.total_pending_work,
    ds.total_overdue,
    ds.last_activity_at,
    ds.refreshed_at
  FROM dossier_statistics ds
  WHERE ds.dossier_id = ANY(p_dossier_ids)
  ORDER BY ds.last_activity_at DESC NULLS LAST;
END;
$$;

COMMENT ON FUNCTION get_dossier_statistics_batch(UUID[]) IS
  'Returns pre-computed statistics for multiple dossiers (batch query) from the materialized view';

-- Get summary statistics across all dossiers (for dashboard overview)
CREATE OR REPLACE FUNCTION get_dossier_statistics_summary(
  p_dossier_type TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_dossiers', COUNT(*),
    'total_tasks', SUM(task_count),
    'total_pending_tasks', SUM(pending_task_count),
    'total_overdue_tasks', SUM(overdue_task_count),
    'total_commitments', SUM(commitment_count),
    'total_pending_commitments', SUM(pending_commitment_count),
    'total_overdue_commitments', SUM(overdue_commitment_count),
    'total_intakes', SUM(intake_count),
    'total_pending_intakes', SUM(pending_intake_count),
    'total_positions', SUM(position_count),
    'total_relationships', SUM(relationship_count),
    'total_events', SUM(event_count),
    'total_documents', SUM(document_count),
    'total_work_items', SUM(total_work_items),
    'total_pending_work', SUM(total_pending_work),
    'total_overdue', SUM(total_overdue),
    'dossiers_with_pending_work', COUNT(*) FILTER (WHERE total_pending_work > 0),
    'dossiers_with_overdue', COUNT(*) FILTER (WHERE total_overdue > 0),
    'last_refresh', MAX(refreshed_at),
    'by_type', (
      SELECT jsonb_object_agg(
        dossier_type,
        jsonb_build_object(
          'count', type_count,
          'pending_work', type_pending,
          'overdue', type_overdue
        )
      )
      FROM (
        SELECT
          ds.dossier_type,
          COUNT(*) AS type_count,
          SUM(ds.total_pending_work) AS type_pending,
          SUM(ds.total_overdue) AS type_overdue
        FROM dossier_statistics ds
        WHERE (p_dossier_type IS NULL OR ds.dossier_type = p_dossier_type)
        GROUP BY ds.dossier_type
      ) type_stats
    )
  )
  INTO result
  FROM dossier_statistics ds
  WHERE (p_dossier_type IS NULL OR ds.dossier_type = p_dossier_type);

  RETURN result;
END;
$$;

COMMENT ON FUNCTION get_dossier_statistics_summary(TEXT) IS
  'Returns aggregated summary statistics across all dossiers, optionally filtered by type';

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT ON dossier_statistics TO authenticated;
GRANT EXECUTE ON FUNCTION get_dossier_statistics(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_dossier_statistics_batch(UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION get_dossier_statistics_summary(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_dossier_statistics() TO postgres;

-- ============================================================================
-- ADD TABLE COMMENTS
-- ============================================================================

COMMENT ON MATERIALIZED VIEW dossier_statistics IS
  'Pre-computed aggregate statistics for each dossier. Refreshed every 5 minutes via pg_cron and on related table changes via triggers.';
