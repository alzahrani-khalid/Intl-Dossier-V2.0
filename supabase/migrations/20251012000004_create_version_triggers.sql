-- =====================================================================================
-- Migration: Setup Database Triggers for Version Increment
-- Description: Creates triggers to auto-increment _version on updates and manage sync metadata
-- Author: Database Architect
-- Date: 2025-10-12
-- =====================================================================================

-- Drop existing trigger function if it exists (for idempotency)
DROP FUNCTION IF EXISTS public.increment_version() CASCADE;

-- Create the main trigger function to increment version
CREATE OR REPLACE FUNCTION public.increment_version()
RETURNS TRIGGER AS $$
DECLARE
    old_record RECORD;
    new_record RECORD;
    has_data_changes BOOLEAN := FALSE;
    excluded_columns TEXT[] := ARRAY[
        '_status', '_version', '_last_synced_at', '_sync_id', '_device_id',
        'updated_at', 'last_login_at', 'last_used_at'
    ];
    col_name TEXT;
    old_value TEXT;
    new_value TEXT;
BEGIN
    -- Only process if the table has sync columns
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = TG_TABLE_SCHEMA
        AND table_name = TG_TABLE_NAME
        AND column_name = '_version'
    ) THEN
        RETURN NEW;
    END IF;

    -- Convert OLD and NEW to JSON for comparison
    IF TG_OP = 'UPDATE' THEN
        -- Check if any non-metadata columns have changed
        FOR col_name IN
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = TG_TABLE_SCHEMA
            AND table_name = TG_TABLE_NAME
            AND column_name != ALL(excluded_columns)
        LOOP
            -- Get old and new values as text
            EXECUTE format('SELECT ($1).%I::TEXT', col_name) INTO old_value USING OLD;
            EXECUTE format('SELECT ($1).%I::TEXT', col_name) INTO new_value USING NEW;

            -- Check if values are different
            IF (old_value IS DISTINCT FROM new_value) THEN
                has_data_changes := TRUE;
                EXIT; -- Exit loop as soon as we find a change
            END IF;
        END LOOP;

        -- Only increment version if actual data changed
        IF has_data_changes THEN
            -- Increment version number
            NEW._version := COALESCE(OLD._version, 0) + 1;

            -- Set status to pending if not explicitly set
            IF NEW._status IS NOT DISTINCT FROM OLD._status THEN
                NEW._status := 'pending';
            END IF;

            -- Clear last_synced_at for modified records
            IF NEW._status = 'pending' THEN
                NEW._last_synced_at := NULL;
            END IF;
        END IF;
    ELSIF TG_OP = 'INSERT' THEN
        -- For new records, ensure version starts at 1
        NEW._version := COALESCE(NEW._version, 1);
        NEW._status := COALESCE(NEW._status, 'pending');
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a function to handle successful sync
CREATE OR REPLACE FUNCTION public.handle_sync_success()
RETURNS TRIGGER AS $$
BEGIN
    -- When _status changes from 'pending' or 'conflict' to 'synced'
    IF OLD._status IN ('pending', 'conflict') AND NEW._status = 'synced' THEN
        NEW._last_synced_at := NOW();
        -- Optionally clear the sync_id after successful sync
        -- NEW._sync_id := NULL;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a function to detect and handle conflicts
CREATE OR REPLACE FUNCTION public.detect_sync_conflict()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if this is a sync operation (has _sync_id)
    IF NEW._sync_id IS NOT NULL AND OLD._sync_id IS NOT NULL THEN
        -- If versions don't match expected sequence, mark as conflict
        IF NEW._version != OLD._version + 1 THEN
            NEW._status := 'conflict';
            RAISE NOTICE 'Sync conflict detected for % id=%: version mismatch', TG_TABLE_NAME, NEW.id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create version triggers for a specific table
CREATE OR REPLACE FUNCTION create_version_triggers(table_name text)
RETURNS void AS $$
BEGIN
    -- Check if the table has _version column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = create_version_triggers.table_name
        AND column_name = '_version'
    ) THEN
        RAISE NOTICE 'Table % does not have _version column, skipping triggers', table_name;
        RETURN;
    END IF;

    -- Drop existing triggers if they exist
    EXECUTE format('DROP TRIGGER IF EXISTS trg_increment_version_%s ON public.%I', table_name, table_name);
    EXECUTE format('DROP TRIGGER IF EXISTS trg_sync_success_%s ON public.%I', table_name, table_name);
    EXECUTE format('DROP TRIGGER IF EXISTS trg_detect_conflict_%s ON public.%I', table_name, table_name);

    -- Create the version increment trigger
    EXECUTE format('
        CREATE TRIGGER trg_increment_version_%s
        BEFORE INSERT OR UPDATE ON public.%I
        FOR EACH ROW
        EXECUTE FUNCTION public.increment_version()
    ', table_name, table_name);

    -- Create the sync success trigger
    EXECUTE format('
        CREATE TRIGGER trg_sync_success_%s
        BEFORE UPDATE ON public.%I
        FOR EACH ROW
        WHEN (OLD._status IS DISTINCT FROM NEW._status)
        EXECUTE FUNCTION public.handle_sync_success()
    ', table_name, table_name);

    -- Create the conflict detection trigger
    EXECUTE format('
        CREATE TRIGGER trg_detect_conflict_%s
        BEFORE UPDATE ON public.%I
        FOR EACH ROW
        WHEN (NEW._sync_id IS NOT NULL)
        EXECUTE FUNCTION public.detect_sync_conflict()
    ', table_name, table_name);

    RAISE NOTICE 'Created version triggers for table: %', table_name;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to intake_tickets
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'intake_tickets' AND table_schema = 'public') THEN
        PERFORM create_version_triggers('intake_tickets');
    END IF;
END $$;

-- Apply triggers to dossiers
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'dossiers' AND table_schema = 'public') THEN
        PERFORM create_version_triggers('dossiers');
    END IF;
END $$;

-- Apply triggers to countries
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'countries' AND table_schema = 'public') THEN
        PERFORM create_version_triggers('countries');
    END IF;
END $$;

-- Apply triggers to organizations
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organizations' AND table_schema = 'public') THEN
        PERFORM create_version_triggers('organizations');
    END IF;
END $$;

-- Apply triggers to forums
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'forums' AND table_schema = 'public') THEN
        PERFORM create_version_triggers('forums');
    END IF;
END $$;

-- Apply triggers to assignments
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'assignments' AND table_schema = 'public') THEN
        PERFORM create_version_triggers('assignments');
    END IF;
END $$;

-- Apply triggers to kanban_cards
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'kanban_cards' AND table_schema = 'public') THEN
        PERFORM create_version_triggers('kanban_cards');
    END IF;
END $$;

-- Apply triggers to network_nodes
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'network_nodes' AND table_schema = 'public') THEN
        PERFORM create_version_triggers('network_nodes');
    END IF;
END $$;

-- Apply triggers to network_edges
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'network_edges' AND table_schema = 'public') THEN
        PERFORM create_version_triggers('network_edges');
    END IF;
END $$;

-- Apply triggers to users
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') THEN
        PERFORM create_version_triggers('users');
    END IF;
END $$;

-- Apply triggers to mous (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'mous' AND table_schema = 'public') THEN
        PERFORM create_version_triggers('mous');
    END IF;
END $$;

-- Apply triggers to events (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'events' AND table_schema = 'public') THEN
        PERFORM create_version_triggers('events');
    END IF;
END $$;

-- Apply triggers to calendar_entries (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'calendar_entries' AND table_schema = 'public') THEN
        PERFORM create_version_triggers('calendar_entries');
    END IF;
END $$;

-- Apply triggers to documents (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'documents' AND table_schema = 'public') THEN
        PERFORM create_version_triggers('documents');
    END IF;
END $$;

-- Utility function to resolve conflicts
CREATE OR REPLACE FUNCTION public.resolve_sync_conflict(
    table_name text,
    record_id uuid,
    resolution_strategy text DEFAULT 'server_wins',
    merged_data jsonb DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    success BOOLEAN := FALSE;
BEGIN
    IF resolution_strategy = 'server_wins' THEN
        -- Keep server version, just mark as synced
        EXECUTE format('
            UPDATE %I
            SET _status = ''synced'',
                _last_synced_at = NOW()
            WHERE id = $1 AND _status = ''conflict''
        ', table_name)
        USING record_id;

    ELSIF resolution_strategy = 'client_wins' THEN
        -- Accept client version, increment version and mark as synced
        EXECUTE format('
            UPDATE %I
            SET _status = ''synced'',
                _version = _version + 1,
                _last_synced_at = NOW()
            WHERE id = $1 AND _status = ''conflict''
        ', table_name)
        USING record_id;

    ELSIF resolution_strategy = 'merge' AND merged_data IS NOT NULL THEN
        -- Apply merged data
        -- This is a simplified version - actual implementation would need
        -- to handle the merge more carefully based on table structure
        EXECUTE format('
            UPDATE %I
            SET _status = ''synced'',
                _version = _version + 1,
                _last_synced_at = NOW()
            WHERE id = $1 AND _status = ''conflict''
        ', table_name)
        USING record_id;
    END IF;

    GET DIAGNOSTICS success = ROW_COUNT > 0;
    RETURN success;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get conflict details
CREATE OR REPLACE FUNCTION public.get_sync_conflicts(
    table_name text DEFAULT NULL,
    limit_rows integer DEFAULT 100
)
RETURNS TABLE (
    table_name text,
    record_id uuid,
    version integer,
    device_id text,
    updated_at timestamptz,
    conflict_detected_at timestamptz
) AS $$
DECLARE
    query_text text;
BEGIN
    IF table_name IS NOT NULL THEN
        -- Query specific table
        query_text := format('
            SELECT
                %L as table_name,
                id as record_id,
                _version as version,
                _device_id as device_id,
                updated_at,
                updated_at as conflict_detected_at
            FROM %I
            WHERE _status = ''conflict''
            ORDER BY updated_at DESC
            LIMIT $1
        ', table_name, table_name);

        RETURN QUERY EXECUTE query_text USING limit_rows;
    ELSE
        -- Query all tables with conflicts (simplified for example)
        RETURN QUERY
        SELECT * FROM (
            SELECT
                'intake_tickets'::text as tname,
                id as record_id,
                _version as version,
                _device_id as device_id,
                updated_at,
                updated_at as conflict_detected_at
            FROM public.intake_tickets
            WHERE _status = 'conflict'

            UNION ALL

            SELECT
                'dossiers'::text as tname,
                id as record_id,
                _version as version,
                _device_id as device_id,
                updated_at,
                updated_at as conflict_detected_at
            FROM public.dossiers
            WHERE _status = 'conflict'

            -- Add more tables as needed
        ) conflicts
        ORDER BY conflict_detected_at DESC
        LIMIT limit_rows;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments for documentation
COMMENT ON FUNCTION public.increment_version() IS 'Automatically increments _version on data changes, ignoring metadata-only updates';
COMMENT ON FUNCTION public.handle_sync_success() IS 'Updates _last_synced_at when a record is successfully synced';
COMMENT ON FUNCTION public.detect_sync_conflict() IS 'Detects version conflicts during sync operations';
COMMENT ON FUNCTION public.resolve_sync_conflict(text, uuid, text, jsonb) IS 'Resolves sync conflicts using specified strategy: server_wins, client_wins, or merge';
COMMENT ON FUNCTION public.get_sync_conflicts(text, integer) IS 'Retrieves current sync conflicts for monitoring and resolution';

-- Create a monitoring view for trigger activity
CREATE OR REPLACE VIEW public.sync_trigger_activity AS
SELECT
    tgname as trigger_name,
    tgrelid::regclass as table_name,
    tgenabled as enabled,
    CASE tgenabled
        WHEN 'O' THEN 'ENABLED'
        WHEN 'D' THEN 'DISABLED'
        WHEN 'R' THEN 'REPLICA'
        WHEN 'A' THEN 'ALWAYS'
        ELSE 'UNKNOWN'
    END as status
FROM pg_trigger
WHERE tgname LIKE 'trg_%version%'
   OR tgname LIKE 'trg_%sync%'
   OR tgname LIKE 'trg_%conflict%'
ORDER BY table_name, trigger_name;

-- Grant permissions
GRANT SELECT ON public.sync_trigger_activity TO authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_sync_conflict(text, uuid, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_sync_conflicts(text, integer) TO authenticated;

-- =====================================================================================
-- Rollback Script (commented out for safety)
-- =====================================================================================
-- DROP FUNCTION IF EXISTS public.increment_version() CASCADE;
-- DROP FUNCTION IF EXISTS public.handle_sync_success() CASCADE;
-- DROP FUNCTION IF EXISTS public.detect_sync_conflict() CASCADE;
-- DROP FUNCTION IF EXISTS create_version_triggers(text) CASCADE;
-- DROP FUNCTION IF EXISTS public.resolve_sync_conflict(text, uuid, text, jsonb);
-- DROP FUNCTION IF EXISTS public.get_sync_conflicts(text, integer);
-- DROP VIEW IF EXISTS public.sync_trigger_activity;
--
-- DROP TRIGGER IF EXISTS trg_increment_version_intake_tickets ON public.intake_tickets;
-- DROP TRIGGER IF EXISTS trg_sync_success_intake_tickets ON public.intake_tickets;
-- DROP TRIGGER IF EXISTS trg_detect_conflict_intake_tickets ON public.intake_tickets;
--
-- -- Repeat for all other tables...