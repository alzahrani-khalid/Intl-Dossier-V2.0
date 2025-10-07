-- Migration: Add Search Vector to Engagements
-- Feature: 015-search-retrieval-spec
-- Task: T008
-- Description: Add tsvector column with weighted search vectors and trigram indexes

-- Add search_vector column with weighted tsvectors
ALTER TABLE engagements ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title_en, '')), 'A') ||
    setweight(to_tsvector('arabic', coalesce(title_ar, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description_en, '')), 'B') ||
    setweight(to_tsvector('arabic', coalesce(description_ar, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(objectives_en, '')), 'C') ||
    setweight(to_tsvector('arabic', coalesce(objectives_ar, '')), 'C')
  ) STORED;

-- Create GIN index for full-text search
CREATE INDEX IF NOT EXISTS idx_engagements_search_vector
  ON engagements USING GIN(search_vector);

-- Create trigram indexes for fuzzy matching on titles
CREATE INDEX IF NOT EXISTS idx_engagements_title_en_trgm
  ON engagements USING GIN(title_en gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_engagements_title_ar_trgm
  ON engagements USING GIN(title_ar gin_trgm_ops);

-- Create covering index for search results
CREATE INDEX IF NOT EXISTS idx_engagements_search_covering
  ON engagements (id, title_en, title_ar, description_en, description_ar, status, updated_at)
  WHERE status != 'deleted';

-- Analyze table for query planner
ANALYZE engagements;
