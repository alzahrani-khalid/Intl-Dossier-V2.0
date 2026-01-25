-- Migration: Create Step-Up MFA Challenges Table
-- Date: 2026-01-24
-- Purpose: Support step-up MFA verification flow for sensitive operations

-- Create step_up_challenges table
CREATE TABLE IF NOT EXISTS public.step_up_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  resource_id TEXT,
  factors TEXT[] NOT NULL DEFAULT '{}',
  expires_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  completed_factor_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE step_up_challenges ENABLE ROW LEVEL SECURITY;

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_step_up_challenges_user_id ON step_up_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_step_up_challenges_expires_at ON step_up_challenges(expires_at);
CREATE INDEX IF NOT EXISTS idx_step_up_challenges_user_expires ON step_up_challenges(user_id, expires_at) WHERE completed_at IS NULL;

-- RLS Policies

-- Service role bypass
CREATE POLICY "Service role has full access to step_up_challenges"
ON step_up_challenges FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Users can view their own challenges
CREATE POLICY "Users can view own challenges"
ON step_up_challenges FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Users can insert their own challenges (via Edge Functions)
CREATE POLICY "Users can create own challenges"
ON step_up_challenges FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Only service role can update challenges (to mark as completed)
-- Regular users cannot update challenges directly

-- Auto-delete expired challenges (cron job)
-- Note: Requires pg_cron extension
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule(
      'cleanup_expired_step_up_challenges',
      '0 * * * *', -- Every hour
      $$DELETE FROM step_up_challenges WHERE expires_at < NOW() - INTERVAL '1 hour'$$
    );
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'pg_cron not available, skipping scheduled cleanup';
END $$;

-- Add rate_limits table if not exists (for rate limiting)
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  count INTEGER NOT NULL DEFAULT 0,
  window_start TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for rate limit lookups
CREATE INDEX IF NOT EXISTS idx_rate_limits_key ON rate_limits(key);
CREATE INDEX IF NOT EXISTS idx_rate_limits_expires ON rate_limits(expires_at);

-- Cleanup expired rate limits
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule(
      'cleanup_expired_rate_limits',
      '*/5 * * * *', -- Every 5 minutes
      $$DELETE FROM rate_limits WHERE expires_at < NOW()$$
    );
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'pg_cron not available, skipping scheduled cleanup';
END $$;

COMMENT ON TABLE step_up_challenges IS 'Step-up MFA challenges for sensitive operations';
COMMENT ON TABLE rate_limits IS 'Rate limiting entries for API throttling';
