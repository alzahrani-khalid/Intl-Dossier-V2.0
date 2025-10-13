-- Migration: Setup RLS policies for user management tables
-- Feature: 019-user-management-access
-- Task: T014
-- Date: 2025-10-11

-- Enable RLS on all tables
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE delegations ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_role_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- =====================================================================
-- USER SESSIONS POLICIES
-- =====================================================================

-- Users can view their own sessions
CREATE POLICY "Users can view own sessions"
  ON user_sessions FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all sessions
CREATE POLICY "Admins can view all sessions"
  ON user_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
    )
  );

-- Users can delete their own sessions (logout)
CREATE POLICY "Users can delete own sessions"
  ON user_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- Admins can delete any sessions (force logout)
CREATE POLICY "Admins can delete any sessions"
  ON user_sessions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
    )
  );

-- =====================================================================
-- DELEGATIONS POLICIES
-- =====================================================================

-- Users can view delegations where they are grantor or grantee
CREATE POLICY "Users can view own delegations"
  ON delegations FOR SELECT
  USING (
    auth.uid() = grantor_id OR
    auth.uid() = grantee_id
  );

-- Admins and managers can view all delegations
CREATE POLICY "Admins and managers can view all delegations"
  ON delegations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin', 'manager')
    )
  );

-- Users can create delegations if they are the grantor
CREATE POLICY "Users can create delegations as grantor"
  ON delegations FOR INSERT
  WITH CHECK (auth.uid() = grantor_id);

-- Users can update (revoke) their own delegations
CREATE POLICY "Users can revoke own delegations"
  ON delegations FOR UPDATE
  USING (auth.uid() = grantor_id)
  WITH CHECK (auth.uid() = grantor_id);

-- Admins can revoke any delegation
CREATE POLICY "Admins can revoke any delegation"
  ON delegations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
    )
  );

-- =====================================================================
-- PENDING ROLE APPROVALS POLICIES
-- =====================================================================

-- Users can view their own approval requests
CREATE POLICY "Users can view own approval requests"
  ON pending_role_approvals FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = requested_by);

-- Admins can view all approval requests
CREATE POLICY "Admins can view all approval requests"
  ON pending_role_approvals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
    )
  );

-- Admins can create approval requests
CREATE POLICY "Admins can create approval requests"
  ON pending_role_approvals FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
    )
  );

-- Admins can approve/reject requests
CREATE POLICY "Admins can update approval requests"
  ON pending_role_approvals FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
    )
  );

-- =====================================================================
-- ACCESS REVIEWS POLICIES
-- =====================================================================

-- Security admins can view all reviews
CREATE POLICY "Security admins can view all reviews"
  ON access_reviews FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
    )
  );

-- Managers can view reviews for their scope
CREATE POLICY "Managers can view scoped reviews"
  ON access_reviews FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
        AND role = 'manager'
    )
  );

-- Security admins can create reviews
CREATE POLICY "Security admins can create reviews"
  ON access_reviews FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
    )
  );

-- Reviewers can update their own reviews
CREATE POLICY "Reviewers can update own reviews"
  ON access_reviews FOR UPDATE
  USING (auth.uid() = reviewer_id);

-- =====================================================================
-- ACCESS CERTIFICATIONS POLICIES
-- =====================================================================

-- Users can view their own certifications
CREATE POLICY "Users can view own certifications"
  ON access_certifications FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = certified_by);

-- Security admins can view all certifications
CREATE POLICY "Security admins can view all certifications"
  ON access_certifications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
    )
  );

-- Managers can certify access
CREATE POLICY "Managers can certify access"
  ON access_certifications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
        AND role IN ('manager', 'admin', 'super_admin')
    )
  );

-- =====================================================================
-- AUDIT LOGS POLICIES
-- =====================================================================

-- Admins can view all audit logs
CREATE POLICY "Admins can view all audit logs"
  ON audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
    )
  );

-- Users can view audit logs related to themselves
CREATE POLICY "Users can view own audit logs"
  ON audit_logs FOR SELECT
  USING (
    auth.uid() = user_id OR
    auth.uid() = target_user_id
  );

-- System can insert audit logs (no user restriction)
CREATE POLICY "System can insert audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (true);

-- Prevent updates and deletes (enforced by trigger as well)
-- No UPDATE or DELETE policies = no one can update/delete

-- =====================================================================
-- NOTIFICATIONS POLICIES
-- =====================================================================

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- System can insert notifications for any user
CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);

-- Add comments
COMMENT ON POLICY "Users can view own sessions" ON user_sessions IS 'Users can view their own active sessions';
COMMENT ON POLICY "Admins can view all sessions" ON user_sessions IS 'Admins can view all user sessions for security monitoring';
COMMENT ON POLICY "Users can view own delegations" ON delegations IS 'Users can view delegations where they are grantor or grantee';
COMMENT ON POLICY "Admins can view all approval requests" ON pending_role_approvals IS 'Admins can view and manage all role approval requests';
COMMENT ON POLICY "Security admins can view all reviews" ON access_reviews IS 'Security admins can conduct access reviews';
COMMENT ON POLICY "Admins can view all audit logs" ON audit_logs IS 'Admins can view audit trail for compliance';
COMMENT ON POLICY "Users can view own notifications" ON notifications IS 'Users can view their own notifications';
