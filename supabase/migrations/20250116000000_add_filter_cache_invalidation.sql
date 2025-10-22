/**
 * Migration: Filter Cache Invalidation Trigger
 *
 * Automatically invalidates Redis cache when assignment status changes
 * Task: T079 [US5]
 */

-- Create function to notify cache invalidation
CREATE OR REPLACE FUNCTION notify_filter_cache_invalidation()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify Edge Function to clear cache for this user
  -- The notification payload includes the user_id to target specific cache keys
  PERFORM pg_notify(
    'filter_cache_invalidation',
    json_build_object(
      'user_id', COALESCE(NEW.assignee_id::text, OLD.assignee_id::text),
      'assignment_id', NEW.id::text,
      'old_status', OLD.status,
      'new_status', NEW.status,
      'timestamp', NOW()
    )::text
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on assignments table
DROP TRIGGER IF EXISTS trigger_invalidate_filter_cache ON assignments;

CREATE TRIGGER trigger_invalidate_filter_cache
  AFTER UPDATE OF status, workflow_stage, priority, assigned_at ON assignments
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status
    OR OLD.workflow_stage IS DISTINCT FROM NEW.workflow_stage
    OR OLD.priority IS DISTINCT FROM NEW.priority
    OR OLD.assigned_at IS DISTINCT FROM NEW.assigned_at)
  EXECUTE FUNCTION notify_filter_cache_invalidation();

-- Comment on trigger
COMMENT ON TRIGGER trigger_invalidate_filter_cache ON assignments IS
  'Notifies filter cache invalidation when assignment status or key fields change';

-- Comment on function
COMMENT ON FUNCTION notify_filter_cache_invalidation() IS
  'Sends pg_notify event to invalidate filter cache for affected user';
