-- Migration: Migrate data from assignments to unified tasks table
-- Three-phase migration with zero data loss and 30-day rollback capability
-- Part of: 025-unified-tasks-model implementation

-- Phase 1: Rename old assignments table for rollback capability
DO $$
BEGIN
  -- Check if assignments table exists
  IF EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'assignments'
  ) THEN
    -- Rename to assignments_deprecated for 30-day rollback window
    ALTER TABLE assignments RENAME TO assignments_deprecated;
    RAISE NOTICE 'Renamed assignments → assignments_deprecated for rollback capability';
  ELSE
    RAISE NOTICE 'No assignments table found - skipping rename';
  END IF;
END $$;

-- Phase 2: Migrate data from assignments_deprecated to tasks
DO $$
DECLARE
  old_count INT;
  new_count INT;
  migration_start TIMESTAMPTZ;
BEGIN
  migration_start := now();

  -- Check if we have data to migrate
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'assignments_deprecated') THEN
    SELECT COUNT(*) INTO old_count FROM assignments_deprecated;
    RAISE NOTICE 'Starting migration of % assignments...', old_count;

    -- Migrate all assignment data to tasks table
    INSERT INTO tasks (
      id,
      title,
      description,
      assignee_id,
      engagement_id,
      status,
      workflow_stage,
      priority,
      sla_deadline,
      work_item_type,
      work_item_id,
      source,
      created_by,
      updated_by,
      completed_by,
      created_at,
      updated_at,
      completed_at,
      is_deleted
    )
    SELECT
      a.id,
      -- Generate title from assignment ID if no task title exists
      COALESCE(
        (SELECT title FROM tasks_deprecated t WHERE t.assignment_id = a.id LIMIT 1),
        'Assignment #' || SUBSTRING(a.id::text, 1, 8)
      ) AS title,
      -- Get description from old tasks table if exists
      COALESCE(
        (SELECT description FROM tasks_deprecated t WHERE t.assignment_id = a.id LIMIT 1),
        ''
      ) AS description,
      a.assignee_id,
      NULL AS engagement_id, -- Must be manually backfilled if needed
      a.status,
      a.workflow_stage,
      a.priority,
      a.sla_deadline,
      a.work_item_type,
      a.work_item_id,
      COALESCE(a.source, '{}'::jsonb) AS source,
      a.created_by,
      a.updated_by,
      a.completed_by,
      a.created_at,
      a.updated_at,
      a.completed_at,
      COALESCE(a.is_deleted, false) AS is_deleted
    FROM assignments_deprecated a
    ON CONFLICT (id) DO NOTHING; -- Skip if already migrated

    -- Verify migration count
    SELECT COUNT(*) INTO new_count FROM tasks;

    IF old_count != new_count THEN
      RAISE EXCEPTION 'Migration failed: Expected % rows, got %', old_count, new_count;
    END IF;

    RAISE NOTICE 'Migration successful: % rows migrated in % seconds', new_count, EXTRACT(EPOCH FROM (now() - migration_start));

  ELSE
    RAISE NOTICE 'No assignments_deprecated table found - migration skipped';
  END IF;

END $$;

-- Phase 3: Sample data verification
DO $$
DECLARE
  sample_id UUID;
  sample_title TEXT;
BEGIN
  -- Get a random sample for verification
  SELECT id, title INTO sample_id, sample_title
  FROM tasks
  WHERE is_deleted = false
  LIMIT 1;

  IF sample_id IS NOT NULL THEN
    RAISE NOTICE 'Sample verification - Task ID: %, Title: %', sample_id, sample_title;
  END IF;
END $$;

-- Add migration metadata
COMMENT ON TABLE tasks IS 'Unified tasks table (migrated from assignments on ' || now()::text || ')';

-- Optionally drop old tasks_deprecated table if it exists
-- UNCOMMENT after confirming migration success
-- DROP TABLE IF EXISTS tasks_deprecated;
