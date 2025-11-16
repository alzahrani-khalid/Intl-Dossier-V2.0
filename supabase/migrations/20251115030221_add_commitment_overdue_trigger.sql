-- Migration: Add commitment overdue auto-detection trigger
-- Feature: 030-health-commitment
-- Date: 2025-11-15
-- Purpose: Automatically mark commitments as "overdue" when accessed if past due date

-- Create trigger function to check and update overdue status
CREATE OR REPLACE FUNCTION check_commitment_overdue()
RETURNS TRIGGER AS $$
BEGIN
  -- If commitment is past due date and status is pending or in_progress, mark as overdue
  IF NEW.due_date < CURRENT_DATE AND NEW.status IN ('pending', 'in_progress') THEN
    NEW.status := 'overdue';
    NEW.updated_at := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call function before UPDATE on aa_commitments table
CREATE TRIGGER commitment_overdue_check
BEFORE UPDATE ON aa_commitments
FOR EACH ROW
EXECUTE FUNCTION check_commitment_overdue();

-- Add comments for documentation
COMMENT ON FUNCTION check_commitment_overdue() IS 'Auto-updates commitment status to overdue if past due date when commitment is accessed. Works in conjunction with daily scheduled job for comprehensive coverage.';
COMMENT ON TRIGGER commitment_overdue_check ON aa_commitments IS 'Triggers before UPDATE to auto-mark overdue commitments. Provides real-time detection when commitments are viewed/modified.';
