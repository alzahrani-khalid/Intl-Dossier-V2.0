-- Migration: Setup pg_cron jobs for automated tasks
-- Feature: 019-user-management-access
-- Task: T015
-- Date: 2025-10-11

-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant usage to postgres role (required for cron jobs)
GRANT USAGE ON SCHEMA cron TO postgres;

-- =====================================================================
-- CRON JOB 1: Delegation Expiry Check (every minute)
-- =====================================================================
-- Automatically revokes expired delegations
SELECT cron.schedule(
  'delegation-expiry-check',  -- Job name
  '* * * * *',                 -- Every minute
  $$
    UPDATE delegations
    SET revoked_at = now(),
        revocation_reason = 'Automatically revoked due to expiration',
        updated_at = now()
    WHERE revoked_at IS NULL
      AND expires_at <= now();
  $$
);

-- =====================================================================
-- CRON JOB 2: Guest Account Expiry (every 5 minutes)
-- =====================================================================
-- Automatically deactivates expired guest accounts
SELECT cron.schedule(
  'guest-account-expiry',     -- Job name
  '*/5 * * * *',              -- Every 5 minutes
  $$
    UPDATE auth.users
    SET status = 'deactivated',
        deactivated_at = now(),
        deactivation_reason = 'Guest account automatically expired',
        updated_at = now()
    WHERE user_type = 'guest'
      AND status = 'active'
      AND expires_at <= now();
  $$
);

-- =====================================================================
-- CRON JOB 3: Delegation Expiry Notifications (daily at 9 AM)
-- =====================================================================
-- Sends notifications for delegations expiring in next 7 days
SELECT cron.schedule(
  'delegation-expiry-notifications',  -- Job name
  '0 9 * * *',                        -- Daily at 9:00 AM
  $$
    SELECT notify_delegation_expired();
  $$
);

-- =====================================================================
-- CRON JOB 4: Quarterly Access Reviews (automatic scheduling)
-- =====================================================================
-- Automatically creates access review on 1st of Jan, Apr, Jul, Oct at 9 AM
SELECT cron.schedule(
  'quarterly-access-review',  -- Job name
  '0 9 1 1,4,7,10 *',         -- 9 AM on 1st of Jan, Apr, Jul, Oct
  $$
    INSERT INTO access_reviews (
      title,
      description,
      scope,
      status,
      reviewer_id,
      created_at
    )
    SELECT
      'Quarterly Access Review - ' || to_char(now(), 'Q') || 'Q ' || to_char(now(), 'YYYY'),
      'Automatic quarterly access review for compliance and privilege creep detection',
      'all',
      'pending',
      (SELECT id FROM auth.users WHERE role = 'super_admin' LIMIT 1),  -- Assign to first super_admin
      now()
    WHERE NOT EXISTS (
      -- Prevent duplicate reviews for same quarter
      SELECT 1 FROM access_reviews
      WHERE title LIKE '%' || to_char(now(), 'Q') || 'Q ' || to_char(now(), 'YYYY') || '%'
    );
  $$
);

-- =====================================================================
-- CRON JOB 5: Materialized View Refresh (every 6 hours)
-- =====================================================================
-- Refreshes access_review_summary materialized view for performance
SELECT cron.schedule(
  'refresh-access-review-summary',  -- Job name
  '0 */6 * * *',                    -- Every 6 hours
  $$
    REFRESH MATERIALIZED VIEW CONCURRENTLY access_review_summary;
  $$
);

-- =====================================================================
-- CRON JOB 6: Expired Approval Cleanup (daily at 1 AM)
-- =====================================================================
-- Marks expired approval requests as expired
SELECT cron.schedule(
  'expire-pending-approvals',  -- Job name
  '0 1 * * *',                 -- Daily at 1:00 AM
  $$
    SELECT expire_pending_approvals();
  $$
);

-- =====================================================================
-- CRON JOB 7: Session Cleanup (every hour)
-- =====================================================================
-- Removes expired sessions from database
SELECT cron.schedule(
  'session-cleanup',    -- Job name
  '0 * * * *',          -- Every hour
  $$
    DELETE FROM user_sessions
    WHERE expires_at < now();
  $$
);

-- =====================================================================
-- CRON JOB 8: Notification Cleanup (daily at 2 AM)
-- =====================================================================
-- Removes expired and old read notifications (older than 30 days)
SELECT cron.schedule(
  'notification-cleanup',  -- Job name
  '0 2 * * *',             -- Daily at 2:00 AM
  $$
    DELETE FROM notifications
    WHERE (
      expires_at IS NOT NULL AND expires_at < now()
    ) OR (
      read = true AND read_at < now() - interval '30 days'
    );
  $$
);

-- Add comments
COMMENT ON EXTENSION pg_cron IS 'PostgreSQL cron scheduler for automated user management tasks';

-- View all scheduled jobs (for verification)
SELECT
  jobid,
  schedule,
  command,
  nodename,
  nodeport,
  database,
  username,
  active,
  jobname
FROM cron.job
WHERE jobname IN (
  'delegation-expiry-check',
  'guest-account-expiry',
  'delegation-expiry-notifications',
  'quarterly-access-review',
  'refresh-access-review-summary',
  'expire-pending-approvals',
  'session-cleanup',
  'notification-cleanup'
)
ORDER BY jobname;
