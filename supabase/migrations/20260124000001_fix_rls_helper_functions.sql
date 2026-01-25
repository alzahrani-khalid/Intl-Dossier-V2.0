-- Migration: Fix RLS Helper Functions (CRITICAL SECURITY FIX)
-- Date: 2026-01-24
-- Issue: RLS helper functions return hardcoded values instead of querying actual user data
-- This is an authorization bypass vulnerability that allows any user to bypass RLS policies

-- ============================================
-- Step 1: Create missing tables
-- ============================================

-- Create user_roles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'analyst', 'supervisor', 'manager', 'admin', 'auditor')),
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Create user_units table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  unit_id TEXT NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, unit_id)
);

-- Enable RLS on new tables
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_units ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);
CREATE INDEX IF NOT EXISTS idx_user_units_user_id ON user_units(user_id);
CREATE INDEX IF NOT EXISTS idx_user_units_unit_id ON user_units(unit_id);

-- ============================================
-- Step 2: Create sensitivity_level type if not exists
-- ============================================

DO $$ BEGIN
  CREATE TYPE sensitivity_level AS ENUM ('public', 'internal', 'confidential', 'restricted', 'top_secret');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- Step 3: Add clearance_level mapping if needed
-- ============================================

-- Add clearance_level column to profiles if not exists (as text for compatibility)
DO $$ BEGIN
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS clearance_text sensitivity_level DEFAULT 'internal';
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

-- ============================================
-- Step 4: Fix RLS Helper Functions
-- ============================================

-- get_user_units(): FIXED - Now queries actual user_units table
CREATE OR REPLACE FUNCTION get_user_units(p_user_id UUID)
RETURNS TEXT[] AS $$
DECLARE
  units TEXT[];
BEGIN
  -- Query actual user units from user_units table
  SELECT COALESCE(
    ARRAY_AGG(unit_id ORDER BY is_primary DESC, granted_at ASC),
    ARRAY['default']::TEXT[]
  )
  INTO units
  FROM user_units
  WHERE user_id = p_user_id
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > NOW());

  -- Return default unit if user has no units assigned
  RETURN COALESCE(NULLIF(units, ARRAY[]::TEXT[]), ARRAY['default']::TEXT[]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- get_user_max_sensitivity(): FIXED - Now queries actual profiles table
CREATE OR REPLACE FUNCTION get_user_max_sensitivity(p_user_id UUID)
RETURNS sensitivity_level AS $$
DECLARE
  user_clearance INTEGER;
  max_sensitivity sensitivity_level;
BEGIN
  -- Get clearance level from profiles table
  SELECT COALESCE(p.clearance_level, 1)
  INTO user_clearance
  FROM profiles p
  WHERE p.user_id = p_user_id;

  -- Map numeric clearance to sensitivity level
  -- Level 1: internal, Level 2: confidential, Level 3: restricted, Level 4: top_secret
  CASE user_clearance
    WHEN 1 THEN max_sensitivity := 'internal'::sensitivity_level;
    WHEN 2 THEN max_sensitivity := 'confidential'::sensitivity_level;
    WHEN 3 THEN max_sensitivity := 'restricted'::sensitivity_level;
    WHEN 4 THEN max_sensitivity := 'top_secret'::sensitivity_level;
    ELSE max_sensitivity := 'internal'::sensitivity_level;
  END CASE;

  RETURN max_sensitivity;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- user_has_role(): FIXED - Now queries actual user_roles table
CREATE OR REPLACE FUNCTION user_has_role(p_user_id UUID, p_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user has the specified role in user_roles table
  RETURN EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_id = p_user_id
      AND role = p_role
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > NOW())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- is_supervisor(): Uses fixed user_has_role
CREATE OR REPLACE FUNCTION is_supervisor(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN user_has_role(p_user_id, 'supervisor') OR user_has_role(p_user_id, 'manager') OR user_has_role(p_user_id, 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- is_admin(): Uses fixed user_has_role
CREATE OR REPLACE FUNCTION is_admin(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN user_has_role(p_user_id, 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- is_auditor(): Uses fixed user_has_role
CREATE OR REPLACE FUNCTION is_auditor(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN user_has_role(p_user_id, 'auditor');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- Step 5: RLS Policies for new tables
-- ============================================

-- Service role bypass for user_roles
CREATE POLICY IF NOT EXISTS "Service role has full access to user_roles"
ON user_roles FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Service role bypass for user_units
CREATE POLICY IF NOT EXISTS "Service role has full access to user_units"
ON user_units FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Users can view their own roles
DROP POLICY IF EXISTS "Users can view own roles" ON user_roles;
CREATE POLICY "Users can view own roles"
ON user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Users can view their own units
DROP POLICY IF EXISTS "Users can view own units" ON user_units;
CREATE POLICY "Users can view own units"
ON user_units FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Admins can manage all roles
DROP POLICY IF EXISTS "Admins can manage roles" ON user_roles;
CREATE POLICY "Admins can manage roles"
ON user_roles FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Admins can manage all units
DROP POLICY IF EXISTS "Admins can manage units" ON user_units;
CREATE POLICY "Admins can manage units"
ON user_units FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- ============================================
-- Step 6: Grant permissions
-- ============================================

GRANT SELECT ON user_roles TO authenticated;
GRANT SELECT ON user_units TO authenticated;

-- ============================================
-- Step 7: Seed default data for existing users
-- ============================================

-- Give all existing users the 'user' role if they don't have any role
INSERT INTO user_roles (user_id, role, granted_at)
SELECT id, 'user', NOW()
FROM auth.users
WHERE id NOT IN (SELECT DISTINCT user_id FROM user_roles)
ON CONFLICT (user_id, role) DO NOTHING;

-- Give all existing users a default unit if they don't have any
INSERT INTO user_units (user_id, unit_id, is_primary, granted_at)
SELECT id, 'default', true, NOW()
FROM auth.users
WHERE id NOT IN (SELECT DISTINCT user_id FROM user_units)
ON CONFLICT (user_id, unit_id) DO NOTHING;

-- ============================================
-- Step 8: Update comments
-- ============================================

COMMENT ON TABLE user_roles IS 'User role assignments with expiration support';
COMMENT ON TABLE user_units IS 'User unit/queue assignments with expiration support';
COMMENT ON FUNCTION get_user_units IS 'Get list of units/queues the user has access to (queries actual data)';
COMMENT ON FUNCTION get_user_max_sensitivity IS 'Get the maximum sensitivity level the user can access (queries actual data)';
COMMENT ON FUNCTION user_has_role IS 'Check if user has a specific active role (queries actual data)';
