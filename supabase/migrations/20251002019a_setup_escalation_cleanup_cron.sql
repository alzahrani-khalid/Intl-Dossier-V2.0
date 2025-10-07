-- Migration: T019a - Setup escalation cleanup cron job
-- Description: Delete resolved escalation events >90 days old (preserve SLA breaches indefinitely)
-- Dependencies: T009 (escalation_events)
-- Implements: FR-019 retention policy

-- Unschedule existing job if it exists
SELECT cron.unschedule('escalation-cleanup-daily')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'escalation-cleanup-daily');

-- Schedule escalation cleanup daily at 02:00 UTC
SELECT cron.schedule(
  'escalation-cleanup-daily',
  '0 2 * * *', -- 02:00 daily
  $$
  DELETE FROM escalation_events
  WHERE resolved_at < NOW() - INTERVAL '90 days'
    AND reason != 'sla_breach'; -- Preserve SLA breach events indefinitely for audit compliance
  $$
);

-- Log the schedule
DO $$
BEGIN
  RAISE NOTICE 'Escalation cleanup cron job scheduled: deletes non-breach escalations >90 days at 02:00 UTC daily';
  RAISE NOTICE 'SLA breach events (reason=sla_breach) are preserved indefinitely for compliance';
END $$;

-- Comment on index (already created in T009)
COMMENT ON INDEX idx_escalation_cleanup IS 'Optimizes escalation cleanup job (scans only resolved events)';
