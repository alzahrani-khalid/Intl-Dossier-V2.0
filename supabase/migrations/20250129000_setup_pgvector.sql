-- Migration: 000_setup_pgvector
-- Description: Setup pgvector extension and HNSW index configuration
-- Date: 2025-01-29
-- Note: This migration should run FIRST to ensure pgvector is available

-- ============================================
-- Enable Required Extensions
-- ============================================

-- Enable pgvector for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable pg_trgm for text similarity (trigrams)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Enable pgcrypto for hashing functions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================
-- Configure pgvector Settings
-- ============================================

-- Set vector index parameters for optimal performance
-- These settings affect HNSW index creation and search

-- Set the number of connections per element (higher = better quality, more memory)
-- Default is 16, we use 32 for better recall
SET ivfflat.probes = 10;

-- For HNSW indexes (if using hnsw extension)
-- ALTER SYSTEM SET hnsw.ef_construction = 200;
-- ALTER SYSTEM SET hnsw.m = 16;

-- ============================================
-- Create Vector Similarity Functions
-- ============================================

-- Function to normalize vectors (L2 normalization)
CREATE OR REPLACE FUNCTION normalize_vector(v vector)
RETURNS vector AS $$
DECLARE
    norm float;
BEGIN
    norm := sqrt(sum(val * val) FROM unnest(v::float[]) val);
    IF norm = 0 THEN
        RETURN v;
    END IF;
    RETURN (array_agg(val / norm)::float[])::vector FROM unnest(v::float[]) val;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to calculate cosine similarity (returns 0-1)
CREATE OR REPLACE FUNCTION cosine_similarity(v1 vector, v2 vector)
RETURNS float AS $$
BEGIN
    RETURN 1 - (normalize_vector(v1) <=> normalize_vector(v2));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to calculate euclidean distance
CREATE OR REPLACE FUNCTION euclidean_distance(v1 vector, v2 vector)
RETURNS float AS $$
BEGIN
    RETURN v1 <-> v2;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to calculate inner product similarity
CREATE OR REPLACE FUNCTION inner_product_similarity(v1 vector, v2 vector)
RETURNS float AS $$
BEGIN
    RETURN (v1 <#> v2) * -1;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- Create Configuration Table for Vector Search
-- ============================================

CREATE TABLE IF NOT EXISTS vector_search_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_name TEXT UNIQUE NOT NULL,
    embedding_model TEXT NOT NULL,
    embedding_dim INTEGER NOT NULL,
    similarity_metric TEXT NOT NULL CHECK (similarity_metric IN ('cosine', 'euclidean', 'inner_product')),
    similarity_threshold NUMERIC(3,2) NOT NULL CHECK (similarity_threshold >= 0 AND similarity_threshold <= 1),
    max_results INTEGER NOT NULL DEFAULT 10,
    use_reranking BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default configuration for BGE-M3 model
INSERT INTO vector_search_config (
    config_name,
    embedding_model,
    embedding_dim,
    similarity_metric,
    similarity_threshold,
    max_results,
    use_reranking,
    is_active
) VALUES (
    'default_bge_m3',
    'bge-m3',
    1024,
    'cosine',
    0.65,
    10,
    false,
    true
);

-- Configuration for high-precision duplicate detection
INSERT INTO vector_search_config (
    config_name,
    embedding_model,
    embedding_dim,
    similarity_metric,
    similarity_threshold,
    max_results,
    use_reranking,
    is_active
) VALUES (
    'duplicate_detection',
    'bge-m3',
    1024,
    'cosine',
    0.82,
    5,
    true,
    true
);

-- ============================================
-- Create Vector Statistics Table
-- ============================================

CREATE TABLE IF NOT EXISTS vector_search_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    search_id UUID NOT NULL,
    query_vector_id UUID,
    config_id UUID REFERENCES vector_search_config(id),
    search_type TEXT NOT NULL,
    results_count INTEGER NOT NULL,
    execution_time_ms INTEGER NOT NULL,
    avg_similarity_score NUMERIC(3,2),
    max_similarity_score NUMERIC(3,2),
    min_similarity_score NUMERIC(3,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- Optimized Vector Search Function
-- ============================================

CREATE OR REPLACE FUNCTION vector_similarity_search(
    p_query_vector vector,
    p_table_name TEXT DEFAULT 'ai_embeddings',
    p_limit INTEGER DEFAULT 10,
    p_threshold FLOAT DEFAULT 0.65,
    p_metric TEXT DEFAULT 'cosine'
) RETURNS TABLE (
    id UUID,
    owner_id UUID,
    similarity_score FLOAT
) AS $$
DECLARE
    v_query TEXT;
BEGIN
    -- Build dynamic query based on similarity metric
    CASE p_metric
        WHEN 'cosine' THEN
            v_query := format(
                'SELECT id, owner_id, 1 - (embedding <=> $1) as similarity_score
                 FROM %I
                 WHERE 1 - (embedding <=> $1) >= $2
                 ORDER BY embedding <=> $1
                 LIMIT $3',
                p_table_name
            );
        WHEN 'euclidean' THEN
            v_query := format(
                'SELECT id, owner_id, 1 / (1 + (embedding <-> $1)) as similarity_score
                 FROM %I
                 WHERE 1 / (1 + (embedding <-> $1)) >= $2
                 ORDER BY embedding <-> $1
                 LIMIT $3',
                p_table_name
            );
        WHEN 'inner_product' THEN
            v_query := format(
                'SELECT id, owner_id, (embedding <#> $1) * -1 as similarity_score
                 FROM %I
                 WHERE (embedding <#> $1) * -1 >= $2
                 ORDER BY embedding <#> $1 DESC
                 LIMIT $3',
                p_table_name
            );
        ELSE
            RAISE EXCEPTION 'Unknown similarity metric: %', p_metric;
    END CASE;
    
    RETURN QUERY EXECUTE v_query USING p_query_vector, p_threshold, p_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Create HNSW Index Builder Function
-- ============================================

CREATE OR REPLACE FUNCTION create_vector_index(
    p_table_name TEXT,
    p_column_name TEXT DEFAULT 'embedding',
    p_index_type TEXT DEFAULT 'ivfflat',
    p_lists INTEGER DEFAULT 200,
    p_metric TEXT DEFAULT 'vector_cosine_ops'
) RETURNS VOID AS $$
DECLARE
    v_index_name TEXT;
    v_sql TEXT;
BEGIN
    v_index_name := format('idx_%s_%s_vector', p_table_name, p_column_name);
    
    -- Drop existing index if it exists
    EXECUTE format('DROP INDEX IF EXISTS %I', v_index_name);
    
    -- Create new index based on type
    IF p_index_type = 'ivfflat' THEN
        v_sql := format(
            'CREATE INDEX %I ON %I USING ivfflat (%I %s) WITH (lists = %s)',
            v_index_name, p_table_name, p_column_name, p_metric, p_lists
        );
    ELSIF p_index_type = 'hnsw' THEN
        -- HNSW index (requires additional extension)
        v_sql := format(
            'CREATE INDEX %I ON %I USING hnsw (%I %s)',
            v_index_name, p_table_name, p_column_name, p_metric
        );
    ELSE
        RAISE EXCEPTION 'Unknown index type: %', p_index_type;
    END IF;
    
    EXECUTE v_sql;
    
    RAISE NOTICE 'Created vector index % on %.%', v_index_name, p_table_name, p_column_name;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Create Initial Vector Indexes
-- ============================================

-- Note: The actual index creation is done in migration 006
-- This ensures the tables exist first

-- ============================================
-- Vector Maintenance Functions
-- ============================================

-- Function to analyze vector index performance
CREATE OR REPLACE FUNCTION analyze_vector_index_performance()
RETURNS TABLE (
    index_name TEXT,
    table_name TEXT,
    index_size TEXT,
    number_of_rows BIGINT,
    avg_vector_size INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        i.indexname::TEXT as index_name,
        i.tablename::TEXT as table_name,
        pg_size_pretty(pg_relation_size(i.indexrelid))::TEXT as index_size,
        t.n_live_tup as number_of_rows,
        1024 as avg_vector_size -- BGE-M3 dimension
    FROM pg_indexes idx
    JOIN pg_stat_user_indexes i ON idx.indexname = i.indexname
    JOIN pg_stat_user_tables t ON i.tablename = t.tablename
    WHERE idx.indexdef LIKE '%USING ivfflat%'
       OR idx.indexdef LIKE '%USING hnsw%'
    ORDER BY pg_relation_size(i.indexrelid) DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to vacuum and reindex vector tables
CREATE OR REPLACE FUNCTION maintain_vector_indexes()
RETURNS VOID AS $$
DECLARE
    v_table RECORD;
BEGIN
    FOR v_table IN 
        SELECT DISTINCT tablename 
        FROM pg_indexes 
        WHERE indexdef LIKE '%USING ivfflat%' 
           OR indexdef LIKE '%USING hnsw%'
    LOOP
        EXECUTE format('VACUUM ANALYZE %I', v_table.tablename);
        RAISE NOTICE 'Vacuumed and analyzed table %', v_table.tablename;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Grant Permissions
-- ============================================

GRANT EXECUTE ON FUNCTION normalize_vector(vector) TO authenticated;
GRANT EXECUTE ON FUNCTION cosine_similarity(vector, vector) TO authenticated;
GRANT EXECUTE ON FUNCTION euclidean_distance(vector, vector) TO authenticated;
GRANT EXECUTE ON FUNCTION inner_product_similarity(vector, vector) TO authenticated;
GRANT EXECUTE ON FUNCTION vector_similarity_search(vector, TEXT, INTEGER, FLOAT, TEXT) TO authenticated;

GRANT SELECT ON vector_search_config TO authenticated;
GRANT INSERT ON vector_search_stats TO authenticated;

-- Add comments
COMMENT ON FUNCTION vector_similarity_search IS 'Perform similarity search using specified metric and threshold';
COMMENT ON FUNCTION create_vector_index IS 'Create optimized vector index for similarity search';
COMMENT ON FUNCTION analyze_vector_index_performance IS 'Analyze performance metrics of vector indexes';
COMMENT ON FUNCTION maintain_vector_indexes IS 'Perform maintenance on vector indexes';
COMMENT ON TABLE vector_search_config IS 'Configuration for different vector search scenarios';
COMMENT ON TABLE vector_search_stats IS 'Statistics and metrics for vector search operations';