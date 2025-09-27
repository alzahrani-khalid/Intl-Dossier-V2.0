-- 020_users_rls.sql: RLS policies for users table
-- Row-Level Security policies for user management and authentication

-- ============================================
-- ENABLE RLS ON USERS TABLE
-- ============================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- ============================================
-- USERS TABLE RLS POLICIES
-- ============================================

-- Policy: Users can read their own profile
CREATE POLICY users_select_own ON public.users
    FOR SELECT
    USING (auth.uid() = id);

-- Policy: Users can read all active users (for collaboration features)
CREATE POLICY users_select_active ON public.users
    FOR SELECT
    USING (is_active = true AND auth.uid() IS NOT NULL);

-- Policy: Admins can read all users
CREATE POLICY users_select_admin ON public.users
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

-- Policy: Users can update their own profile (except role and is_active)
CREATE POLICY users_update_own ON public.users
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id
        AND role = (SELECT role FROM public.users WHERE id = auth.uid())
        AND is_active = (SELECT is_active FROM public.users WHERE id = auth.uid())
    );

-- Policy: Admins can update any user
CREATE POLICY users_update_admin ON public.users
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

-- Policy: Only system can insert users (via auth trigger)
CREATE POLICY users_insert_system ON public.users
    FOR INSERT
    WITH CHECK (false); -- Will be handled by auth trigger with SECURITY DEFINER

-- Policy: Only admins can delete users (soft delete)
CREATE POLICY users_delete_admin ON public.users
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

-- ============================================
-- HELPER FUNCTIONS FOR USER RLS
-- ============================================

-- Function to check if current user has a specific role
CREATE OR REPLACE FUNCTION public.auth_has_role(required_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role = required_role
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to check if current user has one of the specified roles
CREATE OR REPLACE FUNCTION public.auth_has_any_role(required_roles TEXT[])
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role = ANY(required_roles)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to get current user's role
CREATE OR REPLACE FUNCTION public.auth_get_role()
RETURNS TEXT AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role
    FROM public.users
    WHERE id = auth.uid();

    RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to check if user is active
CREATE OR REPLACE FUNCTION public.auth_is_active()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- GRANT FUNCTION PERMISSIONS
-- ============================================

GRANT EXECUTE ON FUNCTION public.auth_has_role TO authenticated;
GRANT EXECUTE ON FUNCTION public.auth_has_any_role TO authenticated;
GRANT EXECUTE ON FUNCTION public.auth_get_role TO authenticated;
GRANT EXECUTE ON FUNCTION public.auth_is_active TO authenticated;

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON POLICY users_select_own ON public.users IS 'Users can view their own profile';
COMMENT ON POLICY users_select_active ON public.users IS 'Authenticated users can view active users for collaboration';
COMMENT ON POLICY users_update_own ON public.users IS 'Users can update their own profile except role and active status';
COMMENT ON POLICY users_update_admin ON public.users IS 'Admins can update any user profile';
COMMENT ON POLICY users_insert_system ON public.users IS 'Only system can insert users via auth trigger';
COMMENT ON POLICY users_delete_admin ON public.users IS 'Only admins can delete users (soft delete)';

COMMENT ON FUNCTION public.auth_has_role IS 'Check if current user has a specific role';
COMMENT ON FUNCTION public.auth_has_any_role IS 'Check if current user has any of the specified roles';
COMMENT ON FUNCTION public.auth_get_role IS 'Get the current user role';
COMMENT ON FUNCTION public.auth_is_active IS 'Check if current user account is active';
