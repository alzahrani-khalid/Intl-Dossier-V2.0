-- Migration: Add Search Vector to Positions
-- Feature: 015-search-retrieval-spec
-- Task: T009
-- Description: Add tsvector column with weighted search vectors and trigram indexes

-- Add search_vector column with weighted tsvectors
ALTER TABLE positions ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title_en, '')), 'A') ||
    setweight(to_tsvector('arabic', coalesce(title_ar, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(key_messages_en, '')), 'B') ||
    setweight(to_tsvector('arabic', coalesce(key_messages_ar, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(background_en, '')), 'C') ||
    setweight(to_tsvector('arabic', coalesce(background_ar, '')), 'C')
  ) STORED;

-- Create GIN index for full-text search
CREATE INDEX IF NOT EXISTS idx_positions_search_vector
  ON positions USING GIN(search_vector);

-- Create trigram indexes for fuzzy matching on titles
CREATE INDEX IF NOT EXISTS idx_positions_title_en_trgm
  ON positions USING GIN(title_en gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_positions_title_ar_trgm
  ON positions USING GIN(title_ar gin_trgm_ops);

-- Create partial index for published positions only
CREATE INDEX IF NOT EXISTS idx_positions_published_search
  ON positions USING GIN(search_vector)
  WHERE status = 'published';

-- Create covering index for search results
CREATE INDEX IF NOT EXISTS idx_positions_search_covering
  ON positions (id, title_en, title_ar, status, updated_at)
  WHERE status = 'published';

-- Analyze table for query planner
ANALYZE positions;
