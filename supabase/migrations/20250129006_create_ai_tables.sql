-- Migration: 006_create_ai_tables
-- Description: Create tables for AI embeddings and analysis metadata
-- Date: 2025-01-29

-- Enable pgvector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Create enum for owner types
CREATE TYPE embedding_owner_type AS ENUM ('ticket', 'artifact');

-- Create the ai_embeddings table
CREATE TABLE IF NOT EXISTS ai_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_type embedding_owner_type NOT NULL,
    owner_id UUID NOT NULL,
    
    -- Embedding Data
    content_hash BYTEA NOT NULL, -- SHA-256 hash
    embedding vector(1024) NOT NULL, -- 1024-dimensional vector for bge-m3 model
    
    -- Model Information
    model TEXT NOT NULL,
    model_version TEXT NOT NULL,
    embedding_dim INTEGER NOT NULL DEFAULT 1024 CHECK (embedding_dim = 1024),
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    
    -- Unique constraint for owner
    CONSTRAINT unique_owner_embedding UNIQUE (owner_type, owner_id, model)
);

-- Create the analysis_metadata table
CREATE TABLE IF NOT EXISTS analysis_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id UUID NOT NULL, -- Correlation ID for tracking
    
    -- Model Details
    model_name TEXT NOT NULL,
    model_version TEXT NOT NULL,
    embedding_model TEXT,
    embedding_dim INTEGER,
    
    -- Prompt Information
    prompt_template_id TEXT,
    prompt_hash TEXT,
    
    -- Parameters
    temperature NUMERIC(3,2) CHECK (temperature >= 0 AND temperature <= 2),
    top_p NUMERIC(3,2) CHECK (top_p >= 0 AND top_p <= 1),
    seed INTEGER,
    
    -- Performance
    input_tokens INTEGER,
    output_tokens INTEGER,
    latency_ms INTEGER NOT NULL CHECK (latency_ms >= 0),
    
    -- Results
    confidence_score NUMERIC(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    source_refs TEXT[], -- Array of related document IDs
    heuristics JSONB, -- Fallback logic used
    
    -- Relationships
    embedding_id UUID REFERENCES ai_embeddings(id),
    
    -- Metadata
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Function to generate content hash
CREATE OR REPLACE FUNCTION generate_content_hash(
    p_content TEXT
) RETURNS BYTEA AS $$
BEGIN
    RETURN digest(p_content, 'sha256');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to store embedding for a ticket
CREATE OR REPLACE FUNCTION store_ticket_embedding(
    p_ticket_id UUID,
    p_embedding vector,
    p_model TEXT DEFAULT 'bge-m3',
    p_model_version TEXT DEFAULT 'v1.0.0'
) RETURNS UUID AS $$
DECLARE
    v_content TEXT;
    v_content_hash BYTEA;
    v_embedding_id UUID;
BEGIN
    -- Get ticket content for hashing
    SELECT COALESCE(title, '') || ' ' || COALESCE(description, '')
    INTO v_content
    FROM intake_tickets
    WHERE id = p_ticket_id;
    
    -- Generate content hash
    v_content_hash := generate_content_hash(v_content);
    
    -- Insert or update embedding
    INSERT INTO ai_embeddings (
        owner_type,
        owner_id,
        content_hash,
        embedding,
        model,
        model_version,
        embedding_dim,
        expires_at
    ) VALUES (
        'ticket'::embedding_owner_type,
        p_ticket_id,
        v_content_hash,
        p_embedding,
        p_model,
        p_model_version,
        1024,
        NOW() + INTERVAL '30 days'
    )
    ON CONFLICT (owner_type, owner_id, model) 
    DO UPDATE SET
        content_hash = EXCLUDED.content_hash,
        embedding = EXCLUDED.embedding,
        model_version = EXCLUDED.model_version,
        created_at = NOW(),
        expires_at = NOW() + INTERVAL '30 days'
    RETURNING id INTO v_embedding_id;
    
    RETURN v_embedding_id;
END;
$$ LANGUAGE plpgsql;

-- Function to find similar tickets using vector similarity
CREATE OR REPLACE FUNCTION find_similar_tickets_vector(
    p_ticket_id UUID,
    p_similarity_threshold FLOAT DEFAULT 0.65,
    p_limit INTEGER DEFAULT 10
) RETURNS TABLE (
    ticket_id UUID,
    similarity_score FLOAT,
    title TEXT,
    status ticket_status
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id as ticket_id,
        1 - (e1.embedding <=> e2.embedding) as similarity_score,
        t.title,
        t.status
    FROM ai_embeddings e1
    CROSS JOIN ai_embeddings e2
    INNER JOIN intake_tickets t ON t.id = e2.owner_id
    WHERE e1.owner_id = p_ticket_id
    AND e1.owner_type = 'ticket'
    AND e2.owner_type = 'ticket'
    AND e2.owner_id != p_ticket_id
    AND t.status NOT IN ('merged', 'closed')
    AND (1 - (e1.embedding <=> e2.embedding)) >= p_similarity_threshold
    ORDER BY similarity_score DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to clean expired embeddings
CREATE OR REPLACE FUNCTION clean_expired_embeddings()
RETURNS INTEGER AS $$
DECLARE
    v_deleted_count INTEGER;
BEGIN
    DELETE FROM ai_embeddings
    WHERE expires_at < NOW()
    RETURNING COUNT(*) INTO v_deleted_count;
    
    RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to track AI analysis
CREATE OR REPLACE FUNCTION track_ai_analysis(
    p_analysis_id UUID,
    p_model_name TEXT,
    p_model_version TEXT,
    p_latency_ms INTEGER,
    p_user_id UUID,
    p_confidence_score NUMERIC DEFAULT NULL,
    p_embedding_id UUID DEFAULT NULL,
    p_input_tokens INTEGER DEFAULT NULL,
    p_output_tokens INTEGER DEFAULT NULL,
    p_heuristics JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_metadata_id UUID;
BEGIN
    INSERT INTO analysis_metadata (
        analysis_id,
        model_name,
        model_version,
        latency_ms,
        created_by,
        confidence_score,
        embedding_id,
        input_tokens,
        output_tokens,
        heuristics
    ) VALUES (
        p_analysis_id,
        p_model_name,
        p_model_version,
        p_latency_ms,
        p_user_id,
        p_confidence_score,
        p_embedding_id,
        p_input_tokens,
        p_output_tokens,
        p_heuristics
    )
    RETURNING id INTO v_metadata_id;
    
    RETURN v_metadata_id;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for vector similarity search
CREATE INDEX idx_embeddings_vector ON ai_embeddings 
    USING ivfflat (embedding vector_cosine_ops) 
    WITH (lists = 200);

-- Create indexes for regular queries
CREATE INDEX idx_embeddings_owner ON ai_embeddings(owner_type, owner_id);
CREATE INDEX idx_embeddings_expires ON ai_embeddings(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_analysis_correlation ON analysis_metadata(analysis_id);
CREATE INDEX idx_analysis_created ON analysis_metadata(created_at DESC);

-- Add comments
COMMENT ON TABLE ai_embeddings IS 'Vector embeddings for semantic search and duplicate detection';
COMMENT ON TABLE analysis_metadata IS 'Metadata for all AI analysis operations';
COMMENT ON COLUMN ai_embeddings.content_hash IS 'SHA-256 hash of original content for change detection';
COMMENT ON COLUMN ai_embeddings.embedding IS '1024-dimensional vector from BGE-M3 model';
COMMENT ON COLUMN analysis_metadata.analysis_id IS 'Correlation ID for tracking related operations';
COMMENT ON FUNCTION find_similar_tickets_vector IS 'Find similar tickets using cosine similarity of embeddings';