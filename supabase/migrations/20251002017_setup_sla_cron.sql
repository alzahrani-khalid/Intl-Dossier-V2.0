-- Migration: T017 - Setup SLA monitoring cron job
-- Description: Schedule sla_check_and_escalate() to run every 30 seconds
-- Dependencies: T015 (sla_check_and_escalate function)
-- Note: Supabase supports sub-minute cron via pg_cron

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Unschedule existing job if it exists
SELECT cron.unschedule('sla-monitoring')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'sla-monitoring');

-- Schedule SLA monitoring every 30 seconds
-- Format: '*/30 * * * * *' for sub-minute intervals (Supabase supports this)
SELECT cron.schedule(
  'sla-monitoring',
  '30 seconds', -- Every 30 seconds
  $$
  SELECT sla_check_and_escalate();
  $$
);

-- Comment
COMMENT ON EXTENSION pg_cron IS 'Cron-based job scheduler for PostgreSQL';

-- Log the schedule
DO $$
BEGIN
  RAISE NOTICE 'SLA monitoring cron job scheduled: runs sla_check_and_escalate() every 30 seconds';
END $$;
