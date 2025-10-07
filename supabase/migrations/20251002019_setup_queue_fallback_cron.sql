-- Migration: T019 - Setup queue fallback processor
-- Description: Schedule process_stale_queue_items() every 60 seconds (catches items missed by trigger)
-- Dependencies: T008 (assignment_queue), T014 (queue processing trigger)

-- Create function to process stale queue items (failed trigger processing)
CREATE OR REPLACE FUNCTION process_stale_queue_items()
RETURNS TABLE(processed_count INTEGER) AS $$
DECLARE
  items_processed INTEGER := 0;
BEGIN
  -- Process queue items that haven't been attempted in last 60 seconds
  -- This catches items that trigger-based processing might have missed
  -- Implementation will be in queue.service.ts (T042)
  -- For now, just return 0 (actual processing logic in application layer)

  -- Log stale items for monitoring
  PERFORM pg_notify(
    'queue_fallback_needed',
    json_build_object(
      'stale_count', (SELECT COUNT(*) FROM assignment_queue WHERE last_attempt_at IS NULL OR last_attempt_at < now() - interval '60 seconds'),
      'timestamp', now()
    )::text
  );

  items_processed := 0; -- Placeholder, actual processing in Edge Function
  RETURN QUERY SELECT items_processed;
END;
$$ LANGUAGE plpgsql;

-- Unschedule existing job if it exists
SELECT cron.unschedule('queue-fallback-processor')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'queue-fallback-processor');

-- Schedule queue fallback processor every 60 seconds
SELECT cron.schedule(
  'queue-fallback-processor',
  '60 seconds', -- Every minute
  $$
  SELECT process_stale_queue_items();
  $$
);

-- Comment
COMMENT ON FUNCTION process_stale_queue_items IS 'Fallback processor for queue items missed by trigger-based processing';

-- Log the schedule
DO $$
BEGIN
  RAISE NOTICE 'Queue fallback processor cron job scheduled: runs every 60 seconds';
END $$;
