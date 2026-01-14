-- 20260113700001_field_level_history.sql
-- Field-level change tracking for granular history and selective rollback
-- Enables tracking of individual field changes with rollback capability

-- =============================================
-- FIELD HISTORY TABLE
-- =============================================

-- Table to store individual field changes
CREATE TABLE IF NOT EXISTS public.field_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Entity identification (polymorphic)
    entity_type TEXT NOT NULL CHECK (entity_type IN (
        'person', 'engagement', 'commitment', 'organization',
        'country', 'forum', 'mou', 'position', 'dossier', 'task',
        'intake_ticket', 'working_group', 'theme'
    )),
    entity_id UUID NOT NULL,

    -- Field identification
    field_name TEXT NOT NULL,
    field_label_en TEXT,  -- Human-readable label for display
    field_label_ar TEXT,  -- Arabic label
    field_category TEXT DEFAULT 'base' CHECK (field_category IN ('base', 'extension', 'metadata', 'relationship')),

    -- Change values (JSONB for flexible data types)
    old_value JSONB,
    new_value JSONB,

    -- Change metadata
    change_type TEXT NOT NULL DEFAULT 'update' CHECK (change_type IN ('create', 'update', 'delete', 'rollback')),

    -- User context
    changed_by UUID NOT NULL REFERENCES auth.users(id),
    changed_by_email TEXT,
    changed_by_role TEXT,

    -- Session tracking
    session_id TEXT,
    request_id TEXT,
    ip_address INET,
    user_agent TEXT,

    -- Rollback tracking
    is_rollback BOOLEAN DEFAULT false,
    rollback_of_id UUID REFERENCES public.field_history(id),
    rolled_back_at TIMESTAMPTZ,
    rolled_back_by UUID REFERENCES auth.users(id),

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- Constraints
    CONSTRAINT valid_change CHECK (
        (change_type = 'create' AND old_value IS NULL) OR
        (change_type = 'delete' AND new_value IS NULL) OR
        (change_type IN ('update', 'rollback'))
    )
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Primary lookup patterns
CREATE INDEX idx_field_history_entity ON public.field_history(entity_type, entity_id);
CREATE INDEX idx_field_history_field ON public.field_history(entity_type, entity_id, field_name);
CREATE INDEX idx_field_history_timestamp ON public.field_history(created_at DESC);
CREATE INDEX idx_field_history_user ON public.field_history(changed_by);

-- Composite index for entity timeline queries
CREATE INDEX idx_field_history_entity_timeline ON public.field_history(entity_type, entity_id, created_at DESC);

-- Partial index for recent changes (last 30 days)
CREATE INDEX idx_field_history_recent ON public.field_history(entity_type, entity_id, created_at DESC)
    WHERE created_at > NOW() - INTERVAL '30 days';

-- Index for rollback tracking
CREATE INDEX idx_field_history_rollback ON public.field_history(rollback_of_id)
    WHERE rollback_of_id IS NOT NULL;

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Function to extract and log field changes from old/new data
CREATE OR REPLACE FUNCTION public.log_field_changes(
    p_entity_type TEXT,
    p_entity_id UUID,
    p_old_data JSONB,
    p_new_data JSONB,
    p_change_type TEXT DEFAULT 'update',
    p_user_id UUID DEFAULT NULL,
    p_session_id TEXT DEFAULT NULL,
    p_request_id TEXT DEFAULT NULL
)
RETURNS SETOF UUID AS $$
DECLARE
    v_user_id UUID;
    v_user_email TEXT;
    v_user_role TEXT;
    v_key TEXT;
    v_old_value JSONB;
    v_new_value JSONB;
    v_field_label_en TEXT;
    v_field_label_ar TEXT;
    v_field_category TEXT;
    v_inserted_id UUID;
    v_ip INET;
    v_user_agent TEXT;
BEGIN
    -- Get user context
    v_user_id := COALESCE(p_user_id, auth.uid());

    -- Get user details
    SELECT email INTO v_user_email
    FROM auth.users
    WHERE id = v_user_id;

    -- Get user role from public.users
    SELECT role INTO v_user_role
    FROM public.users
    WHERE id = v_user_id;

    -- Get session context if available
    BEGIN
        v_ip := current_setting('app.client_ip', true)::INET;
        v_user_agent := current_setting('app.user_agent', true);
    EXCEPTION WHEN OTHERS THEN
        v_ip := NULL;
        v_user_agent := NULL;
    END;

    -- Process each key in old and new data
    FOR v_key IN
        SELECT DISTINCT jsonb_object_keys
        FROM (
            SELECT jsonb_object_keys(COALESCE(p_old_data, '{}'::JSONB))
            UNION
            SELECT jsonb_object_keys(COALESCE(p_new_data, '{}'::JSONB))
        ) AS keys
    LOOP
        -- Skip system fields that shouldn't be tracked
        IF v_key IN ('id', 'created_at', 'updated_at', 'version', 'search_vector', 'embedding') THEN
            CONTINUE;
        END IF;

        v_old_value := p_old_data->v_key;
        v_new_value := p_new_data->v_key;

        -- Only log if values are different
        IF v_old_value IS DISTINCT FROM v_new_value THEN
            -- Determine field category based on naming conventions
            v_field_category := CASE
                WHEN v_key LIKE '%_id' OR v_key LIKE '%_ids' THEN 'relationship'
                WHEN v_key LIKE '%_at' OR v_key IN ('created_by', 'updated_by', 'archived') THEN 'metadata'
                WHEN v_key LIKE '%_ar' OR v_key LIKE '%_en' OR v_key LIKE 'extension_%' THEN 'extension'
                ELSE 'base'
            END;

            -- Generate human-readable labels (basic transformation)
            v_field_label_en := INITCAP(REPLACE(v_key, '_', ' '));
            v_field_label_ar := v_key; -- Will be populated via i18n

            INSERT INTO public.field_history (
                entity_type,
                entity_id,
                field_name,
                field_label_en,
                field_label_ar,
                field_category,
                old_value,
                new_value,
                change_type,
                changed_by,
                changed_by_email,
                changed_by_role,
                session_id,
                request_id,
                ip_address,
                user_agent
            ) VALUES (
                p_entity_type,
                p_entity_id,
                v_key,
                v_field_label_en,
                v_field_label_ar,
                v_field_category,
                v_old_value,
                v_new_value,
                p_change_type,
                v_user_id,
                v_user_email,
                v_user_role,
                p_session_id,
                p_request_id,
                v_ip,
                v_user_agent
            )
            RETURNING id INTO v_inserted_id;

            RETURN NEXT v_inserted_id;
        END IF;
    END LOOP;

    RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get field history for an entity
CREATE OR REPLACE FUNCTION public.get_field_history(
    p_entity_type TEXT,
    p_entity_id UUID,
    p_field_name TEXT DEFAULT NULL,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
    id UUID,
    field_name TEXT,
    field_label_en TEXT,
    field_label_ar TEXT,
    field_category TEXT,
    old_value JSONB,
    new_value JSONB,
    change_type TEXT,
    changed_by UUID,
    changed_by_email TEXT,
    changed_by_role TEXT,
    created_at TIMESTAMPTZ,
    is_rollback BOOLEAN,
    rollback_of_id UUID,
    rolled_back_at TIMESTAMPTZ,
    rolled_back_by UUID
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        fh.id,
        fh.field_name,
        fh.field_label_en,
        fh.field_label_ar,
        fh.field_category,
        fh.old_value,
        fh.new_value,
        fh.change_type,
        fh.changed_by,
        fh.changed_by_email,
        fh.changed_by_role,
        fh.created_at,
        fh.is_rollback,
        fh.rollback_of_id,
        fh.rolled_back_at,
        fh.rolled_back_by
    FROM public.field_history fh
    WHERE fh.entity_type = p_entity_type
      AND fh.entity_id = p_entity_id
      AND (p_field_name IS NULL OR fh.field_name = p_field_name)
    ORDER BY fh.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function to get field history grouped by field
CREATE OR REPLACE FUNCTION public.get_field_history_grouped(
    p_entity_type TEXT,
    p_entity_id UUID
)
RETURNS TABLE(
    field_name TEXT,
    field_label_en TEXT,
    field_label_ar TEXT,
    field_category TEXT,
    current_value JSONB,
    change_count BIGINT,
    first_change_at TIMESTAMPTZ,
    last_change_at TIMESTAMPTZ,
    last_changed_by_email TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH latest_changes AS (
        SELECT DISTINCT ON (fh.field_name)
            fh.field_name,
            fh.field_label_en,
            fh.field_label_ar,
            fh.field_category,
            fh.new_value as current_value,
            fh.changed_by_email as last_changed_by_email
        FROM public.field_history fh
        WHERE fh.entity_type = p_entity_type
          AND fh.entity_id = p_entity_id
        ORDER BY fh.field_name, fh.created_at DESC
    ),
    change_stats AS (
        SELECT
            fh.field_name,
            COUNT(*) as change_count,
            MIN(fh.created_at) as first_change_at,
            MAX(fh.created_at) as last_change_at
        FROM public.field_history fh
        WHERE fh.entity_type = p_entity_type
          AND fh.entity_id = p_entity_id
        GROUP BY fh.field_name
    )
    SELECT
        lc.field_name,
        lc.field_label_en,
        lc.field_label_ar,
        lc.field_category,
        lc.current_value,
        cs.change_count,
        cs.first_change_at,
        cs.last_change_at,
        lc.last_changed_by_email
    FROM latest_changes lc
    JOIN change_stats cs ON lc.field_name = cs.field_name
    ORDER BY cs.last_change_at DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function to rollback a specific field change
CREATE OR REPLACE FUNCTION public.rollback_field_change(
    p_field_history_id UUID
)
RETURNS JSON AS $$
DECLARE
    v_field_history RECORD;
    v_current_user_id UUID;
    v_current_value JSONB;
    v_update_query TEXT;
    v_new_history_id UUID;
BEGIN
    -- Get current user
    v_current_user_id := auth.uid();
    IF v_current_user_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'User not authenticated'
        );
    END IF;

    -- Get the field history record
    SELECT * INTO v_field_history
    FROM public.field_history
    WHERE id = p_field_history_id;

    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Field history record not found'
        );
    END IF;

    -- Check if already rolled back
    IF v_field_history.rolled_back_at IS NOT NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'This change has already been rolled back'
        );
    END IF;

    -- Get current value from the entity
    EXECUTE format(
        'SELECT to_jsonb(%I) FROM public.%I WHERE id = $1',
        v_field_history.field_name,
        v_field_history.entity_type || 's'  -- Pluralize table name
    )
    INTO v_current_value
    USING v_field_history.entity_id;

    -- Perform the rollback update
    BEGIN
        EXECUTE format(
            'UPDATE public.%I SET %I = $1 WHERE id = $2',
            v_field_history.entity_type || 's',  -- Pluralize table name
            v_field_history.field_name
        )
        USING
            CASE
                WHEN jsonb_typeof(v_field_history.old_value) = 'string' THEN (v_field_history.old_value #>> '{}')::TEXT
                ELSE v_field_history.old_value
            END,
            v_field_history.entity_id;
    EXCEPTION WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Failed to rollback: ' || SQLERRM
        );
    END;

    -- Mark the original record as rolled back
    UPDATE public.field_history
    SET rolled_back_at = NOW(),
        rolled_back_by = v_current_user_id
    WHERE id = p_field_history_id;

    -- Create a new history record for the rollback action
    INSERT INTO public.field_history (
        entity_type,
        entity_id,
        field_name,
        field_label_en,
        field_label_ar,
        field_category,
        old_value,
        new_value,
        change_type,
        changed_by,
        changed_by_email,
        is_rollback,
        rollback_of_id
    )
    SELECT
        entity_type,
        entity_id,
        field_name,
        field_label_en,
        field_label_ar,
        field_category,
        new_value,  -- Current becomes old
        old_value,  -- Old becomes new (the rollback)
        'rollback',
        v_current_user_id,
        (SELECT email FROM auth.users WHERE id = v_current_user_id),
        true,
        p_field_history_id
    FROM public.field_history
    WHERE id = p_field_history_id
    RETURNING id INTO v_new_history_id;

    RETURN json_build_object(
        'success', true,
        'message', 'Field rolled back successfully',
        'rollback_history_id', v_new_history_id,
        'rolled_back_field', v_field_history.field_name,
        'restored_value', v_field_history.old_value
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- TRIGGER FUNCTION FOR AUTO-TRACKING
-- =============================================

-- Generic trigger function to track field changes on any table
CREATE OR REPLACE FUNCTION public.track_field_changes()
RETURNS TRIGGER AS $$
DECLARE
    v_entity_type TEXT;
    v_old_jsonb JSONB;
    v_new_jsonb JSONB;
BEGIN
    -- Determine entity type from table name (remove trailing 's' for singular)
    v_entity_type := CASE
        WHEN TG_TABLE_NAME = 'persons' THEN 'person'
        WHEN TG_TABLE_NAME = 'engagements' THEN 'engagement'
        WHEN TG_TABLE_NAME = 'commitments' THEN 'commitment'
        WHEN TG_TABLE_NAME = 'organizations' THEN 'organization'
        WHEN TG_TABLE_NAME = 'countries' THEN 'country'
        WHEN TG_TABLE_NAME = 'forums' THEN 'forum'
        WHEN TG_TABLE_NAME = 'mous' THEN 'mou'
        WHEN TG_TABLE_NAME = 'positions' THEN 'position'
        WHEN TG_TABLE_NAME = 'dossiers' THEN 'dossier'
        WHEN TG_TABLE_NAME = 'tasks' THEN 'task'
        WHEN TG_TABLE_NAME = 'intake_tickets' THEN 'intake_ticket'
        WHEN TG_TABLE_NAME = 'working_groups' THEN 'working_group'
        WHEN TG_TABLE_NAME = 'themes' THEN 'theme'
        ELSE TG_TABLE_NAME
    END;

    -- Convert records to JSONB
    IF TG_OP IN ('UPDATE', 'DELETE') THEN
        v_old_jsonb := to_jsonb(OLD);
    END IF;

    IF TG_OP IN ('INSERT', 'UPDATE') THEN
        v_new_jsonb := to_jsonb(NEW);
    END IF;

    -- Log field changes
    PERFORM public.log_field_changes(
        v_entity_type,
        COALESCE(NEW.id, OLD.id),
        v_old_jsonb,
        v_new_jsonb,
        CASE TG_OP
            WHEN 'INSERT' THEN 'create'
            WHEN 'DELETE' THEN 'delete'
            ELSE 'update'
        END
    );

    -- Return appropriate value
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to enable field tracking on a table
CREATE OR REPLACE FUNCTION public.enable_field_tracking(target_table TEXT)
RETURNS VOID AS $$
BEGIN
    EXECUTE format('
        DROP TRIGGER IF EXISTS track_field_changes_%s ON public.%s;
        CREATE TRIGGER track_field_changes_%s
        AFTER INSERT OR UPDATE OR DELETE ON public.%s
        FOR EACH ROW
        EXECUTE FUNCTION public.track_field_changes()',
        target_table, target_table, target_table, target_table
    );

    RAISE NOTICE 'Field tracking enabled for table %', target_table;
END;
$$ LANGUAGE plpgsql;

-- Function to disable field tracking on a table
CREATE OR REPLACE FUNCTION public.disable_field_tracking(target_table TEXT)
RETURNS VOID AS $$
BEGIN
    EXECUTE format('DROP TRIGGER IF EXISTS track_field_changes_%s ON public.%s',
        target_table, target_table);

    RAISE NOTICE 'Field tracking disabled for table %', target_table;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- ENABLE FIELD TRACKING ON KEY TABLES
-- =============================================

SELECT public.enable_field_tracking('persons');
SELECT public.enable_field_tracking('engagements');
SELECT public.enable_field_tracking('commitments');
SELECT public.enable_field_tracking('organizations');
SELECT public.enable_field_tracking('countries');
SELECT public.enable_field_tracking('forums');
SELECT public.enable_field_tracking('mous');
SELECT public.enable_field_tracking('positions');
SELECT public.enable_field_tracking('dossiers');
SELECT public.enable_field_tracking('intake_tickets');

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE public.field_history ENABLE ROW LEVEL SECURITY;

-- Policy: Users with editor or admin role can view all field history
CREATE POLICY field_history_view_policy ON public.field_history
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND role IN ('admin', 'editor', 'manager')
        )
    );

-- Policy: Only admins can delete field history records
CREATE POLICY field_history_delete_policy ON public.field_history
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

-- =============================================
-- GRANTS
-- =============================================

GRANT SELECT ON public.field_history TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_field_history TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_field_history_grouped TO authenticated;
GRANT EXECUTE ON FUNCTION public.rollback_field_change TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_field_changes TO authenticated;

-- =============================================
-- RETENTION POLICY
-- =============================================

-- Add retention policy entry for field_history
INSERT INTO public.audit_retention_policies (table_name, retention_days)
VALUES ('field_history', 730)  -- 2 years retention
ON CONFLICT (table_name) DO UPDATE SET retention_days = 730;

-- =============================================
-- VIEWS FOR REPORTING
-- =============================================

-- View for recent field changes (last 7 days)
CREATE OR REPLACE VIEW public.recent_field_changes AS
SELECT
    fh.*,
    u.full_name as changed_by_name,
    CASE
        WHEN fh.created_at > NOW() - INTERVAL '1 hour' THEN 'last_hour'
        WHEN fh.created_at > NOW() - INTERVAL '1 day' THEN 'today'
        WHEN fh.created_at > NOW() - INTERVAL '7 days' THEN 'this_week'
        ELSE 'older'
    END as time_group
FROM public.field_history fh
LEFT JOIN public.users u ON fh.changed_by = u.id
WHERE fh.created_at > NOW() - INTERVAL '7 days'
ORDER BY fh.created_at DESC;

-- Grant access to the view
GRANT SELECT ON public.recent_field_changes TO authenticated;

-- =============================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================

COMMENT ON TABLE public.field_history IS 'Tracks individual field-level changes for entities, enabling granular history and selective rollback';
COMMENT ON COLUMN public.field_history.entity_type IS 'Type of entity (person, engagement, commitment, etc.)';
COMMENT ON COLUMN public.field_history.field_name IS 'Database column name of the changed field';
COMMENT ON COLUMN public.field_history.old_value IS 'Previous value before the change (JSONB for type flexibility)';
COMMENT ON COLUMN public.field_history.new_value IS 'New value after the change (JSONB for type flexibility)';
COMMENT ON COLUMN public.field_history.change_type IS 'Type of change: create, update, delete, or rollback';
COMMENT ON COLUMN public.field_history.is_rollback IS 'Indicates if this change was a rollback of a previous change';
COMMENT ON COLUMN public.field_history.rollback_of_id IS 'References the original change that was rolled back';
COMMENT ON FUNCTION public.log_field_changes IS 'Extracts and logs individual field changes from old/new entity data';
COMMENT ON FUNCTION public.get_field_history IS 'Retrieves field history for an entity with optional filtering';
COMMENT ON FUNCTION public.rollback_field_change IS 'Rolls back a specific field change to its previous value';
