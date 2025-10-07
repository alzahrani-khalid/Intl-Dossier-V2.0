-- Migration: Create rate_limits table for API rate limiting
-- Description: Implements sliding window rate limiting with per-user and global limits
-- Date: 2025-01-29

-- Create rate_limits table
CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Add comment for documentation
COMMENT ON TABLE rate_limits IS 'Rate limiting tracking for API requests';
COMMENT ON COLUMN rate_limits.key IS 'Rate limit key (user:uuid, ip:address, or global:all)';
COMMENT ON COLUMN rate_limits.count IS 'Number of requests in current window';
COMMENT ON COLUMN rate_limits.window_start IS 'Start time of the rate limit window';
COMMENT ON COLUMN rate_limits.expires_at IS 'Expiration time for automatic cleanup';

-- Create index for cleanup queries
CREATE INDEX IF NOT EXISTS idx_rate_limits_expires_at
  ON rate_limits(expires_at)
  WHERE expires_at > NOW();

-- Create index for window queries
CREATE INDEX IF NOT EXISTS idx_rate_limits_window
  ON rate_limits(key, window_start)
  WHERE expires_at > NOW();

-- Enable RLS
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Policy: Service role can manage all rate limits
CREATE POLICY rate_limits_service_all
  ON rate_limits
  FOR ALL
  USING (auth.role() = 'service_role');

-- Policy: Authenticated users can read their own rate limit status
CREATE POLICY rate_limits_user_read
  ON rate_limits
  FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND key = 'user:' || auth.uid()::text
  );

-- Function to clean up expired rate limits
CREATE OR REPLACE FUNCTION cleanup_expired_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM rate_limits
  WHERE expires_at < NOW() - INTERVAL '1 hour';
END;
$$;

-- Comment on cleanup function
COMMENT ON FUNCTION cleanup_expired_rate_limits() IS 'Removes expired rate limit entries (older than 1 hour)';

-- Create a scheduled job to run cleanup every 5 minutes (requires pg_cron extension)
-- Note: This will only work if pg_cron is enabled in your Supabase project
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
  ) THEN
    PERFORM cron.schedule(
      'cleanup-rate-limits',
      '*/5 * * * *', -- Every 5 minutes
      $$SELECT cleanup_expired_rate_limits()$$
    );
  END IF;
END
$$;

-- Grant execute permission on cleanup function to authenticated users
GRANT EXECUTE ON FUNCTION cleanup_expired_rate_limits() TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_rate_limits() TO service_role;