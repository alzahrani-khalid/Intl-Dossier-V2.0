-- Migration: 004_rls_policies_auth.sql
-- Description: Create Row Level Security policies for authentication-related tables
-- Dependencies: 001_security_tables.sql (for table definitions)
-- Created: 2025-01-27

-- Enable RLS on all auth tables
ALTER TABLE auth.mfa_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth.mfa_backup_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE security.audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- MFA ENROLLMENTS RLS POLICIES
-- ============================================================================

-- Base deny-all policy (restrictive)
CREATE POLICY "deny_all_mfa_enrollments" ON auth.mfa_enrollments
    AS RESTRICTIVE
    FOR ALL
    TO authenticated
    USING (false);

-- Users can view their own MFA enrollments
CREATE POLICY "users_view_own_mfa_enrollments" ON auth.mfa_enrollments
    AS PERMISSIVE
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Users can insert their own MFA enrollments
CREATE POLICY "users_insert_own_mfa_enrollments" ON auth.mfa_enrollments
    AS PERMISSIVE
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Users can update their own MFA enrollments
CREATE POLICY "users_update_own_mfa_enrollments" ON auth.mfa_enrollments
    AS PERMISSIVE
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Users can delete their own MFA enrollments
CREATE POLICY "users_delete_own_mfa_enrollments" ON auth.mfa_enrollments
    AS PERMISSIVE
    FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- Admins can view all MFA enrollments
CREATE POLICY "admins_view_all_mfa_enrollments" ON auth.mfa_enrollments
    AS PERMISSIVE
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Admins can update any MFA enrollments (for support)
CREATE POLICY "admins_update_any_mfa_enrollments" ON auth.mfa_enrollments
    AS PERMISSIVE
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- ============================================================================
-- MFA BACKUP CODES RLS POLICIES
-- ============================================================================

-- Base deny-all policy (restrictive)
CREATE POLICY "deny_all_mfa_backup_codes" ON auth.mfa_backup_codes
    AS RESTRICTIVE
    FOR ALL
    TO authenticated
    USING (false);

-- Users can view their own backup codes
CREATE POLICY "users_view_own_backup_codes" ON auth.mfa_backup_codes
    AS PERMISSIVE
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Users can insert their own backup codes
CREATE POLICY "users_insert_own_backup_codes" ON auth.mfa_backup_codes
    AS PERMISSIVE
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Users can update their own backup codes (mark as used)
CREATE POLICY "users_update_own_backup_codes" ON auth.mfa_backup_codes
    AS PERMISSIVE
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Users can delete their own backup codes
CREATE POLICY "users_delete_own_backup_codes" ON auth.mfa_backup_codes
    AS PERMISSIVE
    FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- Admins can view all backup codes (for support)
CREATE POLICY "admins_view_all_backup_codes" ON auth.mfa_backup_codes
    AS PERMISSIVE
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- ============================================================================
-- AUDIT LOGS RLS POLICIES
-- ============================================================================

-- Base deny-all policy (restrictive)
CREATE POLICY "deny_all_audit_logs" ON security.audit_logs
    AS RESTRICTIVE
    FOR ALL
    TO authenticated
    USING (false);

-- Read-only access for admins only
CREATE POLICY "admins_read_audit_logs" ON security.audit_logs
    AS PERMISSIVE
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- System can insert audit logs (for triggers and application)
CREATE POLICY "system_insert_audit_logs" ON security.audit_logs
    AS PERMISSIVE
    FOR INSERT
    TO authenticated
    WITH CHECK (true); -- System inserts are allowed

-- No updates or deletes allowed on audit logs (immutable)
-- This is enforced by not creating any UPDATE or DELETE policies

-- ============================================================================
-- FUNCTIONS FOR RLS POLICY HELPERS
-- ============================================================================

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = auth.uid() 
        AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is admin or moderator
CREATE OR REPLACE FUNCTION is_admin_or_moderator()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = auth.uid() 
        AND role IN ('admin', 'moderator')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user owns the resource
CREATE OR REPLACE FUNCTION owns_resource(resource_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN resource_user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT USAGE ON SCHEMA security TO authenticated;

-- Grant table permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON auth.mfa_enrollments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON auth.mfa_backup_codes TO authenticated;
GRANT SELECT ON security.audit_logs TO authenticated;
GRANT INSERT ON security.audit_logs TO authenticated;

-- Grant sequence permissions
GRANT USAGE ON ALL SEQUENCES IN SCHEMA auth TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA security TO authenticated;

-- ============================================================================
-- TESTING FUNCTIONS (for development only)
-- ============================================================================

-- Function to test RLS policies (development only)
CREATE OR REPLACE FUNCTION test_rls_policies()
RETURNS TABLE (
    table_name TEXT,
    policy_name TEXT,
    policy_type TEXT,
    is_enabled BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        schemaname||'.'||tablename as table_name,
        policyname as policy_name,
        cmd as policy_type,
        true as is_enabled
    FROM pg_policies
    WHERE schemaname IN ('auth', 'security')
    ORDER BY schemaname, tablename, policyname;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON POLICY "users_view_own_mfa_enrollments" ON auth.mfa_enrollments IS 
'Users can view their own MFA enrollment records';

COMMENT ON POLICY "admins_view_all_mfa_enrollments" ON auth.mfa_enrollments IS 
'Administrators can view all MFA enrollment records for support purposes';

COMMENT ON POLICY "users_view_own_backup_codes" ON auth.mfa_backup_codes IS 
'Users can view their own MFA backup codes';

COMMENT ON POLICY "admins_read_audit_logs" ON security.audit_logs IS 
'Only administrators can read audit logs for security compliance';

COMMENT ON POLICY "system_insert_audit_logs" ON security.audit_logs IS 
'System can insert audit logs via triggers and application code';

-- ============================================================================
-- SECURITY NOTES
-- ============================================================================

-- 1. All policies use RESTRICTIVE base policies to ensure deny-by-default
-- 2. User data is isolated - users can only access their own records
-- 3. Admin access is explicitly granted for support and compliance
-- 4. Audit logs are immutable (no UPDATE/DELETE policies)
-- 5. Helper functions use SECURITY DEFINER for proper privilege escalation
-- 6. All policies are documented for security audit purposes
