-- Migration: Add trigram-based duplicate search function
-- Created: 2025-09-30
-- Feature: 008-front-door-intake (T069)
-- Purpose: Implement graceful AI degradation with trigram similarity fallback

-- Ensure pg_trgm extension is installed
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Function for trigram similarity-based duplicate search
-- This is the second fallback when pgvector is unavailable
CREATE OR REPLACE FUNCTION search_tickets_by_trigram(
  p_title TEXT,
  p_description TEXT,
  p_exclude_ticket_id UUID,
  p_threshold FLOAT DEFAULT 0.3,
  p_limit INTEGER DEFAULT 10
) RETURNS TABLE (
  ticket_id UUID,
  ticket_number TEXT,
  title TEXT,
  similarity_score FLOAT,
  content_similarity FLOAT,
  metadata_similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id AS ticket_id,
    t.ticket_number,
    t.title,
    -- Calculate weighted similarity score
    (
      (similarity(t.title, p_title) * 0.5) +
      (similarity(COALESCE(t.description, ''), p_description) * 0.3) +
      (similarity(COALESCE(t.title_ar, ''), p_title) * 0.2)
    ) AS similarity_score,
    similarity(COALESCE(t.description, ''), p_description) AS content_similarity,
    CASE
      WHEN t.request_type = (SELECT request_type FROM intake_tickets WHERE id = p_exclude_ticket_id)
      THEN 0.5
      ELSE 0.0
    END AS metadata_similarity
  FROM intake_tickets t
  WHERE
    t.id != p_exclude_ticket_id
    AND t.status NOT IN ('closed', 'merged', 'converted')
    -- At least one field must meet threshold
    AND (
      similarity(t.title, p_title) >= p_threshold
      OR similarity(COALESCE(t.description, ''), p_description) >= p_threshold
      OR similarity(COALESCE(t.title_ar, ''), p_title) >= p_threshold
    )
  ORDER BY similarity_score DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create GIN indexes on title and description for better trigram performance
CREATE INDEX IF NOT EXISTS idx_tickets_title_trgm
  ON intake_tickets USING GIN (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_tickets_title_ar_trgm
  ON intake_tickets USING GIN (title_ar gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_tickets_description_trgm
  ON intake_tickets USING GIN (description gin_trgm_ops);

-- Grant execute permission
GRANT EXECUTE ON FUNCTION search_tickets_by_trigram TO authenticated;

-- Add comment
COMMENT ON FUNCTION search_tickets_by_trigram IS
  'Trigram-based duplicate search (fallback level 2 when pgvector unavailable) - FR-010 graceful AI degradation';