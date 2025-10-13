-- Migration: Create pending_role_approvals table with dual approval trigger
-- Feature: 019-user-management-access
-- Task: T008
-- Date: 2025-10-11

CREATE TABLE pending_role_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_role user_role NOT NULL,
  current_role user_role NOT NULL,
  requested_by UUID NOT NULL REFERENCES auth.users(id),
  reason TEXT NOT NULL,
  status approval_status DEFAULT 'pending',
  first_approver_id UUID REFERENCES auth.users(id),
  first_approved_at TIMESTAMP WITH TIME ZONE,
  second_approver_id UUID REFERENCES auth.users(id),
  second_approved_at TIMESTAMP WITH TIME ZONE,
  rejected_by UUID REFERENCES auth.users(id),
  rejected_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

  -- Constraints
  CONSTRAINT chk_approval_different_approvers
    CHECK (first_approver_id IS NULL OR second_approver_id IS NULL OR first_approver_id != second_approver_id),
  CONSTRAINT chk_approval_not_self
    CHECK (
      (first_approver_id IS NULL OR first_approver_id != user_id) AND
      (second_approver_id IS NULL OR second_approver_id != user_id) AND
      (requested_by != user_id)
    )
);

-- Create indexes
CREATE INDEX idx_approvals_user ON pending_role_approvals(user_id);
CREATE INDEX idx_approvals_status ON pending_role_approvals(status);
CREATE INDEX idx_approvals_expires_at ON pending_role_approvals(expires_at);

-- Function to apply admin role after dual approval
CREATE OR REPLACE FUNCTION apply_admin_role_approval()
RETURNS TRIGGER AS $$
BEGIN
  -- Only apply role if both approvals are complete and status is approved
  IF NEW.status = 'approved' AND
     NEW.first_approver_id IS NOT NULL AND
     NEW.second_approver_id IS NOT NULL THEN

    -- Update user role
    UPDATE auth.users
    SET role = NEW.requested_role,
        updated_at = now()
    WHERE id = NEW.user_id;

    -- Terminate all active sessions for this user (force re-login)
    DELETE FROM user_sessions
    WHERE user_id = NEW.user_id
      AND expires_at > now();

    -- Raise notice for session invalidation
    RAISE NOTICE 'Admin role applied for user %, all sessions terminated', NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to apply role after dual approval
CREATE TRIGGER trigger_apply_admin_role
  AFTER UPDATE ON pending_role_approvals
  FOR EACH ROW
  WHEN (NEW.status = 'approved')
  EXECUTE FUNCTION apply_admin_role_approval();

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_approvals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_approvals_updated_at
  BEFORE UPDATE ON pending_role_approvals
  FOR EACH ROW
  EXECUTE FUNCTION update_approvals_updated_at();

-- Function to automatically mark approvals as expired
CREATE OR REPLACE FUNCTION expire_pending_approvals()
RETURNS void AS $$
BEGIN
  UPDATE pending_role_approvals
  SET status = 'expired',
      updated_at = now()
  WHERE status = 'pending'
    AND expires_at < now();
END;
$$ LANGUAGE plpgsql;

-- Add comments
COMMENT ON TABLE pending_role_approvals IS 'Dual approval workflow for admin role assignments';
COMMENT ON COLUMN pending_role_approvals.user_id IS 'User whose role is being changed';
COMMENT ON COLUMN pending_role_approvals.requested_role IS 'Role being requested (typically admin or super_admin)';
COMMENT ON COLUMN pending_role_approvals.current_role IS 'Current role of the user';
COMMENT ON COLUMN pending_role_approvals.requested_by IS 'User who requested the role change';
COMMENT ON COLUMN pending_role_approvals.reason IS 'Justification for role change';
COMMENT ON COLUMN pending_role_approvals.status IS 'Approval status (pending, approved, rejected, expired)';
COMMENT ON COLUMN pending_role_approvals.first_approver_id IS 'First administrator who approved';
COMMENT ON COLUMN pending_role_approvals.second_approver_id IS 'Second administrator who approved (must be different)';
COMMENT ON COLUMN pending_role_approvals.expires_at IS 'Approval request expiration (default 7 days)';
