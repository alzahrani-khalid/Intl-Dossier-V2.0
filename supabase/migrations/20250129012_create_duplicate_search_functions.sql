-- Migration: Create duplicate detection functions using pgvector
-- Created: 2025-01-29
-- Feature: 008-front-door-intake

-- Function to search for duplicate tickets using vector similarity
CREATE OR REPLACE FUNCTION search_duplicate_tickets(
  p_embedding vector(1024),
  p_exclude_ticket_id UUID,
  p_threshold FLOAT DEFAULT 0.65,
  p_include_resolved BOOLEAN DEFAULT FALSE,
  p_limit INTEGER DEFAULT 10
) RETURNS TABLE (
  ticket_id UUID,
  ticket_number TEXT,
  title TEXT,
  similarity_score FLOAT,
  title_similarity FLOAT,
  metadata_similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id AS ticket_id,
    t.ticket_number,
    t.title,
    (1 - (e.embedding <=> p_embedding)) AS similarity_score,
    similarity(t.title, (SELECT title FROM intake_tickets WHERE id = p_exclude_ticket_id)) AS title_similarity,
    CASE
      WHEN t.request_type = (SELECT request_type FROM intake_tickets WHERE id = p_exclude_ticket_id)
      THEN 1.0
      ELSE 0.0
    END AS metadata_similarity
  FROM intake_tickets t
  INNER JOIN ai_embeddings e
    ON e.owner_type = 'ticket'
    AND e.owner_id = t.id
  WHERE
    t.id != p_exclude_ticket_id
    AND (p_include_resolved OR t.status NOT IN ('closed', 'merged', 'converted'))
    AND (1 - (e.embedding <=> p_embedding)) >= p_threshold
  ORDER BY (1 - (e.embedding <=> p_embedding)) DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for fallback keyword-based search
CREATE OR REPLACE FUNCTION search_tickets_by_keywords(
  p_keywords TEXT,
  p_exclude_ticket_id UUID,
  p_limit INTEGER DEFAULT 10
) RETURNS TABLE (
  ticket_id UUID,
  ticket_number TEXT,
  title TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id AS ticket_id,
    t.ticket_number,
    t.title
  FROM intake_tickets t
  WHERE
    t.id != p_exclude_ticket_id
    AND t.status NOT IN ('closed', 'merged', 'converted')
    AND (
      to_tsvector('english', t.title) @@ plainto_tsquery('english', p_keywords)
      OR to_tsvector('arabic', t.title_ar) @@ plainto_tsquery('arabic', p_keywords)
      OR t.title ILIKE '%' || p_keywords || '%'
      OR t.title_ar ILIKE '%' || p_keywords || '%'
    )
  ORDER BY
    ts_rank(to_tsvector('english', t.title), plainto_tsquery('english', p_keywords)) DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Install pg_trgm extension for similarity function
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION search_duplicate_tickets TO authenticated;
GRANT EXECUTE ON FUNCTION search_tickets_by_keywords TO authenticated;

-- Add comments
COMMENT ON FUNCTION search_duplicate_tickets IS 'Search for duplicate tickets using pgvector cosine similarity';
COMMENT ON FUNCTION search_tickets_by_keywords IS 'Fallback keyword-based search for duplicates when vector search fails';