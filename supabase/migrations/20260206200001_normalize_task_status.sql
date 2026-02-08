-- Fix 5: Normalize Status Fields
-- Deprecate `status` column in tasks table.
-- Make `workflow_stage` the source of truth.
-- Add trigger to auto-sync `status` FROM `workflow_stage` on UPDATE for backward compatibility.

-- Map workflow_stage -> status
CREATE OR REPLACE FUNCTION sync_task_status_from_workflow_stage()
RETURNS TRIGGER AS $$
BEGIN
  -- Only sync when workflow_stage changes
  IF NEW.workflow_stage IS DISTINCT FROM OLD.workflow_stage THEN
    CASE NEW.workflow_stage
      WHEN 'todo' THEN
        NEW.status := 'pending';
      WHEN 'in_progress' THEN
        NEW.status := 'in_progress';
      WHEN 'review' THEN
        NEW.status := 'review';
      WHEN 'done' THEN
        NEW.status := 'completed';
        -- Also set completed_at if not already set
        IF NEW.completed_at IS NULL THEN
          NEW.completed_at := NOW();
        END IF;
      WHEN 'cancelled' THEN
        NEW.status := 'cancelled';
      ELSE
        -- No change for unknown stages
        NULL;
    END CASE;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS trg_sync_task_status ON tasks;

-- Create trigger: fires BEFORE UPDATE so we can modify the row
CREATE TRIGGER trg_sync_task_status
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION sync_task_status_from_workflow_stage();

-- Add comment marking status as deprecated
COMMENT ON COLUMN tasks.status IS 'DEPRECATED: Use workflow_stage instead. Auto-synced via trg_sync_task_status trigger.';

-- Backfill: sync existing rows where status doesn't match workflow_stage
UPDATE tasks SET
  status = CASE workflow_stage
    WHEN 'todo' THEN 'pending'
    WHEN 'in_progress' THEN 'in_progress'
    WHEN 'review' THEN 'review'
    WHEN 'done' THEN 'completed'
    WHEN 'cancelled' THEN 'cancelled'
    ELSE status
  END
WHERE workflow_stage IS NOT NULL
  AND status != CASE workflow_stage
    WHEN 'todo' THEN 'pending'
    WHEN 'in_progress' THEN 'in_progress'
    WHEN 'review' THEN 'review'
    WHEN 'done' THEN 'completed'
    WHEN 'cancelled' THEN 'cancelled'
    ELSE status
  END;
