-- Migration: T012 - Create SLA deadline calculator
-- Description: Trigger function to automatically calculate sla_deadline on assignment insert
-- Dependencies: T006 (sla_configs), T007 (assignments)

-- Function to calculate SLA deadline based on work_item_type and priority
CREATE OR REPLACE FUNCTION calculate_sla_deadline_fn()
RETURNS TRIGGER AS $$
DECLARE
  deadline_hours NUMERIC(5,2);
BEGIN
  -- Lookup deadline hours from sla_configs
  SELECT sc.deadline_hours INTO deadline_hours
  FROM sla_configs sc
  WHERE sc.work_item_type = NEW.work_item_type
    AND sc.priority = NEW.priority;

  -- If no SLA config found, use default 48 hours
  IF deadline_hours IS NULL THEN
    deadline_hours := 48.0;
    RAISE WARNING 'No SLA config found for work_item_type=% priority=%, defaulting to 48 hours',
      NEW.work_item_type, NEW.priority;
  END IF;

  -- Calculate deadline: assigned_at + deadline_hours
  NEW.sla_deadline := NEW.assigned_at + (deadline_hours || ' hours')::INTERVAL;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to assignments table
DROP TRIGGER IF EXISTS calculate_sla_deadline ON assignments;
CREATE TRIGGER calculate_sla_deadline
  BEFORE INSERT ON assignments
  FOR EACH ROW
  EXECUTE FUNCTION calculate_sla_deadline_fn();

-- Comment
COMMENT ON FUNCTION calculate_sla_deadline_fn IS 'Automatically calculates sla_deadline from sla_configs lookup on assignment creation';
