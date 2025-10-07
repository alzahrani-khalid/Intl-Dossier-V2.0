-- Migration: Apply RLS policies for approvals table
-- Feature: 011-positions-talking-points
-- Task: T012

-- Enable RLS on approvals table
ALTER TABLE approvals ENABLE ROW LEVEL SECURITY;

-- Policy: Approvers can view approvals for positions they're involved with
CREATE POLICY "approvers_view_related_approvals"
  ON approvals
  FOR SELECT
  USING (
    approver_id = auth.uid()
    OR original_approver_id = auth.uid()
    OR delegated_from = auth.uid()
  );

-- Policy: Approvers can insert approvals for their stage
CREATE POLICY "approvers_insert_approvals"
  ON approvals
  FOR INSERT
  WITH CHECK (
    approver_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM positions
      WHERE positions.id = position_id
        AND positions.status = 'under_review'
        AND positions.current_stage = stage
    )
  );

-- Policy: Admins can reassign approvals
CREATE POLICY "admins_reassign_approvals"
  ON approvals
  FOR UPDATE
  USING (
    action = 'reassign'
    AND (
      (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
      OR
      (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    )
  )
  WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    OR
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- Policy: Users can view all approvals for transparency (read-only audit trail)
CREATE POLICY "users_view_all_approvals"
  ON approvals
  FOR SELECT
  USING (true); -- All authenticated users can view approval history

-- Policy: Admins have full access
CREATE POLICY "admins_full_access_approvals"
  ON approvals
  FOR ALL
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    OR
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- Comments
COMMENT ON POLICY "approvers_view_related_approvals" ON approvals IS 'Approvers see approvals they are involved with';
COMMENT ON POLICY "approvers_insert_approvals" ON approvals IS 'Approvers can insert approvals for their stage';
COMMENT ON POLICY "admins_reassign_approvals" ON approvals IS 'Admins can reassign stuck approvals';
COMMENT ON POLICY "users_view_all_approvals" ON approvals IS 'All users can view approval history for transparency';
