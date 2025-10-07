-- Migration: Add Embedding Columns for Semantic Search
-- Feature: 015-search-retrieval-spec
-- Task: T012
-- Description: Add vector(1536) columns and HNSW indexes for semantic search

-- Add embedding column to positions
ALTER TABLE positions ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Add embedding column to attachments
ALTER TABLE attachments ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Add embedding column to briefs
ALTER TABLE briefs ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Create HNSW indexes for fast approximate nearest neighbor search
-- m = 16: number of connections per layer (balance between search speed and recall)
-- ef_construction = 64: size of dynamic candidate list during index build

CREATE INDEX IF NOT EXISTS idx_positions_embedding
  ON positions USING hnsw (embedding vector_l2_ops)
  WITH (m = 16, ef_construction = 64);

CREATE INDEX IF NOT EXISTS idx_attachments_embedding
  ON attachments USING hnsw (embedding vector_l2_ops)
  WITH (m = 16, ef_construction = 64);

CREATE INDEX IF NOT EXISTS idx_briefs_embedding
  ON briefs USING hnsw (embedding vector_l2_ops)
  WITH (m = 16, ef_construction = 64);

-- Create partial indexes to skip NULL embeddings
CREATE INDEX IF NOT EXISTS idx_positions_embedding_not_null
  ON positions USING hnsw (embedding vector_l2_ops)
  WITH (m = 16, ef_construction = 64)
  WHERE embedding IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_attachments_embedding_not_null
  ON attachments USING hnsw (embedding vector_l2_ops)
  WITH (m = 16, ef_construction = 64)
  WHERE embedding IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_briefs_embedding_not_null
  ON briefs USING hnsw (embedding vector_l2_ops)
  WITH (m = 16, ef_construction = 64)
  WHERE embedding IS NOT NULL;

-- Analyze tables for query planner
ANALYZE positions;
ANALYZE attachments;
ANALYZE briefs;
