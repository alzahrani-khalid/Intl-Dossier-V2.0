-- Migration: Fix Dossier INSERT/UPDATE RLS Policies (CRITICAL BUG FIX)
-- Date: 2026-02-05
-- Issue: The RLS policies from 20251022000006 reference `id` in the profiles subquery,
--   but the profiles table uses `user_id` as its PK (not `id`).
--   PostgreSQL resolves the unqualified `id` from the outer context (dossiers.id),
--   so the check becomes `WHERE dossiers.id = auth.uid()` which ALWAYS fails
--   because a dossier's UUID never matches a user's UUID.
--   Result: All INSERT and UPDATE operations on dossiers return 403 Forbidden.

-- ============================================
-- Step 1: Fix INSERT policy
-- ============================================
DROP POLICY IF EXISTS "Users can create dossiers within clearance" ON dossiers;
DROP POLICY IF EXISTS "insert_dossiers_authenticated" ON dossiers;

CREATE POLICY "Users can create dossiers within clearance"
ON dossiers FOR INSERT
TO authenticated
WITH CHECK (
  sensitivity_level <= COALESCE(
    (SELECT p.clearance_level FROM profiles p WHERE p.user_id = auth.uid()),
    1  -- Default: allow level 1 (Public) if no profile row exists
  )
);

-- ============================================
-- Step 2: Fix UPDATE policy
-- ============================================
DROP POLICY IF EXISTS "Users can update dossiers within clearance" ON dossiers;
DROP POLICY IF EXISTS "update_dossiers_hybrid_permissions" ON dossiers;

CREATE POLICY "Users can update dossiers within clearance"
ON dossiers FOR UPDATE
TO authenticated
USING (
  sensitivity_level <= COALESCE(
    (SELECT p.clearance_level FROM profiles p WHERE p.user_id = auth.uid()),
    1
  )
)
WITH CHECK (
  sensitivity_level <= COALESCE(
    (SELECT p.clearance_level FROM profiles p WHERE p.user_id = auth.uid()),
    1
  )
);

-- ============================================
-- Step 3: Ensure profiles row exists for all users
-- ============================================

-- Auto-create profiles for existing users who don't have one
INSERT INTO profiles (user_id, clearance_level)
SELECT id, 1
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM profiles)
ON CONFLICT (user_id) DO NOTHING;

-- Create trigger to auto-create profile for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, clearance_level)
  VALUES (NEW.id, 1)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if any, then create
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_profile();

-- ============================================
-- Step 4: Comments
-- ============================================
COMMENT ON FUNCTION public.handle_new_user_profile() IS 'Auto-creates a profiles row with default clearance level 1 when a new auth user is created';
