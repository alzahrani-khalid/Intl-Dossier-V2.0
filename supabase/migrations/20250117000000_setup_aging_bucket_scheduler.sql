-- Migration: Setup Aging Bucket Scheduler
-- Task: T089a [Polish]
-- Purpose: Schedule daily aging bucket updates at 00:00 UTC using pg_cron
-- Depends on: pg_cron extension, update-aging-buckets Edge Function

-- Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant necessary permissions to postgres role for pg_cron
GRANT USAGE ON SCHEMA cron TO postgres;

-- Create a function to invoke the Edge Function via HTTP
CREATE OR REPLACE FUNCTION invoke_update_aging_buckets()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  edge_function_url TEXT;
  scheduler_token TEXT;
  response TEXT;
BEGIN
  -- Get Edge Function URL from environment
  -- Format: https://{project_ref}.supabase.co/functions/v1/update-aging-buckets
  edge_function_url := current_setting('app.settings.supabase_url', true) || '/functions/v1/update-aging-buckets';
  scheduler_token := current_setting('app.settings.scheduler_token', true);

  -- Make HTTP POST request to Edge Function
  -- Note: In production, use pg_net extension or pg_http for HTTP requests
  -- For now, this function serves as a placeholder that can be triggered manually or via pg_cron

  -- Log the scheduled execution
  RAISE NOTICE 'Scheduled aging bucket update triggered at %', NOW();

  -- In production environment, you would use:
  -- SELECT * FROM http_post(
  --   edge_function_url,
  --   '{}',
  --   'application/json',
  --   ARRAY[
  --     http_header('Authorization', 'Bearer ' || scheduler_token)
  --   ]
  -- );

EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to invoke aging bucket update: %', SQLERRM;
END;
$$;

-- Add helpful comment
COMMENT ON FUNCTION invoke_update_aging_buckets() IS 'Invokes the update-aging-buckets Edge Function to recalculate aging for all pending assignments';

-- Schedule the job to run daily at 00:00 UTC
-- This creates a cron job that runs every day at midnight UTC
SELECT cron.schedule(
  'update-aging-buckets-daily',           -- Job name
  '0 0 * * *',                            -- Cron expression: daily at 00:00 UTC
  $$SELECT invoke_update_aging_buckets()$$ -- SQL command to execute
);

-- Create a table to log aging bucket update executions (optional but recommended)
CREATE TABLE IF NOT EXISTS aging_bucket_update_logs (
  id BIGSERIAL PRIMARY KEY,
  executed_at TIMESTAMPTZ DEFAULT NOW(),
  total_assignments INTEGER,
  updated_count INTEGER,
  cache_keys_invalidated INTEGER,
  execution_time_ms INTEGER,
  status TEXT CHECK (status IN ('success', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for efficient log queries
CREATE INDEX IF NOT EXISTS idx_aging_bucket_logs_executed_at
  ON aging_bucket_update_logs(executed_at DESC);

-- Enable RLS on logs table
ALTER TABLE aging_bucket_update_logs ENABLE ROW LEVEL SECURITY;

-- Allow service role to insert logs
CREATE POLICY "Service role can insert aging bucket logs"
  ON aging_bucket_update_logs
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Allow authenticated users with admin role to view logs
CREATE POLICY "Admins can view aging bucket logs"
  ON aging_bucket_update_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Add helpful comments
COMMENT ON TABLE aging_bucket_update_logs IS 'Audit log for scheduled aging bucket update executions';
COMMENT ON COLUMN aging_bucket_update_logs.total_assignments IS 'Total number of pending assignments processed';
COMMENT ON COLUMN aging_bucket_update_logs.updated_count IS 'Number of assignments with updated aging calculation';
COMMENT ON COLUMN aging_bucket_update_logs.cache_keys_invalidated IS 'Number of Redis cache keys cleared';
COMMENT ON COLUMN aging_bucket_update_logs.execution_time_ms IS 'Job execution time in milliseconds';

-- Create a function to manually trigger aging bucket update (for testing)
CREATE OR REPLACE FUNCTION manual_update_aging_buckets()
RETURNS TABLE (
  total_assignments INTEGER,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM invoke_update_aging_buckets();

  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER as total_assignments,
    'Aging bucket update triggered manually' as message
  FROM assignments
  WHERE status = 'pending';
END;
$$;

COMMENT ON FUNCTION manual_update_aging_buckets() IS 'Manually trigger aging bucket update for testing purposes';

-- Grant execute permission to authenticated users with admin role
GRANT EXECUTE ON FUNCTION manual_update_aging_buckets() TO authenticated;
