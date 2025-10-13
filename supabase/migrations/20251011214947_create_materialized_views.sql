-- Migration: Create materialized views for access review performance
-- Feature: 019-user-management-access
-- Task: T012
-- Date: 2025-10-11

-- Materialized view for access review summary (optimizes query performance)
CREATE MATERIALIZED VIEW access_review_summary AS
SELECT
  u.id as user_id,
  u.email,
  u.username,
  u.full_name,
  u.role,
  u.user_type,
  u.status,
  u.last_login_at,
  u.expires_at,
  u.created_at,

  -- Inactivity detection (90 days threshold)
  CASE
    WHEN u.last_login_at IS NULL THEN true
    WHEN u.last_login_at < now() - interval '90 days' THEN true
    ELSE false
  END as is_inactive,

  -- Days since last login
  CASE
    WHEN u.last_login_at IS NULL THEN NULL
    ELSE EXTRACT(days FROM now() - u.last_login_at)::integer
  END as days_since_login,

  -- Guest expiry detection (expiring within 30 days)
  CASE
    WHEN u.user_type = 'guest' AND u.expires_at IS NOT NULL THEN
      CASE
        WHEN u.expires_at < now() THEN 'expired'
        WHEN u.expires_at <= now() + interval '30 days' THEN 'expiring_soon'
        ELSE 'active'
      END
    ELSE NULL
  END as guest_expiry_status,

  -- Days until expiry for guests
  CASE
    WHEN u.user_type = 'guest' AND u.expires_at IS NOT NULL THEN
      EXTRACT(days FROM u.expires_at - now())::integer
    ELSE NULL
  END as days_until_expiry,

  -- Active delegations count (as grantor)
  COALESCE((
    SELECT COUNT(*)
    FROM delegations d
    WHERE d.grantor_id = u.id
      AND d.revoked_at IS NULL
      AND d.expires_at > now()
  ), 0) as active_delegations_granted,

  -- Active delegations count (as grantee)
  COALESCE((
    SELECT COUNT(*)
    FROM delegations d
    WHERE d.grantee_id = u.id
      AND d.revoked_at IS NULL
      AND d.expires_at > now()
  ), 0) as active_delegations_received,

  -- Permissions from delegations
  COALESCE((
    SELECT jsonb_agg(DISTINCT perm)
    FROM delegations d,
    LATERAL unnest(d.delegated_permissions) AS perm
    WHERE d.grantee_id = u.id
      AND d.revoked_at IS NULL
      AND d.expires_at > now()
  ), '[]'::jsonb) as delegated_permissions,

  -- Has excessive permissions (more than 5 active delegations received)
  CASE
    WHEN (
      SELECT COUNT(*)
      FROM delegations d
      WHERE d.grantee_id = u.id
        AND d.revoked_at IS NULL
        AND d.expires_at > now()
    ) > 5 THEN true
    ELSE false
  END as has_excessive_permissions,

  -- Pending role approvals
  COALESCE((
    SELECT COUNT(*)
    FROM pending_role_approvals pra
    WHERE pra.user_id = u.id
      AND pra.status = 'pending'
  ), 0) as pending_approvals_count

FROM auth.users u
WHERE u.deleted_at IS NULL;  -- Exclude soft-deleted users if applicable

-- Create indexes on materialized view
CREATE UNIQUE INDEX idx_access_review_summary_user_id ON access_review_summary(user_id);
CREATE INDEX idx_access_review_summary_role ON access_review_summary(role);
CREATE INDEX idx_access_review_summary_status ON access_review_summary(status);
CREATE INDEX idx_access_review_summary_inactive ON access_review_summary(is_inactive);
CREATE INDEX idx_access_review_summary_guest_expiry ON access_review_summary(guest_expiry_status)
  WHERE guest_expiry_status IS NOT NULL;
CREATE INDEX idx_access_review_summary_excessive ON access_review_summary(has_excessive_permissions)
  WHERE has_excessive_permissions = true;

-- Function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_access_review_summary()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY access_review_summary;
END;
$$ LANGUAGE plpgsql;

-- Add comments
COMMENT ON MATERIALIZED VIEW access_review_summary IS 'Optimized summary view for access reviews (refreshed every 6 hours via cron)';
COMMENT ON COLUMN access_review_summary.user_id IS 'User identifier';
COMMENT ON COLUMN access_review_summary.is_inactive IS 'User inactive for 90+ days';
COMMENT ON COLUMN access_review_summary.days_since_login IS 'Days since last login';
COMMENT ON COLUMN access_review_summary.guest_expiry_status IS 'Guest expiry status (expired, expiring_soon, active)';
COMMENT ON COLUMN access_review_summary.days_until_expiry IS 'Days until guest account expires';
COMMENT ON COLUMN access_review_summary.active_delegations_granted IS 'Number of active delegations granted by user';
COMMENT ON COLUMN access_review_summary.active_delegations_received IS 'Number of active delegations received by user';
COMMENT ON COLUMN access_review_summary.delegated_permissions IS 'Array of permissions from delegations';
COMMENT ON COLUMN access_review_summary.has_excessive_permissions IS 'User has more than 5 active delegations';
COMMENT ON COLUMN access_review_summary.pending_approvals_count IS 'Number of pending role approval requests';
