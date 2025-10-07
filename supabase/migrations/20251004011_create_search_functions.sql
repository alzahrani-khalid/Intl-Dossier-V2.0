-- Migration: Create Search Database Functions
-- Feature: 015-search-retrieval-spec
-- Task: T015
-- Description: Create functions for full-text and semantic search

-- Function: search_entities_fulltext
-- Performs full-text search across an entity type with ranking and snippets
CREATE OR REPLACE FUNCTION search_entities_fulltext(
  p_entity_type text,
  p_query text,
  p_language text DEFAULT 'english',
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  entity_id uuid,
  entity_title_en text,
  entity_title_ar text,
  entity_snippet_en text,
  entity_snippet_ar text,
  rank_score real,
  entity_type text,
  updated_at timestamptz
) AS $$
DECLARE
  v_table_name text;
  v_tsquery tsquery;
BEGIN
  -- Sanitize entity type to prevent SQL injection
  v_table_name := CASE p_entity_type
    WHEN 'dossiers' THEN 'dossiers'
    WHEN 'people' THEN 'staff_profiles'
    WHEN 'engagements' THEN 'engagements'
    WHEN 'positions' THEN 'positions'
    WHEN 'documents' THEN 'attachments'
    WHEN 'external_contacts' THEN 'external_contacts'
    ELSE NULL
  END;

  IF v_table_name IS NULL THEN
    RAISE EXCEPTION 'Invalid entity type: %. Must be one of: dossiers, people, engagements, positions, documents, external_contacts', p_entity_type;
  END IF;

  -- Convert query to tsquery with proper language configuration
  BEGIN
    v_tsquery := plainto_tsquery(p_language, p_query);
  EXCEPTION WHEN OTHERS THEN
    -- Fallback to simple query if parsing fails
    v_tsquery := plainto_tsquery('simple', p_query);
  END;

  -- Execute search based on entity type
  IF v_table_name = 'dossiers' THEN
    RETURN QUERY
    SELECT
      d.id as entity_id,
      d.title_en as entity_title_en,
      d.title_ar as entity_title_ar,
      ts_headline(p_language, COALESCE(d.summary_en, ''), v_tsquery, 'StartSel=<mark>, StopSel=</mark>, MaxWords=50, MinWords=15') as entity_snippet_en,
      ts_headline('arabic', COALESCE(d.summary_ar, ''), v_tsquery, 'StartSel=<mark>, StopSel=</mark>, MaxWords=50, MinWords=15') as entity_snippet_ar,
      ts_rank_cd(d.search_vector, v_tsquery) as rank_score,
      'dossier'::text as entity_type,
      d.updated_at
    FROM dossiers d
    WHERE d.search_vector @@ v_tsquery
    ORDER BY rank_score DESC, d.updated_at DESC
    LIMIT p_limit OFFSET p_offset;

  ELSIF v_table_name = 'staff_profiles' THEN
    RETURN QUERY
    SELECT
      s.id as entity_id,
      s.full_name_en as entity_title_en,
      s.full_name_ar as entity_title_ar,
      ts_headline(p_language, COALESCE(s.title_en, ''), v_tsquery, 'StartSel=<mark>, StopSel=</mark>') as entity_snippet_en,
      ts_headline('arabic', COALESCE(s.title_ar, ''), v_tsquery, 'StartSel=<mark>, StopSel=</mark>') as entity_snippet_ar,
      ts_rank_cd(s.search_vector, v_tsquery) as rank_score,
      'person'::text as entity_type,
      s.updated_at
    FROM staff_profiles s
    WHERE s.search_vector @@ v_tsquery
    ORDER BY rank_score DESC, s.updated_at DESC
    LIMIT p_limit OFFSET p_offset;

  ELSIF v_table_name = 'engagements' THEN
    RETURN QUERY
    SELECT
      e.id as entity_id,
      e.title_en as entity_title_en,
      e.title_ar as entity_title_ar,
      ts_headline(p_language, COALESCE(e.description_en, ''), v_tsquery, 'StartSel=<mark>, StopSel=</mark>, MaxWords=50, MinWords=15') as entity_snippet_en,
      ts_headline('arabic', COALESCE(e.description_ar, ''), v_tsquery, 'StartSel=<mark>, StopSel=</mark>, MaxWords=50, MinWords=15') as entity_snippet_ar,
      ts_rank_cd(e.search_vector, v_tsquery) as rank_score,
      'engagement'::text as entity_type,
      e.updated_at
    FROM engagements e
    WHERE e.search_vector @@ v_tsquery
    ORDER BY rank_score DESC, e.updated_at DESC
    LIMIT p_limit OFFSET p_offset;

  ELSIF v_table_name = 'positions' THEN
    RETURN QUERY
    SELECT
      p.id as entity_id,
      p.title_en as entity_title_en,
      p.title_ar as entity_title_ar,
      ts_headline(p_language, COALESCE(p.key_messages_en, ''), v_tsquery, 'StartSel=<mark>, StopSel=</mark>, MaxWords=50, MinWords=15') as entity_snippet_en,
      ts_headline('arabic', COALESCE(p.key_messages_ar, ''), v_tsquery, 'StartSel=<mark>, StopSel=</mark>, MaxWords=50, MinWords=15') as entity_snippet_ar,
      ts_rank_cd(p.search_vector, v_tsquery) as rank_score,
      'position'::text as entity_type,
      p.updated_at
    FROM positions p
    WHERE p.search_vector @@ v_tsquery
    AND p.status = 'published'
    ORDER BY rank_score DESC, p.updated_at DESC
    LIMIT p_limit OFFSET p_offset;

  ELSIF v_table_name = 'attachments' THEN
    RETURN QUERY
    SELECT
      a.id as entity_id,
      a.file_name as entity_title_en,
      a.file_name as entity_title_ar,
      ts_headline(p_language, COALESCE(a.description_en, ''), v_tsquery, 'StartSel=<mark>, StopSel=</mark>, MaxWords=50, MinWords=15') as entity_snippet_en,
      ts_headline('arabic', COALESCE(a.description_ar, ''), v_tsquery, 'StartSel=<mark>, StopSel=</mark>, MaxWords=50, MinWords=15') as entity_snippet_ar,
      ts_rank_cd(a.search_vector, v_tsquery) as rank_score,
      'document'::text as entity_type,
      a.updated_at
    FROM attachments a
    WHERE a.search_vector @@ v_tsquery
    AND a.deleted_at IS NULL
    ORDER BY rank_score DESC, a.updated_at DESC
    LIMIT p_limit OFFSET p_offset;

  ELSIF v_table_name = 'external_contacts' THEN
    RETURN QUERY
    SELECT
      ec.id as entity_id,
      ec.full_name_en as entity_title_en,
      ec.full_name_ar as entity_title_ar,
      ts_headline(p_language, COALESCE(ec.title_en, ''), v_tsquery, 'StartSel=<mark>, StopSel=</mark>') as entity_snippet_en,
      ts_headline('arabic', COALESCE(ec.title_ar, ''), v_tsquery, 'StartSel=<mark>, StopSel=</mark>') as entity_snippet_ar,
      ts_rank_cd(ec.search_vector, v_tsquery) as rank_score,
      'person'::text as entity_type,
      ec.updated_at
    FROM external_contacts ec
    WHERE ec.search_vector @@ v_tsquery
    ORDER BY rank_score DESC, ec.updated_at DESC
    LIMIT p_limit OFFSET p_offset;

  END IF;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function: search_entities_semantic
-- Performs semantic search using vector embeddings
CREATE OR REPLACE FUNCTION search_entities_semantic(
  p_entity_type text,
  p_query_embedding vector(1536),
  p_similarity_threshold real DEFAULT 0.6,
  p_limit integer DEFAULT 20
)
RETURNS TABLE (
  entity_id uuid,
  entity_title_en text,
  entity_title_ar text,
  similarity_score real,
  entity_type text,
  updated_at timestamptz
) AS $$
DECLARE
  v_table_name text;
BEGIN
  -- Sanitize entity type (only tables with embeddings)
  v_table_name := CASE p_entity_type
    WHEN 'positions' THEN 'positions'
    WHEN 'documents' THEN 'attachments'
    WHEN 'briefs' THEN 'briefs'
    ELSE NULL
  END;

  IF v_table_name IS NULL THEN
    RAISE EXCEPTION 'Entity type does not support semantic search: %. Must be one of: positions, documents, briefs', p_entity_type;
  END IF;

  -- Execute vector search based on entity type
  IF v_table_name = 'positions' THEN
    RETURN QUERY
    SELECT
      p.id as entity_id,
      p.title_en as entity_title_en,
      p.title_ar as entity_title_ar,
      (1 - (p.embedding <=> p_query_embedding))::real as similarity_score,
      'position'::text as entity_type,
      p.updated_at
    FROM positions p
    WHERE p.embedding IS NOT NULL
      AND (1 - (p.embedding <=> p_query_embedding)) >= p_similarity_threshold
      AND p.status = 'published'
    ORDER BY p.embedding <=> p_query_embedding
    LIMIT p_limit;

  ELSIF v_table_name = 'attachments' THEN
    RETURN QUERY
    SELECT
      a.id as entity_id,
      a.file_name as entity_title_en,
      a.file_name as entity_title_ar,
      (1 - (a.embedding <=> p_query_embedding))::real as similarity_score,
      'document'::text as entity_type,
      a.updated_at
    FROM attachments a
    WHERE a.embedding IS NOT NULL
      AND (1 - (a.embedding <=> p_query_embedding)) >= p_similarity_threshold
      AND a.deleted_at IS NULL
    ORDER BY a.embedding <=> p_query_embedding
    LIMIT p_limit;

  ELSIF v_table_name = 'briefs' THEN
    RETURN QUERY
    SELECT
      b.id as entity_id,
      b.title_en as entity_title_en,
      b.title_ar as entity_title_ar,
      (1 - (b.embedding <=> p_query_embedding))::real as similarity_score,
      'brief'::text as entity_type,
      b.updated_at
    FROM briefs b
    WHERE b.embedding IS NOT NULL
      AND (1 - (b.embedding <=> p_query_embedding)) >= p_similarity_threshold
    ORDER BY b.embedding <=> p_query_embedding
    LIMIT p_limit;

  END IF;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Add comments
COMMENT ON FUNCTION search_entities_fulltext IS 'Full-text search across entity types with ranking and snippet generation';
COMMENT ON FUNCTION search_entities_semantic IS 'Semantic search using vector embeddings for positions, documents, and briefs';
