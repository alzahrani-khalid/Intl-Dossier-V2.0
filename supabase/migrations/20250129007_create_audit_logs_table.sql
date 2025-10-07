-- Migration: 007_create_audit_logs_table
-- Description: Create audit logs table for security and compliance tracking
-- Date: 2025-01-29

-- Create the audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Event Context
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    action TEXT NOT NULL,
    
    -- Changes
    old_values JSONB,
    new_values JSONB,
    
    -- Security Context
    user_id UUID NOT NULL,
    user_role TEXT NOT NULL,
    ip_address INET,
    user_agent TEXT,
    
    -- MFA Context
    required_mfa BOOLEAN NOT NULL DEFAULT false,
    mfa_verified BOOLEAN NOT NULL DEFAULT false,
    mfa_method TEXT,
    
    -- Correlation
    correlation_id UUID,
    session_id TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_mfa CHECK (
        (required_mfa = false) OR 
        (required_mfa = true AND mfa_verified IS NOT NULL)
    )
);

-- Function to log audit events
CREATE OR REPLACE FUNCTION log_audit_event(
    p_entity_type TEXT,
    p_entity_id UUID,
    p_action TEXT,
    p_user_id UUID,
    p_user_role TEXT,
    p_old_values JSONB DEFAULT NULL,
    p_new_values JSONB DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_correlation_id UUID DEFAULT NULL,
    p_session_id TEXT DEFAULT NULL,
    p_required_mfa BOOLEAN DEFAULT false,
    p_mfa_verified BOOLEAN DEFAULT false,
    p_mfa_method TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_audit_id UUID;
BEGIN
    INSERT INTO audit_logs (
        entity_type,
        entity_id,
        action,
        user_id,
        user_role,
        old_values,
        new_values,
        ip_address,
        user_agent,
        correlation_id,
        session_id,
        required_mfa,
        mfa_verified,
        mfa_method
    ) VALUES (
        p_entity_type,
        p_entity_id,
        p_action,
        p_user_id,
        p_user_role,
        p_old_values,
        p_new_values,
        p_ip_address,
        p_user_agent,
        p_correlation_id,
        p_session_id,
        p_required_mfa,
        p_mfa_verified,
        p_mfa_method
    )
    RETURNING id INTO v_audit_id;
    
    RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for automatic audit logging on ticket changes
CREATE OR REPLACE FUNCTION audit_ticket_changes()
RETURNS TRIGGER AS $$
DECLARE
    v_old_values JSONB;
    v_new_values JSONB;
    v_action TEXT;
    v_require_mfa BOOLEAN := false;
BEGIN
    -- Determine action
    IF TG_OP = 'INSERT' THEN
        v_action := 'create';
        v_new_values := to_jsonb(NEW);
    ELSIF TG_OP = 'UPDATE' THEN
        v_action := 'update';
        v_old_values := to_jsonb(OLD);
        v_new_values := to_jsonb(NEW);
        
        -- Check if MFA is required for sensitivity changes
        IF OLD.sensitivity != NEW.sensitivity AND 
           NEW.sensitivity IN ('confidential', 'secret') THEN
            v_require_mfa := true;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        v_action := 'delete';
        v_old_values := to_jsonb(OLD);
        v_require_mfa := true; -- Always require MFA for deletes
    END IF;
    
    -- Log the audit event
    PERFORM log_audit_event(
        'intake_ticket',
        COALESCE(NEW.id, OLD.id),
        v_action,
        COALESCE(NEW.updated_by, NEW.created_by, OLD.updated_by, OLD.created_by),
        current_setting('app.user_role', true),
        v_old_values,
        v_new_values,
        inet_client_addr(),
        current_setting('app.user_agent', true),
        gen_random_uuid(), -- correlation_id
        current_setting('app.session_id', true),
        v_require_mfa
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Apply audit trigger to intake_tickets
CREATE TRIGGER audit_intake_tickets
    AFTER INSERT OR UPDATE OR DELETE ON intake_tickets
    FOR EACH ROW
    EXECUTE FUNCTION audit_ticket_changes();

-- Function to audit attachment operations
CREATE OR REPLACE FUNCTION audit_attachment_changes()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM log_audit_event(
        'intake_attachment',
        COALESCE(NEW.id, OLD.id),
        CASE 
            WHEN TG_OP = 'INSERT' THEN 'upload'
            WHEN TG_OP = 'UPDATE' THEN 'update'
            WHEN TG_OP = 'DELETE' THEN 'delete'
        END,
        COALESCE(NEW.uploaded_by, OLD.uploaded_by),
        current_setting('app.user_role', true),
        CASE WHEN TG_OP != 'INSERT' THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP != 'DELETE' THEN to_jsonb(NEW) ELSE NULL END,
        inet_client_addr(),
        current_setting('app.user_agent', true)
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Apply audit trigger to attachments
CREATE TRIGGER audit_intake_attachments
    AFTER INSERT OR UPDATE OR DELETE ON intake_attachments
    FOR EACH ROW
    EXECUTE FUNCTION audit_attachment_changes();

-- Function to audit sensitive operations
CREATE OR REPLACE FUNCTION audit_sensitive_operation(
    p_operation TEXT,
    p_entity_type TEXT,
    p_entity_id UUID,
    p_user_id UUID,
    p_mfa_verified BOOLEAN,
    p_mfa_method TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    -- Check if MFA was required and verified
    IF p_operation IN ('convert_to_artifact', 'access_confidential', 'export_data') 
       AND NOT p_mfa_verified THEN
        RAISE EXCEPTION 'MFA verification required for operation: %', p_operation;
    END IF;
    
    -- Log the operation
    PERFORM log_audit_event(
        p_entity_type,
        p_entity_id,
        p_operation,
        p_user_id,
        current_setting('app.user_role', true),
        NULL,
        NULL,
        inet_client_addr(),
        current_setting('app.user_agent', true),
        gen_random_uuid(),
        current_setting('app.session_id', true),
        true, -- required_mfa
        p_mfa_verified,
        p_mfa_method
    );
END;
$$ LANGUAGE plpgsql;

-- Create indexes for audit queries
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id, created_at DESC);
CREATE INDEX idx_audit_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_action ON audit_logs(action, created_at DESC);
CREATE INDEX idx_audit_correlation ON audit_logs(correlation_id) WHERE correlation_id IS NOT NULL;
CREATE INDEX idx_audit_session ON audit_logs(session_id) WHERE session_id IS NOT NULL;
CREATE INDEX idx_audit_mfa ON audit_logs(required_mfa, mfa_verified) WHERE required_mfa = true;
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);

-- Partition by month for better performance (optional, for high-volume)
-- This would be implemented based on actual volume requirements

-- Add comments
COMMENT ON TABLE audit_logs IS 'Security and compliance audit trail for all system operations';
COMMENT ON COLUMN audit_logs.entity_type IS 'Type of entity being audited (e.g., intake_ticket)';
COMMENT ON COLUMN audit_logs.action IS 'Action performed (create, update, delete, view, etc.)';
COMMENT ON COLUMN audit_logs.required_mfa IS 'Whether MFA was required for this operation';
COMMENT ON COLUMN audit_logs.mfa_verified IS 'Whether MFA was successfully verified';
COMMENT ON COLUMN audit_logs.correlation_id IS 'UUID for tracking related audit events';
COMMENT ON FUNCTION audit_sensitive_operation IS 'Audit and enforce MFA for sensitive operations';