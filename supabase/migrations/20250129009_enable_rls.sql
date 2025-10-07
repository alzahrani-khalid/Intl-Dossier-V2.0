-- Migration: 009_enable_rls
-- Description: Enable Row Level Security on all tables
-- Date: 2025-01-29

-- ============================================
-- Enable RLS on all tables
-- ============================================

-- Core tables
ALTER TABLE intake_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE intake_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE triage_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sla_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE sla_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE duplicate_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Create helper functions for RLS
-- ============================================

-- Function to get user's units
CREATE OR REPLACE FUNCTION get_user_units(p_user_id UUID)
RETURNS TEXT[] AS $$
BEGIN
    -- This would typically query a user_units table
    -- For now, return a mock implementation
    -- In production, this would be:
    -- SELECT ARRAY_AGG(unit_id) FROM user_units WHERE user_id = p_user_id
    RETURN ARRAY['unit_1', 'unit_2', 'default'];
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's max sensitivity clearance
CREATE OR REPLACE FUNCTION get_user_max_sensitivity(p_user_id UUID)
RETURNS sensitivity_level AS $$
BEGIN
    -- This would typically query a user_clearance table
    -- For now, return a mock implementation
    -- In production, this would be:
    -- SELECT max_sensitivity FROM user_clearance WHERE user_id = p_user_id
    RETURN 'confidential'::sensitivity_level;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has role
CREATE OR REPLACE FUNCTION user_has_role(p_user_id UUID, p_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- This would typically query a user_roles table
    -- For now, return a mock implementation
    -- In production, this would be:
    -- RETURN EXISTS(SELECT 1 FROM user_roles WHERE user_id = p_user_id AND role = p_role)
    RETURN p_role IN ('user', 'supervisor', 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is supervisor
CREATE OR REPLACE FUNCTION is_supervisor(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN user_has_role(p_user_id, 'supervisor');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN user_has_role(p_user_id, 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is auditor
CREATE OR REPLACE FUNCTION is_auditor(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN user_has_role(p_user_id, 'auditor');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Create service role for system operations
-- ============================================

-- Note: In Supabase, the service role already exists
-- This is for documentation purposes

-- Function to bypass RLS for system operations
CREATE OR REPLACE FUNCTION system_operation(p_operation TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if the current user is the service role
    RETURN current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Grant necessary permissions
-- ============================================

-- Grant execute permissions on helper functions to authenticated users
GRANT EXECUTE ON FUNCTION get_user_units(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_max_sensitivity(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION user_has_role(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION is_supervisor(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_auditor(UUID) TO authenticated;

-- Grant table permissions to authenticated users
-- (RLS policies will control actual access)
GRANT SELECT, INSERT, UPDATE, DELETE ON intake_tickets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON intake_attachments TO authenticated;
GRANT SELECT, INSERT, UPDATE ON triage_decisions TO authenticated;
GRANT SELECT ON sla_policies TO authenticated;
GRANT SELECT, INSERT ON sla_events TO authenticated;
GRANT SELECT, INSERT, UPDATE ON duplicate_candidates TO authenticated;
GRANT SELECT, INSERT, UPDATE ON ai_embeddings TO authenticated;
GRANT SELECT, INSERT ON analysis_metadata TO authenticated;
GRANT INSERT ON audit_logs TO authenticated;
GRANT SELECT ON audit_logs TO authenticated; -- Only for auditors via RLS

-- Grant usage on all sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================
-- Create bypass policies for service role
-- ============================================

-- Service role bypass for all tables (system operations)
CREATE POLICY service_role_bypass_tickets ON intake_tickets
    FOR ALL
    USING (system_operation('any'));

CREATE POLICY service_role_bypass_attachments ON intake_attachments
    FOR ALL
    USING (system_operation('any'));

CREATE POLICY service_role_bypass_triage ON triage_decisions
    FOR ALL
    USING (system_operation('any'));

CREATE POLICY service_role_bypass_sla_policies ON sla_policies
    FOR ALL
    USING (system_operation('any'));

CREATE POLICY service_role_bypass_sla_events ON sla_events
    FOR ALL
    USING (system_operation('any'));

CREATE POLICY service_role_bypass_duplicates ON duplicate_candidates
    FOR ALL
    USING (system_operation('any'));

CREATE POLICY service_role_bypass_embeddings ON ai_embeddings
    FOR ALL
    USING (system_operation('any'));

CREATE POLICY service_role_bypass_analysis ON analysis_metadata
    FOR ALL
    USING (system_operation('any'));

CREATE POLICY service_role_bypass_audit ON audit_logs
    FOR ALL
    USING (system_operation('any'));

-- Add comments
COMMENT ON FUNCTION get_user_units IS 'Get list of units/queues the user has access to';
COMMENT ON FUNCTION get_user_max_sensitivity IS 'Get the maximum sensitivity level the user can access';
COMMENT ON FUNCTION user_has_role IS 'Check if user has a specific role';
COMMENT ON FUNCTION system_operation IS 'Check if operation is being performed by service role';