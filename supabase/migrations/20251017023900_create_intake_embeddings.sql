-- Migration: Create intake_embeddings table
-- Feature: 024-intake-entity-linking
-- Task: T011

CREATE TABLE IF NOT EXISTS intake_embeddings (
  -- Identity
  intake_id UUID PRIMARY KEY REFERENCES intake_tickets(id) ON DELETE CASCADE,

  -- Vector data
  embedding vector(1536), -- 1536-dimensional embeddings (OpenAI-compatible)

  -- Metadata
  text_hash TEXT NOT NULL, -- Hash of intake text to detect changes
  model_version TEXT NOT NULL DEFAULT 'text-embedding-ada-002', -- Track model for migrations

  -- Audit
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add comments
COMMENT ON TABLE intake_embeddings IS 'Vector embeddings for intake ticket text to enable AI-powered semantic search';
COMMENT ON COLUMN intake_embeddings.embedding IS '1536-dimensional vector embedding (OpenAI text-embedding-ada-002 or all-MiniLM-L6-v2 compatible)';
COMMENT ON COLUMN intake_embeddings.text_hash IS 'SHA256 hash of intake text for change detection';
COMMENT ON COLUMN intake_embeddings.model_version IS 'Embedding model identifier for migration tracking';
