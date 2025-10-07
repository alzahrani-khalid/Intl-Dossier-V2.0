-- Migration: Enable PostgreSQL Extensions for Search
-- Feature: 015-search-retrieval-spec
-- Task: T005
-- Description: Enable pg_trgm for trigram fuzzy matching and pgvector for embeddings

-- Enable trigram extension for fuzzy text matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Enable vector extension for semantic search (may already be enabled)
CREATE EXTENSION IF NOT EXISTS pgvector;

-- Verify extensions are installed
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm'
    ) THEN
        RAISE EXCEPTION 'pg_trgm extension failed to install';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'vector'
    ) THEN
        RAISE EXCEPTION 'pgvector extension failed to install';
    END IF;

    RAISE NOTICE 'Search extensions enabled successfully';
END $$;
