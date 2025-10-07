-- Migration: Add Search Vector to Attachments (Documents)
-- Feature: 015-search-retrieval-spec
-- Task: T011
-- Description: Add tsvector column with weighted search vectors and trigram indexes

-- Add search_vector column with weighted tsvectors
ALTER TABLE attachments ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(file_name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description_en, '')), 'B') ||
    setweight(to_tsvector('arabic', coalesce(description_ar, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(extracted_text_en, '')), 'C') ||
    setweight(to_tsvector('arabic', coalesce(extracted_text_ar, '')), 'C')
  ) STORED;

-- Create GIN index for full-text search
CREATE INDEX IF NOT EXISTS idx_attachments_search_vector
  ON attachments USING GIN(search_vector);

-- Create trigram indexes for fuzzy matching on file names
CREATE INDEX IF NOT EXISTS idx_attachments_file_name_trgm
  ON attachments USING GIN(file_name gin_trgm_ops);

-- Create covering index for search results
CREATE INDEX IF NOT EXISTS idx_attachments_search_covering
  ON attachments (id, file_name, description_en, description_ar, file_type, updated_at)
  WHERE deleted_at IS NULL;

-- Analyze table for query planner
ANALYZE attachments;
