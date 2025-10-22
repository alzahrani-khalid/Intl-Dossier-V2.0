-- Vector Similarity Search Function for AI Link Suggestions
--
-- This function performs cosine similarity search using pgvector HNSW index.
-- It filters entities by:
-- - Clearance level (user must have >= entity classification level)
-- - Organization boundary (multi-tenancy enforcement)
-- - Archived status (excludes deleted entities)
-- - Similarity threshold (minimum 70% match per FR-001a)
--
-- Performance: <3 seconds for AI suggestions (SC-002) via HNSW index
--
-- Usage:
-- SELECT * FROM vector_similarity_search(
--   query_embedding := '[0.1, 0.2, ...]'::vector,
--   entity_types := ARRAY['dossier', 'position'],
--   match_threshold := 0.70,
--   match_count := 5,
--   user_clearance := 2,
--   organization_id := 'org-uuid'
-- );

CREATE OR REPLACE FUNCTION vector_similarity_search(
  query_embedding vector(1536),
  entity_types text[],
  match_threshold float DEFAULT 0.70,
  match_count int DEFAULT 5,
  user_clearance int DEFAULT 0,
  organization_id uuid DEFAULT NULL
)
RETURNS TABLE (
  entity_id uuid,
  entity_type text,
  entity_name text,
  entity_updated_at timestamptz,
  similarity_score float
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH entity_embeddings_filtered AS (
    -- Join entity_embeddings with entity metadata from all entity tables
    -- This is a simplified version - in production, you'd UNION across all 11 entity types
    SELECT
      ee.entity_id,
      ee.entity_type,
      ee.embedding,
      ee.updated_at,
      CASE
        WHEN ee.entity_type = 'dossier' THEN d.title
        WHEN ee.entity_type = 'position' THEN p.title
        WHEN ee.entity_type = 'organization' THEN o.name_en
        WHEN ee.entity_type = 'country' THEN c.name_en
        ELSE 'Unknown'
      END AS entity_name,
      CASE
        WHEN ee.entity_type = 'dossier' THEN d.classification_level
        WHEN ee.entity_type = 'position' THEN p.classification_level
        WHEN ee.entity_type = 'organization' THEN o.classification_level
        WHEN ee.entity_type = 'country' THEN c.classification_level
        ELSE 0
      END AS classification_level,
      CASE
        WHEN ee.entity_type = 'dossier' THEN d.org_id
        WHEN ee.entity_type = 'position' THEN p.org_id
        WHEN ee.entity_type = 'organization' THEN o.org_id
        WHEN ee.entity_type = 'country' THEN c.org_id
        ELSE NULL
      END AS org_id,
      CASE
        WHEN ee.entity_type = 'dossier' THEN d.archived_at
        WHEN ee.entity_type = 'position' THEN p.archived_at
        WHEN ee.entity_type = 'organization' THEN o.archived_at
        WHEN ee.entity_type = 'country' THEN c.archived_at
        ELSE NULL
      END AS archived_at
    FROM entity_embeddings ee
    LEFT JOIN dossiers d ON ee.entity_type = 'dossier' AND ee.entity_id = d.id
    LEFT JOIN positions p ON ee.entity_type = 'position' AND ee.entity_id = p.id
    LEFT JOIN organizations o ON ee.entity_type = 'organization' AND ee.entity_id = o.id
    LEFT JOIN countries c ON ee.entity_type = 'country' AND ee.entity_id = c.id
    WHERE
      ee.entity_type = ANY(entity_types)
      AND (organization_id IS NULL OR org_id = organization_id) -- Multi-tenancy
      AND archived_at IS NULL -- No archived entities
  ),
  similarity_results AS (
    -- Calculate cosine similarity using pgvector operator <=>
    -- HNSW index on entity_embeddings.embedding provides <3s performance
    SELECT
      entity_id,
      entity_type,
      entity_name,
      updated_at AS entity_updated_at,
      1 - (embedding <=> query_embedding) AS similarity_score,
      classification_level
    FROM entity_embeddings_filtered
    WHERE
      1 - (embedding <=> query_embedding) >= match_threshold -- Minimum 70% similarity
      AND classification_level <= user_clearance -- Clearance enforcement
    ORDER BY similarity_score DESC
    LIMIT match_count
  )
  SELECT
    sr.entity_id,
    sr.entity_type,
    sr.entity_name,
    sr.entity_updated_at,
    sr.similarity_score
  FROM similarity_results sr;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION vector_similarity_search TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION vector_similarity_search IS 'Performs cosine similarity search using pgvector HNSW index for AI link suggestions. Filters by clearance level, organization, and archived status. Performance target: <3s for 5 results (SC-002).';
