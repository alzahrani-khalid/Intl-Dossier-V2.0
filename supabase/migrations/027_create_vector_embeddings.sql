-- Migration: Create Vector Embeddings table
-- Purpose: 1536-dimensional embeddings for similarity search (FR-003)
-- Feature: 004-refine-specification-to Phase 3.4

-- Enable pgvector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Create vector_embeddings table
CREATE TABLE vector_embeddings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID NOT NULL REFERENCES intelligence_reports(id) ON DELETE CASCADE,
    embedding vector(1536) NOT NULL, -- 1536-dimensional vector
    
    -- Indexing metadata (FR-005)
    index_method TEXT NOT NULL DEFAULT 'hnsw',
    ef_construction INTEGER NOT NULL DEFAULT 200 CHECK (ef_construction >= 100),
    m_parameter INTEGER NOT NULL DEFAULT 16 CHECK (m_parameter >= 5 AND m_parameter <= 48),
    
    -- Search metadata (FR-004)
    similarity_threshold DECIMAL(3,2) NOT NULL DEFAULT 0.80 CHECK (similarity_threshold >= 0 AND similarity_threshold <= 1),
    
    -- Audit fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create HNSW index for vector similarity search (FR-005)
CREATE INDEX idx_vector_embeddings_hnsw ON vector_embeddings 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 200);

-- Create index on report_id for efficient lookups
CREATE INDEX idx_vector_embeddings_report_id ON vector_embeddings(report_id);

-- Create index on similarity_threshold for filtering
CREATE INDEX idx_vector_embeddings_threshold ON vector_embeddings(similarity_threshold);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_vector_embeddings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER trigger_update_vector_embeddings_updated_at
    BEFORE UPDATE ON vector_embeddings
    FOR EACH ROW
    EXECUTE FUNCTION update_vector_embeddings_updated_at();

-- Create function to validate embedding dimensions
CREATE OR REPLACE FUNCTION validate_embedding_dimensions()
RETURNS TRIGGER AS $$
BEGIN
    IF array_length(NEW.embedding, 1) != 1536 THEN
        RAISE EXCEPTION 'Embedding must have exactly 1536 dimensions, got %', array_length(NEW.embedding, 1);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for embedding validation
CREATE TRIGGER trigger_validate_embedding_dimensions
    BEFORE INSERT OR UPDATE ON vector_embeddings
    FOR EACH ROW
    EXECUTE FUNCTION validate_embedding_dimensions();

-- Add comments
COMMENT ON TABLE vector_embeddings IS '1536-dimensional embeddings for similarity search using pgvector';
COMMENT ON COLUMN vector_embeddings.embedding IS '1536-dimensional vector for similarity search';
COMMENT ON COLUMN vector_embeddings.index_method IS 'Indexing method (hnsw for Hierarchical Navigable Small World)';
COMMENT ON COLUMN vector_embeddings.ef_construction IS 'Construction parameter for HNSW index (≥100)';
COMMENT ON COLUMN vector_embeddings.m_parameter IS 'M parameter for HNSW index (5-48)';
COMMENT ON COLUMN vector_embeddings.similarity_threshold IS 'Cosine similarity threshold for search (0-1)';
