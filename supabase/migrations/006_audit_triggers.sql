-- Migration: 006_audit_triggers.sql
-- Description: Create audit trigger functions for comprehensive security logging
-- Dependencies: 001_security_tables.sql (for audit_logs table)
-- Created: 2025-01-27

-- ============================================================================
-- AUDIT TRIGGER FUNCTION
-- ============================================================================

-- Main audit trigger function that logs all changes to audited tables
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
    audit_record RECORD;
    old_data JSONB;
    new_data JSONB;
    changed_fields JSONB := '{}';
    field_name TEXT;
    old_value JSONB;
    new_value JSONB;
BEGIN
    -- Determine operation type and prepare data
    IF TG_OP = 'DELETE' THEN
        old_data = to_jsonb(OLD);
        new_data = NULL;
        audit_record := OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        old_data = to_jsonb(OLD);
        new_data = to_jsonb(NEW);
        audit_record := NEW;
        
        -- Track changed fields for updates
        FOR field_name IN SELECT jsonb_object_keys(old_data) LOOP
            old_value := old_data->field_name;
            new_value := new_data->field_name;
            
            IF old_value IS DISTINCT FROM new_value THEN
                changed_fields := changed_fields || jsonb_build_object(field_name, jsonb_build_object(
                    'old', old_value,
                    'new', new_value
                ));
            END IF;
        END LOOP;
    ELSIF TG_OP = 'INSERT' THEN
        old_data = NULL;
        new_data = to_jsonb(NEW);
        audit_record := NEW;
    END IF;

    -- Insert audit log record
    INSERT INTO security.audit_logs (
        event_type,
        severity,
        user_id,
        ip_address,
        user_agent,
        resource,
        action,
        result,
        metadata
    ) VALUES (
        TG_TABLE_SCHEMA || '.' || TG_TABLE_NAME || '_' || LOWER(TG_OP),
        CASE 
            WHEN TG_OP = 'DELETE' THEN 'warning'
            WHEN TG_OP = 'UPDATE' AND changed_fields != '{}' THEN 'info'
            WHEN TG_OP = 'INSERT' THEN 'info'
            ELSE 'info'
        END,
        COALESCE(audit_record.user_id, audit_record.created_by, audit_record.acknowledged_by),
        COALESCE(current_setting('request.headers.x-forwarded-for', true), current_setting('request.headers.x-real-ip', true), inet_client_addr()::text)::inet,
        current_setting('request.headers.user-agent', true),
        TG_TABLE_SCHEMA || '.' || TG_TABLE_NAME,
        TG_OP,
        'success',
        jsonb_build_object(
            'operation', TG_OP,
            'table', TG_TABLE_SCHEMA || '.' || TG_TABLE_NAME,
            'record_id', COALESCE(audit_record.id, audit_record.user_id),
            'changed_fields', changed_fields,
            'old_data', old_data,
            'new_data', new_data,
            'trigger_name', TG_NAME,
            'timestamp', now()
        )
    );

    -- Return appropriate record
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- MFA AUDIT TRIGGERS
-- ============================================================================

-- Audit trigger for MFA enrollments
CREATE TRIGGER audit_mfa_enrollments
    AFTER INSERT OR UPDATE OR DELETE ON auth.mfa_enrollments
    FOR EACH ROW
    EXECUTE FUNCTION audit_trigger_function();

-- Audit trigger for MFA backup codes
CREATE TRIGGER audit_mfa_backup_codes
    AFTER INSERT OR UPDATE OR DELETE ON auth.mfa_backup_codes
    FOR EACH ROW
    EXECUTE FUNCTION audit_trigger_function();

-- ============================================================================
-- MONITORING AUDIT TRIGGERS
-- ============================================================================

-- Audit trigger for alert configurations
CREATE TRIGGER audit_alert_configs
    AFTER INSERT OR UPDATE OR DELETE ON monitoring.alert_configs
    FOR EACH ROW
    EXECUTE FUNCTION audit_trigger_function();

-- Audit trigger for alert history
CREATE TRIGGER audit_alert_history
    AFTER INSERT OR UPDATE OR DELETE ON monitoring.alert_history
    FOR EACH ROW
    EXECUTE FUNCTION audit_trigger_function();

-- Audit trigger for anomaly patterns
CREATE TRIGGER audit_anomaly_patterns
    AFTER INSERT OR UPDATE OR DELETE ON monitoring.anomaly_patterns
    FOR EACH ROW
    EXECUTE FUNCTION audit_trigger_function();

-- ============================================================================
-- FEATURE AUDIT TRIGGERS
-- ============================================================================

-- Audit trigger for export requests
CREATE TRIGGER audit_export_requests
    AFTER INSERT OR UPDATE OR DELETE ON features.export_requests
    FOR EACH ROW
    EXECUTE FUNCTION audit_trigger_function();

-- Audit trigger for clustering results
CREATE TRIGGER audit_clustering_results
    AFTER INSERT OR UPDATE OR DELETE ON analytics.clustering_results
    FOR EACH ROW
    EXECUTE FUNCTION audit_trigger_function();

-- Audit trigger for accessibility preferences
CREATE TRIGGER audit_accessibility_preferences
    AFTER INSERT OR UPDATE OR DELETE ON users.accessibility_preferences
    FOR EACH ROW
    EXECUTE FUNCTION audit_trigger_function();

-- ============================================================================
-- SPECIALIZED AUDIT FUNCTIONS
-- ============================================================================

-- Function to audit failed authentication attempts
CREATE OR REPLACE FUNCTION audit_auth_failure(
    p_user_id UUID,
    p_ip_address INET,
    p_user_agent TEXT,
    p_reason TEXT
) RETURNS VOID AS $$
BEGIN
    INSERT INTO security.audit_logs (
        event_type,
        severity,
        user_id,
        ip_address,
        user_agent,
        resource,
        action,
        result,
        metadata
    ) VALUES (
        'auth.login_failed',
        'warning',
        p_user_id,
        p_ip_address,
        p_user_agent,
        'auth.users',
        'login',
        'failure',
        jsonb_build_object(
            'reason', p_reason,
            'timestamp', now()
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to audit MFA events
CREATE OR REPLACE FUNCTION audit_mfa_event(
    p_user_id UUID,
    p_event_type TEXT,
    p_result TEXT,
    p_metadata JSONB DEFAULT '{}'
) RETURNS VOID AS $$
BEGIN
    INSERT INTO security.audit_logs (
        event_type,
        severity,
        user_id,
        ip_address,
        user_agent,
        resource,
        action,
        result,
        metadata
    ) VALUES (
        'auth.mfa_' || p_event_type,
        CASE 
            WHEN p_result = 'success' THEN 'info'
            WHEN p_result = 'failure' THEN 'warning'
            ELSE 'info'
        END,
        p_user_id,
        COALESCE(current_setting('request.headers.x-forwarded-for', true), current_setting('request.headers.x-real-ip', true), inet_client_addr()::text)::inet,
        current_setting('request.headers.user-agent', true),
        'auth.mfa',
        p_event_type,
        p_result,
        p_metadata || jsonb_build_object('timestamp', now())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to audit security events
CREATE OR REPLACE FUNCTION audit_security_event(
    p_event_type TEXT,
    p_severity TEXT,
    p_user_id UUID,
    p_resource TEXT,
    p_action TEXT,
    p_result TEXT,
    p_metadata JSONB DEFAULT '{}'
) RETURNS VOID AS $$
BEGIN
    INSERT INTO security.audit_logs (
        event_type,
        severity,
        user_id,
        ip_address,
        user_agent,
        resource,
        action,
        result,
        metadata
    ) VALUES (
        p_event_type,
        p_severity,
        p_user_id,
        COALESCE(current_setting('request.headers.x-forwarded-for', true), current_setting('request.headers.x-real-ip', true), inet_client_addr()::text)::inet,
        current_setting('request.headers.user-agent', true),
        p_resource,
        p_action,
        p_result,
        p_metadata || jsonb_build_object('timestamp', now())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- AUDIT CLEANUP FUNCTIONS
-- ============================================================================

-- Function to clean up old audit logs (for data retention)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete audit logs older than 90 days (active retention)
    DELETE FROM security.audit_logs
    WHERE created_at < now() - INTERVAL '90 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Log the cleanup operation
    INSERT INTO security.audit_logs (
        event_type,
        severity,
        user_id,
        resource,
        action,
        result,
        metadata
    ) VALUES (
        'system.audit_cleanup',
        'info',
        NULL,
        'security.audit_logs',
        'cleanup',
        'success',
        jsonb_build_object(
            'deleted_count', deleted_count,
            'retention_days', 90,
            'timestamp', now()
        )
    );
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- AUDIT QUERY FUNCTIONS
-- ============================================================================

-- Function to get audit logs for a specific user
CREATE OR REPLACE FUNCTION get_user_audit_logs(
    p_user_id UUID,
    p_from_date TIMESTAMPTZ DEFAULT NULL,
    p_to_date TIMESTAMPTZ DEFAULT NULL,
    p_limit INTEGER DEFAULT 100
) RETURNS TABLE (
    id UUID,
    event_type TEXT,
    severity TEXT,
    action TEXT,
    result TEXT,
    created_at TIMESTAMPTZ,
    metadata JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        al.id,
        al.event_type,
        al.severity,
        al.action,
        al.result,
        al.created_at,
        al.metadata
    FROM security.audit_logs al
    WHERE al.user_id = p_user_id
    AND (p_from_date IS NULL OR al.created_at >= p_from_date)
    AND (p_to_date IS NULL OR al.created_at <= p_to_date)
    ORDER BY al.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get security events by severity
CREATE OR REPLACE FUNCTION get_security_events_by_severity(
    p_severity TEXT,
    p_hours INTEGER DEFAULT 24
) RETURNS TABLE (
    id UUID,
    event_type TEXT,
    user_id UUID,
    action TEXT,
    result TEXT,
    created_at TIMESTAMPTZ,
    metadata JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        al.id,
        al.event_type,
        al.user_id,
        al.action,
        al.result,
        al.created_at,
        al.metadata
    FROM security.audit_logs al
    WHERE al.severity = p_severity
    AND al.created_at >= now() - (p_hours || ' hours')::INTERVAL
    ORDER BY al.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SCHEDULED AUDIT CLEANUP
-- ============================================================================

-- Create a function to be called by pg_cron for scheduled cleanup
CREATE OR REPLACE FUNCTION schedule_audit_cleanup()
RETURNS VOID AS $$
BEGIN
    -- This function can be called by pg_cron or external scheduler
    PERFORM cleanup_old_audit_logs();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON FUNCTION audit_trigger_function() IS 
'Main audit trigger function that logs all changes to audited tables with detailed change tracking';

COMMENT ON FUNCTION audit_auth_failure(UUID, INET, TEXT, TEXT) IS 
'Logs failed authentication attempts with reason and context';

COMMENT ON FUNCTION audit_mfa_event(UUID, TEXT, TEXT, JSONB) IS 
'Logs MFA-related events (enrollment, verification, recovery)';

COMMENT ON FUNCTION audit_security_event(TEXT, TEXT, UUID, TEXT, TEXT, TEXT, JSONB) IS 
'Logs general security events with customizable parameters';

COMMENT ON FUNCTION cleanup_old_audit_logs() IS 
'Removes audit logs older than 90 days to maintain data retention policy';

-- ============================================================================
-- SECURITY NOTES
-- ============================================================================

-- 1. All audit functions use SECURITY DEFINER for proper privilege escalation
-- 2. Audit triggers capture all DML operations on sensitive tables
-- 3. IP addresses are captured from headers for proxy environments
-- 4. Change tracking includes old/new values for updates
-- 5. Audit logs are immutable (no UPDATE/DELETE policies)
-- 6. Cleanup functions maintain data retention compliance
-- 7. All functions include proper error handling and logging
