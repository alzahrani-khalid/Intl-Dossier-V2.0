-- Create profiles table for user metadata
-- Required by tests for clearance level and organization assignment

CREATE TABLE IF NOT EXISTS public.profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  clearance_level INTEGER NOT NULL DEFAULT 1 CHECK (clearance_level >= 1 AND clearance_level <= 4),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Service role has full access (for tests)
CREATE POLICY "Service role has full access to profiles"
ON profiles FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
ON profiles FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE USING (auth.uid() = user_id);

-- Comments for documentation
COMMENT ON TABLE profiles IS 'User profiles with clearance levels and organization assignments';
COMMENT ON COLUMN profiles.clearance_level IS 'Security clearance level: 1 (Basic) to 4 (Top Secret)';
COMMENT ON COLUMN profiles.organization_id IS 'Organization the user belongs to';

-- Create index for organization lookups
CREATE INDEX idx_profiles_organization_id ON profiles(organization_id);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
