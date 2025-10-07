-- Migration: T020 - Create RLS policies for staff_profiles
-- Description: Row Level Security for staff profile access
-- Dependencies: T004 (staff_profiles table)

-- Enable RLS on staff_profiles
ALTER TABLE staff_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own profile
DROP POLICY IF EXISTS "Users can read own profile" ON staff_profiles;
CREATE POLICY "Users can read own profile"
  ON staff_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can update their own availability status
DROP POLICY IF EXISTS "Users can update own availability" ON staff_profiles;
CREATE POLICY "Users can update own availability"
  ON staff_profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Supervisors can read profiles in their unit
DROP POLICY IF EXISTS "Supervisors can read unit profiles" ON staff_profiles;
CREATE POLICY "Supervisors can read unit profiles"
  ON staff_profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM staff_profiles supervisor
      WHERE supervisor.user_id = auth.uid()
        AND supervisor.role = 'supervisor'
        AND supervisor.unit_id = staff_profiles.unit_id
    )
  );

-- Policy: Supervisors can update profiles in their unit
DROP POLICY IF EXISTS "Supervisors can update unit profiles" ON staff_profiles;
CREATE POLICY "Supervisors can update unit profiles"
  ON staff_profiles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM staff_profiles supervisor
      WHERE supervisor.user_id = auth.uid()
        AND supervisor.role = 'supervisor'
        AND supervisor.unit_id = staff_profiles.unit_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff_profiles supervisor
      WHERE supervisor.user_id = auth.uid()
        AND supervisor.role = 'supervisor'
        AND supervisor.unit_id = staff_profiles.unit_id
    )
  );

-- Policy: Admins can read all profiles
DROP POLICY IF EXISTS "Admins can read all profiles" ON staff_profiles;
CREATE POLICY "Admins can read all profiles"
  ON staff_profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM staff_profiles admin
      WHERE admin.user_id = auth.uid()
        AND admin.role = 'admin'
    )
  );

-- Policy: Admins can update all profiles
DROP POLICY IF EXISTS "Admins can update all profiles" ON staff_profiles;
CREATE POLICY "Admins can update all profiles"
  ON staff_profiles
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
COMMENT ON TABLE staff_profiles IS 'RLS enabled: Users see own profile, supervisors see unit, admins see all';
