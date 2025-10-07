-- Migration: Create approvals table
-- Feature: 011-positions-talking-points
-- Task: T005

-- Create approvals table for audit trail of approval actions
CREATE TABLE IF NOT EXISTS approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  position_id uuid NOT NULL REFERENCES positions(id) ON DELETE CASCADE,
  stage int NOT NULL CHECK (stage >= 1 AND stage <= 10),

  -- Approver information
  approver_id uuid NOT NULL REFERENCES auth.users(id),
  original_approver_id uuid REFERENCES auth.users(id),

  -- Action and comments
  action text NOT NULL CHECK (action IN ('approve', 'request_revisions', 'delegate', 'reassign')),
  comments text,

  -- Step-up authentication
  step_up_verified boolean NOT NULL DEFAULT false,
  step_up_challenge_id uuid,

  -- Delegation fields
  delegated_from uuid REFERENCES auth.users(id),
  delegated_until timestamptz,

  -- Reassignment fields (admin only)
  reassigned_by uuid REFERENCES auth.users(id),
  reassignment_reason text,

  -- Audit
  created_at timestamptz NOT NULL DEFAULT now(),

  -- Constraints
  CONSTRAINT check_step_up_on_approve CHECK (
    (action = 'approve' AND step_up_verified = true) OR (action != 'approve')
  ),
  CONSTRAINT check_comments_on_revisions CHECK (
    (action = 'request_revisions' AND char_length(trim(comments)) > 0) OR (action != 'request_revisions')
  ),
  CONSTRAINT check_delegation_fields CHECK (
    (action = 'delegate' AND delegated_from IS NOT NULL AND delegated_until IS NOT NULL)
    OR (action != 'delegate')
  ),
  CONSTRAINT check_reassignment_fields CHECK (
    (action = 'reassign' AND reassigned_by IS NOT NULL AND char_length(trim(reassignment_reason)) > 0)
    OR (action != 'reassign')
  )
);

-- Add comments
COMMENT ON TABLE approvals IS 'Audit trail of all approval actions within the approval chain';
COMMENT ON COLUMN approvals.stage IS 'Approval stage number (1-10)';
COMMENT ON COLUMN approvals.approver_id IS 'User performing the action (may be delegate)';
COMMENT ON COLUMN approvals.original_approver_id IS 'Original assigned approver if different from approver_id';
COMMENT ON COLUMN approvals.action IS 'Action type: approve, request_revisions, delegate, reassign';
COMMENT ON COLUMN approvals.step_up_verified IS 'Boolean confirming step-up authentication completed';
COMMENT ON COLUMN approvals.step_up_challenge_id IS 'Reference to step-up challenge for audit';
COMMENT ON COLUMN approvals.delegated_from IS 'User who delegated if action is delegate';
COMMENT ON COLUMN approvals.delegated_until IS 'Delegation expiry timestamp';
COMMENT ON COLUMN approvals.reassigned_by IS 'Admin who performed reassignment';
COMMENT ON COLUMN approvals.reassignment_reason IS 'Justification for admin reassignment';

-- Create indexes
CREATE INDEX idx_approvals_position_id ON approvals(position_id);
CREATE INDEX idx_approvals_approver_id ON approvals(approver_id);
CREATE INDEX idx_approvals_stage ON approvals(position_id, stage);
CREATE INDEX idx_approvals_action ON approvals(action);
CREATE INDEX idx_approvals_created_at ON approvals(created_at DESC);
