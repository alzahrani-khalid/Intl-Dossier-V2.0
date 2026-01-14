-- ============================================================================
-- CQRS Read Models for Intl-Dossier
-- ============================================================================
-- This migration implements optimized read models (projections) for complex
-- queries like timeline visualizations and relationship graphs.
--
-- CQRS Pattern:
-- - Write Model: Normalized tables (dossiers, relationships, events, etc.)
-- - Read Model: Denormalized views/materialized views optimized for queries
-- - Sync: Event handlers update read models when write model changes
-- ============================================================================

-- Create schema for read models (projections)
CREATE SCHEMA IF NOT EXISTS read_models;

-- ============================================================================
-- ENUMS: Projection Status
-- ============================================================================

CREATE TYPE read_models.projection_status AS ENUM (
  'stale',      -- Needs refresh
  'refreshing', -- Currently being updated
  'current',    -- Up to date
  'error'       -- Error during refresh
);

-- ============================================================================
-- PROJECTION METADATA: Track projection state
-- ============================================================================

CREATE TABLE read_models.projection_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projection_name TEXT NOT NULL UNIQUE,
  projection_type TEXT NOT NULL,  -- 'materialized_view', 'table', 'aggregate'
  last_event_id UUID REFERENCES events.domain_events(id),
  last_event_version BIGINT DEFAULT 0,
  last_refreshed_at TIMESTAMPTZ,
  status read_models.projection_status NOT NULL DEFAULT 'stale',
  error_message TEXT,
  refresh_interval_seconds INTEGER DEFAULT 300,  -- 5 minutes default
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TIMELINE PROJECTION: Denormalized timeline events
-- ============================================================================

-- Pre-computed timeline events across all sources for fast reads
CREATE TABLE read_models.timeline_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Event identification
  event_key TEXT NOT NULL UNIQUE,  -- Format: {source_table}-{source_id}
  source_table TEXT NOT NULL,
  source_id UUID NOT NULL,

  -- Dossier association
  dossier_id UUID NOT NULL,
  dossier_type TEXT NOT NULL,

  -- Event data (denormalized)
  event_type TEXT NOT NULL,
  title_en TEXT,
  title_ar TEXT,
  description_en TEXT,
  description_ar TEXT,
  event_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,

  -- Categorization
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT,

  -- Rich metadata for UI
  metadata JSONB NOT NULL DEFAULT '{}',

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),

  -- Search optimization
  search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', COALESCE(title_en, '')), 'A') ||
    setweight(to_tsvector('arabic', COALESCE(title_ar, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(description_en, '')), 'B') ||
    setweight(to_tsvector('arabic', COALESCE(description_ar, '')), 'B')
  ) STORED
);

-- Indexes for timeline queries
CREATE INDEX idx_timeline_dossier ON read_models.timeline_events(dossier_id, event_date DESC);
CREATE INDEX idx_timeline_type ON read_models.timeline_events(dossier_id, event_type, event_date DESC);
CREATE INDEX idx_timeline_date ON read_models.timeline_events(event_date DESC);
CREATE INDEX idx_timeline_priority ON read_models.timeline_events(dossier_id, priority) WHERE priority IN ('high', 'urgent');
CREATE INDEX idx_timeline_search ON read_models.timeline_events USING GIN(search_vector);
CREATE INDEX idx_timeline_source ON read_models.timeline_events(source_table, source_id);

-- ============================================================================
-- RELATIONSHIP GRAPH PROJECTION: Pre-computed graph for fast traversal
-- ============================================================================

-- Flattened relationship graph with pre-computed paths
CREATE TABLE read_models.relationship_graph (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationship identification
  relationship_id UUID NOT NULL,  -- Original relationship ID

  -- Source node
  source_dossier_id UUID NOT NULL,
  source_type TEXT NOT NULL,
  source_name_en TEXT,
  source_name_ar TEXT,
  source_status TEXT,

  -- Target node
  target_dossier_id UUID NOT NULL,
  target_type TEXT NOT NULL,
  target_name_en TEXT,
  target_name_ar TEXT,
  target_status TEXT,

  -- Relationship metadata
  relationship_type TEXT NOT NULL,
  relationship_subtype TEXT,
  strength INTEGER DEFAULT 50,  -- 0-100 relationship strength

  -- Pre-computed traversal data
  is_bidirectional BOOLEAN DEFAULT false,

  -- Metadata
  metadata JSONB NOT NULL DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(source_dossier_id, target_dossier_id, relationship_type)
);

-- Indexes for graph traversal
CREATE INDEX idx_graph_source ON read_models.relationship_graph(source_dossier_id);
CREATE INDEX idx_graph_target ON read_models.relationship_graph(target_dossier_id);
CREATE INDEX idx_graph_type ON read_models.relationship_graph(relationship_type);
CREATE INDEX idx_graph_bidirectional ON read_models.relationship_graph(source_dossier_id, target_dossier_id)
  WHERE is_bidirectional = true;

-- ============================================================================
-- DOSSIER SUMMARY PROJECTION: Pre-computed dossier summaries
-- ============================================================================

-- Aggregated dossier data for fast list/search queries
CREATE TABLE read_models.dossier_summaries (
  id UUID PRIMARY KEY,  -- Same as dossier ID

  -- Core info
  type TEXT NOT NULL,
  name_en TEXT,
  name_ar TEXT,
  summary_en TEXT,
  summary_ar TEXT,
  status TEXT,

  -- Computed stats
  relationship_count INTEGER DEFAULT 0,
  document_count INTEGER DEFAULT 0,
  event_count INTEGER DEFAULT 0,
  interaction_count INTEGER DEFAULT 0,
  last_activity_at TIMESTAMPTZ,

  -- Health score (0-100)
  health_score INTEGER DEFAULT 50,

  -- Tags and categories
  tags TEXT[] DEFAULT '{}',
  categories TEXT[] DEFAULT '{}',

  -- Search
  search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', COALESCE(name_en, '')), 'A') ||
    setweight(to_tsvector('arabic', COALESCE(name_ar, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(summary_en, '')), 'B') ||
    setweight(to_tsvector('arabic', COALESCE(summary_ar, '')), 'B')
  ) STORED,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for dossier queries
CREATE INDEX idx_dossier_summaries_type ON read_models.dossier_summaries(type);
CREATE INDEX idx_dossier_summaries_status ON read_models.dossier_summaries(status);
CREATE INDEX idx_dossier_summaries_search ON read_models.dossier_summaries USING GIN(search_vector);
CREATE INDEX idx_dossier_summaries_tags ON read_models.dossier_summaries USING GIN(tags);
CREATE INDEX idx_dossier_summaries_activity ON read_models.dossier_summaries(last_activity_at DESC NULLS LAST);

-- ============================================================================
-- ANALYTICS PROJECTION: Pre-computed metrics for dashboards
-- ============================================================================

-- Daily aggregated metrics
CREATE TABLE read_models.daily_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  metric_date DATE NOT NULL,
  metric_type TEXT NOT NULL,  -- 'dossier_activity', 'relationship_changes', 'events', etc.

  -- Aggregated values
  total_count INTEGER DEFAULT 0,
  by_type JSONB DEFAULT '{}',  -- Breakdown by entity type
  by_status JSONB DEFAULT '{}',  -- Breakdown by status
  by_user JSONB DEFAULT '{}',  -- Breakdown by user (top users)

  -- Computed
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(metric_date, metric_type)
);

-- Index for metrics queries
CREATE INDEX idx_daily_metrics_date ON read_models.daily_metrics(metric_date DESC);
CREATE INDEX idx_daily_metrics_type ON read_models.daily_metrics(metric_type, metric_date DESC);

-- ============================================================================
-- FUNCTIONS: Projection Sync
-- ============================================================================

-- Function to sync timeline events from source tables
CREATE OR REPLACE FUNCTION read_models.sync_timeline_event(
  p_source_table TEXT,
  p_source_id UUID,
  p_dossier_id UUID,
  p_dossier_type TEXT,
  p_event_type TEXT,
  p_title_en TEXT,
  p_title_ar TEXT,
  p_description_en TEXT,
  p_description_ar TEXT,
  p_event_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ DEFAULT NULL,
  p_priority TEXT DEFAULT 'medium',
  p_status TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}',
  p_created_by UUID DEFAULT NULL
) RETURNS read_models.timeline_events AS $$
DECLARE
  v_event read_models.timeline_events;
  v_event_key TEXT;
BEGIN
  v_event_key := p_source_table || '-' || p_source_id::TEXT;

  INSERT INTO read_models.timeline_events (
    event_key,
    source_table,
    source_id,
    dossier_id,
    dossier_type,
    event_type,
    title_en,
    title_ar,
    description_en,
    description_ar,
    event_date,
    end_date,
    priority,
    status,
    metadata,
    created_by
  ) VALUES (
    v_event_key,
    p_source_table,
    p_source_id,
    p_dossier_id,
    p_dossier_type,
    p_event_type,
    p_title_en,
    p_title_ar,
    p_description_en,
    p_description_ar,
    p_event_date,
    p_end_date,
    p_priority,
    p_status,
    p_metadata,
    p_created_by
  )
  ON CONFLICT (event_key) DO UPDATE SET
    dossier_id = EXCLUDED.dossier_id,
    dossier_type = EXCLUDED.dossier_type,
    event_type = EXCLUDED.event_type,
    title_en = EXCLUDED.title_en,
    title_ar = EXCLUDED.title_ar,
    description_en = EXCLUDED.description_en,
    description_ar = EXCLUDED.description_ar,
    event_date = EXCLUDED.event_date,
    end_date = EXCLUDED.end_date,
    priority = EXCLUDED.priority,
    status = EXCLUDED.status,
    metadata = EXCLUDED.metadata,
    updated_at = NOW()
  RETURNING * INTO v_event;

  RETURN v_event;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to remove timeline event
CREATE OR REPLACE FUNCTION read_models.delete_timeline_event(
  p_source_table TEXT,
  p_source_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_event_key TEXT;
BEGIN
  v_event_key := p_source_table || '-' || p_source_id::TEXT;

  DELETE FROM read_models.timeline_events
  WHERE event_key = v_event_key;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to sync relationship graph
CREATE OR REPLACE FUNCTION read_models.sync_relationship(
  p_relationship_id UUID,
  p_source_dossier_id UUID,
  p_target_dossier_id UUID,
  p_relationship_type TEXT,
  p_relationship_subtype TEXT DEFAULT NULL,
  p_strength INTEGER DEFAULT 50,
  p_is_bidirectional BOOLEAN DEFAULT false,
  p_metadata JSONB DEFAULT '{}'
) RETURNS read_models.relationship_graph AS $$
DECLARE
  v_source_dossier RECORD;
  v_target_dossier RECORD;
  v_relationship read_models.relationship_graph;
BEGIN
  -- Fetch source dossier info
  SELECT type, name_en, name_ar, status INTO v_source_dossier
  FROM dossiers WHERE id = p_source_dossier_id;

  -- Fetch target dossier info
  SELECT type, name_en, name_ar, status INTO v_target_dossier
  FROM dossiers WHERE id = p_target_dossier_id;

  INSERT INTO read_models.relationship_graph (
    relationship_id,
    source_dossier_id,
    source_type,
    source_name_en,
    source_name_ar,
    source_status,
    target_dossier_id,
    target_type,
    target_name_en,
    target_name_ar,
    target_status,
    relationship_type,
    relationship_subtype,
    strength,
    is_bidirectional,
    metadata
  ) VALUES (
    p_relationship_id,
    p_source_dossier_id,
    v_source_dossier.type,
    v_source_dossier.name_en,
    v_source_dossier.name_ar,
    v_source_dossier.status,
    p_target_dossier_id,
    v_target_dossier.type,
    v_target_dossier.name_en,
    v_target_dossier.name_ar,
    v_target_dossier.status,
    p_relationship_type,
    p_relationship_subtype,
    p_strength,
    p_is_bidirectional,
    p_metadata
  )
  ON CONFLICT (source_dossier_id, target_dossier_id, relationship_type) DO UPDATE SET
    relationship_subtype = EXCLUDED.relationship_subtype,
    strength = EXCLUDED.strength,
    is_bidirectional = EXCLUDED.is_bidirectional,
    metadata = EXCLUDED.metadata,
    source_name_en = EXCLUDED.source_name_en,
    source_name_ar = EXCLUDED.source_name_ar,
    source_status = EXCLUDED.source_status,
    target_name_en = EXCLUDED.target_name_en,
    target_name_ar = EXCLUDED.target_name_ar,
    target_status = EXCLUDED.target_status,
    updated_at = NOW()
  RETURNING * INTO v_relationship;

  RETURN v_relationship;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to delete relationship from graph
CREATE OR REPLACE FUNCTION read_models.delete_relationship(
  p_relationship_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
  DELETE FROM read_models.relationship_graph
  WHERE relationship_id = p_relationship_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update dossier summary
CREATE OR REPLACE FUNCTION read_models.sync_dossier_summary(
  p_dossier_id UUID
) RETURNS read_models.dossier_summaries AS $$
DECLARE
  v_dossier RECORD;
  v_summary read_models.dossier_summaries;
  v_relationship_count INTEGER;
  v_document_count INTEGER;
  v_event_count INTEGER;
  v_interaction_count INTEGER;
  v_last_activity TIMESTAMPTZ;
BEGIN
  -- Fetch dossier info
  SELECT id, type, name_en, name_ar, summary_en, summary_ar, status, created_at
  INTO v_dossier FROM dossiers WHERE id = p_dossier_id;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- Count relationships
  SELECT COUNT(*) INTO v_relationship_count
  FROM read_models.relationship_graph
  WHERE source_dossier_id = p_dossier_id OR target_dossier_id = p_dossier_id;

  -- Count documents (if documents table exists)
  SELECT COUNT(*) INTO v_document_count
  FROM documents WHERE dossier_id = p_dossier_id;

  -- Count timeline events
  SELECT COUNT(*) INTO v_event_count
  FROM read_models.timeline_events WHERE dossier_id = p_dossier_id;

  -- Count interactions
  SELECT COUNT(*) INTO v_interaction_count
  FROM dossier_interactions WHERE dossier_id = p_dossier_id;

  -- Get last activity
  SELECT MAX(event_date) INTO v_last_activity
  FROM read_models.timeline_events WHERE dossier_id = p_dossier_id;

  -- Upsert summary
  INSERT INTO read_models.dossier_summaries (
    id,
    type,
    name_en,
    name_ar,
    summary_en,
    summary_ar,
    status,
    relationship_count,
    document_count,
    event_count,
    interaction_count,
    last_activity_at,
    health_score
  ) VALUES (
    v_dossier.id,
    v_dossier.type,
    v_dossier.name_en,
    v_dossier.name_ar,
    v_dossier.summary_en,
    v_dossier.summary_ar,
    v_dossier.status,
    v_relationship_count,
    v_document_count,
    v_event_count,
    v_interaction_count,
    COALESCE(v_last_activity, v_dossier.created_at),
    -- Calculate health score based on activity
    LEAST(100, 50 + (v_relationship_count * 5) + (v_event_count * 2) + (v_document_count * 3))
  )
  ON CONFLICT (id) DO UPDATE SET
    type = EXCLUDED.type,
    name_en = EXCLUDED.name_en,
    name_ar = EXCLUDED.name_ar,
    summary_en = EXCLUDED.summary_en,
    summary_ar = EXCLUDED.summary_ar,
    status = EXCLUDED.status,
    relationship_count = EXCLUDED.relationship_count,
    document_count = EXCLUDED.document_count,
    event_count = EXCLUDED.event_count,
    interaction_count = EXCLUDED.interaction_count,
    last_activity_at = EXCLUDED.last_activity_at,
    health_score = EXCLUDED.health_score,
    updated_at = NOW()
  RETURNING * INTO v_summary;

  RETURN v_summary;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- QUERY FUNCTIONS: Optimized Read Operations
-- ============================================================================

-- Fast timeline query using read model
CREATE OR REPLACE FUNCTION read_models.get_timeline(
  p_dossier_id UUID,
  p_event_types TEXT[] DEFAULT NULL,
  p_priority TEXT[] DEFAULT NULL,
  p_date_from TIMESTAMPTZ DEFAULT NULL,
  p_date_to TIMESTAMPTZ DEFAULT NULL,
  p_search_query TEXT DEFAULT NULL,
  p_cursor TIMESTAMPTZ DEFAULT NULL,
  p_limit INTEGER DEFAULT 20
) RETURNS TABLE (
  id UUID,
  event_key TEXT,
  source_table TEXT,
  source_id UUID,
  event_type TEXT,
  title_en TEXT,
  title_ar TEXT,
  description_en TEXT,
  description_ar TEXT,
  event_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  priority TEXT,
  status TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ,
  created_by UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    te.id,
    te.event_key,
    te.source_table,
    te.source_id,
    te.event_type,
    te.title_en,
    te.title_ar,
    te.description_en,
    te.description_ar,
    te.event_date,
    te.end_date,
    te.priority,
    te.status,
    te.metadata,
    te.created_at,
    te.created_by
  FROM read_models.timeline_events te
  WHERE te.dossier_id = p_dossier_id
    AND (p_event_types IS NULL OR te.event_type = ANY(p_event_types))
    AND (p_priority IS NULL OR te.priority = ANY(p_priority))
    AND (p_date_from IS NULL OR te.event_date >= p_date_from)
    AND (p_date_to IS NULL OR te.event_date <= p_date_to)
    AND (p_cursor IS NULL OR te.event_date < p_cursor)
    AND (
      p_search_query IS NULL OR
      te.search_vector @@ plainto_tsquery('english', p_search_query) OR
      te.search_vector @@ plainto_tsquery('arabic', p_search_query)
    )
  ORDER BY te.event_date DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Fast graph traversal using read model
CREATE OR REPLACE FUNCTION read_models.get_relationship_graph(
  p_dossier_id UUID,
  p_relationship_types TEXT[] DEFAULT NULL,
  p_max_depth INTEGER DEFAULT 2,
  p_include_inactive BOOLEAN DEFAULT false
) RETURNS TABLE (
  node_id UUID,
  node_type TEXT,
  name_en TEXT,
  name_ar TEXT,
  status TEXT,
  depth INTEGER,
  path UUID[],
  relationship_types TEXT[]
) AS $$
WITH RECURSIVE graph AS (
  -- Base case: starting node
  SELECT
    rg.source_dossier_id AS node_id,
    rg.source_type AS node_type,
    rg.source_name_en AS name_en,
    rg.source_name_ar AS name_ar,
    rg.source_status AS status,
    0 AS depth,
    ARRAY[rg.source_dossier_id] AS path,
    ARRAY[]::TEXT[] AS relationship_types
  FROM read_models.relationship_graph rg
  WHERE rg.source_dossier_id = p_dossier_id
  LIMIT 1

  UNION ALL

  -- Recursive case: connected nodes
  SELECT
    rg.target_dossier_id,
    rg.target_type,
    rg.target_name_en,
    rg.target_name_ar,
    rg.target_status,
    g.depth + 1,
    g.path || rg.target_dossier_id,
    g.relationship_types || rg.relationship_type
  FROM graph g
  JOIN read_models.relationship_graph rg ON rg.source_dossier_id = g.node_id
  WHERE g.depth < p_max_depth
    AND NOT rg.target_dossier_id = ANY(g.path)  -- Prevent cycles
    AND (p_relationship_types IS NULL OR rg.relationship_type = ANY(p_relationship_types))
    AND (p_include_inactive OR rg.target_status != 'archived')
)
SELECT DISTINCT ON (node_id) * FROM graph
ORDER BY node_id, depth;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Get dossier with precomputed summary
CREATE OR REPLACE FUNCTION read_models.get_dossier_summary(
  p_dossier_id UUID
) RETURNS read_models.dossier_summaries AS $$
DECLARE
  v_summary read_models.dossier_summaries;
BEGIN
  SELECT * INTO v_summary
  FROM read_models.dossier_summaries
  WHERE id = p_dossier_id;

  -- If not found, sync and return
  IF NOT FOUND THEN
    RETURN read_models.sync_dossier_summary(p_dossier_id);
  END IF;

  RETURN v_summary;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Search dossiers using optimized read model
CREATE OR REPLACE FUNCTION read_models.search_dossiers(
  p_query TEXT,
  p_types TEXT[] DEFAULT NULL,
  p_status TEXT[] DEFAULT NULL,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
) RETURNS TABLE (
  id UUID,
  type TEXT,
  name_en TEXT,
  name_ar TEXT,
  summary_en TEXT,
  summary_ar TEXT,
  status TEXT,
  relationship_count INTEGER,
  last_activity_at TIMESTAMPTZ,
  health_score INTEGER,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ds.id,
    ds.type,
    ds.name_en,
    ds.name_ar,
    ds.summary_en,
    ds.summary_ar,
    ds.status,
    ds.relationship_count,
    ds.last_activity_at,
    ds.health_score,
    ts_rank(ds.search_vector, plainto_tsquery('english', p_query)) AS rank
  FROM read_models.dossier_summaries ds
  WHERE (
      ds.search_vector @@ plainto_tsquery('english', p_query) OR
      ds.search_vector @@ plainto_tsquery('arabic', p_query)
    )
    AND (p_types IS NULL OR ds.type = ANY(p_types))
    AND (p_status IS NULL OR ds.status = ANY(p_status))
  ORDER BY rank DESC, ds.last_activity_at DESC NULLS LAST
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE read_models.timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE read_models.relationship_graph ENABLE ROW LEVEL SECURITY;
ALTER TABLE read_models.dossier_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE read_models.daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE read_models.projection_metadata ENABLE ROW LEVEL SECURITY;

-- Timeline events inherit permissions from dossiers
CREATE POLICY "Users can view timeline events for accessible dossiers"
  ON read_models.timeline_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM dossiers d
      WHERE d.id = dossier_id
      AND (
        d.visibility = 'public' OR
        auth.uid() IS NOT NULL
      )
    )
  );

-- Relationship graph inherits permissions
CREATE POLICY "Users can view relationships for accessible dossiers"
  ON read_models.relationship_graph FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM dossiers d
      WHERE d.id = source_dossier_id
      AND (
        d.visibility = 'public' OR
        auth.uid() IS NOT NULL
      )
    )
  );

-- Dossier summaries inherit permissions
CREATE POLICY "Users can view summaries for accessible dossiers"
  ON read_models.dossier_summaries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM dossiers d
      WHERE d.id = read_models.dossier_summaries.id
      AND (
        d.visibility = 'public' OR
        auth.uid() IS NOT NULL
      )
    )
  );

-- Metrics are visible to authenticated users
CREATE POLICY "Authenticated users can view metrics"
  ON read_models.daily_metrics FOR SELECT
  USING (auth.role() = 'authenticated');

-- Projection metadata is system-only
CREATE POLICY "System manages projection metadata"
  ON read_models.projection_metadata FOR ALL
  USING (auth.role() = 'service_role');

-- Write policies - only through functions
CREATE POLICY "Timeline events managed through functions"
  ON read_models.timeline_events FOR ALL
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Relationship graph managed through functions"
  ON read_models.relationship_graph FOR ALL
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Dossier summaries managed through functions"
  ON read_models.dossier_summaries FOR ALL
  USING (false)
  WITH CHECK (false);

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT USAGE ON SCHEMA read_models TO authenticated;
GRANT USAGE ON SCHEMA read_models TO service_role;

-- Read access for authenticated users
GRANT SELECT ON read_models.timeline_events TO authenticated;
GRANT SELECT ON read_models.relationship_graph TO authenticated;
GRANT SELECT ON read_models.dossier_summaries TO authenticated;
GRANT SELECT ON read_models.daily_metrics TO authenticated;

-- Full access for service role
GRANT ALL ON ALL TABLES IN SCHEMA read_models TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA read_models TO service_role;

-- Function grants
GRANT EXECUTE ON FUNCTION read_models.get_timeline TO authenticated;
GRANT EXECUTE ON FUNCTION read_models.get_relationship_graph TO authenticated;
GRANT EXECUTE ON FUNCTION read_models.get_dossier_summary TO authenticated;
GRANT EXECUTE ON FUNCTION read_models.search_dossiers TO authenticated;
GRANT EXECUTE ON FUNCTION read_models.sync_timeline_event TO service_role;
GRANT EXECUTE ON FUNCTION read_models.delete_timeline_event TO service_role;
GRANT EXECUTE ON FUNCTION read_models.sync_relationship TO service_role;
GRANT EXECUTE ON FUNCTION read_models.delete_relationship TO service_role;
GRANT EXECUTE ON FUNCTION read_models.sync_dossier_summary TO service_role;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON SCHEMA read_models IS 'CQRS read models (projections) optimized for complex queries';
COMMENT ON TABLE read_models.timeline_events IS 'Denormalized timeline events for fast timeline queries';
COMMENT ON TABLE read_models.relationship_graph IS 'Pre-computed relationship graph for fast traversal';
COMMENT ON TABLE read_models.dossier_summaries IS 'Aggregated dossier data for fast list/search queries';
COMMENT ON TABLE read_models.daily_metrics IS 'Pre-aggregated daily metrics for dashboards';
COMMENT ON TABLE read_models.projection_metadata IS 'Tracks state and freshness of projections';
COMMENT ON FUNCTION read_models.get_timeline IS 'Fast timeline query using pre-computed read model';
COMMENT ON FUNCTION read_models.get_relationship_graph IS 'Fast graph traversal using pre-computed read model';
