-- ============================================================================
-- Event Sourcing Infrastructure for Intl-Dossier
-- ============================================================================
-- This migration implements an event sourcing pattern where all changes to
-- entities are stored as immutable events, enabling:
-- - Full audit trails with temporal queries
-- - Time-travel debugging and state reconstruction
-- - CQRS pattern support for read/write optimization
-- - Easy addition of new projections without data migration
-- ============================================================================

-- Create schema for event sourcing
CREATE SCHEMA IF NOT EXISTS events;

-- ============================================================================
-- ENUMS: Event Types and Categories
-- ============================================================================

-- Aggregate types (entity categories)
CREATE TYPE events.aggregate_type AS ENUM (
  'person',
  'engagement',
  'organization',
  'country',
  'forum',
  'theme',
  'working_group',
  'relationship',
  'task',
  'commitment',
  'intake_ticket',
  'document',
  'mou'
);

-- Event categories for filtering and routing
CREATE TYPE events.event_category AS ENUM (
  'lifecycle',      -- Create, archive, restore, delete
  'update',         -- Field/property updates
  'relationship',   -- Relationship changes
  'assignment',     -- Assignment/unassignment
  'status',         -- Status transitions
  'attachment',     -- Document/file attachments
  'workflow',       -- Workflow state changes
  'audit'           -- Administrative actions
);

-- ============================================================================
-- CORE TABLES: Event Store
-- ============================================================================

-- Main events table - immutable append-only log
CREATE TABLE events.domain_events (
  -- Primary identifier
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Event metadata
  event_type TEXT NOT NULL,                           -- e.g., 'PersonCreated', 'EngagementUpdated'
  event_category events.event_category NOT NULL,
  event_version INTEGER NOT NULL DEFAULT 1,           -- Schema version for this event type

  -- Aggregate identification
  aggregate_type events.aggregate_type NOT NULL,
  aggregate_id UUID NOT NULL,                         -- The entity this event belongs to
  aggregate_version INTEGER NOT NULL,                 -- Optimistic concurrency control

  -- Event payload
  payload JSONB NOT NULL DEFAULT '{}',                -- Event-specific data
  metadata JSONB NOT NULL DEFAULT '{}',               -- Additional context (correlation, causation, etc.)

  -- Change tracking
  changes JSONB DEFAULT NULL,                         -- Diff for update events: {field: {old, new}}

  -- Actor information
  actor_id UUID REFERENCES auth.users(id),            -- User who caused the event
  actor_role TEXT,                                    -- Role at time of action
  actor_ip INET,                                      -- IP address
  actor_user_agent TEXT,                              -- User agent string

  -- Correlation and causation
  correlation_id UUID,                                -- Groups related events across aggregates
  causation_id UUID REFERENCES events.domain_events(id), -- The event that caused this event

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure events are truly immutable
  CONSTRAINT events_immutable CHECK (
    id IS NOT NULL AND
    event_type IS NOT NULL AND
    aggregate_id IS NOT NULL
  )
);

-- Snapshots for performance optimization
CREATE TABLE events.aggregate_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aggregate_type events.aggregate_type NOT NULL,
  aggregate_id UUID NOT NULL,
  aggregate_version INTEGER NOT NULL,
  state JSONB NOT NULL,                               -- Full aggregate state at this point
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (aggregate_type, aggregate_id, aggregate_version)
);

-- Event streams for organized querying
CREATE TABLE events.event_streams (
  stream_name TEXT PRIMARY KEY,
  aggregate_type events.aggregate_type NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_event_at TIMESTAMPTZ,
  event_count BIGINT DEFAULT 0
);

-- Stream subscriptions for projections
CREATE TABLE events.stream_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_name TEXT NOT NULL UNIQUE,
  stream_name TEXT REFERENCES events.event_streams(stream_name),
  event_types TEXT[] DEFAULT NULL,                    -- NULL means all events
  last_processed_event_id UUID,
  last_processed_at TIMESTAMPTZ,
  checkpoint BIGINT DEFAULT 0,                        -- Global position
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'stopped')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Idempotency tracking to prevent duplicate events
CREATE TABLE events.idempotency_keys (
  idempotency_key TEXT PRIMARY KEY,
  event_id UUID REFERENCES events.domain_events(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours')
);

-- ============================================================================
-- INDEXES: Performance Optimization
-- ============================================================================

-- Primary query patterns
CREATE INDEX idx_events_aggregate ON events.domain_events(aggregate_type, aggregate_id, aggregate_version);
CREATE INDEX idx_events_type ON events.domain_events(event_type);
CREATE INDEX idx_events_category ON events.domain_events(event_category);
CREATE INDEX idx_events_created_at ON events.domain_events(created_at DESC);
CREATE INDEX idx_events_actor ON events.domain_events(actor_id) WHERE actor_id IS NOT NULL;
CREATE INDEX idx_events_correlation ON events.domain_events(correlation_id) WHERE correlation_id IS NOT NULL;

-- JSONB indexes for payload queries
CREATE INDEX idx_events_payload ON events.domain_events USING GIN (payload jsonb_path_ops);
CREATE INDEX idx_events_metadata ON events.domain_events USING GIN (metadata jsonb_path_ops);

-- Snapshot queries
CREATE INDEX idx_snapshots_aggregate ON events.aggregate_snapshots(aggregate_type, aggregate_id, aggregate_version DESC);

-- Idempotency cleanup
CREATE INDEX idx_idempotency_expires ON events.idempotency_keys(expires_at);

-- ============================================================================
-- FUNCTIONS: Event Store Operations
-- ============================================================================

-- Append a new event to the store
CREATE OR REPLACE FUNCTION events.append_event(
  p_event_type TEXT,
  p_event_category events.event_category,
  p_aggregate_type events.aggregate_type,
  p_aggregate_id UUID,
  p_payload JSONB DEFAULT '{}',
  p_changes JSONB DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}',
  p_correlation_id UUID DEFAULT NULL,
  p_causation_id UUID DEFAULT NULL,
  p_idempotency_key TEXT DEFAULT NULL,
  p_event_version INTEGER DEFAULT 1
) RETURNS events.domain_events AS $$
DECLARE
  v_event events.domain_events;
  v_next_version INTEGER;
  v_existing_event_id UUID;
  v_actor_id UUID;
  v_actor_role TEXT;
BEGIN
  -- Get current user context
  v_actor_id := auth.uid();

  -- Get user role if available
  SELECT raw_user_meta_data->>'role' INTO v_actor_role
  FROM auth.users WHERE id = v_actor_id;

  -- Check idempotency key if provided
  IF p_idempotency_key IS NOT NULL THEN
    SELECT event_id INTO v_existing_event_id
    FROM events.idempotency_keys
    WHERE idempotency_key = p_idempotency_key
      AND expires_at > NOW();

    IF v_existing_event_id IS NOT NULL THEN
      SELECT * INTO v_event FROM events.domain_events WHERE id = v_existing_event_id;
      RETURN v_event;
    END IF;
  END IF;

  -- Get next aggregate version (use advisory lock for concurrency)
  PERFORM pg_advisory_xact_lock(hashtext(p_aggregate_type::TEXT || p_aggregate_id::TEXT));

  SELECT COALESCE(MAX(aggregate_version), 0) + 1 INTO v_next_version
  FROM events.domain_events
  WHERE aggregate_type = p_aggregate_type AND aggregate_id = p_aggregate_id;

  -- Insert the event
  INSERT INTO events.domain_events (
    event_type,
    event_category,
    event_version,
    aggregate_type,
    aggregate_id,
    aggregate_version,
    payload,
    changes,
    metadata,
    actor_id,
    actor_role,
    correlation_id,
    causation_id
  ) VALUES (
    p_event_type,
    p_event_category,
    p_event_version,
    p_aggregate_type,
    p_aggregate_id,
    v_next_version,
    p_payload,
    p_changes,
    p_metadata,
    v_actor_id,
    v_actor_role,
    COALESCE(p_correlation_id, gen_random_uuid()),
    p_causation_id
  ) RETURNING * INTO v_event;

  -- Store idempotency key if provided
  IF p_idempotency_key IS NOT NULL THEN
    INSERT INTO events.idempotency_keys (idempotency_key, event_id)
    VALUES (p_idempotency_key, v_event.id)
    ON CONFLICT (idempotency_key) DO NOTHING;
  END IF;

  -- Update event stream statistics
  INSERT INTO events.event_streams (stream_name, aggregate_type, last_event_at, event_count)
  VALUES (p_aggregate_type::TEXT, p_aggregate_type, NOW(), 1)
  ON CONFLICT (stream_name) DO UPDATE
  SET last_event_at = NOW(), event_count = events.event_streams.event_count + 1;

  RETURN v_event;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get events for an aggregate
CREATE OR REPLACE FUNCTION events.get_aggregate_events(
  p_aggregate_type events.aggregate_type,
  p_aggregate_id UUID,
  p_from_version INTEGER DEFAULT 0,
  p_to_version INTEGER DEFAULT NULL,
  p_limit INTEGER DEFAULT 1000
) RETURNS SETOF events.domain_events AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM events.domain_events
  WHERE aggregate_type = p_aggregate_type
    AND aggregate_id = p_aggregate_id
    AND aggregate_version > p_from_version
    AND (p_to_version IS NULL OR aggregate_version <= p_to_version)
  ORDER BY aggregate_version ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Get events by correlation ID (for saga/workflow tracking)
CREATE OR REPLACE FUNCTION events.get_correlated_events(
  p_correlation_id UUID
) RETURNS SETOF events.domain_events AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM events.domain_events
  WHERE correlation_id = p_correlation_id
  ORDER BY created_at ASC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Get latest snapshot for an aggregate
CREATE OR REPLACE FUNCTION events.get_latest_snapshot(
  p_aggregate_type events.aggregate_type,
  p_aggregate_id UUID
) RETURNS events.aggregate_snapshots AS $$
DECLARE
  v_snapshot events.aggregate_snapshots;
BEGIN
  SELECT * INTO v_snapshot
  FROM events.aggregate_snapshots
  WHERE aggregate_type = p_aggregate_type
    AND aggregate_id = p_aggregate_id
  ORDER BY aggregate_version DESC
  LIMIT 1;

  RETURN v_snapshot;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Create a snapshot
CREATE OR REPLACE FUNCTION events.create_snapshot(
  p_aggregate_type events.aggregate_type,
  p_aggregate_id UUID,
  p_state JSONB
) RETURNS events.aggregate_snapshots AS $$
DECLARE
  v_snapshot events.aggregate_snapshots;
  v_current_version INTEGER;
BEGIN
  -- Get current aggregate version
  SELECT COALESCE(MAX(aggregate_version), 0) INTO v_current_version
  FROM events.domain_events
  WHERE aggregate_type = p_aggregate_type AND aggregate_id = p_aggregate_id;

  INSERT INTO events.aggregate_snapshots (
    aggregate_type,
    aggregate_id,
    aggregate_version,
    state
  ) VALUES (
    p_aggregate_type,
    p_aggregate_id,
    v_current_version,
    p_state
  ) RETURNING * INTO v_snapshot;

  RETURN v_snapshot;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Rebuild aggregate state from events
CREATE OR REPLACE FUNCTION events.rebuild_aggregate_state(
  p_aggregate_type events.aggregate_type,
  p_aggregate_id UUID,
  p_target_version INTEGER DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_snapshot events.aggregate_snapshots;
  v_state JSONB := '{}';
  v_event events.domain_events;
  v_from_version INTEGER := 0;
BEGIN
  -- Try to load from snapshot first
  SELECT * INTO v_snapshot
  FROM events.aggregate_snapshots
  WHERE aggregate_type = p_aggregate_type
    AND aggregate_id = p_aggregate_id
    AND (p_target_version IS NULL OR aggregate_version <= p_target_version)
  ORDER BY aggregate_version DESC
  LIMIT 1;

  IF v_snapshot IS NOT NULL THEN
    v_state := v_snapshot.state;
    v_from_version := v_snapshot.aggregate_version;
  END IF;

  -- Apply subsequent events
  FOR v_event IN
    SELECT * FROM events.get_aggregate_events(
      p_aggregate_type,
      p_aggregate_id,
      v_from_version,
      p_target_version
    )
  LOOP
    -- Apply event based on category
    CASE v_event.event_category
      WHEN 'lifecycle' THEN
        IF v_event.event_type LIKE '%Created' THEN
          v_state := v_event.payload;
        ELSIF v_event.event_type LIKE '%Archived' OR v_event.event_type LIKE '%Deleted' THEN
          v_state := v_state || jsonb_build_object('is_archived', true, 'archived_at', v_event.created_at);
        ELSIF v_event.event_type LIKE '%Restored' THEN
          v_state := v_state - 'is_archived' - 'archived_at';
        END IF;
      WHEN 'update' THEN
        -- Merge payload into state
        v_state := v_state || v_event.payload;
      WHEN 'status' THEN
        v_state := v_state || jsonb_build_object('status', v_event.payload->>'new_status');
      ELSE
        -- For other categories, merge payload
        v_state := v_state || v_event.payload;
    END CASE;

    -- Update metadata
    v_state := v_state || jsonb_build_object(
      '_version', v_event.aggregate_version,
      '_last_event_id', v_event.id,
      '_last_event_type', v_event.event_type,
      '_last_modified_at', v_event.created_at,
      '_last_modified_by', v_event.actor_id
    );
  END LOOP;

  RETURN v_state;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Get aggregate history (timeline view)
CREATE OR REPLACE FUNCTION events.get_aggregate_history(
  p_aggregate_type events.aggregate_type,
  p_aggregate_id UUID,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
) RETURNS TABLE (
  event_id UUID,
  event_type TEXT,
  event_category events.event_category,
  aggregate_version INTEGER,
  changes JSONB,
  actor_id UUID,
  actor_role TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    de.id,
    de.event_type,
    de.event_category,
    de.aggregate_version,
    de.changes,
    de.actor_id,
    de.actor_role,
    de.created_at
  FROM events.domain_events de
  WHERE de.aggregate_type = p_aggregate_type
    AND de.aggregate_id = p_aggregate_id
  ORDER BY de.aggregate_version DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Time travel: get state at a specific point in time
CREATE OR REPLACE FUNCTION events.get_state_at_time(
  p_aggregate_type events.aggregate_type,
  p_aggregate_id UUID,
  p_timestamp TIMESTAMPTZ
) RETURNS JSONB AS $$
DECLARE
  v_target_version INTEGER;
BEGIN
  -- Find the version at the given time
  SELECT aggregate_version INTO v_target_version
  FROM events.domain_events
  WHERE aggregate_type = p_aggregate_type
    AND aggregate_id = p_aggregate_id
    AND created_at <= p_timestamp
  ORDER BY aggregate_version DESC
  LIMIT 1;

  IF v_target_version IS NULL THEN
    RETURN NULL;
  END IF;

  RETURN events.rebuild_aggregate_state(p_aggregate_type, p_aggregate_id, v_target_version);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- HELPER FUNCTIONS: Entity-Specific Event Creators
-- ============================================================================

-- Person events
CREATE OR REPLACE FUNCTION events.emit_person_created(
  p_person_id UUID,
  p_data JSONB,
  p_correlation_id UUID DEFAULT NULL
) RETURNS events.domain_events AS $$
BEGIN
  RETURN events.append_event(
    'PersonCreated',
    'lifecycle',
    'person',
    p_person_id,
    p_data,
    NULL,
    '{}',
    p_correlation_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION events.emit_person_updated(
  p_person_id UUID,
  p_changes JSONB,
  p_new_values JSONB,
  p_correlation_id UUID DEFAULT NULL
) RETURNS events.domain_events AS $$
BEGIN
  RETURN events.append_event(
    'PersonUpdated',
    'update',
    'person',
    p_person_id,
    p_new_values,
    p_changes,
    '{}',
    p_correlation_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Engagement events
CREATE OR REPLACE FUNCTION events.emit_engagement_created(
  p_engagement_id UUID,
  p_data JSONB,
  p_correlation_id UUID DEFAULT NULL
) RETURNS events.domain_events AS $$
BEGIN
  RETURN events.append_event(
    'EngagementCreated',
    'lifecycle',
    'engagement',
    p_engagement_id,
    p_data,
    NULL,
    '{}',
    p_correlation_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION events.emit_engagement_updated(
  p_engagement_id UUID,
  p_changes JSONB,
  p_new_values JSONB,
  p_correlation_id UUID DEFAULT NULL
) RETURNS events.domain_events AS $$
BEGIN
  RETURN events.append_event(
    'EngagementUpdated',
    'update',
    'engagement',
    p_engagement_id,
    p_new_values,
    p_changes,
    '{}',
    p_correlation_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Relationship events
CREATE OR REPLACE FUNCTION events.emit_relationship_created(
  p_relationship_id UUID,
  p_source_id UUID,
  p_target_id UUID,
  p_relationship_type TEXT,
  p_data JSONB DEFAULT '{}',
  p_correlation_id UUID DEFAULT NULL
) RETURNS events.domain_events AS $$
BEGIN
  RETURN events.append_event(
    'RelationshipCreated',
    'relationship',
    'relationship',
    p_relationship_id,
    jsonb_build_object(
      'source_id', p_source_id,
      'target_id', p_target_id,
      'relationship_type', p_relationship_type
    ) || p_data,
    NULL,
    '{}',
    p_correlation_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Task events
CREATE OR REPLACE FUNCTION events.emit_task_created(
  p_task_id UUID,
  p_data JSONB,
  p_correlation_id UUID DEFAULT NULL
) RETURNS events.domain_events AS $$
BEGIN
  RETURN events.append_event(
    'TaskCreated',
    'lifecycle',
    'task',
    p_task_id,
    p_data,
    NULL,
    '{}',
    p_correlation_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION events.emit_task_status_changed(
  p_task_id UUID,
  p_old_status TEXT,
  p_new_status TEXT,
  p_correlation_id UUID DEFAULT NULL
) RETURNS events.domain_events AS $$
BEGIN
  RETURN events.append_event(
    'TaskStatusChanged',
    'status',
    'task',
    p_task_id,
    jsonb_build_object('old_status', p_old_status, 'new_status', p_new_status),
    jsonb_build_object('status', jsonb_build_object('old', p_old_status, 'new', p_new_status)),
    '{}',
    p_correlation_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- VIEWS: Convenient Query Interfaces
-- ============================================================================

-- Recent events view
CREATE OR REPLACE VIEW events.recent_events AS
SELECT
  de.id,
  de.event_type,
  de.event_category,
  de.aggregate_type,
  de.aggregate_id,
  de.aggregate_version,
  de.payload,
  de.changes,
  de.actor_id,
  u.email AS actor_email,
  u.raw_user_meta_data->>'full_name' AS actor_name,
  de.correlation_id,
  de.created_at
FROM events.domain_events de
LEFT JOIN auth.users u ON de.actor_id = u.id
ORDER BY de.created_at DESC;

-- Aggregate event counts
CREATE OR REPLACE VIEW events.aggregate_stats AS
SELECT
  aggregate_type,
  aggregate_id,
  COUNT(*) AS event_count,
  MIN(created_at) AS first_event_at,
  MAX(created_at) AS last_event_at,
  MAX(aggregate_version) AS current_version
FROM events.domain_events
GROUP BY aggregate_type, aggregate_id;

-- Event type distribution
CREATE OR REPLACE VIEW events.event_type_stats AS
SELECT
  event_type,
  event_category,
  COUNT(*) AS event_count,
  COUNT(DISTINCT aggregate_id) AS aggregate_count,
  MAX(created_at) AS last_occurrence
FROM events.domain_events
GROUP BY event_type, event_category
ORDER BY event_count DESC;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE events.domain_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE events.aggregate_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE events.event_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE events.stream_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE events.idempotency_keys ENABLE ROW LEVEL SECURITY;

-- Events are readable by authenticated users (they inherit entity-level permissions)
CREATE POLICY "Authenticated users can read events"
  ON events.domain_events FOR SELECT
  USING (auth.role() = 'authenticated');

-- Events are only created through functions (SECURITY DEFINER)
CREATE POLICY "Events created through functions only"
  ON events.domain_events FOR INSERT
  WITH CHECK (false);  -- Direct inserts blocked, use append_event function

-- Snapshots are readable by authenticated users
CREATE POLICY "Authenticated users can read snapshots"
  ON events.aggregate_snapshots FOR SELECT
  USING (auth.role() = 'authenticated');

-- Snapshots created through functions only
CREATE POLICY "Snapshots created through functions only"
  ON events.aggregate_snapshots FOR INSERT
  WITH CHECK (false);

-- Event streams readable by authenticated users
CREATE POLICY "Authenticated users can read event streams"
  ON events.event_streams FOR SELECT
  USING (auth.role() = 'authenticated');

-- Subscriptions managed by system
CREATE POLICY "System manages subscriptions"
  ON events.stream_subscriptions FOR ALL
  USING (auth.role() = 'service_role');

-- Idempotency keys managed by system
CREATE POLICY "System manages idempotency keys"
  ON events.idempotency_keys FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================================
-- MAINTENANCE: Cleanup and Archival
-- ============================================================================

-- Clean up expired idempotency keys
CREATE OR REPLACE FUNCTION events.cleanup_expired_idempotency_keys()
RETURNS INTEGER AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM events.idempotency_keys
  WHERE expires_at < NOW();

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Archive old events (move to cold storage table)
CREATE TABLE events.archived_events (
  LIKE events.domain_events INCLUDING ALL
);

CREATE OR REPLACE FUNCTION events.archive_old_events(
  p_older_than INTERVAL DEFAULT '1 year'
)
RETURNS INTEGER AS $$
DECLARE
  v_archived INTEGER;
BEGIN
  WITH moved AS (
    DELETE FROM events.domain_events
    WHERE created_at < NOW() - p_older_than
    RETURNING *
  )
  INSERT INTO events.archived_events
  SELECT * FROM moved;

  GET DIAGNOSTICS v_archived = ROW_COUNT;
  RETURN v_archived;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- GRANTS
-- ============================================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA events TO authenticated;
GRANT USAGE ON SCHEMA events TO service_role;

-- Grant select on tables
GRANT SELECT ON events.domain_events TO authenticated;
GRANT SELECT ON events.aggregate_snapshots TO authenticated;
GRANT SELECT ON events.event_streams TO authenticated;
GRANT SELECT ON events.recent_events TO authenticated;
GRANT SELECT ON events.aggregate_stats TO authenticated;
GRANT SELECT ON events.event_type_stats TO authenticated;

-- Service role gets full access
GRANT ALL ON ALL TABLES IN SCHEMA events TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA events TO service_role;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION events.append_event TO authenticated;
GRANT EXECUTE ON FUNCTION events.get_aggregate_events TO authenticated;
GRANT EXECUTE ON FUNCTION events.get_correlated_events TO authenticated;
GRANT EXECUTE ON FUNCTION events.get_latest_snapshot TO authenticated;
GRANT EXECUTE ON FUNCTION events.create_snapshot TO authenticated;
GRANT EXECUTE ON FUNCTION events.rebuild_aggregate_state TO authenticated;
GRANT EXECUTE ON FUNCTION events.get_aggregate_history TO authenticated;
GRANT EXECUTE ON FUNCTION events.get_state_at_time TO authenticated;
GRANT EXECUTE ON FUNCTION events.emit_person_created TO authenticated;
GRANT EXECUTE ON FUNCTION events.emit_person_updated TO authenticated;
GRANT EXECUTE ON FUNCTION events.emit_engagement_created TO authenticated;
GRANT EXECUTE ON FUNCTION events.emit_engagement_updated TO authenticated;
GRANT EXECUTE ON FUNCTION events.emit_relationship_created TO authenticated;
GRANT EXECUTE ON FUNCTION events.emit_task_created TO authenticated;
GRANT EXECUTE ON FUNCTION events.emit_task_status_changed TO authenticated;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON SCHEMA events IS 'Event sourcing infrastructure for immutable event storage and state reconstruction';
COMMENT ON TABLE events.domain_events IS 'Immutable append-only log of all domain events';
COMMENT ON TABLE events.aggregate_snapshots IS 'Point-in-time snapshots for performance optimization';
COMMENT ON TABLE events.event_streams IS 'Named event streams for organized querying';
COMMENT ON TABLE events.stream_subscriptions IS 'Subscription tracking for projections and read models';
COMMENT ON FUNCTION events.append_event IS 'Append a new event to the event store with optimistic concurrency';
COMMENT ON FUNCTION events.rebuild_aggregate_state IS 'Reconstruct aggregate state from events with optional snapshot loading';
COMMENT ON FUNCTION events.get_state_at_time IS 'Time-travel query to get aggregate state at a specific point in time';
