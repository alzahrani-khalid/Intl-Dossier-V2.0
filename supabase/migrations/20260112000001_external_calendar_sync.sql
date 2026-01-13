-- Migration: External Calendar Sync
-- Description: Two-way sync with external calendar systems (Google Calendar, Outlook, Exchange)
-- Created: 2026-01-12

-- ============================================================================
-- ENUMS
-- ============================================================================

-- External calendar provider types
CREATE TYPE external_calendar_provider AS ENUM (
    'google_calendar',
    'outlook',
    'exchange',
    'ical_feed'
);

-- Sync status for calendar connections
CREATE TYPE calendar_sync_status AS ENUM (
    'pending',
    'active',
    'paused',
    'error',
    'disconnected'
);

-- Sync direction
CREATE TYPE sync_direction AS ENUM (
    'import_only',      -- Only import external events
    'export_only',      -- Only export internal events
    'two_way'           -- Full bidirectional sync
);

-- Event sync state
CREATE TYPE event_sync_state AS ENUM (
    'synced',
    'pending_push',
    'pending_pull',
    'conflict',
    'error'
);

-- Conflict resolution strategy
CREATE TYPE sync_conflict_strategy AS ENUM (
    'internal_wins',    -- Internal event takes precedence
    'external_wins',    -- External event takes precedence
    'newest_wins',      -- Most recently updated wins
    'manual'            -- User must resolve manually
);

-- ============================================================================
-- TABLES
-- ============================================================================

-- User's connected external calendar accounts
CREATE TABLE IF NOT EXISTS external_calendar_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Provider details
    provider external_calendar_provider NOT NULL,
    provider_account_id TEXT,           -- External account identifier
    provider_email TEXT,                -- Email associated with external account
    provider_name TEXT,                 -- Display name from provider

    -- OAuth tokens (encrypted in production)
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMPTZ,

    -- Sync configuration
    sync_direction sync_direction NOT NULL DEFAULT 'two_way',
    sync_status calendar_sync_status NOT NULL DEFAULT 'pending',
    conflict_strategy sync_conflict_strategy NOT NULL DEFAULT 'newest_wins',

    -- Sync state
    last_sync_at TIMESTAMPTZ,
    last_sync_error TEXT,
    sync_cursor TEXT,                   -- Provider-specific sync token/cursor

    -- Settings
    sync_enabled BOOLEAN NOT NULL DEFAULT true,
    auto_sync_interval_minutes INTEGER DEFAULT 15,
    sync_past_days INTEGER DEFAULT 30,  -- How far back to sync
    sync_future_days INTEGER DEFAULT 90, -- How far ahead to sync

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Unique constraint: one connection per provider per user
    UNIQUE(user_id, provider, provider_account_id)
);

-- External calendars available for sync
CREATE TABLE IF NOT EXISTS external_calendars (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    connection_id UUID NOT NULL REFERENCES external_calendar_connections(id) ON DELETE CASCADE,

    -- Calendar identifiers
    external_calendar_id TEXT NOT NULL, -- Provider's calendar ID
    name TEXT NOT NULL,
    description TEXT,
    color TEXT,                         -- Calendar color from provider
    timezone TEXT DEFAULT 'UTC',

    -- Sync settings
    sync_enabled BOOLEAN NOT NULL DEFAULT true,
    import_events BOOLEAN NOT NULL DEFAULT true,
    export_events BOOLEAN NOT NULL DEFAULT false,

    -- Access level
    is_primary BOOLEAN DEFAULT false,
    is_owner BOOLEAN DEFAULT false,
    access_role TEXT,                   -- owner, writer, reader

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE(connection_id, external_calendar_id)
);

-- Mapping between internal and external events
CREATE TABLE IF NOT EXISTS calendar_event_sync_mapping (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Internal event reference
    internal_event_id UUID REFERENCES calendar_events(id) ON DELETE CASCADE,
    internal_series_id UUID REFERENCES event_series(id) ON DELETE CASCADE,

    -- External event reference
    external_calendar_id UUID NOT NULL REFERENCES external_calendars(id) ON DELETE CASCADE,
    external_event_id TEXT NOT NULL,
    external_recurring_event_id TEXT,   -- For recurring events

    -- Sync state
    sync_state event_sync_state NOT NULL DEFAULT 'synced',
    last_synced_at TIMESTAMPTZ,
    last_external_update TIMESTAMPTZ,
    last_internal_update TIMESTAMPTZ,

    -- Version tracking for conflict detection
    external_etag TEXT,                 -- Provider's version identifier
    internal_version INTEGER DEFAULT 1,

    -- Error tracking
    last_error TEXT,
    error_count INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Ensure either internal_event_id or internal_series_id is set
    CONSTRAINT mapping_has_internal_ref CHECK (
        internal_event_id IS NOT NULL OR internal_series_id IS NOT NULL
    ),

    UNIQUE(external_calendar_id, external_event_id)
);

-- Sync history log
CREATE TABLE IF NOT EXISTS calendar_sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    connection_id UUID NOT NULL REFERENCES external_calendar_connections(id) ON DELETE CASCADE,

    -- Sync details
    sync_started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    sync_completed_at TIMESTAMPTZ,
    sync_type TEXT NOT NULL,            -- 'full', 'incremental', 'manual'
    direction sync_direction NOT NULL,

    -- Results
    events_imported INTEGER DEFAULT 0,
    events_exported INTEGER DEFAULT 0,
    events_updated INTEGER DEFAULT 0,
    events_deleted INTEGER DEFAULT 0,
    conflicts_detected INTEGER DEFAULT 0,
    conflicts_resolved INTEGER DEFAULT 0,
    errors INTEGER DEFAULT 0,

    -- Error details
    error_message TEXT,
    error_details JSONB,

    -- Status
    status TEXT NOT NULL DEFAULT 'in_progress' -- 'in_progress', 'completed', 'failed'
);

-- Sync conflicts requiring resolution
CREATE TABLE IF NOT EXISTS calendar_sync_conflicts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mapping_id UUID NOT NULL REFERENCES calendar_event_sync_mapping(id) ON DELETE CASCADE,

    -- Conflict details
    detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    conflict_type TEXT NOT NULL,        -- 'update_conflict', 'delete_conflict', 'create_conflict'

    -- Snapshots for comparison
    internal_snapshot JSONB NOT NULL,
    external_snapshot JSONB NOT NULL,

    -- Differences
    conflicting_fields TEXT[] NOT NULL,

    -- Resolution
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES auth.users(id),
    resolution TEXT,                    -- 'internal_kept', 'external_kept', 'merged', 'ignored'

    -- Status
    status TEXT NOT NULL DEFAULT 'pending' -- 'pending', 'resolved', 'ignored'
);

-- iCal feed subscriptions (for read-only feeds)
CREATE TABLE IF NOT EXISTS ical_feed_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Feed details
    feed_url TEXT NOT NULL,
    feed_name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#3B82F6',

    -- Sync settings
    sync_enabled BOOLEAN NOT NULL DEFAULT true,
    refresh_interval_minutes INTEGER DEFAULT 60,
    last_refresh_at TIMESTAMPTZ,
    last_refresh_error TEXT,

    -- Content hash for change detection
    content_hash TEXT,

    -- Statistics
    event_count INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Events from iCal feeds (stored separately to track source)
CREATE TABLE IF NOT EXISTS ical_feed_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NOT NULL REFERENCES ical_feed_subscriptions(id) ON DELETE CASCADE,

    -- Event identifiers
    ical_uid TEXT NOT NULL,
    sequence INTEGER DEFAULT 0,

    -- Event data
    title TEXT NOT NULL,
    description TEXT,
    location TEXT,

    -- Timing
    start_datetime TIMESTAMPTZ NOT NULL,
    end_datetime TIMESTAMPTZ,
    is_all_day BOOLEAN DEFAULT false,
    timezone TEXT DEFAULT 'UTC',

    -- Recurrence
    rrule TEXT,                         -- Raw RRULE string
    recurrence_id TEXT,                 -- For exceptions

    -- Status
    status TEXT DEFAULT 'confirmed',    -- confirmed, tentative, cancelled

    -- Organizer
    organizer_email TEXT,
    organizer_name TEXT,

    -- Raw data
    raw_ical TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE(subscription_id, ical_uid, COALESCE(recurrence_id, ''))
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- External calendar connections
CREATE INDEX idx_external_calendar_connections_user ON external_calendar_connections(user_id);
CREATE INDEX idx_external_calendar_connections_status ON external_calendar_connections(sync_status);
CREATE INDEX idx_external_calendar_connections_provider ON external_calendar_connections(provider);

-- External calendars
CREATE INDEX idx_external_calendars_connection ON external_calendars(connection_id);
CREATE INDEX idx_external_calendars_sync_enabled ON external_calendars(sync_enabled) WHERE sync_enabled = true;

-- Event sync mapping
CREATE INDEX idx_calendar_event_sync_mapping_internal ON calendar_event_sync_mapping(internal_event_id);
CREATE INDEX idx_calendar_event_sync_mapping_series ON calendar_event_sync_mapping(internal_series_id);
CREATE INDEX idx_calendar_event_sync_mapping_external ON calendar_event_sync_mapping(external_calendar_id);
CREATE INDEX idx_calendar_event_sync_mapping_state ON calendar_event_sync_mapping(sync_state);

-- Sync logs
CREATE INDEX idx_calendar_sync_logs_connection ON calendar_sync_logs(connection_id);
CREATE INDEX idx_calendar_sync_logs_started ON calendar_sync_logs(sync_started_at DESC);

-- Sync conflicts
CREATE INDEX idx_calendar_sync_conflicts_mapping ON calendar_sync_conflicts(mapping_id);
CREATE INDEX idx_calendar_sync_conflicts_status ON calendar_sync_conflicts(status) WHERE status = 'pending';

-- iCal subscriptions
CREATE INDEX idx_ical_feed_subscriptions_user ON ical_feed_subscriptions(user_id);
CREATE INDEX idx_ical_feed_events_subscription ON ical_feed_events(subscription_id);
CREATE INDEX idx_ical_feed_events_datetime ON ical_feed_events(start_datetime, end_datetime);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to get all calendar events for a user (internal + external)
CREATE OR REPLACE FUNCTION get_unified_calendar_events(
    p_user_id UUID,
    p_start_date TIMESTAMPTZ,
    p_end_date TIMESTAMPTZ
)
RETURNS TABLE (
    id UUID,
    source TEXT,
    source_id UUID,
    title TEXT,
    description TEXT,
    start_datetime TIMESTAMPTZ,
    end_datetime TIMESTAMPTZ,
    is_all_day BOOLEAN,
    location TEXT,
    status TEXT,
    calendar_name TEXT,
    calendar_color TEXT,
    is_synced BOOLEAN,
    can_edit BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    -- Internal calendar events
    SELECT
        ce.id,
        'internal'::TEXT as source,
        ce.id as source_id,
        COALESCE(ce.title_en, ce.title_ar) as title,
        COALESCE(ce.description_en, ce.description_ar) as description,
        ce.start_datetime,
        ce.end_datetime,
        false as is_all_day,
        COALESCE(ce.location_en, ce.location_ar) as location,
        ce.status::TEXT,
        'Internal Calendar'::TEXT as calendar_name,
        '#3B82F6'::TEXT as calendar_color,
        EXISTS(SELECT 1 FROM calendar_event_sync_mapping m WHERE m.internal_event_id = ce.id) as is_synced,
        true as can_edit
    FROM calendar_events ce
    WHERE ce.start_datetime >= p_start_date
    AND ce.start_datetime <= p_end_date

    UNION ALL

    -- iCal feed events
    SELECT
        ife.id,
        'ical_feed'::TEXT as source,
        ife.subscription_id as source_id,
        ife.title,
        ife.description,
        ife.start_datetime,
        ife.end_datetime,
        ife.is_all_day,
        ife.location,
        ife.status,
        ifs.feed_name as calendar_name,
        ifs.color as calendar_color,
        false as is_synced,
        false as can_edit
    FROM ical_feed_events ife
    JOIN ical_feed_subscriptions ifs ON ifs.id = ife.subscription_id
    WHERE ifs.user_id = p_user_id
    AND ifs.sync_enabled = true
    AND ife.start_datetime >= p_start_date
    AND ife.start_datetime <= p_end_date

    ORDER BY start_datetime;
END;
$$;

-- Function to check for sync conflicts
CREATE OR REPLACE FUNCTION check_sync_conflicts(
    p_mapping_id UUID,
    p_external_data JSONB
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    v_mapping calendar_event_sync_mapping%ROWTYPE;
    v_internal_event calendar_events%ROWTYPE;
BEGIN
    -- Get the mapping
    SELECT * INTO v_mapping FROM calendar_event_sync_mapping WHERE id = p_mapping_id;

    IF v_mapping.internal_event_id IS NULL THEN
        RETURN false;
    END IF;

    -- Get internal event
    SELECT * INTO v_internal_event FROM calendar_events WHERE id = v_mapping.internal_event_id;

    -- Check if both have been modified since last sync
    IF v_mapping.last_synced_at IS NOT NULL
       AND v_internal_event.updated_at > v_mapping.last_synced_at
       AND (p_external_data->>'updated_at')::TIMESTAMPTZ > v_mapping.last_synced_at THEN
        RETURN true;
    END IF;

    RETURN false;
END;
$$;

-- Function to update sync status
CREATE OR REPLACE FUNCTION update_connection_sync_status(
    p_connection_id UUID,
    p_status calendar_sync_status,
    p_error TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE external_calendar_connections
    SET
        sync_status = p_status,
        last_sync_at = CASE WHEN p_status = 'active' THEN now() ELSE last_sync_at END,
        last_sync_error = p_error,
        updated_at = now()
    WHERE id = p_connection_id;
END;
$$;

-- Function to get pending sync items
CREATE OR REPLACE FUNCTION get_pending_sync_items(
    p_connection_id UUID,
    p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
    mapping_id UUID,
    internal_event_id UUID,
    external_event_id TEXT,
    sync_state event_sync_state,
    action TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        m.id as mapping_id,
        m.internal_event_id,
        m.external_event_id,
        m.sync_state,
        CASE
            WHEN m.sync_state = 'pending_push' THEN 'push'
            WHEN m.sync_state = 'pending_pull' THEN 'pull'
            WHEN m.sync_state = 'conflict' THEN 'resolve'
            ELSE 'skip'
        END as action
    FROM calendar_event_sync_mapping m
    JOIN external_calendars ec ON ec.id = m.external_calendar_id
    WHERE ec.connection_id = p_connection_id
    AND m.sync_state IN ('pending_push', 'pending_pull', 'conflict')
    ORDER BY m.updated_at ASC
    LIMIT p_limit;
END;
$$;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger to mark events for sync when modified
CREATE OR REPLACE FUNCTION mark_event_for_sync()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Mark all mappings for this event as pending push
    UPDATE calendar_event_sync_mapping
    SET
        sync_state = 'pending_push',
        last_internal_update = now(),
        internal_version = internal_version + 1,
        updated_at = now()
    WHERE internal_event_id = NEW.id
    AND sync_state = 'synced';

    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_mark_event_for_sync
    AFTER UPDATE ON calendar_events
    FOR EACH ROW
    WHEN (OLD.* IS DISTINCT FROM NEW.*)
    EXECUTE FUNCTION mark_event_for_sync();

-- Trigger to update timestamps
CREATE OR REPLACE FUNCTION update_calendar_sync_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_external_calendar_connections_timestamp
    BEFORE UPDATE ON external_calendar_connections
    FOR EACH ROW
    EXECUTE FUNCTION update_calendar_sync_timestamp();

CREATE TRIGGER trigger_update_external_calendars_timestamp
    BEFORE UPDATE ON external_calendars
    FOR EACH ROW
    EXECUTE FUNCTION update_calendar_sync_timestamp();

CREATE TRIGGER trigger_update_calendar_event_sync_mapping_timestamp
    BEFORE UPDATE ON calendar_event_sync_mapping
    FOR EACH ROW
    EXECUTE FUNCTION update_calendar_sync_timestamp();

CREATE TRIGGER trigger_update_ical_feed_subscriptions_timestamp
    BEFORE UPDATE ON ical_feed_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_calendar_sync_timestamp();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE external_calendar_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_calendars ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_event_sync_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_sync_conflicts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ical_feed_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ical_feed_events ENABLE ROW LEVEL SECURITY;

-- External calendar connections policies
CREATE POLICY "Users can view own connections"
    ON external_calendar_connections FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can create own connections"
    ON external_calendar_connections FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own connections"
    ON external_calendar_connections FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can delete own connections"
    ON external_calendar_connections FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- External calendars policies
CREATE POLICY "Users can view own external calendars"
    ON external_calendars FOR SELECT
    TO authenticated
    USING (
        connection_id IN (
            SELECT id FROM external_calendar_connections WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage own external calendars"
    ON external_calendars FOR ALL
    TO authenticated
    USING (
        connection_id IN (
            SELECT id FROM external_calendar_connections WHERE user_id = auth.uid()
        )
    );

-- Sync mapping policies
CREATE POLICY "Users can view own sync mappings"
    ON calendar_event_sync_mapping FOR SELECT
    TO authenticated
    USING (
        external_calendar_id IN (
            SELECT ec.id FROM external_calendars ec
            JOIN external_calendar_connections ecc ON ecc.id = ec.connection_id
            WHERE ecc.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage own sync mappings"
    ON calendar_event_sync_mapping FOR ALL
    TO authenticated
    USING (
        external_calendar_id IN (
            SELECT ec.id FROM external_calendars ec
            JOIN external_calendar_connections ecc ON ecc.id = ec.connection_id
            WHERE ecc.user_id = auth.uid()
        )
    );

-- Sync logs policies
CREATE POLICY "Users can view own sync logs"
    ON calendar_sync_logs FOR SELECT
    TO authenticated
    USING (
        connection_id IN (
            SELECT id FROM external_calendar_connections WHERE user_id = auth.uid()
        )
    );

-- Sync conflicts policies
CREATE POLICY "Users can view own sync conflicts"
    ON calendar_sync_conflicts FOR SELECT
    TO authenticated
    USING (
        mapping_id IN (
            SELECT m.id FROM calendar_event_sync_mapping m
            JOIN external_calendars ec ON ec.id = m.external_calendar_id
            JOIN external_calendar_connections ecc ON ecc.id = ec.connection_id
            WHERE ecc.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can resolve own sync conflicts"
    ON calendar_sync_conflicts FOR UPDATE
    TO authenticated
    USING (
        mapping_id IN (
            SELECT m.id FROM calendar_event_sync_mapping m
            JOIN external_calendars ec ON ec.id = m.external_calendar_id
            JOIN external_calendar_connections ecc ON ecc.id = ec.connection_id
            WHERE ecc.user_id = auth.uid()
        )
    );

-- iCal feed subscriptions policies
CREATE POLICY "Users can view own ical subscriptions"
    ON ical_feed_subscriptions FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can manage own ical subscriptions"
    ON ical_feed_subscriptions FOR ALL
    TO authenticated
    USING (user_id = auth.uid());

-- iCal feed events policies
CREATE POLICY "Users can view own ical events"
    ON ical_feed_events FOR SELECT
    TO authenticated
    USING (
        subscription_id IN (
            SELECT id FROM ical_feed_subscriptions WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "System can manage ical events"
    ON ical_feed_events FOR ALL
    TO authenticated
    USING (
        subscription_id IN (
            SELECT id FROM ical_feed_subscriptions WHERE user_id = auth.uid()
        )
    );

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE external_calendar_connections IS 'User connections to external calendar providers (Google, Outlook, Exchange)';
COMMENT ON TABLE external_calendars IS 'Individual calendars from connected external accounts';
COMMENT ON TABLE calendar_event_sync_mapping IS 'Maps internal events to their external counterparts';
COMMENT ON TABLE calendar_sync_logs IS 'History of sync operations';
COMMENT ON TABLE calendar_sync_conflicts IS 'Conflicts requiring user resolution';
COMMENT ON TABLE ical_feed_subscriptions IS 'Read-only iCal feed subscriptions';
COMMENT ON TABLE ical_feed_events IS 'Events imported from iCal feeds';
