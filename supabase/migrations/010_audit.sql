-- 010_audit.sql: Audit log table and trigger function
-- Comprehensive audit trail for all database operations

CREATE TABLE IF NOT EXISTS public.audit_log (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
    row_id UUID NOT NULL,
    old_data JSONB,
    new_data JSONB,
    changed_fields TEXT[],
    user_id UUID,
    user_email TEXT,
    user_role TEXT,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    session_id TEXT,
    request_id TEXT
);

-- Create indexes for performance
CREATE INDEX idx_audit_log_table ON public.audit_log(table_name);
CREATE INDEX idx_audit_log_operation ON public.audit_log(operation);
CREATE INDEX idx_audit_log_row ON public.audit_log(row_id);
CREATE INDEX idx_audit_log_user ON public.audit_log(user_id);
CREATE INDEX idx_audit_log_timestamp ON public.audit_log(timestamp DESC);
CREATE INDEX idx_audit_log_table_row ON public.audit_log(table_name, row_id);

-- Partial index for recent audit entries
CREATE INDEX idx_audit_log_recent ON public.audit_log(timestamp DESC)
    WHERE timestamp > (NOW() - INTERVAL '30 days');

-- Function to get changed fields between old and new data
CREATE OR REPLACE FUNCTION public.get_changed_fields(old_data JSONB, new_data JSONB)
RETURNS TEXT[] AS $$
DECLARE
    changed_fields TEXT[] := '{}';
    key TEXT;
BEGIN
    -- For INSERT operation, all fields are considered changed
    IF old_data IS NULL THEN
        SELECT array_agg(jsonb_object_keys) INTO changed_fields
        FROM jsonb_object_keys(new_data);
        RETURN changed_fields;
    END IF;

    -- For DELETE operation, all fields are considered changed
    IF new_data IS NULL THEN
        SELECT array_agg(jsonb_object_keys) INTO changed_fields
        FROM jsonb_object_keys(old_data);
        RETURN changed_fields;
    END IF;

    -- For UPDATE operation, compare fields
    FOR key IN SELECT jsonb_object_keys(old_data) UNION SELECT jsonb_object_keys(new_data)
    LOOP
        IF (old_data->key IS DISTINCT FROM new_data->key) THEN
            changed_fields := array_append(changed_fields, key);
        END IF;
    END LOOP;

    RETURN changed_fields;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Enhanced audit trigger function with context capture
CREATE OR REPLACE FUNCTION public.audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
    audit_user_id UUID;
    audit_user_email TEXT;
    audit_user_role TEXT;
    audit_ip INET;
    audit_user_agent TEXT;
    audit_session_id TEXT;
    audit_request_id TEXT;
    changed_fields TEXT[];
    old_jsonb JSONB;
    new_jsonb JSONB;
BEGIN
    -- Get user context from auth
    audit_user_id := auth.uid();

    -- Get additional context from session if available
    BEGIN
        audit_user_email := current_setting('app.user_email', true);
        audit_user_role := current_setting('app.user_role', true);
        audit_ip := current_setting('app.client_ip', true)::INET;
        audit_user_agent := current_setting('app.user_agent', true);
        audit_session_id := current_setting('app.session_id', true);
        audit_request_id := current_setting('app.request_id', true);
    EXCEPTION WHEN OTHERS THEN
        -- Ignore if settings are not available
        NULL;
    END;

    -- If no auth user, try to get from the users table
    IF audit_user_id IS NULL AND TG_TABLE_NAME != 'audit_log' THEN
        IF TG_OP = 'DELETE' THEN
            audit_user_id := OLD.id;
        ELSE
            audit_user_id := NEW.id;
        END IF;
    END IF;

    -- Convert records to JSONB
    IF TG_OP != 'INSERT' THEN
        old_jsonb := to_jsonb(OLD);
    END IF;

    IF TG_OP != 'DELETE' THEN
        new_jsonb := to_jsonb(NEW);
    END IF;

    -- Get changed fields
    changed_fields := public.get_changed_fields(old_jsonb, new_jsonb);

    -- Insert audit record
    INSERT INTO public.audit_log (
        table_name,
        operation,
        row_id,
        old_data,
        new_data,
        changed_fields,
        user_id,
        user_email,
        user_role,
        ip_address,
        user_agent,
        session_id,
        request_id
    ) VALUES (
        TG_TABLE_NAME,
        TG_OP,
        COALESCE(NEW.id, OLD.id),
        old_jsonb,
        new_jsonb,
        changed_fields,
        audit_user_id,
        audit_user_email,
        audit_user_role,
        audit_ip,
        audit_user_agent,
        audit_session_id,
        audit_request_id
    );

    -- Return appropriate value
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to enable audit logging on a table
CREATE OR REPLACE FUNCTION public.enable_audit_logging(target_table TEXT)
RETURNS VOID AS $$
BEGIN
    -- Create audit trigger for the table
    EXECUTE format('
        CREATE TRIGGER audit_trigger_%s
        AFTER INSERT OR UPDATE OR DELETE ON public.%s
        FOR EACH ROW
        EXECUTE FUNCTION public.audit_trigger_function()',
        target_table, target_table
    );

    RAISE NOTICE 'Audit logging enabled for table %', target_table;
END;
$$ LANGUAGE plpgsql;

-- Function to disable audit logging on a table
CREATE OR REPLACE FUNCTION public.disable_audit_logging(target_table TEXT)
RETURNS VOID AS $$
BEGIN
    -- Drop audit trigger for the table
    EXECUTE format('DROP TRIGGER IF EXISTS audit_trigger_%s ON public.%s',
        target_table, target_table);

    RAISE NOTICE 'Audit logging disabled for table %', target_table;
END;
$$ LANGUAGE plpgsql;

-- Enable audit logging on all critical tables
SELECT public.enable_audit_logging('users');
SELECT public.enable_audit_logging('countries');
SELECT public.enable_audit_logging('organizations');
SELECT public.enable_audit_logging('mous');
SELECT public.enable_audit_logging('events');
SELECT public.enable_audit_logging('forums');
SELECT public.enable_audit_logging('briefs');
SELECT public.enable_audit_logging('intelligence_reports');
SELECT public.enable_audit_logging('data_library_items');

-- Audit log retention policy table
CREATE TABLE IF NOT EXISTS public.audit_retention_policies (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    table_name TEXT NOT NULL,
    retention_days INTEGER NOT NULL CHECK (retention_days > 0),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(table_name)
);

-- Insert default retention policies
INSERT INTO public.audit_retention_policies (table_name, retention_days) VALUES
    ('users', 365),                    -- 1 year for user changes
    ('intelligence_reports', 730),      -- 2 years for intelligence reports
    ('mous', 1095),                     -- 3 years for MoUs
    ('events', 180),                    -- 6 months for events
    ('data_library_items', 365),        -- 1 year for data library
    ('DEFAULT', 90)                     -- 90 days for all other tables
ON CONFLICT (table_name) DO NOTHING;

-- Function to clean up old audit logs based on retention policies
CREATE OR REPLACE FUNCTION public.cleanup_audit_logs()
RETURNS TABLE(table_name TEXT, deleted_count BIGINT) AS $$
DECLARE
    policy RECORD;
    del_count BIGINT;
BEGIN
    -- Loop through active retention policies
    FOR policy IN
        SELECT * FROM public.audit_retention_policies
        WHERE is_active = true
    LOOP
        IF policy.table_name = 'DEFAULT' THEN
            -- Apply default policy to tables without specific policies
            DELETE FROM public.audit_log al
            WHERE al.timestamp < (NOW() - INTERVAL '1 day' * policy.retention_days)
            AND NOT EXISTS (
                SELECT 1 FROM public.audit_retention_policies arp
                WHERE arp.table_name = al.table_name
                AND arp.table_name != 'DEFAULT'
                AND arp.is_active = true
            );
            GET DIAGNOSTICS del_count = ROW_COUNT;
            RETURN QUERY SELECT 'DEFAULT' AS table_name, del_count;
        ELSE
            -- Apply specific table policy
            DELETE FROM public.audit_log al
            WHERE al.table_name = policy.table_name
            AND al.timestamp < (NOW() - INTERVAL '1 day' * policy.retention_days);
            GET DIAGNOSTICS del_count = ROW_COUNT;
            RETURN QUERY SELECT policy.table_name, del_count;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- View for recent audit activity
CREATE OR REPLACE VIEW public.recent_audit_activity AS
SELECT
    al.*,
    u.full_name as user_name,
    CASE
        WHEN al.timestamp > NOW() - INTERVAL '1 hour' THEN 'Last Hour'
        WHEN al.timestamp > NOW() - INTERVAL '1 day' THEN 'Today'
        WHEN al.timestamp > NOW() - INTERVAL '7 days' THEN 'This Week'
        WHEN al.timestamp > NOW() - INTERVAL '30 days' THEN 'This Month'
        ELSE 'Older'
    END as time_group,
    array_length(al.changed_fields, 1) as field_count
FROM public.audit_log al
LEFT JOIN public.users u ON al.user_id = u.id
WHERE al.timestamp > NOW() - INTERVAL '30 days'
ORDER BY al.timestamp DESC;

-- View for audit statistics
CREATE OR REPLACE VIEW public.audit_statistics AS
SELECT
    table_name,
    operation,
    DATE(timestamp) as audit_date,
    COUNT(*) as operation_count,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(DISTINCT row_id) as unique_rows,
    AVG(array_length(changed_fields, 1))::INTEGER as avg_fields_changed
FROM public.audit_log
WHERE timestamp > NOW() - INTERVAL '30 days'
GROUP BY table_name, operation, DATE(timestamp)
ORDER BY audit_date DESC, table_name, operation;

-- Function to get audit history for a specific record
CREATE OR REPLACE FUNCTION public.get_audit_history(
    p_table_name TEXT,
    p_row_id UUID,
    p_limit INTEGER DEFAULT 100
)
RETURNS TABLE(
    audit_id UUID,
    operation TEXT,
    changed_fields TEXT[],
    old_value JSONB,
    new_value JSONB,
    user_email TEXT,
    timestamp TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        al.id as audit_id,
        al.operation,
        al.changed_fields,
        al.old_data as old_value,
        al.new_data as new_value,
        COALESCE(al.user_email, u.email) as user_email,
        al.timestamp
    FROM public.audit_log al
    LEFT JOIN public.users u ON al.user_id = u.id
    WHERE al.table_name = p_table_name
    AND al.row_id = p_row_id
    ORDER BY al.timestamp DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant permissions
GRANT SELECT ON public.audit_log TO authenticated;
GRANT ALL ON public.audit_retention_policies TO authenticated;
GRANT SELECT ON public.recent_audit_activity TO authenticated;
GRANT SELECT ON public.audit_statistics TO authenticated;

-- Enable Row Level Security
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_retention_policies ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for audit log (read-only for most users)
CREATE POLICY audit_log_read_policy ON public.audit_log
    FOR SELECT
    USING (
        auth.uid() IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND role IN ('admin', 'editor')
        )
    );

-- Add comments for documentation
COMMENT ON TABLE public.audit_log IS 'Comprehensive audit trail for all database operations';
COMMENT ON COLUMN public.audit_log.changed_fields IS 'Array of field names that were modified in the operation';
COMMENT ON FUNCTION public.cleanup_audit_logs IS 'Removes old audit log entries based on retention policies';
COMMENT ON FUNCTION public.get_audit_history IS 'Retrieves the complete audit history for a specific record';