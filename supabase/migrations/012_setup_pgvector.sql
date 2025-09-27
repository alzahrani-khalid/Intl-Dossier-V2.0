-- Migration: Setup pgvector extension for AI embeddings
-- Description: Enable vector similarity search for intelligence analysis and document matching
-- Date: 2025-01-27

-- ========================================
-- Enable pgvector Extension
-- ========================================

CREATE EXTENSION IF NOT EXISTS vector;

-- ========================================
-- Vector Embedding Tables
-- ========================================

-- Document embeddings for semantic search
CREATE TABLE IF NOT EXISTS document_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_type entity_type NOT NULL,
    source_id UUID NOT NULL,
    embedding VECTOR(1536) NOT NULL,
    content_chunk TEXT NOT NULL,
    chunk_index INTEGER NOT NULL DEFAULT 0,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for vector similarity search
CREATE INDEX idx_document_embeddings_vector ON document_embeddings 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

CREATE INDEX idx_document_embeddings_source ON document_embeddings(source_type, source_id);
CREATE INDEX idx_document_embeddings_chunk ON document_embeddings(source_id, chunk_index);

-- Query embeddings history (for analysis and improvement)
CREATE TABLE IF NOT EXISTS query_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    query_text TEXT NOT NULL,
    query_embedding VECTOR(1536) NOT NULL,
    query_type VARCHAR(50),
    results_count INTEGER,
    execution_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_query_embeddings_user ON query_embeddings(user_id);
CREATE INDEX idx_query_embeddings_created ON query_embeddings(created_at DESC);

-- ========================================
-- Vector Search Functions
-- ========================================

-- Function to find similar documents using cosine similarity
CREATE OR REPLACE FUNCTION search_similar_documents(
    query_embedding VECTOR(1536),
    limit_count INTEGER DEFAULT 10,
    threshold FLOAT DEFAULT 0.7,
    filter_type entity_type DEFAULT NULL,
    filter_id UUID DEFAULT NULL
)
RETURNS TABLE (
    document_id UUID,
    source_type entity_type,
    source_id UUID,
    content_chunk TEXT,
    similarity_score FLOAT,
    metadata JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        de.id,
        de.source_type,
        de.source_id,
        de.content_chunk,
        1 - (de.embedding <=> query_embedding) AS similarity_score,
        de.metadata
    FROM document_embeddings de
    WHERE 
        (filter_type IS NULL OR de.source_type = filter_type)
        AND (filter_id IS NULL OR de.source_id = filter_id)
        AND (1 - (de.embedding <=> query_embedding)) >= threshold
    ORDER BY de.embedding <=> query_embedding
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to find related intelligence reports
CREATE OR REPLACE FUNCTION find_related_intelligence(
    report_id UUID,
    limit_count INTEGER DEFAULT 5
)
RETURNS TABLE (
    related_report_id UUID,
    related_report_title VARCHAR(255),
    similarity_score FLOAT,
    confidence_level confidence_level,
    classification classification_level
) AS $$
DECLARE
    query_vector VECTOR(1536);
BEGIN
    -- Get the vector embedding of the source report
    SELECT vector_embedding INTO query_vector
    FROM intelligence_reports
    WHERE id = report_id;
    
    IF query_vector IS NULL THEN
        RETURN;
    END IF;
    
    RETURN QUERY
    SELECT 
        ir.id,
        ir.title,
        1 - (ir.vector_embedding <=> query_vector) AS similarity_score,
        ir.confidence_level,
        ir.classification
    FROM intelligence_reports ir
    WHERE 
        ir.id != report_id
        AND ir.vector_embedding IS NOT NULL
        AND ir.deleted_at IS NULL
        AND ir.status = 'published'
    ORDER BY ir.vector_embedding <=> query_vector
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to generate text embeddings (placeholder - actual implementation requires AI service)
CREATE OR REPLACE FUNCTION generate_embedding(
    input_text TEXT,
    model_name VARCHAR(50) DEFAULT 'text-embedding-ada-002'
)
RETURNS VECTOR(1536) AS $$
BEGIN
    -- This is a placeholder function
    -- In production, this would call the AnythingLLM service
    -- to generate actual embeddings
    RAISE NOTICE 'Embedding generation requires AI service integration';
    
    -- Return a zero vector as placeholder
    RETURN array_fill(0::float, ARRAY[1536])::VECTOR(1536);
END;
$$ LANGUAGE plpgsql;

-- Function to chunk and embed large documents
CREATE OR REPLACE FUNCTION chunk_and_embed_document(
    p_source_type entity_type,
    p_source_id UUID,
    p_content TEXT,
    p_chunk_size INTEGER DEFAULT 1000,
    p_overlap INTEGER DEFAULT 200
)
RETURNS INTEGER AS $$
DECLARE
    v_chunks TEXT[];
    v_chunk TEXT;
    v_chunk_index INTEGER := 0;
    v_total_chunks INTEGER := 0;
    v_start_pos INTEGER := 1;
    v_content_length INTEGER;
BEGIN
    v_content_length := length(p_content);
    
    -- Delete existing embeddings for this document
    DELETE FROM document_embeddings 
    WHERE source_type = p_source_type AND source_id = p_source_id;
    
    -- Create chunks with overlap
    WHILE v_start_pos <= v_content_length LOOP
        v_chunk := substring(p_content FROM v_start_pos FOR p_chunk_size);
        
        IF length(v_chunk) > 0 THEN
            -- Insert chunk (embedding would be generated by AI service)
            INSERT INTO document_embeddings (
                source_type,
                source_id,
                embedding,
                content_chunk,
                chunk_index,
                metadata
            ) VALUES (
                p_source_type,
                p_source_id,
                generate_embedding(v_chunk),
                v_chunk,
                v_chunk_index,
                jsonb_build_object(
                    'chunk_size', length(v_chunk),
                    'start_position', v_start_pos,
                    'created_at', NOW()
                )
            );
            
            v_chunk_index := v_chunk_index + 1;
            v_total_chunks := v_total_chunks + 1;
        END IF;
        
        -- Move to next chunk with overlap
        v_start_pos := v_start_pos + p_chunk_size - p_overlap;
    END LOOP;
    
    RETURN v_total_chunks;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- Triggers for Automatic Embedding
-- ========================================

-- Trigger function to automatically generate embeddings for intelligence reports
CREATE OR REPLACE FUNCTION auto_embed_intelligence_report()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'published' AND (OLD IS NULL OR OLD.status != 'published') THEN
        -- Generate embedding for the report
        NEW.vector_embedding := generate_embedding(NEW.title || ' ' || NEW.content);
        
        -- Chunk and embed the full document
        PERFORM chunk_and_embed_document(
            'intelligence_report'::entity_type,
            NEW.id,
            NEW.content
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to intelligence reports
CREATE TRIGGER embed_intelligence_report
    BEFORE INSERT OR UPDATE ON intelligence_reports
    FOR EACH ROW EXECUTE FUNCTION auto_embed_intelligence_report();

-- ========================================
-- Maintenance Functions
-- ========================================

-- Function to rebuild vector indexes (for maintenance)
CREATE OR REPLACE FUNCTION rebuild_vector_indexes()
RETURNS void AS $$
BEGIN
    -- Rebuild the IVFFlat index for better performance
    REINDEX INDEX idx_document_embeddings_vector;
    
    -- Update statistics
    ANALYZE document_embeddings;
    ANALYZE intelligence_reports;
    
    RAISE NOTICE 'Vector indexes rebuilt successfully';
END;
$$ LANGUAGE plpgsql;

-- Function to clean up orphaned embeddings
CREATE OR REPLACE FUNCTION cleanup_orphaned_embeddings()
RETURNS INTEGER AS $$
DECLARE
    v_deleted_count INTEGER;
BEGIN
    -- Delete embeddings where source no longer exists
    WITH deleted AS (
        DELETE FROM document_embeddings de
        WHERE NOT EXISTS (
            SELECT 1 
            FROM intelligence_reports ir 
            WHERE ir.id = de.source_id 
                AND de.source_type = 'intelligence_report'
                AND ir.deleted_at IS NULL
        )
        RETURNING *
    )
    SELECT COUNT(*) INTO v_deleted_count FROM deleted;
    
    RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- Configuration and Settings
-- ========================================

-- Set optimal configuration for pgvector
ALTER SYSTEM SET ivfflat.probes = 10;

-- Add comments
COMMENT ON TABLE document_embeddings IS 'Vector embeddings for semantic search across documents';
COMMENT ON TABLE query_embeddings IS 'History of query embeddings for analysis and improvement';
COMMENT ON FUNCTION search_similar_documents IS 'Find documents similar to a given embedding vector';
COMMENT ON FUNCTION find_related_intelligence IS 'Find intelligence reports related to a given report';
COMMENT ON FUNCTION generate_embedding IS 'Generate vector embedding from text (requires AI service)';
COMMENT ON FUNCTION chunk_and_embed_document IS 'Split document into chunks and generate embeddings';
COMMENT ON FUNCTION rebuild_vector_indexes IS 'Rebuild vector indexes for optimal performance';
COMMENT ON FUNCTION cleanup_orphaned_embeddings IS 'Remove embeddings for deleted documents';