-- Migration: T021 - Create RLS policies for assignments
-- Description: Row Level Security for assignment access
-- Dependencies: T007 (assignments table)

-- Enable RLS on assignments
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own assignments
DROP POLICY IF EXISTS "Users can read own assignments" ON assignments;
CREATE POLICY "Users can read own assignments"
  ON assignments
  FOR SELECT
  USING (auth.uid() = assignee_id);

-- Policy: Supervisors can read their unit's assignments
DROP POLICY IF EXISTS "Supervisors can read unit assignments" ON assignments;
CREATE POLICY "Supervisors can read unit assignments"
  ON assignments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM staff_profiles supervisor
      JOIN staff_profiles assignee ON assignee.user_id = assignments.assignee_id
      WHERE supervisor.user_id = auth.uid()
        AND supervisor.role = 'supervisor'
        AND supervisor.unit_id = assignee.unit_id
    )
  );

-- Policy: Admins can read all assignments
DROP POLICY IF EXISTS "Admins can read all assignments" ON assignments;
CREATE POLICY "Admins can read all assignments"
  ON assignments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM staff_profiles admin
      WHERE admin.user_id = auth.uid()
        AND admin.role = 'admin'
    )
  );

-- Policy: System can insert assignments (service role)
DROP POLICY IF EXISTS "System can insert assignments" ON assignments;
CREATE POLICY "System can insert assignments"
  ON assignments
  FOR INSERT
  WITH CHECK (true); -- Service role only

-- Policy: Users can update their own assignment status
DROP POLICY IF EXISTS "Users can update own assignment status" ON assignments;
CREATE POLICY "Users can update own assignment status"
  ON assignments
  FOR UPDATE
  USING (auth.uid() = assignee_id)
  WITH CHECK (auth.uid() = assignee_id);

-- Policy: Supervisors can override assignments in their unit
DROP POLICY IF EXISTS "Supervisors can override unit assignments" ON assignments;
CREATE POLICY "Supervisors can override unit assignments"
  ON assignments
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM staff_profiles supervisor
      JOIN staff_profiles assignee ON assignee.user_id = assignments.assignee_id
      WHERE supervisor.user_id = auth.uid()
        AND supervisor.role = 'supervisor'
        AND supervisor.unit_id = assignee.unit_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff_profiles supervisor
      JOIN staff_profiles assignee ON assignee.user_id = assignments.assignee_id
      WHERE supervisor.user_id = auth.uid()
        AND supervisor.role = 'supervisor'
        AND supervisor.unit_id = assignee.unit_id
    )
  );

-- Policy: Admins can override any assignment
DROP POLICY IF EXISTS "Admins can override any assignment" ON assignments;
CREATE POLICY "Admins can override any assignment"
  ON assignments
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM staff_profiles admin
      WHERE admin.user_id = auth.uid()
        AND admin.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff_profiles admin
      WHERE admin.user_id = auth.uid()
        AND admin.role = 'admin'
    )
  );

-- Comment
COMMENT ON TABLE assignments IS 'RLS enabled: Users see own assignments, supervisors see unit, admins see all';
