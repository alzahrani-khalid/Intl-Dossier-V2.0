-- =====================================================================================
-- Migration: Create Composite Indexes for Sync Queries
-- Description: Creates optimized indexes for efficient sync operations and delta queries
-- Author: Database Architect
-- Date: 2025-10-12
-- =====================================================================================

-- Function to create sync indexes for a table
CREATE OR REPLACE FUNCTION create_sync_indexes(table_name text)
RETURNS void AS $$
DECLARE
    index_exists boolean;
BEGIN
    -- Check if updated_at column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = create_sync_indexes.table_name
        AND column_name = 'updated_at'
    ) INTO index_exists;

    IF NOT index_exists THEN
        RAISE NOTICE 'Table % does not have updated_at column, skipping some indexes', table_name;
        RETURN;
    END IF;

    -- Index 1: User-specific delta sync (user_id, updated_at)
    -- Check for user_id column
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = create_sync_indexes.table_name
        AND column_name = 'user_id'
    ) THEN
        EXECUTE format('
            CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_%s_user_sync
            ON public.%I (user_id, updated_at DESC)
            WHERE _status IS NOT NULL
        ', table_name, table_name);
        RAISE NOTICE 'Created user sync index for table: %', table_name;
    END IF;

    -- Alternative: Check for created_by column
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = create_sync_indexes.table_name
        AND column_name = 'created_by'
    ) THEN
        EXECUTE format('
            CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_%s_created_by_sync
            ON public.%I (created_by, updated_at DESC)
            WHERE _status IS NOT NULL
        ', table_name, table_name);
        RAISE NOTICE 'Created created_by sync index for table: %', table_name;
    END IF;

    -- Index 2: Pending changes index (_status, updated_at)
    EXECUTE format('
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_%s_pending_sync
        ON public.%I (_status, updated_at ASC)
        WHERE _status IN (''pending'', ''conflict'')
    ', table_name, table_name);

    -- Index 3: Version-based conflict detection (_version, updated_at)
    EXECUTE format('
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_%s_version_sync
        ON public.%I (_version, updated_at DESC)
        WHERE _status IS NOT NULL
    ', table_name, table_name);

    -- Index 4: Device-specific changes (_device_id, _status, updated_at)
    EXECUTE format('
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_%s_device_sync
        ON public.%I (_device_id, _status, updated_at DESC)
        WHERE _device_id IS NOT NULL
    ', table_name, table_name);

    -- Index 5: Last sync timestamp for incremental sync
    EXECUTE format('
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_%s_last_sync
        ON public.%I (_last_synced_at DESC NULLS LAST)
        WHERE _last_synced_at IS NOT NULL
    ', table_name, table_name);

    -- Index 6: Composite index for sync status monitoring
    EXECUTE format('
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_%s_sync_status
        ON public.%I (_status, _version, _last_synced_at)
    ', table_name, table_name);

    -- Index 7: Updated records since last sync
    EXECUTE format('
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_%s_recent_changes
        ON public.%I (updated_at DESC)
        WHERE updated_at > (NOW() - INTERVAL ''7 days'')
    ', table_name, table_name);

    RAISE NOTICE 'Created all sync indexes for table: %', table_name;
END;
$$ LANGUAGE plpgsql;

-- Create sync indexes for intake_tickets
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'intake_tickets'
        AND column_name = '_status'
    ) THEN
        PERFORM create_sync_indexes('intake_tickets');
    END IF;
END $$;

-- Create sync indexes for dossiers
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'dossiers'
        AND column_name = '_status'
    ) THEN
        PERFORM create_sync_indexes('dossiers');
    END IF;
END $$;

-- Create sync indexes for countries
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'countries'
        AND column_name = '_status'
    ) THEN
        PERFORM create_sync_indexes('countries');
    END IF;
END $$;

-- Create sync indexes for organizations
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'organizations'
        AND column_name = '_status'
    ) THEN
        PERFORM create_sync_indexes('organizations');
    END IF;
END $$;

-- Create sync indexes for forums
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'forums'
        AND column_name = '_status'
    ) THEN
        PERFORM create_sync_indexes('forums');
    END IF;
END $$;

-- Create sync indexes for assignments
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'assignments'
        AND column_name = '_status'
    ) THEN
        PERFORM create_sync_indexes('assignments');
    END IF;
END $$;

-- Create sync indexes for kanban_cards
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'kanban_cards'
        AND column_name = '_status'
    ) THEN
        PERFORM create_sync_indexes('kanban_cards');
    END IF;
END $$;

-- Create sync indexes for network_nodes
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'network_nodes'
        AND column_name = '_status'
    ) THEN
        PERFORM create_sync_indexes('network_nodes');
    END IF;
END $$;

-- Create sync indexes for network_edges
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'network_edges'
        AND column_name = '_status'
    ) THEN
        PERFORM create_sync_indexes('network_edges');
    END IF;
END $$;

-- Create sync indexes for users
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'users'
        AND column_name = '_status'
    ) THEN
        PERFORM create_sync_indexes('users');
    END IF;
END $$;

-- Create sync indexes for mous (if exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'mous'
        AND column_name = '_status'
    ) THEN
        PERFORM create_sync_indexes('mous');
    END IF;
END $$;

-- Create sync indexes for events (if exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'events'
        AND column_name = '_status'
    ) THEN
        PERFORM create_sync_indexes('events');
    END IF;
END $$;

-- Create sync indexes for calendar_entries (if exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'calendar_entries'
        AND column_name = '_status'
    ) THEN
        PERFORM create_sync_indexes('calendar_entries');
    END IF;
END $$;

-- Create sync indexes for documents (if exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'documents'
        AND column_name = '_status'
    ) THEN
        PERFORM create_sync_indexes('documents');
    END IF;
END $$;

-- Special indexes for high-frequency sync tables

-- Intake tickets: Additional index for status + priority
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_intake_tickets_sync_priority
ON public.intake_tickets (_status, priority, updated_at DESC)
WHERE _status IN ('pending', 'conflict')
AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'intake_tickets'
    AND column_name = '_status'
);

-- Dossiers: Additional index for type + status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_dossiers_sync_type
ON public.dossiers (_status, type, updated_at DESC)
WHERE _status IN ('pending', 'conflict')
AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'dossiers'
    AND column_name = '_status'
);

-- Create a materialized view for sync statistics (refreshed periodically)
CREATE MATERIALIZED VIEW IF NOT EXISTS public.sync_statistics AS
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
AND indexname LIKE '%sync%'
ORDER BY idx_scan DESC;

-- Create index on the materialized view
CREATE INDEX IF NOT EXISTS idx_sync_statistics_scans
ON public.sync_statistics (index_scans DESC);

-- Grant permissions
GRANT SELECT ON public.sync_statistics TO authenticated;

-- Function to refresh sync statistics
CREATE OR REPLACE FUNCTION public.refresh_sync_statistics()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.sync_statistics;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Optional: Schedule periodic refresh using pg_cron
-- SELECT cron.schedule('refresh-sync-stats', '0 */6 * * *', 'SELECT public.refresh_sync_statistics();');

-- Function to analyze index usage for optimization
CREATE OR REPLACE FUNCTION public.analyze_sync_index_usage()
RETURNS TABLE (
    table_name text,
    index_name text,
    index_size text,
    index_scans bigint,
    avg_tuples_per_scan numeric,
    recommendation text
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        tablename::text,
        indexname::text,
        pg_size_pretty(pg_relation_size(indexrelid))::text,
        idx_scan,
        CASE
            WHEN idx_scan > 0 THEN ROUND(idx_tup_fetch::numeric / idx_scan, 2)
            ELSE 0
        END,
        CASE
            WHEN idx_scan = 0 THEN 'Consider removing - never used'
            WHEN idx_scan < 100 THEN 'Low usage - monitor'
            WHEN idx_tup_fetch::numeric / NULLIF(idx_scan, 0) > 1000 THEN 'High rows per scan - may need optimization'
            ELSE 'Good performance'
        END::text
    FROM pg_stat_user_indexes
    WHERE schemaname = 'public'
    AND indexname LIKE '%sync%'
    ORDER BY idx_scan DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments for documentation
COMMENT ON FUNCTION create_sync_indexes(text) IS 'Creates all necessary indexes for efficient sync operations on a table';
COMMENT ON MATERIALIZED VIEW public.sync_statistics IS 'Statistics for sync-related indexes to monitor performance';
COMMENT ON FUNCTION public.analyze_sync_index_usage() IS 'Analyzes sync index usage and provides optimization recommendations';

-- =====================================================================================
-- Rollback Script (commented out for safety)
-- =====================================================================================
-- DROP FUNCTION IF EXISTS create_sync_indexes(text);
-- DROP FUNCTION IF EXISTS public.refresh_sync_statistics();
-- DROP FUNCTION IF EXISTS public.analyze_sync_index_usage();
-- DROP MATERIALIZED VIEW IF EXISTS public.sync_statistics;
--
-- DROP INDEX IF EXISTS idx_intake_tickets_user_sync;
-- DROP INDEX IF EXISTS idx_intake_tickets_created_by_sync;
-- DROP INDEX IF EXISTS idx_intake_tickets_pending_sync;
-- DROP INDEX IF EXISTS idx_intake_tickets_version_sync;
-- DROP INDEX IF EXISTS idx_intake_tickets_device_sync;
-- DROP INDEX IF EXISTS idx_intake_tickets_last_sync;
-- DROP INDEX IF EXISTS idx_intake_tickets_sync_status;
-- DROP INDEX IF EXISTS idx_intake_tickets_recent_changes;
-- DROP INDEX IF EXISTS idx_intake_tickets_sync_priority;
--
-- -- Repeat for all other tables...