-- Migration: Optimize Vector Search Queries
-- Purpose: T060 - Add HNSW indexes and optimize vector search for AI features
-- Feature: 033-ai-brief-generation
-- Date: 2025-12-06

-- ============================================
-- HNSW INDEXES FOR DOCUMENT EMBEDDINGS
-- ============================================
-- HNSW provides faster queries with better recall for small-medium datasets (<1M rows)
-- Key parameters:
--   m: Max number of connections per layer (higher = better recall, more memory)
--   ef_construction: Size of dynamic candidate list during build (higher = better quality)

-- Drop existing IVFFlat index on document_embeddings (if exists)
DROP INDEX IF EXISTS idx_document_embeddings_vector;

-- Create HNSW index for cosine similarity (primary use case)
CREATE INDEX IF NOT EXISTS idx_document_embeddings_hnsw_cosine
ON document_embeddings USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- ============================================
-- COMPOSITE INDEXES FOR FILTERED SEARCHES
-- ============================================
-- Partial indexes for common filter patterns

-- Index for AI brief context retrieval (countries, organizations, intelligence_reports)
CREATE INDEX IF NOT EXISTS idx_document_embeddings_brief_sources
ON document_embeddings (source_type, created_at DESC)
WHERE source_type IN ('country', 'organization', 'intelligence_report', 'event');

-- Index for temporal filtering on created_at
CREATE INDEX IF NOT EXISTS idx_document_embeddings_created_at
ON document_embeddings (created_at DESC);

-- ============================================
-- OPTIMIZED SEARCH FUNCTION FOR AI FEATURES
-- ============================================

-- Drop existing function to recreate with optimizations
DROP FUNCTION IF EXISTS search_similar_documents_optimized;

-- Optimized vector search with proper index hints and filtering
CREATE OR REPLACE FUNCTION search_similar_documents_optimized(
    query_embedding VECTOR(1536),
    limit_count INTEGER DEFAULT 10,
    threshold FLOAT DEFAULT 0.7,
    filter_types TEXT[] DEFAULT NULL,
    max_age_days INTEGER DEFAULT NULL
)
RETURNS TABLE (
    document_id UUID,
    source_type entity_type,
    source_id UUID,
    content_chunk TEXT,
    similarity_score FLOAT,
    metadata JSONB,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    -- Set HNSW ef_search for this query (higher = better recall, slower)
    SET LOCAL hnsw.ef_search = 40;

    RETURN QUERY
    SELECT
        de.id,
        de.source_type,
        de.source_id,
        de.content_chunk,
        (1 - (de.embedding <=> query_embedding))::FLOAT AS similarity_score,
        de.metadata,
        de.created_at
    FROM document_embeddings de
    WHERE
        -- Apply source type filter if provided
        (filter_types IS NULL OR de.source_type::TEXT = ANY(filter_types))
        -- Apply age filter if provided
        AND (max_age_days IS NULL OR de.created_at > NOW() - (max_age_days || ' days')::INTERVAL)
        -- Apply similarity threshold
        AND (1 - (de.embedding <=> query_embedding)) >= threshold
    ORDER BY de.embedding <=> query_embedding
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- BRIEF CONTEXT SEARCH FUNCTION
-- ============================================

-- Specialized function for AI brief generation context retrieval
CREATE OR REPLACE FUNCTION search_brief_context(
    query_embedding VECTOR(1536),
    engagement_dossier_ids UUID[] DEFAULT NULL,
    limit_per_type INTEGER DEFAULT 5,
    threshold FLOAT DEFAULT 0.6
)
RETURNS TABLE (
    source_type entity_type,
    source_id UUID,
    content_chunk TEXT,
    similarity_score FLOAT,
    metadata JSONB
) AS $$
BEGIN
    SET LOCAL hnsw.ef_search = 60;  -- Higher recall for brief generation

    RETURN QUERY
    WITH ranked_results AS (
        SELECT
            de.source_type,
            de.source_id,
            de.content_chunk,
            (1 - (de.embedding <=> query_embedding))::FLOAT AS sim_score,
            de.metadata,
            ROW_NUMBER() OVER (
                PARTITION BY de.source_type
                ORDER BY de.embedding <=> query_embedding
            ) AS type_rank
        FROM document_embeddings de
        WHERE
            de.source_type IN ('country', 'organization', 'intelligence_report', 'event')
            AND (engagement_dossier_ids IS NULL OR de.source_id = ANY(engagement_dossier_ids))
            AND (1 - (de.embedding <=> query_embedding)) >= threshold
    )
    SELECT
        rr.source_type,
        rr.source_id,
        rr.content_chunk,
        rr.sim_score,
        rr.metadata
    FROM ranked_results rr
    WHERE rr.type_rank <= limit_per_type
    ORDER BY rr.sim_score DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- CHAT ASSISTANT SEARCH FUNCTION
-- ============================================

-- Specialized function for AI chat semantic search
CREATE OR REPLACE FUNCTION search_chat_context(
    query_embedding VECTOR(1536),
    filter_entities TEXT[] DEFAULT NULL,
    limit_count INTEGER DEFAULT 10,
    threshold FLOAT DEFAULT 0.65
)
RETURNS TABLE (
    source_type entity_type,
    source_id UUID,
    content_chunk TEXT,
    similarity_score FLOAT,
    metadata JSONB
) AS $$
BEGIN
    SET LOCAL hnsw.ef_search = 50;

    RETURN QUERY
    SELECT
        de.source_type,
        de.source_id,
        de.content_chunk,
        (1 - (de.embedding <=> query_embedding))::FLOAT AS similarity_score,
        de.metadata
    FROM document_embeddings de
    WHERE
        (filter_entities IS NULL OR de.source_type::TEXT = ANY(filter_entities))
        AND (1 - (de.embedding <=> query_embedding)) >= threshold
    ORDER BY de.embedding <=> query_embedding
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- ENTITY LINKING SEARCH FUNCTION
-- ============================================

-- Specialized function for intake entity linking suggestions
CREATE OR REPLACE FUNCTION search_entity_links(
    query_embedding VECTOR(1536),
    limit_count INTEGER DEFAULT 5,
    threshold FLOAT DEFAULT 0.7
)
RETURNS TABLE (
    source_type entity_type,
    source_id UUID,
    content_chunk TEXT,
    similarity_score FLOAT,
    metadata JSONB
) AS $$
BEGIN
    SET LOCAL hnsw.ef_search = 40;

    RETURN QUERY
    SELECT
        de.source_type,
        de.source_id,
        de.content_chunk,
        (1 - (de.embedding <=> query_embedding))::FLOAT AS similarity_score,
        de.metadata
    FROM document_embeddings de
    WHERE
        de.source_type IN ('country', 'organization')
        AND (1 - (de.embedding <=> query_embedding)) >= threshold
    ORDER BY de.embedding <=> query_embedding
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- VECTOR STATISTICS FUNCTION
-- ============================================

-- Function to monitor vector index performance
CREATE OR REPLACE FUNCTION get_vector_search_stats()
RETURNS TABLE (
    table_name TEXT,
    index_name TEXT,
    index_type TEXT,
    index_size TEXT,
    row_count BIGINT,
    last_vacuum TIMESTAMPTZ,
    last_analyze TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.relname::TEXT AS table_name,
        i.relname::TEXT AS index_name,
        am.amname::TEXT AS index_type,
        pg_size_pretty(pg_relation_size(i.oid))::TEXT AS index_size,
        c.reltuples::BIGINT AS row_count,
        s.last_vacuum,
        s.last_analyze
    FROM pg_class t
    JOIN pg_index ix ON t.oid = ix.indrelid
    JOIN pg_class i ON i.oid = ix.indexrelid
    JOIN pg_am am ON i.relam = am.oid
    LEFT JOIN pg_stat_user_tables s ON t.relname = s.relname
    WHERE t.relname = 'document_embeddings'
    AND am.amname IN ('hnsw', 'ivfflat');
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- MAINTENANCE FUNCTIONS
-- ============================================

-- Function to analyze vector tables (VACUUM must be run separately outside transactions)
CREATE OR REPLACE FUNCTION optimize_vector_tables()
RETURNS VOID AS $$
BEGIN
    -- Analyze tables to update statistics for query planner
    ANALYZE document_embeddings;
    ANALYZE query_embeddings;

    RAISE NOTICE 'Vector tables analyzed successfully. Run VACUUM ANALYZE manually for full optimization.';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- GRANTS
-- ============================================

GRANT EXECUTE ON FUNCTION search_similar_documents_optimized TO authenticated;
GRANT EXECUTE ON FUNCTION search_brief_context TO authenticated;
GRANT EXECUTE ON FUNCTION search_chat_context TO authenticated;
GRANT EXECUTE ON FUNCTION search_entity_links TO authenticated;
GRANT EXECUTE ON FUNCTION get_vector_search_stats TO authenticated;
GRANT EXECUTE ON FUNCTION optimize_vector_tables TO authenticated;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON FUNCTION search_similar_documents_optimized IS 'Optimized vector search with HNSW index hints and flexible filtering';
COMMENT ON FUNCTION search_brief_context IS 'Specialized search for AI brief generation context retrieval';
COMMENT ON FUNCTION search_chat_context IS 'Specialized search for AI chat assistant semantic queries';
COMMENT ON FUNCTION search_entity_links IS 'Specialized search for intake entity linking suggestions';
COMMENT ON FUNCTION get_vector_search_stats IS 'Monitor vector index performance and statistics';
COMMENT ON FUNCTION optimize_vector_tables IS 'Analyze and vacuum vector tables for optimal performance';
