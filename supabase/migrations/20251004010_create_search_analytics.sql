-- Migration: Create Search Analytics Tables
-- Feature: 015-search-retrieval-spec
-- Task: T014
-- Description: Create tables for tracking search queries and click analytics

-- Table: search_queries
-- Tracks individual search queries for analytics and "People also looked for" feature
CREATE TABLE IF NOT EXISTS search_queries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  query_text text NOT NULL,
  query_text_normalized text NOT NULL,
  language_detected text CHECK (language_detected IN ('en', 'ar', 'mixed')),
  filters jsonb DEFAULT '{}'::jsonb,
  results_count integer DEFAULT 0 CHECK (results_count >= 0),
  clicked_result_id uuid,
  clicked_result_type text CHECK (clicked_result_type IN ('dossier', 'person', 'engagement', 'position', 'document', 'brief')),
  clicked_rank integer CHECK (clicked_rank > 0),
  created_at timestamptz DEFAULT now()
);

-- Indexes for search_queries
CREATE INDEX IF NOT EXISTS idx_search_queries_user
  ON search_queries (user_id, created_at DESC)
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_search_queries_normalized
  ON search_queries (query_text_normalized);

CREATE INDEX IF NOT EXISTS idx_search_queries_clicks
  ON search_queries (query_text_normalized, clicked_result_id)
  WHERE clicked_result_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_search_queries_created_at
  ON search_queries (created_at DESC);

-- Table: search_click_aggregates
-- Aggregated co-click data for "People also looked for" suggestions
CREATE TABLE IF NOT EXISTS search_click_aggregates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  query_text_normalized text NOT NULL,
  followed_by_query_normalized text NOT NULL,
  co_occurrence_count integer DEFAULT 1 CHECK (co_occurrence_count > 0),
  last_updated timestamptz DEFAULT now(),
  UNIQUE (query_text_normalized, followed_by_query_normalized)
);

-- Indexes for search_click_aggregates
CREATE INDEX IF NOT EXISTS idx_click_aggregates_query
  ON search_click_aggregates (query_text_normalized, co_occurrence_count DESC);

CREATE INDEX IF NOT EXISTS idx_click_aggregates_count
  ON search_click_aggregates (co_occurrence_count DESC)
  WHERE co_occurrence_count >= 10;

-- Add comments
COMMENT ON TABLE search_queries IS 'Individual search query tracking for analytics';
COMMENT ON COLUMN search_queries.query_text IS 'Raw user input';
COMMENT ON COLUMN search_queries.query_text_normalized IS 'Normalized query (lowercase, trimmed) for aggregation';
COMMENT ON COLUMN search_queries.language_detected IS 'Auto-detected language: en, ar, or mixed';
COMMENT ON COLUMN search_queries.filters IS 'JSON object with applied filters (entity types, date ranges, etc.)';
COMMENT ON COLUMN search_queries.clicked_result_id IS 'ID of entity user clicked (if any)';
COMMENT ON COLUMN search_queries.clicked_rank IS 'Position in search results (1-based)';

COMMENT ON TABLE search_click_aggregates IS 'Aggregated co-click data for suggestion features';
COMMENT ON COLUMN search_click_aggregates.query_text_normalized IS 'Original search query';
COMMENT ON COLUMN search_click_aggregates.followed_by_query_normalized IS 'Subsequent search query within 5 minutes';
COMMENT ON COLUMN search_click_aggregates.co_occurrence_count IS 'Number of times this pattern occurred';

-- Enable Row Level Security
ALTER TABLE search_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_click_aggregates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for search_queries
-- Users can only see their own queries
CREATE POLICY search_queries_select_own
  ON search_queries FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own queries
CREATE POLICY search_queries_insert_own
  ON search_queries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can see all queries (for analytics)
CREATE POLICY search_queries_select_admin
  ON search_queries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM staff_profiles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- RLS Policies for search_click_aggregates
-- Anyone can read aggregates (anonymized data)
CREATE POLICY search_click_aggregates_select_all
  ON search_click_aggregates FOR SELECT
  TO authenticated
  USING (co_occurrence_count >= 10);

-- Only system can insert/update aggregates (via background job)
CREATE POLICY search_click_aggregates_modify_system
  ON search_click_aggregates FOR ALL
  USING (false)
  WITH CHECK (false);
