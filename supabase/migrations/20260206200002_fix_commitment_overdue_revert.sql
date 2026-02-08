-- Fix 6: Fix Commitment Overdue Revert
-- Problem: Trigger marks overdue but doesn't revert when due_date is extended
-- Solution: Check both directions - mark overdue AND revert from overdue

CREATE OR REPLACE FUNCTION check_commitment_overdue()
RETURNS TRIGGER AS $$
BEGIN
  -- If commitment is past due date and status is pending or in_progress, mark as overdue
  IF NEW.due_date < CURRENT_DATE AND NEW.status IN ('pending', 'in_progress') THEN
    NEW.status := 'overdue';
    NEW.updated_at := NOW();
  -- If commitment was overdue but due_date has been extended, revert to in_progress
  ELSIF NEW.status = 'overdue' AND NEW.due_date >= CURRENT_DATE THEN
    NEW.status := 'in_progress';
    NEW.updated_at := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION check_commitment_overdue() IS 'Auto-updates commitment status to overdue if past due date, and reverts from overdue to in_progress if due_date is extended. Bidirectional check.';
