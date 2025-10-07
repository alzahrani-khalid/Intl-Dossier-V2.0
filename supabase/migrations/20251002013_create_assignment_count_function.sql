-- Migration: T013 - Create assignment count maintenance
-- Description: Trigger function to maintain current_assignment_count on staff_profiles
-- Dependencies: T007 (assignments), T004 (staff_profiles)

-- Function to update staff assignment count when assignment status changes
CREATE OR REPLACE FUNCTION update_staff_assignment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    -- Increment count on new assignment
    UPDATE staff_profiles
    SET current_assignment_count = current_assignment_count + 1
    WHERE user_id = NEW.assignee_id;

  ELSIF (TG_OP = 'DELETE') THEN
    -- Decrement count on assignment deletion
    UPDATE staff_profiles
    SET current_assignment_count = GREATEST(0, current_assignment_count - 1)
    WHERE user_id = OLD.assignee_id;

  ELSIF (TG_OP = 'UPDATE') THEN
    -- Decrement count when assignment completes or is cancelled
    IF (OLD.status IN ('assigned', 'in_progress') AND NEW.status IN ('completed', 'cancelled')) THEN
      UPDATE staff_profiles
      SET current_assignment_count = GREATEST(0, current_assignment_count - 1)
      WHERE user_id = NEW.assignee_id;
    END IF;

    -- Handle reassignment (assignee changed)
    IF (OLD.assignee_id != NEW.assignee_id) THEN
      -- Decrement old assignee
      UPDATE staff_profiles
      SET current_assignment_count = GREATEST(0, current_assignment_count - 1)
      WHERE user_id = OLD.assignee_id;

      -- Increment new assignee
      UPDATE staff_profiles
      SET current_assignment_count = current_assignment_count + 1
      WHERE user_id = NEW.assignee_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to assignments table
DROP TRIGGER IF EXISTS update_assignment_count ON assignments;
CREATE TRIGGER update_assignment_count
  AFTER INSERT OR UPDATE OR DELETE ON assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_staff_assignment_count();

-- Comment
COMMENT ON FUNCTION update_staff_assignment_count IS 'Maintains cached assignment count on staff_profiles for performance';
