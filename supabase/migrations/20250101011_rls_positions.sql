-- Migration: Apply RLS policies for positions table
-- Feature: 011-positions-talking-points
-- Task: T011

-- Enable RLS on positions table
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;

-- Policy: Drafters can view their own drafts
CREATE POLICY "drafters_view_own_drafts"
  ON positions
  FOR SELECT
  USING (
    author_id = auth.uid()
    AND status = 'draft'
  );

-- Policy: Approvers can view positions in review at their stage
-- Note: This requires approval_chain_config JSONB structure
CREATE POLICY "approvers_view_positions_at_stage"
  ON positions
  FOR SELECT
  USING (
    status = 'under_review'
    AND auth.uid() IN (
      SELECT DISTINCT approver_id
      FROM approvals
      WHERE approvals.position_id = positions.id
        AND approvals.stage = positions.current_stage
    )
  );

-- Policy: Users can view published positions for their audience groups
CREATE POLICY "users_view_published_for_audience"
  ON positions
  FOR SELECT
  USING (
    status = 'published'
    AND EXISTS (
      SELECT 1
      FROM position_audience_groups pag
      INNER JOIN user_audience_memberships uam
        ON pag.audience_group_id = uam.audience_group_id
      WHERE pag.position_id = positions.id
        AND uam.user_id = auth.uid()
    )
  );

-- Policy: Drafters can insert positions
CREATE POLICY "drafters_insert_positions"
  ON positions
  FOR INSERT
  WITH CHECK (
    auth.uid() = author_id
    AND status = 'draft'
  );

-- Policy: Drafters can update their own drafts
CREATE POLICY "drafters_update_own_drafts"
  ON positions
  FOR UPDATE
  USING (
    author_id = auth.uid()
    AND status = 'draft'
  )
  WITH CHECK (
    author_id = auth.uid()
  );

-- Policy: Admins can view all positions
CREATE POLICY "admins_view_all"
  ON positions
  FOR SELECT
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    OR
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- Policy: Admins can update any position
CREATE POLICY "admins_update_all"
  ON positions
  FOR UPDATE
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    OR
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- Comments on policies
COMMENT ON POLICY "drafters_view_own_drafts" ON positions IS 'Authors can see their own draft positions';
COMMENT ON POLICY "approvers_view_positions_at_stage" ON positions IS 'Approvers can see positions at their approval stage';
COMMENT ON POLICY "users_view_published_for_audience" ON positions IS 'Users can see published positions for their audience groups';
COMMENT ON POLICY "drafters_update_own_drafts" ON positions IS 'Authors can update their own drafts';
COMMENT ON POLICY "admins_view_all" ON positions IS 'Admins have full read access';
