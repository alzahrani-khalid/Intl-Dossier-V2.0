-- Migration: Apply RLS policies for attachments and consistency_checks tables
-- Feature: 011-positions-talking-points
-- Task: T013

-- Enable RLS on consistency_checks table
ALTER TABLE consistency_checks ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can view consistency checks
CREATE POLICY "users_view_consistency_checks"
  ON consistency_checks
  FOR SELECT
  USING (true);

-- Policy: Authenticated users can trigger manual consistency checks
CREATE POLICY "users_insert_consistency_checks"
  ON consistency_checks
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Policy: Admins have full access to consistency checks
CREATE POLICY "admins_full_access_consistency"
  ON consistency_checks
  FOR ALL
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    OR
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- Enable RLS on position_embeddings table
ALTER TABLE position_embeddings ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can view embeddings (for consistency checking)
CREATE POLICY "users_view_embeddings"
  ON position_embeddings
  FOR SELECT
  USING (true);

-- Policy: System/admin can manage embeddings
CREATE POLICY "admins_manage_embeddings"
  ON position_embeddings
  FOR ALL
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    OR
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- Enable RLS on position_versions table
ALTER TABLE position_versions ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can view position versions
CREATE POLICY "users_view_position_versions"
  ON position_versions
  FOR SELECT
  USING (true);

-- Policy: System can insert versions (via triggers/functions)
CREATE POLICY "system_insert_versions"
  ON position_versions
  FOR INSERT
  WITH CHECK (true);

-- Enable RLS on audience_groups table
ALTER TABLE audience_groups ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can view audience groups
CREATE POLICY "users_view_audience_groups"
  ON audience_groups
  FOR SELECT
  USING (true);

-- Policy: Admins can manage audience groups
CREATE POLICY "admins_manage_audience_groups"
  ON audience_groups
  FOR ALL
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    OR
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- Enable RLS on position_audience_groups junction table
ALTER TABLE position_audience_groups ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view position-audience associations
CREATE POLICY "users_view_position_audiences"
  ON position_audience_groups
  FOR SELECT
  USING (true);

-- Policy: Position authors can manage their position's audience groups
CREATE POLICY "authors_manage_position_audiences"
  ON position_audience_groups
  FOR ALL
  USING (
    granted_by = auth.uid()
  )
  WITH CHECK (
    granted_by = auth.uid()
  );

-- Enable RLS on user_audience_memberships junction table
ALTER TABLE user_audience_memberships ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own memberships
CREATE POLICY "users_view_own_memberships"
  ON user_audience_memberships
  FOR SELECT
  USING (user_id = auth.uid());

-- Policy: Admins can manage all memberships
CREATE POLICY "admins_manage_memberships"
  ON user_audience_memberships
  FOR ALL
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    OR
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- Comments
COMMENT ON POLICY "users_view_consistency_checks" ON consistency_checks IS 'All users can view consistency check results';
COMMENT ON POLICY "users_insert_consistency_checks" ON consistency_checks IS 'Authenticated users can trigger manual consistency checks';
COMMENT ON POLICY "users_view_embeddings" ON position_embeddings IS 'All users can view embeddings for consistency checking';
COMMENT ON POLICY "users_view_position_versions" ON position_versions IS 'All users can view position version history';
COMMENT ON POLICY "users_view_audience_groups" ON audience_groups IS 'All users can view available audience groups';
COMMENT ON POLICY "admins_manage_audience_groups" ON audience_groups IS 'Admins manage audience group definitions';
