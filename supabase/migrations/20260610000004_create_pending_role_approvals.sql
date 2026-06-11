-- pending_role_approvals (approvals #6): enum + table + indexes + owner-scoped RLS.
-- The committed source migration 20251011214943_create_pending_role_approvals.sql was
-- NEVER applied to staging (42P01: relation does not exist), so the approvals edge
-- functions and regenerated types had no table to reference.
-- Root cause it could not apply: it depends on (1) a MISSING approval_status enum, and
-- (2) an admin-role-apply trigger that mutates auth roles and deletes from a session
-- table that does not exist on staging.
-- Fix: create the approval_status enum (guarded), the table verbatim (both CHECK
-- constraints), the three indexes, the safe updated_at trigger, and the safe
-- expire_pending_approvals() helper, plus owner-scoped RLS.
-- The admin-role-apply function + trigger are OMITTED ENTIRELY (they mutate auth roles
-- and depend on a missing session table — role-apply mechanics are deferred to Phase 61
-- role-source unification).
-- Verified live (project zkrcjzdemdmwhearhfgg, 2026-06-10): approval_status enum MISSING,
-- user_role enum EXISTS, session table MISSING, pending_role_approvals MISSING.
-- Applied 2026-06-10.

BEGIN;

-- (1) approval_status enum — guarded so re-apply is a safe no-op.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'approval_status') THEN
    CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected', 'expired');
  END IF;
END
$$;

-- (2) Table — copied verbatim from the source migration (all columns + both CHECK
-- constraints). References user_role (live) and approval_status (created above).
CREATE TABLE IF NOT EXISTS pending_role_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_role user_role NOT NULL,
  -- "current_role" is a reserved word in PostgreSQL (read-only built-in); it MUST be
  -- quoted. The source migration 20251011214943 shipped it unquoted, which is a second
  -- reason it could never apply (42601 syntax error at "current_role").
  "current_role" user_role NOT NULL,
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

-- (3) Indexes.
CREATE INDEX IF NOT EXISTS idx_approvals_user ON pending_role_approvals(user_id);
CREATE INDEX IF NOT EXISTS idx_approvals_status ON pending_role_approvals(status);
CREATE INDEX IF NOT EXISTS idx_approvals_expires_at ON pending_role_approvals(expires_at);

-- (4) Safe updated_at trigger (no auth.users mutation).
CREATE OR REPLACE FUNCTION update_approvals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_approvals_updated_at ON pending_role_approvals;
CREATE TRIGGER trigger_update_approvals_updated_at
  BEFORE UPDATE ON pending_role_approvals
  FOR EACH ROW
  EXECUTE FUNCTION update_approvals_updated_at();

-- (5) Safe helper — only updates this table.
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

-- Comments.
COMMENT ON TABLE pending_role_approvals IS 'Dual approval workflow for admin role assignments';
COMMENT ON COLUMN pending_role_approvals.user_id IS 'User whose role is being changed';
COMMENT ON COLUMN pending_role_approvals.requested_role IS 'Role being requested (typically admin or super_admin)';
COMMENT ON COLUMN pending_role_approvals."current_role" IS 'Current role of the user';
COMMENT ON COLUMN pending_role_approvals.requested_by IS 'User who requested the role change';
COMMENT ON COLUMN pending_role_approvals.reason IS 'Justification for role change';
COMMENT ON COLUMN pending_role_approvals.status IS 'Approval status (pending, approved, rejected, expired)';
COMMENT ON COLUMN pending_role_approvals.first_approver_id IS 'First administrator who approved';
COMMENT ON COLUMN pending_role_approvals.second_approver_id IS 'Second administrator who approved (must be different)';
COMMENT ON COLUMN pending_role_approvals.expires_at IS 'Approval request expiration (default 7 days)';

-- (6) RLS — owner-scoped to the parties of the approval. No broad admin policy
-- (admin gating is Phase 61). This staging DB has a public-schema DEFAULT PRIVILEGE
-- (pg_default_acl) that auto-grants ALL to anon/authenticated/service_role on every new
-- relation, so explicitly REVOKE ALL from anon (RLS still governs authenticated).
REVOKE ALL ON pending_role_approvals FROM anon;

ALTER TABLE pending_role_approvals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pending_role_approvals_select_policy" ON pending_role_approvals;
CREATE POLICY "pending_role_approvals_select_policy"
ON pending_role_approvals
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR requested_by = auth.uid()
  OR first_approver_id = auth.uid()
  OR second_approver_id = auth.uid()
);

DROP POLICY IF EXISTS "pending_role_approvals_insert_policy" ON pending_role_approvals;
CREATE POLICY "pending_role_approvals_insert_policy"
ON pending_role_approvals
FOR INSERT
TO authenticated
WITH CHECK (requested_by = auth.uid());

COMMIT;
