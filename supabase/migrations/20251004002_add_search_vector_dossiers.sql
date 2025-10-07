-- Migration: Add Search Vector to Dossiers
-- Feature: 015-search-retrieval-spec
-- Task: T006
-- Description: Add tsvector column with weighted search vectors and trigram indexes

-- Add search_vector column with weighted tsvectors
ALTER TABLE dossiers ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title_en, '')), 'A') ||
    setweight(to_tsvector('arabic', coalesce(title_ar, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(summary_en, '')), 'B') ||
    setweight(to_tsvector('arabic', coalesce(summary_ar, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(background_en, '')), 'C') ||
    setweight(to_tsvector('arabic', coalesce(background_ar, '')), 'C')
  ) STORED;

-- Create GIN index for full-text search
CREATE INDEX IF NOT EXISTS idx_dossiers_search_vector
  ON dossiers USING GIN(search_vector);

-- Create trigram indexes for fuzzy matching on titles
CREATE INDEX IF NOT EXISTS idx_dossiers_title_en_trgm
  ON dossiers USING GIN(title_en gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_dossiers_title_ar_trgm
  ON dossiers USING GIN(title_ar gin_trgm_ops);

-- Create partial index for active/archived dossiers only
CREATE INDEX IF NOT EXISTS idx_dossiers_active_search
  ON dossiers USING GIN(search_vector)
  WHERE status IN ('active', 'archived');

-- Create covering index to avoid table lookups
CREATE INDEX IF NOT EXISTS idx_dossiers_search_covering
  ON dossiers (id, title_en, title_ar, summary_en, summary_ar, status, updated_at)
  WHERE status != 'deleted';

-- Analyze table for query planner
ANALYZE dossiers;
