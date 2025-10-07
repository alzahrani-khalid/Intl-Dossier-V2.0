-- Migration: Create database functions for automation
-- Feature: 010-after-action-notes
-- Task: T015

-- Function: Auto-update overdue commitments
CREATE OR REPLACE FUNCTION update_overdue_commitments()
RETURNS void AS $$
BEGIN
  UPDATE commitments
  SET status = 'overdue', updated_at = NOW()
  WHERE due_date < CURRENT_DATE
  AND status NOT IN ('completed', 'cancelled', 'overdue');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule via pg_cron (hourly at minute 0)
-- Note: Requires pg_cron extension enabled in Supabase
SELECT cron.schedule(
  'update-overdue-commitments',
  '0 * * * *',
  'SELECT update_overdue_commitments()'
);
