-- Enhanced Search Suggestions Migration
-- Feature: Enhanced search with real-time suggestions, fuzzy matching, search history, and adaptive filters
-- Description: Creates tables and functions for intelligent search suggestions

-- ==============================================================================
-- SECTION 1: Search History Table
-- ==============================================================================

-- Create search_history table to track user searches
CREATE TABLE IF NOT EXISTS search_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    query TEXT NOT NULL,
    query_normalized TEXT NOT NULL, -- Lowercase, trimmed for deduplication
    entity_types TEXT[] NOT NULL DEFAULT ARRAY['dossier'],
    result_count INTEGER NOT NULL DEFAULT 0,
    filters_applied JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Index for fast user history lookups
    CONSTRAINT search_history_query_not_empty CHECK (length(trim(query)) > 0)
);

-- Create index for user history and recency
CREATE INDEX IF NOT EXISTS idx_search_history_user_recent
    ON search_history(user_id, created_at DESC);

-- Create index for normalized query (for suggestions)
CREATE INDEX IF NOT EXISTS idx_search_history_normalized
    ON search_history(query_normalized);

-- Create trigram index for fuzzy matching on queries
CREATE INDEX IF NOT EXISTS idx_search_history_query_trgm
    ON search_history USING gin (query gin_trgm_ops);

-- ==============================================================================
-- SECTION 2: Popular Searches Table (Aggregated)
-- ==============================================================================

-- Create popular_searches table for trending/popular queries
CREATE TABLE IF NOT EXISTS popular_searches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query_normalized TEXT NOT NULL UNIQUE,
    display_query TEXT NOT NULL, -- Most common form for display
    search_count INTEGER NOT NULL DEFAULT 1,
    avg_result_count NUMERIC(10,2) NOT NULL DEFAULT 0,
    entity_types TEXT[] NOT NULL DEFAULT ARRAY['dossier'],
    last_searched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for popularity ranking
CREATE INDEX IF NOT EXISTS idx_popular_searches_count
    ON popular_searches(search_count DESC);

-- Create trigram index for fuzzy matching
CREATE INDEX IF NOT EXISTS idx_popular_searches_query_trgm
    ON popular_searches USING gin (query_normalized gin_trgm_ops);

-- ==============================================================================
-- SECTION 3: Search Suggestions Cache
-- ==============================================================================

-- Create search_suggestions_cache for pre-computed suggestions
CREATE TABLE IF NOT EXISTS search_suggestions_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL,
    suggestion_type TEXT NOT NULL CHECK (suggestion_type IN ('title', 'tag', 'keyword', 'name', 'topic')),
    value_en TEXT NOT NULL,
    value_ar TEXT,
    frequency INTEGER NOT NULL DEFAULT 1,
    last_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(entity_type, suggestion_type, value_en)
);

-- Create trigram index for fast fuzzy matching
CREATE INDEX IF NOT EXISTS idx_suggestions_cache_en_trgm
    ON search_suggestions_cache USING gin (value_en gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_suggestions_cache_ar_trgm
    ON search_suggestions_cache USING gin (value_ar gin_trgm_ops);

-- Create index for entity type filtering
CREATE INDEX IF NOT EXISTS idx_suggestions_cache_entity_type
    ON search_suggestions_cache(entity_type, frequency DESC);

-- ==============================================================================
-- SECTION 4: Filter Counts Cache (for adaptive filters)
-- ==============================================================================

-- Create filter_counts_cache for showing result counts per filter
CREATE TABLE IF NOT EXISTS filter_counts_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cache_key TEXT NOT NULL, -- Combination of base query + entity types
    filter_type TEXT NOT NULL, -- 'status', 'type', 'tag', 'date_range', etc.
    filter_value TEXT NOT NULL,
    result_count INTEGER NOT NULL DEFAULT 0,
    cached_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '5 minutes'),

    UNIQUE(cache_key, filter_type, filter_value)
);

-- Create index for cache lookups
CREATE INDEX IF NOT EXISTS idx_filter_counts_cache_key
    ON filter_counts_cache(cache_key, filter_type);

-- Create index for cache expiration cleanup
CREATE INDEX IF NOT EXISTS idx_filter_counts_expires
    ON filter_counts_cache(expires_at);

-- ==============================================================================
-- SECTION 5: Functions for Search Suggestions
-- ==============================================================================

-- Function to get fuzzy search suggestions
CREATE OR REPLACE FUNCTION get_search_suggestions(
    p_query TEXT,
    p_entity_types TEXT[] DEFAULT ARRAY['dossier'],
    p_limit INTEGER DEFAULT 10,
    p_min_similarity NUMERIC DEFAULT 0.3
)
RETURNS TABLE (
    suggestion TEXT,
    suggestion_ar TEXT,
    suggestion_type TEXT,
    entity_type TEXT,
    similarity_score NUMERIC,
    frequency INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_normalized_query TEXT;
BEGIN
    -- Normalize the query
    v_normalized_query := lower(trim(p_query));

    -- Return empty if query is too short
    IF length(v_normalized_query) < 2 THEN
        RETURN;
    END IF;

    RETURN QUERY
    WITH suggestions AS (
        -- Get suggestions from cache matching entity types
        SELECT
            sc.value_en AS suggestion,
            sc.value_ar AS suggestion_ar,
            sc.suggestion_type,
            sc.entity_type,
            similarity(lower(sc.value_en), v_normalized_query) AS sim_score,
            sc.frequency
        FROM search_suggestions_cache sc
        WHERE
            (sc.entity_type = ANY(p_entity_types) OR 'all' = ANY(p_entity_types))
            AND (
                similarity(lower(sc.value_en), v_normalized_query) >= p_min_similarity
                OR lower(sc.value_en) LIKE v_normalized_query || '%'
                OR (sc.value_ar IS NOT NULL AND similarity(lower(sc.value_ar), v_normalized_query) >= p_min_similarity)
                OR (sc.value_ar IS NOT NULL AND lower(sc.value_ar) LIKE v_normalized_query || '%')
            )

        UNION ALL

        -- Get suggestions from popular searches
        SELECT
            ps.display_query AS suggestion,
            NULL AS suggestion_ar,
            'popular' AS suggestion_type,
            UNNEST(ps.entity_types) AS entity_type,
            similarity(ps.query_normalized, v_normalized_query) AS sim_score,
            ps.search_count AS frequency
        FROM popular_searches ps
        WHERE
            similarity(ps.query_normalized, v_normalized_query) >= p_min_similarity
            OR ps.query_normalized LIKE v_normalized_query || '%'
    )
    SELECT DISTINCT ON (s.suggestion)
        s.suggestion,
        s.suggestion_ar,
        s.suggestion_type,
        s.entity_type,
        s.sim_score AS similarity_score,
        s.frequency
    FROM suggestions s
    WHERE s.suggestion IS NOT NULL
    ORDER BY s.suggestion, s.sim_score DESC, s.frequency DESC
    LIMIT p_limit;
END;
$$;

-- Function to add search to history
CREATE OR REPLACE FUNCTION add_search_history(
    p_user_id UUID,
    p_query TEXT,
    p_entity_types TEXT[],
    p_result_count INTEGER,
    p_filters JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_history_id UUID;
    v_normalized_query TEXT;
BEGIN
    v_normalized_query := lower(trim(p_query));

    -- Insert into search history
    INSERT INTO search_history (user_id, query, query_normalized, entity_types, result_count, filters_applied)
    VALUES (p_user_id, p_query, v_normalized_query, p_entity_types, p_result_count, p_filters)
    RETURNING id INTO v_history_id;

    -- Update popular searches
    INSERT INTO popular_searches (query_normalized, display_query, search_count, avg_result_count, entity_types, last_searched_at)
    VALUES (v_normalized_query, p_query, 1, p_result_count, p_entity_types, NOW())
    ON CONFLICT (query_normalized) DO UPDATE SET
        search_count = popular_searches.search_count + 1,
        avg_result_count = (popular_searches.avg_result_count * popular_searches.search_count + p_result_count) / (popular_searches.search_count + 1),
        display_query = CASE
            WHEN length(p_query) > length(popular_searches.display_query) THEN p_query
            ELSE popular_searches.display_query
        END,
        entity_types = ARRAY(SELECT DISTINCT UNNEST(popular_searches.entity_types || p_entity_types)),
        last_searched_at = NOW(),
        updated_at = NOW();

    RETURN v_history_id;
END;
$$;

-- Function to get user's recent searches
CREATE OR REPLACE FUNCTION get_user_search_history(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 10,
    p_entity_types TEXT[] DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    query TEXT,
    entity_types TEXT[],
    result_count INTEGER,
    filters_applied JSONB,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT ON (sh.query_normalized)
        sh.id,
        sh.query,
        sh.entity_types,
        sh.result_count,
        sh.filters_applied,
        sh.created_at
    FROM search_history sh
    WHERE
        sh.user_id = p_user_id
        AND (p_entity_types IS NULL OR sh.entity_types && p_entity_types)
    ORDER BY sh.query_normalized, sh.created_at DESC
    LIMIT p_limit;
END;
$$;

-- Function to get filter counts for adaptive filtering
CREATE OR REPLACE FUNCTION get_filter_counts(
    p_cache_key TEXT,
    p_entity_types TEXT[],
    p_base_query TEXT DEFAULT NULL
)
RETURNS TABLE (
    filter_type TEXT,
    filter_value TEXT,
    result_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- First try to get from cache
    RETURN QUERY
    SELECT
        fcc.filter_type,
        fcc.filter_value,
        fcc.result_count
    FROM filter_counts_cache fcc
    WHERE
        fcc.cache_key = p_cache_key
        AND fcc.expires_at > NOW()
    ORDER BY fcc.filter_type, fcc.result_count DESC;

    -- If no results from cache, return empty (caller should compute and cache)
    IF NOT FOUND THEN
        RETURN;
    END IF;
END;
$$;

-- Function to cache filter counts
CREATE OR REPLACE FUNCTION cache_filter_counts(
    p_cache_key TEXT,
    p_filter_type TEXT,
    p_filter_value TEXT,
    p_result_count INTEGER,
    p_ttl_minutes INTEGER DEFAULT 5
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO filter_counts_cache (cache_key, filter_type, filter_value, result_count, expires_at)
    VALUES (p_cache_key, p_filter_type, p_filter_value, p_result_count, NOW() + (p_ttl_minutes || ' minutes')::INTERVAL)
    ON CONFLICT (cache_key, filter_type, filter_value) DO UPDATE SET
        result_count = p_result_count,
        cached_at = NOW(),
        expires_at = NOW() + (p_ttl_minutes || ' minutes')::INTERVAL;
END;
$$;

-- Function to clear user's search history
CREATE OR REPLACE FUNCTION clear_user_search_history(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_deleted_count INTEGER;
BEGIN
    DELETE FROM search_history WHERE user_id = p_user_id;
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RETURN v_deleted_count;
END;
$$;

-- ==============================================================================
-- SECTION 6: Trigger to populate suggestions cache
-- ==============================================================================

-- Function to extract and cache suggestions from dossiers
CREATE OR REPLACE FUNCTION refresh_dossier_suggestions()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Insert/update title suggestions from dossiers (with DISTINCT to avoid duplicates)
    INSERT INTO search_suggestions_cache (entity_type, suggestion_type, value_en, value_ar, frequency)
    SELECT DISTINCT ON (d.name_en)
        COALESCE(d.type, 'dossier') AS entity_type,
        'title' AS suggestion_type,
        d.name_en AS value_en,
        d.name_ar AS value_ar,
        1 AS frequency
    FROM dossiers d
    WHERE d.name_en IS NOT NULL AND length(trim(d.name_en)) > 0
    ON CONFLICT (entity_type, suggestion_type, value_en) DO UPDATE SET
        value_ar = EXCLUDED.value_ar,
        last_updated_at = NOW();

    -- Insert/update tag suggestions from dossiers
    INSERT INTO search_suggestions_cache (entity_type, suggestion_type, value_en, value_ar, frequency)
    SELECT
        'dossier' AS entity_type,
        'tag' AS suggestion_type,
        tag AS value_en,
        NULL AS value_ar,
        COUNT(*) AS frequency
    FROM dossiers d, UNNEST(d.tags) AS tag
    WHERE tag IS NOT NULL AND length(trim(tag)) > 0
    GROUP BY tag
    ON CONFLICT (entity_type, suggestion_type, value_en) DO UPDATE SET
        frequency = EXCLUDED.frequency,
        last_updated_at = NOW();
END;
$$;

-- Function to refresh all suggestions (to be called periodically)
CREATE OR REPLACE FUNCTION refresh_all_suggestions()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Refresh dossier suggestions
    PERFORM refresh_dossier_suggestions();

    -- Refresh engagement suggestions (using location as the primary searchable field)
    INSERT INTO search_suggestions_cache (entity_type, suggestion_type, value_en, value_ar, frequency)
    SELECT
        'engagement' AS entity_type,
        'keyword' AS suggestion_type,
        e.engagement_type AS value_en,
        NULL AS value_ar,
        COUNT(*) AS frequency
    FROM engagements e
    WHERE e.engagement_type IS NOT NULL AND length(trim(e.engagement_type)) > 0
    GROUP BY e.engagement_type
    ON CONFLICT (entity_type, suggestion_type, value_en) DO UPDATE SET
        frequency = EXCLUDED.frequency,
        last_updated_at = NOW();

    -- Refresh engagement location suggestions (with DISTINCT to avoid duplicates)
    INSERT INTO search_suggestions_cache (entity_type, suggestion_type, value_en, value_ar, frequency)
    SELECT DISTINCT ON (e.location_en)
        'engagement' AS entity_type,
        'title' AS suggestion_type,
        e.location_en AS value_en,
        e.location_ar AS value_ar,
        1 AS frequency
    FROM engagements e
    WHERE e.location_en IS NOT NULL AND length(trim(e.location_en)) > 0
    ON CONFLICT (entity_type, suggestion_type, value_en) DO UPDATE SET
        value_ar = EXCLUDED.value_ar,
        last_updated_at = NOW();

    -- Refresh position suggestions (with DISTINCT to avoid duplicates)
    INSERT INTO search_suggestions_cache (entity_type, suggestion_type, value_en, value_ar, frequency)
    SELECT DISTINCT ON (p.title_en)
        'position' AS entity_type,
        'title' AS suggestion_type,
        p.title_en AS value_en,
        p.title_ar AS value_ar,
        1 AS frequency
    FROM positions p
    WHERE p.title_en IS NOT NULL AND length(trim(p.title_en)) > 0
    ON CONFLICT (entity_type, suggestion_type, value_en) DO UPDATE SET
        value_ar = EXCLUDED.value_ar,
        last_updated_at = NOW();

    -- Refresh people suggestions from persons table (with DISTINCT to avoid duplicates)
    INSERT INTO search_suggestions_cache (entity_type, suggestion_type, value_en, value_ar, frequency)
    SELECT DISTINCT ON (ps.title_en)
        'person' AS entity_type,
        'name' AS suggestion_type,
        ps.title_en AS value_en,
        ps.title_ar AS value_ar,
        1 AS frequency
    FROM persons ps
    WHERE ps.title_en IS NOT NULL AND length(trim(ps.title_en)) > 0
    ON CONFLICT (entity_type, suggestion_type, value_en) DO UPDATE SET
        value_ar = EXCLUDED.value_ar,
        last_updated_at = NOW();

    -- Clean up expired filter cache
    DELETE FROM filter_counts_cache WHERE expires_at < NOW();
END;
$$;

-- ==============================================================================
-- SECTION 7: RLS Policies
-- ==============================================================================

-- Enable RLS on search_history
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;

-- Users can only see their own search history
CREATE POLICY search_history_user_policy ON search_history
    FOR ALL
    USING (user_id = auth.uid());

-- Popular searches are readable by all authenticated users
ALTER TABLE popular_searches ENABLE ROW LEVEL SECURITY;

CREATE POLICY popular_searches_read_policy ON popular_searches
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Suggestions cache is readable by all authenticated users
ALTER TABLE search_suggestions_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY suggestions_cache_read_policy ON search_suggestions_cache
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Filter counts cache is readable by all authenticated users
ALTER TABLE filter_counts_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY filter_counts_cache_read_policy ON filter_counts_cache
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- ==============================================================================
-- SECTION 8: Initial population of suggestions cache
-- ==============================================================================

-- Run the refresh function to populate initial suggestions
SELECT refresh_all_suggestions();

-- ==============================================================================
-- SECTION 9: Comments for documentation
-- ==============================================================================

COMMENT ON TABLE search_history IS 'Stores individual user search history for personalized suggestions';
COMMENT ON TABLE popular_searches IS 'Aggregated popular search queries across all users';
COMMENT ON TABLE search_suggestions_cache IS 'Pre-computed suggestions from various entity types for fast autocomplete';
COMMENT ON TABLE filter_counts_cache IS 'Cached result counts for adaptive filters';

COMMENT ON FUNCTION get_search_suggestions IS 'Returns fuzzy-matched search suggestions based on query and entity types';
COMMENT ON FUNCTION add_search_history IS 'Adds a search to user history and updates popular searches';
COMMENT ON FUNCTION get_user_search_history IS 'Returns recent unique searches for a user';
COMMENT ON FUNCTION get_filter_counts IS 'Returns cached filter counts for adaptive filtering UI';
COMMENT ON FUNCTION refresh_all_suggestions IS 'Refreshes the suggestions cache from all entity tables';
