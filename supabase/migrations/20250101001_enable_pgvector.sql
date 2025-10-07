-- Migration: Enable pgvector extension for AI embeddings
-- Feature: 011-positions-talking-points
-- Task: T001

-- Enable the vector extension for pgvector support
CREATE EXTENSION IF NOT EXISTS vector;

-- Verify extension is enabled
COMMENT ON EXTENSION vector IS 'Enabled for positions consistency checking via AI embeddings';
