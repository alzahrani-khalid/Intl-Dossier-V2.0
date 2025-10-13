-- =====================================================================================
-- Migration: Add Mobile Sync Metadata Columns
-- Description: Adds sync metadata columns to existing tables for offline-first mobile support
-- Author: Database Architect
-- Date: 2025-10-12
-- =====================================================================================

-- Function to add sync metadata columns to a table
CREATE OR REPLACE FUNCTION add_sync_metadata_columns(table_name text)
RETURNS void AS $$
BEGIN
    -- Add _status column if it doesn't exist
    EXECUTE format('
        ALTER TABLE %I
        ADD COLUMN IF NOT EXISTS _status TEXT
        DEFAULT ''synced''
        CHECK (_status IN (''synced'', ''pending'', ''conflict''))
    ', table_name);

    -- Add _version column if it doesn't exist
    EXECUTE format('
        ALTER TABLE %I
        ADD COLUMN IF NOT EXISTS _version INTEGER
        DEFAULT 1
        CHECK (_version > 0)
    ', table_name);

    -- Add _last_synced_at column if it doesn't exist
    EXECUTE format('
        ALTER TABLE %I
        ADD COLUMN IF NOT EXISTS _last_synced_at TIMESTAMPTZ
    ', table_name);

    -- Add _sync_id column for tracking sync operations
    EXECUTE format('
        ALTER TABLE %I
        ADD COLUMN IF NOT EXISTS _sync_id UUID
    ', table_name);

    -- Add _device_id column to track which device made the change
    EXECUTE format('
        ALTER TABLE %I
        ADD COLUMN IF NOT EXISTS _device_id TEXT
    ', table_name);

    RAISE NOTICE 'Added sync metadata columns to table: %', table_name;
END;
$$ LANGUAGE plpgsql;

-- Apply sync metadata to intake_tickets table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'intake_tickets' AND table_schema = 'public') THEN
        PERFORM add_sync_metadata_columns('intake_tickets');
    END IF;
END $$;

-- Apply sync metadata to dossiers table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'dossiers' AND table_schema = 'public') THEN
        PERFORM add_sync_metadata_columns('dossiers');
    END IF;
END $$;

-- Apply sync metadata to countries table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'countries' AND table_schema = 'public') THEN
        PERFORM add_sync_metadata_columns('countries');
    END IF;
END $$;

-- Apply sync metadata to organizations table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organizations' AND table_schema = 'public') THEN
        PERFORM add_sync_metadata_columns('organizations');
    END IF;
END $$;

-- Apply sync metadata to forums table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'forums' AND table_schema = 'public') THEN
        PERFORM add_sync_metadata_columns('forums');
    END IF;
END $$;

-- Apply sync metadata to assignments table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'assignments' AND table_schema = 'public') THEN
        PERFORM add_sync_metadata_columns('assignments');
    END IF;
END $$;

-- Apply sync metadata to kanban_cards table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'kanban_cards' AND table_schema = 'public') THEN
        PERFORM add_sync_metadata_columns('kanban_cards');
    END IF;
END $$;

-- Apply sync metadata to network_nodes table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'network_nodes' AND table_schema = 'public') THEN
        PERFORM add_sync_metadata_columns('network_nodes');
    END IF;
END $$;

-- Apply sync metadata to network_edges table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'network_edges' AND table_schema = 'public') THEN
        PERFORM add_sync_metadata_columns('network_edges');
    END IF;
END $$;

-- Apply sync metadata to users table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') THEN
        PERFORM add_sync_metadata_columns('users');
    END IF;
END $$;

-- Apply sync metadata to mous table (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'mous' AND table_schema = 'public') THEN
        PERFORM add_sync_metadata_columns('mous');
    END IF;
END $$;

-- Apply sync metadata to events table (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'events' AND table_schema = 'public') THEN
        PERFORM add_sync_metadata_columns('events');
    END IF;
END $$;

-- Apply sync metadata to calendar_entries table (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'calendar_entries' AND table_schema = 'public') THEN
        PERFORM add_sync_metadata_columns('calendar_entries');
    END IF;
END $$;

-- Apply sync metadata to documents table (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'documents' AND table_schema = 'public') THEN
        PERFORM add_sync_metadata_columns('documents');
    END IF;
END $$;

-- Apply sync metadata to intelligence_signals table (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'intelligence_signals' AND table_schema = 'public') THEN
        PERFORM add_sync_metadata_columns('intelligence_signals');
    END IF;
END $$;

-- Apply sync metadata to dossier_relationships table (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'dossier_relationships' AND table_schema = 'public') THEN
        PERFORM add_sync_metadata_columns('dossier_relationships');
    END IF;
END $$;

-- Apply sync metadata to position_dossier_links table (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'position_dossier_links' AND table_schema = 'public') THEN
        PERFORM add_sync_metadata_columns('position_dossier_links');
    END IF;
END $$;

-- Create a view to monitor sync status across all tables
CREATE OR REPLACE VIEW public.sync_status_overview AS
WITH sync_tables AS (
    SELECT
        'intake_tickets' as table_name,
        COUNT(*) FILTER (WHERE _status = 'synced') as synced_count,
        COUNT(*) FILTER (WHERE _status = 'pending') as pending_count,
        COUNT(*) FILTER (WHERE _status = 'conflict') as conflict_count,
        MAX(_last_synced_at) as last_sync
    FROM public.intake_tickets
    WHERE EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'intake_tickets'
        AND column_name = '_status'
    )

    UNION ALL

    SELECT
        'dossiers' as table_name,
        COUNT(*) FILTER (WHERE _status = 'synced') as synced_count,
        COUNT(*) FILTER (WHERE _status = 'pending') as pending_count,
        COUNT(*) FILTER (WHERE _status = 'conflict') as conflict_count,
        MAX(_last_synced_at) as last_sync
    FROM public.dossiers
    WHERE EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'dossiers'
        AND column_name = '_status'
    )

    UNION ALL

    SELECT
        'countries' as table_name,
        COUNT(*) FILTER (WHERE _status = 'synced') as synced_count,
        COUNT(*) FILTER (WHERE _status = 'pending') as pending_count,
        COUNT(*) FILTER (WHERE _status = 'conflict') as conflict_count,
        MAX(_last_synced_at) as last_sync
    FROM public.countries
    WHERE EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'countries'
        AND column_name = '_status'
    )

    UNION ALL

    SELECT
        'organizations' as table_name,
        COUNT(*) FILTER (WHERE _status = 'synced') as synced_count,
        COUNT(*) FILTER (WHERE _status = 'pending') as pending_count,
        COUNT(*) FILTER (WHERE _status = 'conflict') as conflict_count,
        MAX(_last_synced_at) as last_sync
    FROM public.organizations
    WHERE EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'organizations'
        AND column_name = '_status'
    )

    UNION ALL

    SELECT
        'forums' as table_name,
        COUNT(*) FILTER (WHERE _status = 'synced') as synced_count,
        COUNT(*) FILTER (WHERE _status = 'pending') as pending_count,
        COUNT(*) FILTER (WHERE _status = 'conflict') as conflict_count,
        MAX(_last_synced_at) as last_sync
    FROM public.forums
    WHERE EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'forums'
        AND column_name = '_status'
    )
)
SELECT * FROM sync_tables WHERE synced_count > 0 OR pending_count > 0 OR conflict_count > 0;

-- Add comments for documentation
COMMENT ON COLUMN public.intake_tickets._status IS 'Sync status: synced, pending, or conflict';
COMMENT ON COLUMN public.intake_tickets._version IS 'Version number for optimistic locking and conflict detection';
COMMENT ON COLUMN public.intake_tickets._last_synced_at IS 'Timestamp of last successful sync with server';
COMMENT ON COLUMN public.intake_tickets._sync_id IS 'UUID identifying the sync operation';
COMMENT ON COLUMN public.intake_tickets._device_id IS 'Identifier of the device that made the change';

-- Grant permissions on the sync status view
GRANT SELECT ON public.sync_status_overview TO authenticated;

-- Function to mark records as synced
CREATE OR REPLACE FUNCTION public.mark_as_synced(
    table_name text,
    record_ids uuid[],
    sync_id uuid DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    affected_rows INTEGER;
BEGIN
    EXECUTE format('
        UPDATE %I
        SET
            _status = ''synced'',
            _last_synced_at = NOW(),
            _sync_id = $1
        WHERE id = ANY($2)
        AND _status != ''synced''
    ', table_name)
    USING sync_id, record_ids;

    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    RETURN affected_rows;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get pending changes for sync
CREATE OR REPLACE FUNCTION public.get_pending_changes(
    table_name text,
    user_id uuid DEFAULT NULL,
    device_id text DEFAULT NULL,
    limit_rows integer DEFAULT 100
)
RETURNS TABLE (
    id uuid,
    _status text,
    _version integer,
    _device_id text,
    updated_at timestamptz
) AS $$
BEGIN
    RETURN QUERY EXECUTE format('
        SELECT
            id,
            _status,
            _version,
            _device_id,
            updated_at
        FROM %I
        WHERE _status IN (''pending'', ''conflict'')
        %s
        %s
        ORDER BY updated_at ASC
        LIMIT $1
    ',
    table_name,
    CASE WHEN user_id IS NOT NULL THEN 'AND (user_id = $2 OR created_by = $2)' ELSE '' END,
    CASE WHEN device_id IS NOT NULL THEN 'AND _device_id = $3' ELSE '' END
    )
    USING limit_rows, user_id, device_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================================
-- Rollback Script (commented out for safety)
-- =====================================================================================
-- DROP FUNCTION IF EXISTS add_sync_metadata_columns(text);
-- DROP FUNCTION IF EXISTS public.mark_as_synced(text, uuid[], uuid);
-- DROP FUNCTION IF EXISTS public.get_pending_changes(text, uuid, text, integer);
-- DROP VIEW IF EXISTS public.sync_status_overview;
--
-- ALTER TABLE public.intake_tickets DROP COLUMN IF EXISTS _status;
-- ALTER TABLE public.intake_tickets DROP COLUMN IF EXISTS _version;
-- ALTER TABLE public.intake_tickets DROP COLUMN IF EXISTS _last_synced_at;
-- ALTER TABLE public.intake_tickets DROP COLUMN IF EXISTS _sync_id;
-- ALTER TABLE public.intake_tickets DROP COLUMN IF EXISTS _device_id;
--
-- -- Repeat for all other tables...