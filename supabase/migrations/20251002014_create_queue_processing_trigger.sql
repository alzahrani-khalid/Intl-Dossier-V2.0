-- Migration: T014 - Create queue processing trigger
-- Description: Trigger to notify queue processor when capacity becomes available
-- Dependencies: T007 (assignments), T008 (assignment_queue)

-- Function to send pg_notify when assignment completes (frees capacity)
CREATE OR REPLACE FUNCTION process_queue_on_capacity_change()
RETURNS TRIGGER AS $$
DECLARE
  staff_unit UUID;
  staff_skills UUID[];
BEGIN
  -- Only trigger if assignment status changed to completed/cancelled (capacity freed)
  IF (TG_OP = 'UPDATE' AND
      OLD.status IN ('assigned', 'in_progress') AND
      NEW.status IN ('completed', 'cancelled')) THEN

    -- Get assignee's unit and skills
    SELECT unit_id, skills INTO staff_unit, staff_skills
    FROM staff_profiles
    WHERE user_id = NEW.assignee_id;

    -- Notify queue processor asynchronously (non-blocking)
    PERFORM pg_notify(
      'queue_process_needed',
      json_build_object(
        'unit_id', staff_unit,
        'freed_skills', staff_skills,
        'timestamp', now()
      )::text
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to assignments table
DROP TRIGGER IF EXISTS assignment_completion_trigger ON assignments;
CREATE TRIGGER assignment_completion_trigger
  AFTER UPDATE ON assignments
  FOR EACH ROW
  EXECUTE FUNCTION process_queue_on_capacity_change();

-- Comment
COMMENT ON FUNCTION process_queue_on_capacity_change IS 'Sends pg_notify to trigger asynchronous queue processing when staff capacity freed';
