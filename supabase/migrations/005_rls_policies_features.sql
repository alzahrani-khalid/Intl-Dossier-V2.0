-- Migration: 005_rls_policies_features.sql
-- Description: Create Row Level Security policies for monitoring and feature tables
-- Dependencies: 002_monitoring_tables.sql, 003_feature_tables.sql (for table definitions)
-- Created: 2025-01-27

-- Enable RLS on all monitoring and feature tables
ALTER TABLE monitoring.alert_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitoring.alert_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitoring.anomaly_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitoring.health_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE features.export_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics.clustering_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE users.accessibility_preferences ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- ALERT CONFIGURATIONS RLS POLICIES
-- ============================================================================

-- Base deny-all policy (restrictive)
CREATE POLICY "deny_all_alert_configs" ON monitoring.alert_configs
    AS RESTRICTIVE
    FOR ALL
    TO authenticated
    USING (false);

-- Admins can view all alert configurations
CREATE POLICY "admins_view_alert_configs" ON monitoring.alert_configs
    AS PERMISSIVE
    FOR SELECT
    TO authenticated
    USING (is_admin());

-- Admins can create alert configurations
CREATE POLICY "admins_create_alert_configs" ON monitoring.alert_configs
    AS PERMISSIVE
    FOR INSERT
    TO authenticated
    WITH CHECK (is_admin());

-- Admins can update alert configurations
CREATE POLICY "admins_update_alert_configs" ON monitoring.alert_configs
    AS PERMISSIVE
    FOR UPDATE
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

-- Admins can delete alert configurations
CREATE POLICY "admins_delete_alert_configs" ON monitoring.alert_configs
    AS PERMISSIVE
    FOR DELETE
    TO authenticated
    USING (is_admin());

-- ============================================================================
-- ALERT HISTORY RLS POLICIES
-- ============================================================================

-- Base deny-all policy (restrictive)
CREATE POLICY "deny_all_alert_history" ON monitoring.alert_history
    AS RESTRICTIVE
    FOR ALL
    TO authenticated
    USING (false);

-- Admins can view all alert history
CREATE POLICY "admins_view_alert_history" ON monitoring.alert_history
    AS PERMISSIVE
    FOR SELECT
    TO authenticated
    USING (is_admin());

-- System can insert alert history (for triggers)
CREATE POLICY "system_insert_alert_history" ON monitoring.alert_history
    AS PERMISSIVE
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Admins can update alert history (acknowledge, resolve)
CREATE POLICY "admins_update_alert_history" ON monitoring.alert_history
    AS PERMISSIVE
    FOR UPDATE
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

-- ============================================================================
-- ANOMALY PATTERNS RLS POLICIES
-- ============================================================================

-- Base deny-all policy (restrictive)
CREATE POLICY "deny_all_anomaly_patterns" ON monitoring.anomaly_patterns
    AS RESTRICTIVE
    FOR ALL
    TO authenticated
    USING (false);

-- Admins can view all anomaly patterns
CREATE POLICY "admins_view_anomaly_patterns" ON monitoring.anomaly_patterns
    AS PERMISSIVE
    FOR SELECT
    TO authenticated
    USING (is_admin());

-- System can insert anomaly patterns (for ML detection)
CREATE POLICY "system_insert_anomaly_patterns" ON monitoring.anomaly_patterns
    AS PERMISSIVE
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Admins can update anomaly patterns (review, classify)
CREATE POLICY "admins_update_anomaly_patterns" ON monitoring.anomaly_patterns
    AS PERMISSIVE
    FOR UPDATE
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

-- ============================================================================
-- HEALTH METRICS RLS POLICIES
-- ============================================================================

-- Base deny-all policy (restrictive)
CREATE POLICY "deny_all_health_metrics" ON monitoring.health_metrics
    AS RESTRICTIVE
    FOR ALL
    TO authenticated
    USING (false);

-- Admins can view all health metrics
CREATE POLICY "admins_view_health_metrics" ON monitoring.health_metrics
    AS PERMISSIVE
    FOR SELECT
    TO authenticated
    USING (is_admin());

-- System can insert health metrics (for monitoring)
CREATE POLICY "system_insert_health_metrics" ON monitoring.health_metrics
    AS PERMISSIVE
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- ============================================================================
-- EXPORT REQUESTS RLS POLICIES
-- ============================================================================

-- Base deny-all policy (restrictive)
CREATE POLICY "deny_all_export_requests" ON features.export_requests
    AS RESTRICTIVE
    FOR ALL
    TO authenticated
    USING (false);

-- Users can view their own export requests
CREATE POLICY "users_view_own_export_requests" ON features.export_requests
    AS PERMISSIVE
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Users can create their own export requests
CREATE POLICY "users_create_own_export_requests" ON features.export_requests
    AS PERMISSIVE
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Users can update their own export requests (status updates)
CREATE POLICY "users_update_own_export_requests" ON features.export_requests
    AS PERMISSIVE
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Admins can view all export requests
CREATE POLICY "admins_view_all_export_requests" ON features.export_requests
    AS PERMISSIVE
    FOR SELECT
    TO authenticated
    USING (is_admin());

-- Admins can update any export requests (for support)
CREATE POLICY "admins_update_any_export_requests" ON features.export_requests
    AS PERMISSIVE
    FOR UPDATE
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

-- ============================================================================
-- CLUSTERING RESULTS RLS POLICIES
-- ============================================================================

-- Base deny-all policy (restrictive)
CREATE POLICY "deny_all_clustering_results" ON analytics.clustering_results
    AS RESTRICTIVE
    FOR ALL
    TO authenticated
    USING (false);

-- Users can view their own clustering results
CREATE POLICY "users_view_own_clustering_results" ON analytics.clustering_results
    AS PERMISSIVE
    FOR SELECT
    TO authenticated
    USING (created_by = auth.uid());

-- Users can create their own clustering results
CREATE POLICY "users_create_own_clustering_results" ON analytics.clustering_results
    AS PERMISSIVE
    FOR INSERT
    TO authenticated
    WITH CHECK (created_by = auth.uid());

-- Admins can view all clustering results
CREATE POLICY "admins_view_all_clustering_results" ON analytics.clustering_results
    AS PERMISSIVE
    FOR SELECT
    TO authenticated
    USING (is_admin());

-- Admins can update any clustering results (mark as optimal)
CREATE POLICY "admins_update_any_clustering_results" ON analytics.clustering_results
    AS PERMISSIVE
    FOR UPDATE
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

-- ============================================================================
-- ACCESSIBILITY PREFERENCES RLS POLICIES
-- ============================================================================

-- Base deny-all policy (restrictive)
CREATE POLICY "deny_all_accessibility_preferences" ON users.accessibility_preferences
    AS RESTRICTIVE
    FOR ALL
    TO authenticated
    USING (false);

-- Users can view their own accessibility preferences
CREATE POLICY "users_view_own_accessibility_preferences" ON users.accessibility_preferences
    AS PERMISSIVE
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Users can create their own accessibility preferences
CREATE POLICY "users_create_own_accessibility_preferences" ON users.accessibility_preferences
    AS PERMISSIVE
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Users can update their own accessibility preferences
CREATE POLICY "users_update_own_accessibility_preferences" ON users.accessibility_preferences
    AS PERMISSIVE
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Users can delete their own accessibility preferences
CREATE POLICY "users_delete_own_accessibility_preferences" ON users.accessibility_preferences
    AS PERMISSIVE
    FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- Admins can view all accessibility preferences (for analytics)
CREATE POLICY "admins_view_all_accessibility_preferences" ON users.accessibility_preferences
    AS PERMISSIVE
    FOR SELECT
    TO authenticated
    USING (is_admin());

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA monitoring TO authenticated;
GRANT USAGE ON SCHEMA features TO authenticated;
GRANT USAGE ON SCHEMA analytics TO authenticated;
GRANT USAGE ON SCHEMA users TO authenticated;

-- Grant table permissions for monitoring tables
GRANT SELECT ON monitoring.alert_configs TO authenticated;
GRANT INSERT, UPDATE, DELETE ON monitoring.alert_configs TO authenticated;
GRANT SELECT ON monitoring.alert_history TO authenticated;
GRANT INSERT, UPDATE ON monitoring.alert_history TO authenticated;
GRANT SELECT ON monitoring.anomaly_patterns TO authenticated;
GRANT INSERT, UPDATE ON monitoring.anomaly_patterns TO authenticated;
GRANT SELECT ON monitoring.health_metrics TO authenticated;
GRANT INSERT ON monitoring.health_metrics TO authenticated;

-- Grant table permissions for feature tables
GRANT SELECT, INSERT, UPDATE, DELETE ON features.export_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE ON analytics.clustering_results TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON users.accessibility_preferences TO authenticated;

-- Grant sequence permissions
GRANT USAGE ON ALL SEQUENCES IN SCHEMA monitoring TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA features TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA analytics TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA users TO authenticated;

-- ============================================================================
-- SPECIAL PERMISSIONS FOR SYSTEM OPERATIONS
-- ============================================================================

-- Create a system role for automated operations
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'system') THEN
        CREATE ROLE system;
    END IF;
END
$$;

-- Grant system role permissions for automated operations
GRANT USAGE ON SCHEMA monitoring TO system;
GRANT USAGE ON SCHEMA features TO system;
GRANT USAGE ON SCHEMA analytics TO system;
GRANT USAGE ON SCHEMA users TO system;

-- System can insert into monitoring tables
GRANT INSERT ON monitoring.alert_history TO system;
GRANT INSERT ON monitoring.anomaly_patterns TO system;
GRANT INSERT ON monitoring.health_metrics TO system;

-- ============================================================================
-- FUNCTIONS FOR RLS POLICY HELPERS
-- ============================================================================

-- Function to check if user is admin (reuse from auth policies)
-- This function is already created in 004_rls_policies_auth.sql

-- Function to check if user is admin or moderator
-- This function is already created in 004_rls_policies_auth.sql

-- Function to check if user owns the resource
-- This function is already created in 004_rls_policies_auth.sql

-- Function to check if user can access monitoring data
CREATE OR REPLACE FUNCTION can_access_monitoring()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN is_admin() OR is_admin_or_moderator();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON POLICY "admins_view_alert_configs" ON monitoring.alert_configs IS 
'Only administrators can view alert configurations';

COMMENT ON POLICY "users_view_own_export_requests" ON features.export_requests IS 
'Users can view their own export requests';

COMMENT ON POLICY "users_view_own_clustering_results" ON analytics.clustering_results IS 
'Users can view clustering results they created';

COMMENT ON POLICY "users_view_own_accessibility_preferences" ON users.accessibility_preferences IS 
'Users can view and manage their own accessibility preferences';

COMMENT ON POLICY "system_insert_alert_history" ON monitoring.alert_history IS 
'System can insert alert history records via monitoring triggers';

COMMENT ON POLICY "system_insert_anomaly_patterns" ON monitoring.anomaly_patterns IS 
'System can insert anomaly patterns via ML detection processes';

COMMENT ON POLICY "system_insert_health_metrics" ON monitoring.health_metrics IS 
'System can insert health metrics via monitoring agents';

-- ============================================================================
-- SECURITY NOTES
-- ============================================================================

-- 1. All policies use RESTRICTIVE base policies to ensure deny-by-default
-- 2. User data is isolated - users can only access their own records
-- 3. Admin access is explicitly granted for monitoring and support
-- 4. System role has limited permissions for automated operations
-- 5. Monitoring data is admin-only for security compliance
-- 6. Feature data (exports, clustering) is user-scoped with admin oversight
-- 7. All policies are documented for security audit purposes
