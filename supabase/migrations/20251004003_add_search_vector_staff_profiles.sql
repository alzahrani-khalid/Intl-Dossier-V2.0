-- Migration: Add Search Vector to Staff Profiles
-- Feature: 015-search-retrieval-spec
-- Task: T007
-- Description: Add tsvector column with weighted search vectors and trigram indexes

-- Add search_vector column with weighted tsvectors
ALTER TABLE staff_profiles ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(full_name_en, '')), 'A') ||
    setweight(to_tsvector('arabic', coalesce(full_name_ar, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(title_en, '')), 'B') ||
    setweight(to_tsvector('arabic', coalesce(title_ar, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(notes_en, '')), 'C') ||
    setweight(to_tsvector('arabic', coalesce(notes_ar, '')), 'C')
  ) STORED;

-- Create GIN index for full-text search
CREATE INDEX IF NOT EXISTS idx_staff_profiles_search_vector
  ON staff_profiles USING GIN(search_vector);

-- Create trigram indexes for fuzzy matching on names
CREATE INDEX IF NOT EXISTS idx_staff_profiles_full_name_en_trgm
  ON staff_profiles USING GIN(full_name_en gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_staff_profiles_full_name_ar_trgm
  ON staff_profiles USING GIN(full_name_ar gin_trgm_ops);

-- Create covering index for search results
CREATE INDEX IF NOT EXISTS idx_staff_profiles_search_covering
  ON staff_profiles (id, full_name_en, full_name_ar, title_en, title_ar, updated_at)
  WHERE status = 'active';

-- Analyze table for query planner
ANALYZE staff_profiles;
