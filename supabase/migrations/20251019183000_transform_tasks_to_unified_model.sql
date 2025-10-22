-- Migration: Transform existing tasks table to unified model
-- Zero data loss - adds columns and migrates JSONB data to structured columns
-- Part of: 025-unified-tasks-model implementation

-- Step 1: Add new columns to existing tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assignee_id UUID REFERENCES auth.users(id);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS engagement_id UUID REFERENCES engagements(id) ON DELETE SET NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS workflow_stage TEXT CHECK (workflow_stage IN ('todo', 'in_progress', 'review', 'done', 'cancelled'));
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS sla_deadline TIMESTAMPTZ;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS work_item_type TEXT CHECK (work_item_type IN ('dossier', 'position', 'ticket', 'generic'));
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS work_item_id UUID;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_by UUID REFERENCES auth.users(id);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

-- Step 2: Migrate data from JSONB to structured columns
DO $$
DECLARE
  migration_count INT := 0;
BEGIN
  -- Migrate assignee_id from assignment JSONB
  UPDATE tasks
  SET assignee_id = (assignment->>'assignee_id')::UUID
  WHERE assignee_id IS NULL
    AND assignment ? 'assignee_id';

  GET DIAGNOSTICS migration_count = ROW_COUNT;
  RAISE NOTICE 'Migrated assignee_id for % tasks', migration_count;

  -- Migrate work_item_type from source JSONB (skip 'multi' type - use NULL for multiple items)
  UPDATE tasks
  SET work_item_type = CASE
    WHEN source->>'type' IN ('dossier', 'position', 'ticket') THEN source->>'type'
    WHEN source->>'type' = 'multi' THEN NULL -- Multiple items stay in source JSONB
    ELSE 'generic'
  END
  WHERE work_item_type IS NULL
    AND source ? 'type';

  GET DIAGNOSTICS migration_count = ROW_COUNT;
  RAISE NOTICE 'Migrated work_item_type for % tasks', migration_count;

  -- Migrate work_item_id from source JSONB (primary dossier/position)
  UPDATE tasks
  SET work_item_id = COALESCE(
    (source->>'primary_dossier_id')::UUID,
    (source->>'primary_position_id')::UUID,
    (source->>'primary_ticket_id')::UUID
  )
  WHERE work_item_id IS NULL
    AND (source ? 'primary_dossier_id' OR source ? 'primary_position_id' OR source ? 'primary_ticket_id');

  GET DIAGNOSTICS migration_count = ROW_COUNT;
  RAISE NOTICE 'Migrated work_item_id for % tasks', migration_count;

  -- Set workflow_stage based on status
  UPDATE tasks
  SET workflow_stage = CASE
    WHEN status::text = 'pending' THEN 'todo'
    WHEN status::text = 'in_progress' THEN 'in_progress'
    WHEN status::text = 'review' THEN 'review'
    WHEN status::text = 'completed' THEN 'done'
    WHEN status::text = 'cancelled' THEN 'cancelled'
    ELSE 'todo'
  END
  WHERE workflow_stage IS NULL;

  GET DIAGNOSTICS migration_count = ROW_COUNT;
  RAISE NOTICE 'Set workflow_stage for % tasks', migration_count;

  -- Set updated_by from last_modified_by
  UPDATE tasks
  SET updated_by = last_modified_by
  WHERE updated_by IS NULL AND last_modified_by IS NOT NULL;

  GET DIAGNOSTICS migration_count = ROW_COUNT;
  RAISE NOTICE 'Migrated updated_by for % tasks', migration_count;

END $$;

-- Step 3: Add NOT NULL constraints after data migration (where applicable)
ALTER TABLE tasks ALTER COLUMN assignee_id SET NOT NULL;
ALTER TABLE tasks ALTER COLUMN workflow_stage SET NOT NULL;

-- Step 4: Update description to allow NULL (it was NOT NULL but should be optional)
ALTER TABLE tasks ALTER COLUMN description DROP NOT NULL;

-- Step 5: Add comments for documentation
COMMENT ON COLUMN tasks.assignee_id IS 'Primary person responsible for completing the task (migrated from assignment JSONB)';
COMMENT ON COLUMN tasks.engagement_id IS 'Optional engagement context for kanban board grouping';
COMMENT ON COLUMN tasks.workflow_stage IS 'Kanban board column for visual workflow tracking';
COMMENT ON COLUMN tasks.work_item_type IS 'Type of entity this task relates to (migrated from source JSONB)';
COMMENT ON COLUMN tasks.work_item_id IS 'Primary work item ID (migrated from source primary_*_id)';
COMMENT ON COLUMN tasks.updated_by IS 'User who last updated the task';
COMMENT ON COLUMN tasks.completed_by IS 'User who marked the task as completed';

-- Step 6: Verify migration
DO $$
DECLARE
  total_tasks INT;
  tasks_with_assignee INT;
  tasks_with_work_item INT;
BEGIN
  SELECT COUNT(*) INTO total_tasks FROM tasks WHERE is_deleted = false;
  SELECT COUNT(*) INTO tasks_with_assignee FROM tasks WHERE is_deleted = false AND assignee_id IS NOT NULL;
  SELECT COUNT(*) INTO tasks_with_work_item FROM tasks WHERE is_deleted = false AND work_item_type IS NOT NULL;

  RAISE NOTICE 'Migration verification:';
  RAISE NOTICE '  Total active tasks: %', total_tasks;
  RAISE NOTICE '  Tasks with assignee: %', tasks_with_assignee;
  RAISE NOTICE '  Tasks with work_item_type: %', tasks_with_work_item;

  IF tasks_with_assignee < total_tasks THEN
    RAISE WARNING 'Some tasks are missing assignee_id - manual review required';
  END IF;
END $$;
