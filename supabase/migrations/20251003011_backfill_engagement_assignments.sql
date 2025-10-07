-- Migration: Backfill engagement_id for existing assignments
-- Feature: 014-full-assignment-detail
-- Task: T012

-- This migration attempts to link existing assignments to engagements
-- based on work_item relationships (if engagements exist)

-- Note: This is a one-time backfill for existing data
-- New assignments will have engagement_id set on creation

-- Update assignments that are linked to dossiers which have engagements
UPDATE assignments a
SET engagement_id = e.id
FROM engagements e
WHERE
  a.engagement_id IS NULL AND
  a.work_item_type = 'dossier' AND
  a.work_item_id IN (
    SELECT dossier_id
    FROM engagement_dossiers ed
    WHERE ed.engagement_id = e.id
  );

-- Log the backfill results
DO $$
DECLARE
  v_updated_count INTEGER;
BEGIN
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RAISE NOTICE 'Backfilled engagement_id for % assignments', v_updated_count;
END $$;

-- Create index to track backfilled assignments (optional, for analytics)
CREATE INDEX IF NOT EXISTS idx_assignments_backfilled
ON assignments(engagement_id)
WHERE engagement_id IS NOT NULL AND created_at < '2025-10-03'::DATE;

-- Comment
COMMENT ON INDEX idx_assignments_backfilled IS
  'Tracks assignments that were backfilled with engagement_id during migration';
