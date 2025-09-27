-- 015_vector_index.sql: pgvector index for intelligence similarity search
-- Optimized vector search infrastructure for AI-powered features

-- ============================================
-- ENSURE PGVECTOR EXTENSION
-- ============================================

-- Ensure pgvector extension is installed
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;

-- ============================================
-- VECTOR SIMILARITY INDEXES
-- ============================================

-- Primary vector index for intelligence reports using IVFFlat
-- IVFFlat is better for larger datasets (>1M rows) than HNSW
CREATE INDEX IF NOT EXISTS idx_intelligence_vector_cosine ON public.intelligence_reports
    USING ivfflat (vector_embedding vector_cosine_ops)
    WITH (lists = 100)
    WHERE vector_embedding IS NOT NULL
    AND status = 'published';

-- Alternative index using L2 distance for different similarity metrics
CREATE INDEX IF NOT EXISTS idx_intelligence_vector_l2 ON public.intelligence_reports
    USING ivfflat (vector_embedding vector_l2_ops)
    WITH (lists = 100)
    WHERE vector_embedding IS NOT NULL
    AND status = 'published';

-- Index for inner product similarity (useful for normalized vectors)
CREATE INDEX IF NOT EXISTS idx_intelligence_vector_ip ON public.intelligence_reports
    USING ivfflat (vector_embedding vector_ip_ops)
    WITH (lists = 100)
    WHERE vector_embedding IS NOT NULL
    AND status = 'published';

-- ============================================
-- VECTOR SEARCH FUNCTIONS
-- ============================================

-- Function to search intelligence reports by semantic similarity
CREATE OR REPLACE FUNCTION public.search_intelligence_semantic(
    query_embedding vector(1536),
    limit_count INTEGER DEFAULT 10,
    min_similarity FLOAT DEFAULT 0.5,
    classification_filter TEXT[] DEFAULT NULL,
    confidence_filter TEXT[] DEFAULT NULL
)
RETURNS TABLE(
    id UUID,
    report_number TEXT,
    title_en TEXT,
    title_ar TEXT,
    executive_summary_en TEXT,
    executive_summary_ar TEXT,
    confidence_level TEXT,
    classification TEXT,
    similarity_score FLOAT,
    rank INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH ranked_results AS (
        SELECT
            ir.id,
            ir.report_number,
            ir.title_en,
            ir.title_ar,
            ir.executive_summary_en,
            ir.executive_summary_ar,
            ir.confidence_level,
            ir.classification,
            1 - (ir.vector_embedding <=> query_embedding) as similarity_score,
            ROW_NUMBER() OVER (ORDER BY ir.vector_embedding <=> query_embedding) as rank_number
        FROM public.intelligence_reports ir
        WHERE
            ir.vector_embedding IS NOT NULL
            AND ir.status = 'published'
            AND (classification_filter IS NULL OR ir.classification = ANY(classification_filter))
            AND (confidence_filter IS NULL OR ir.confidence_level = ANY(confidence_filter))
            AND 1 - (ir.vector_embedding <=> query_embedding) > min_similarity
        ORDER BY ir.vector_embedding <=> query_embedding
        LIMIT limit_count
    )
    SELECT
        rr.id,
        rr.report_number,
        rr.title_en,
        rr.title_ar,
        rr.executive_summary_en,
        rr.executive_summary_ar,
        rr.confidence_level,
        rr.classification,
        rr.similarity_score,
        rr.rank_number::INTEGER as rank
    FROM ranked_results rr;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to find related intelligence reports based on a given report
CREATE OR REPLACE FUNCTION public.find_related_intelligence(
    source_report_id UUID,
    limit_count INTEGER DEFAULT 5,
    min_similarity FLOAT DEFAULT 0.6
)
RETURNS TABLE(
    id UUID,
    report_number TEXT,
    title_en TEXT,
    title_ar TEXT,
    confidence_level TEXT,
    similarity_score FLOAT
) AS $$
DECLARE
    source_embedding vector(1536);
BEGIN
    -- Get the embedding of the source report
    SELECT vector_embedding INTO source_embedding
    FROM public.intelligence_reports
    WHERE id = source_report_id;

    IF source_embedding IS NULL THEN
        RETURN; -- No embedding, return empty result
    END IF;

    -- Find similar reports
    RETURN QUERY
    SELECT
        ir.id,
        ir.report_number,
        ir.title_en,
        ir.title_ar,
        ir.confidence_level,
        1 - (ir.vector_embedding <=> source_embedding) as similarity_score
    FROM public.intelligence_reports ir
    WHERE
        ir.id != source_report_id
        AND ir.vector_embedding IS NOT NULL
        AND ir.status = 'published'
        AND 1 - (ir.vector_embedding <=> source_embedding) > min_similarity
    ORDER BY ir.vector_embedding <=> source_embedding
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to cluster intelligence reports by similarity
CREATE OR REPLACE FUNCTION public.cluster_intelligence_reports(
    cluster_threshold FLOAT DEFAULT 0.7,
    min_cluster_size INTEGER DEFAULT 3
)
RETURNS TABLE(
    cluster_id INTEGER,
    report_id UUID,
    report_number TEXT,
    title_en TEXT,
    cluster_centroid vector(1536)
) AS $$
DECLARE
    current_cluster_id INTEGER := 0;
    processed_reports UUID[] := '{}';
BEGIN
    -- Simple clustering based on similarity threshold
    FOR report_id, report_number, title_en IN
        SELECT id, report_number, title_en
        FROM public.intelligence_reports
        WHERE vector_embedding IS NOT NULL
        AND status = 'published'
        ORDER BY created_at DESC
    LOOP
        -- Skip if already processed
        IF report_id = ANY(processed_reports) THEN
            CONTINUE;
        END IF;

        current_cluster_id := current_cluster_id + 1;

        -- Find all reports similar to this one
        RETURN QUERY
        WITH cluster_members AS (
            SELECT
                ir.id,
                ir.report_number,
                ir.title_en,
                ir.vector_embedding
            FROM public.intelligence_reports ir
            WHERE
                ir.vector_embedding IS NOT NULL
                AND ir.status = 'published'
                AND ir.id NOT IN (SELECT unnest(processed_reports))
                AND (
                    ir.id = report_id
                    OR 1 - (ir.vector_embedding <=> (
                        SELECT vector_embedding
                        FROM public.intelligence_reports
                        WHERE id = report_id
                    )) > cluster_threshold
                )
        ),
        cluster_stats AS (
            SELECT
                AVG(vector_embedding) as centroid,
                COUNT(*) as member_count
            FROM cluster_members
        )
        SELECT
            current_cluster_id as cluster_id,
            cm.id as report_id,
            cm.report_number,
            cm.title_en,
            cs.centroid as cluster_centroid
        FROM cluster_members cm
        CROSS JOIN cluster_stats cs
        WHERE cs.member_count >= min_cluster_size;

        -- Mark reports as processed
        processed_reports := processed_reports || ARRAY(
            SELECT id FROM cluster_members
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- ============================================
-- VECTOR EMBEDDING MANAGEMENT
-- ============================================

-- Table to store embedding generation queue
CREATE TABLE IF NOT EXISTS public.embedding_generation_queue (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    content_to_embed TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    processed_at TIMESTAMPTZ,
    UNIQUE(table_name, record_id)
);

CREATE INDEX idx_embedding_queue_status ON public.embedding_generation_queue(status, created_at)
    WHERE status IN ('pending', 'processing');

-- Function to queue content for embedding generation
CREATE OR REPLACE FUNCTION public.queue_for_embedding()
RETURNS TRIGGER AS $$
BEGIN
    -- Queue intelligence report for embedding when created or updated
    IF TG_TABLE_NAME = 'intelligence_reports' THEN
        INSERT INTO public.embedding_generation_queue (
            table_name,
            record_id,
            content_to_embed
        ) VALUES (
            TG_TABLE_NAME,
            NEW.id,
            NEW.title_en || ' ' ||
            NEW.executive_summary_en || ' ' ||
            NEW.analysis_en
        )
        ON CONFLICT (table_name, record_id)
        DO UPDATE SET
            content_to_embed = EXCLUDED.content_to_embed,
            status = 'pending',
            created_at = NOW(),
            processed_at = NULL,
            error_message = NULL;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to queue intelligence reports for embedding
CREATE TRIGGER queue_intelligence_embedding
    AFTER INSERT OR UPDATE OF title_en, executive_summary_en, analysis_en ON public.intelligence_reports
    FOR EACH ROW
    WHEN (NEW.status IN ('review', 'approved', 'published'))
    EXECUTE FUNCTION public.queue_for_embedding();

-- ============================================
-- VECTOR STATISTICS AND MONITORING
-- ============================================

-- Function to get vector index statistics
CREATE OR REPLACE FUNCTION public.get_vector_index_stats()
RETURNS TABLE(
    index_name TEXT,
    table_name TEXT,
    index_size TEXT,
    num_vectors BIGINT,
    avg_similarity FLOAT,
    index_method TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        i.indexname::TEXT as index_name,
        i.tablename::TEXT as table_name,
        pg_size_pretty(pg_relation_size(c.oid))::TEXT as index_size,
        COUNT(*)::BIGINT as num_vectors,
        NULL::FLOAT as avg_similarity, -- Would need actual query data
        am.amname::TEXT as index_method
    FROM pg_indexes i
    JOIN pg_class c ON c.relname = i.indexname
    JOIN pg_am am ON c.relam = am.oid
    WHERE i.indexname LIKE '%vector%'
    GROUP BY i.indexname, i.tablename, c.oid, am.amname;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to validate vector embeddings
CREATE OR REPLACE FUNCTION public.validate_vector_embeddings()
RETURNS TABLE(
    table_name TEXT,
    total_records BIGINT,
    records_with_embeddings BIGINT,
    records_without_embeddings BIGINT,
    embedding_coverage_percent FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        'intelligence_reports'::TEXT as table_name,
        COUNT(*)::BIGINT as total_records,
        COUNT(vector_embedding)::BIGINT as records_with_embeddings,
        COUNT(*) - COUNT(vector_embedding)::BIGINT as records_without_embeddings,
        (COUNT(vector_embedding)::FLOAT / NULLIF(COUNT(*), 0) * 100)::FLOAT as embedding_coverage_percent
    FROM public.intelligence_reports
    WHERE status = 'published';
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- PERFORMANCE OPTIMIZATION
-- ============================================

-- Set work_mem for vector operations (session-level)
-- Vector operations can be memory-intensive
CREATE OR REPLACE FUNCTION public.optimize_vector_search_session()
RETURNS VOID AS $$
BEGIN
    -- Increase work memory for vector operations
    SET LOCAL work_mem = '256MB';
    -- Enable parallel workers for vector searches
    SET LOCAL max_parallel_workers_per_gather = 4;
    -- Optimize for read-heavy workloads
    SET LOCAL random_page_cost = 1.1;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

GRANT EXECUTE ON FUNCTION public.search_intelligence_semantic TO authenticated;
GRANT EXECUTE ON FUNCTION public.find_related_intelligence TO authenticated;
GRANT EXECUTE ON FUNCTION public.cluster_intelligence_reports TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_vector_index_stats TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_vector_embeddings TO authenticated;
GRANT EXECUTE ON FUNCTION public.optimize_vector_search_session TO authenticated;

GRANT SELECT ON public.embedding_generation_queue TO authenticated;
GRANT INSERT, UPDATE ON public.embedding_generation_queue TO authenticated;

-- ============================================
-- RLS POLICIES FOR EMBEDDING QUEUE
-- ============================================

ALTER TABLE public.embedding_generation_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY embedding_queue_select ON public.embedding_generation_queue
    FOR SELECT
    USING (public.auth_has_any_role(ARRAY['admin', 'editor']));

CREATE POLICY embedding_queue_insert ON public.embedding_generation_queue
    FOR INSERT
    WITH CHECK (public.auth_has_any_role(ARRAY['admin', 'editor']));

CREATE POLICY embedding_queue_update ON public.embedding_generation_queue
    FOR UPDATE
    USING (public.auth_has_any_role(ARRAY['admin', 'editor']))
    WITH CHECK (public.auth_has_any_role(ARRAY['admin', 'editor']));

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON INDEX idx_intelligence_vector_cosine IS 'IVFFlat index for cosine similarity search on intelligence report embeddings';
COMMENT ON INDEX idx_intelligence_vector_l2 IS 'IVFFlat index for L2 distance search on intelligence report embeddings';
COMMENT ON INDEX idx_intelligence_vector_ip IS 'IVFFlat index for inner product similarity search on intelligence report embeddings';

COMMENT ON FUNCTION public.search_intelligence_semantic IS 'Search intelligence reports using semantic similarity with vector embeddings';
COMMENT ON FUNCTION public.find_related_intelligence IS 'Find intelligence reports related to a given report based on vector similarity';
COMMENT ON FUNCTION public.cluster_intelligence_reports IS 'Cluster intelligence reports based on vector similarity';

COMMENT ON TABLE public.embedding_generation_queue IS 'Queue for generating vector embeddings for content';
COMMENT ON FUNCTION public.queue_for_embedding IS 'Automatically queue content for vector embedding generation';

COMMENT ON FUNCTION public.optimize_vector_search_session IS 'Optimize session settings for vector search operations';