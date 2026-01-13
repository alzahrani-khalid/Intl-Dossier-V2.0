-- Migration: Semantic Search Expansion for All Dossier Types
-- Feature: semantic-search-expansion
-- Description: Extends pgvector semantic search to cover all dossier types
--              (country, organization, forum, theme) with unified ranking.
--              Supports natural language queries in English and Arabic.

-- ============================================================================
-- PART 1: Add embedding column to dossiers table
-- ============================================================================

-- Add embedding column to dossiers (covers country, organization, forum, theme)
ALTER TABLE dossiers ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- ============================================================================
-- PART 2: Create HNSW indexes for fast approximate nearest neighbor search
-- ============================================================================

-- Dossiers embedding index
CREATE INDEX IF NOT EXISTS idx_dossiers_embedding
  ON dossiers USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Partial index for non-null embeddings (more efficient)
CREATE INDEX IF NOT EXISTS idx_dossiers_embedding_not_null
  ON dossiers USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64)
  WHERE embedding IS NOT NULL;

-- ============================================================================
-- PART 3: Create unified semantic search function
-- ============================================================================

-- Drop existing function to recreate with expanded entity types
DROP FUNCTION IF EXISTS search_entities_semantic(text, vector(1536), real, integer);

-- Recreated function with all entity types
CREATE OR REPLACE FUNCTION search_entities_semantic(
  p_entity_type text,
  p_query_embedding vector(1536),
  p_similarity_threshold real DEFAULT 0.6,
  p_limit integer DEFAULT 20
)
RETURNS TABLE (
  entity_id uuid,
  entity_title text,
  entity_title_ar text,
  description_en text,
  description_ar text,
  similarity_score real,
  entity_type text,
  entity_subtype text,
  updated_at timestamptz,
  metadata jsonb
) AS $$
BEGIN
  -- Original entity types
  IF p_entity_type = 'positions' THEN
    RETURN QUERY
    SELECT
      p.id as entity_id,
      p.title_en as entity_title,
      p.title_ar as entity_title_ar,
      p.key_messages_en as description_en,
      p.key_messages_ar as description_ar,
      (1 - (p.embedding <=> p_query_embedding))::real as similarity_score,
      'position'::text as entity_type,
      NULL::text as entity_subtype,
      p.updated_at,
      jsonb_build_object('topic', p.topic, 'status', p.status) as metadata
    FROM positions p
    WHERE p.embedding IS NOT NULL
      AND (1 - (p.embedding <=> p_query_embedding)) >= p_similarity_threshold
      AND p.status = 'published'
    ORDER BY p.embedding <=> p_query_embedding
    LIMIT p_limit;

  ELSIF p_entity_type = 'documents' THEN
    RETURN QUERY
    SELECT
      a.id as entity_id,
      a.file_name as entity_title,
      a.file_name as entity_title_ar,
      a.description_en,
      a.description_ar,
      (1 - (a.embedding <=> p_query_embedding))::real as similarity_score,
      'document'::text as entity_type,
      a.file_type as entity_subtype,
      a.updated_at,
      jsonb_build_object('file_type', a.file_type, 'file_size', a.file_size) as metadata
    FROM attachments a
    WHERE a.embedding IS NOT NULL
      AND (1 - (a.embedding <=> p_query_embedding)) >= p_similarity_threshold
      AND a.deleted_at IS NULL
    ORDER BY a.embedding <=> p_query_embedding
    LIMIT p_limit;

  ELSIF p_entity_type = 'briefs' THEN
    RETURN QUERY
    SELECT
      b.id as entity_id,
      COALESCE((b.content_en->>'summary')::text, 'Brief') as entity_title,
      COALESCE((b.content_ar->>'summary')::text, 'ملخص') as entity_title_ar,
      (b.content_en->>'summary')::text as description_en,
      (b.content_ar->>'summary')::text as description_ar,
      (1 - (b.embedding <=> p_query_embedding))::real as similarity_score,
      'brief'::text as entity_type,
      b.generated_by as entity_subtype,
      b.generated_at as updated_at,
      jsonb_build_object('dossier_id', b.dossier_id, 'generated_by', b.generated_by) as metadata
    FROM briefs b
    WHERE b.embedding IS NOT NULL
      AND (1 - (b.embedding <=> p_query_embedding)) >= p_similarity_threshold
    ORDER BY b.embedding <=> p_query_embedding
    LIMIT p_limit;

  -- NEW: Dossiers (includes country, organization, forum, theme)
  ELSIF p_entity_type = 'dossiers' THEN
    RETURN QUERY
    SELECT
      d.id as entity_id,
      d.name_en as entity_title,
      d.name_ar as entity_title_ar,
      d.description_en,
      d.description_ar,
      (1 - (d.embedding <=> p_query_embedding))::real as similarity_score,
      'dossier'::text as entity_type,
      d.type as entity_subtype,
      d.updated_at,
      jsonb_build_object('type', d.type, 'status', d.status, 'sensitivity_level', d.sensitivity_level, 'tags', d.tags) as metadata
    FROM dossiers d
    WHERE d.embedding IS NOT NULL
      AND (1 - (d.embedding <=> p_query_embedding)) >= p_similarity_threshold
      AND d.is_active = true
    ORDER BY d.embedding <=> p_query_embedding
    LIMIT p_limit;

  -- Dossier type-specific searches (country, organization, forum, theme)
  ELSIF p_entity_type IN ('country', 'organization', 'forum', 'theme') THEN
    RETURN QUERY
    SELECT
      d.id as entity_id,
      d.name_en as entity_title,
      d.name_ar as entity_title_ar,
      d.description_en,
      d.description_ar,
      (1 - (d.embedding <=> p_query_embedding))::real as similarity_score,
      p_entity_type::text as entity_type,
      d.type as entity_subtype,
      d.updated_at,
      jsonb_build_object('type', d.type, 'status', d.status, 'sensitivity_level', d.sensitivity_level, 'tags', d.tags) as metadata
    FROM dossiers d
    WHERE d.embedding IS NOT NULL
      AND d.type = p_entity_type
      AND (1 - (d.embedding <=> p_query_embedding)) >= p_similarity_threshold
      AND d.is_active = true
    ORDER BY d.embedding <=> p_query_embedding
    LIMIT p_limit;

  ELSE
    RAISE EXCEPTION 'Unsupported entity type for semantic search: %. Supported types: positions, documents, briefs, dossiers, country, organization, forum, theme', p_entity_type;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- PART 4: Create unified multi-entity semantic search function
-- ============================================================================

CREATE OR REPLACE FUNCTION search_all_entities_semantic(
  p_query_embedding vector(1536),
  p_entity_types text[] DEFAULT ARRAY['dossiers', 'positions', 'documents', 'briefs'],
  p_similarity_threshold real DEFAULT 0.6,
  p_limit integer DEFAULT 50
)
RETURNS TABLE (
  entity_id uuid,
  entity_title text,
  entity_title_ar text,
  description_en text,
  description_ar text,
  similarity_score real,
  entity_type text,
  entity_subtype text,
  updated_at timestamptz,
  metadata jsonb,
  rank_position integer
) AS $$
DECLARE
  v_entity_type text;
  v_results_per_type integer;
BEGIN
  -- Calculate results per type (distribute limit across types)
  v_results_per_type := GREATEST(5, p_limit / array_length(p_entity_types, 1));

  -- Create temp table for results
  CREATE TEMP TABLE IF NOT EXISTS temp_search_results (
    entity_id uuid,
    entity_title text,
    entity_title_ar text,
    description_en text,
    description_ar text,
    similarity_score real,
    entity_type text,
    entity_subtype text,
    updated_at timestamptz,
    metadata jsonb
  ) ON COMMIT DROP;

  -- Clear any existing data
  DELETE FROM temp_search_results;

  -- Search each entity type
  FOREACH v_entity_type IN ARRAY p_entity_types
  LOOP
    BEGIN
      INSERT INTO temp_search_results
      SELECT * FROM search_entities_semantic(
        v_entity_type,
        p_query_embedding,
        p_similarity_threshold,
        v_results_per_type
      );
    EXCEPTION WHEN OTHERS THEN
      -- Log error but continue with other entity types
      RAISE WARNING 'Error searching %: %', v_entity_type, SQLERRM;
    END;
  END LOOP;

  -- Return sorted results with rank position
  RETURN QUERY
  SELECT
    t.entity_id,
    t.entity_title,
    t.entity_title_ar,
    t.description_en,
    t.description_ar,
    t.similarity_score,
    t.entity_type,
    t.entity_subtype,
    t.updated_at,
    t.metadata,
    ROW_NUMBER() OVER (ORDER BY t.similarity_score DESC)::integer as rank_position
  FROM temp_search_results t
  ORDER BY t.similarity_score DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- PART 5: Create embedding generation queue for dossiers
-- ============================================================================

-- First, update the entity_type check constraint to include dossier
ALTER TABLE embedding_update_queue DROP CONSTRAINT IF EXISTS embedding_update_queue_entity_type_check;
ALTER TABLE embedding_update_queue ADD CONSTRAINT embedding_update_queue_entity_type_check
  CHECK (entity_type = ANY (ARRAY[
    'positions'::text,
    'attachments'::text,
    'briefs'::text,
    'dossier'::text
  ]));

-- Second, ensure the embedding_update_queue table has a unique constraint on (entity_type, entity_id)
-- This is required for ON CONFLICT to work properly
DO $$
BEGIN
  -- Add unique constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'embedding_update_queue_entity_unique'
    AND conrelid = 'embedding_update_queue'::regclass
  ) THEN
    ALTER TABLE embedding_update_queue
    ADD CONSTRAINT embedding_update_queue_entity_unique
    UNIQUE (entity_type, entity_id);
  END IF;
END
$$;

-- Add dossier entries to embedding queue
INSERT INTO embedding_update_queue (entity_type, entity_id, priority, created_at)
SELECT 'dossier', id,
  CASE
    WHEN type = 'country' THEN 1  -- Countries are highest priority
    WHEN type = 'organization' THEN 2
    WHEN type = 'forum' THEN 3
    ELSE 4
  END,
  now()
FROM dossiers
WHERE embedding IS NULL
  AND is_active = true
ON CONFLICT (entity_type, entity_id) DO NOTHING;

-- ============================================================================
-- PART 6: Create triggers for automatic embedding queue updates
-- ============================================================================

-- Trigger function for dossiers
CREATE OR REPLACE FUNCTION queue_dossier_embedding_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Only queue if content changed that affects embedding
  IF TG_OP = 'INSERT' OR
     OLD.name_en IS DISTINCT FROM NEW.name_en OR
     OLD.name_ar IS DISTINCT FROM NEW.name_ar OR
     OLD.description_en IS DISTINCT FROM NEW.description_en OR
     OLD.description_ar IS DISTINCT FROM NEW.description_ar THEN

    INSERT INTO embedding_update_queue (entity_type, entity_id, priority, created_at)
    VALUES ('dossier', NEW.id,
      CASE
        WHEN NEW.type = 'country' THEN 1
        WHEN NEW.type = 'organization' THEN 2
        WHEN NEW.type = 'forum' THEN 3
        ELSE 4
      END,
      now())
    ON CONFLICT (entity_type, entity_id)
    DO UPDATE SET created_at = now(), processed_at = NULL, error_message = NULL, retry_count = 0;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for dossiers
DROP TRIGGER IF EXISTS trg_queue_dossier_embedding ON dossiers;
CREATE TRIGGER trg_queue_dossier_embedding
  AFTER INSERT OR UPDATE ON dossiers
  FOR EACH ROW
  EXECUTE FUNCTION queue_dossier_embedding_update();

-- ============================================================================
-- PART 7: Add indexes for hybrid search optimization
-- ============================================================================

-- Composite index for dossier searches (type + is_active + embedding)
CREATE INDEX IF NOT EXISTS idx_dossiers_semantic_search
  ON dossiers (type, is_active)
  WHERE embedding IS NOT NULL;

-- ============================================================================
-- PART 8: Update search analytics to track semantic searches
-- ============================================================================

-- Add semantic search tracking columns to search_analytics if they don't exist
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'search_analytics') THEN
    ALTER TABLE search_analytics ADD COLUMN IF NOT EXISTS search_mode text DEFAULT 'fulltext';
    ALTER TABLE search_analytics ADD COLUMN IF NOT EXISTS embedding_model text;
    ALTER TABLE search_analytics ADD COLUMN IF NOT EXISTS similarity_threshold real;
  END IF;
END
$$;

-- ============================================================================
-- PART 9: Analyze tables for query planner
-- ============================================================================

ANALYZE dossiers;

-- Comments
COMMENT ON FUNCTION search_entities_semantic IS 'Semantic search using vector embeddings for all entity types including dossiers (country, organization, forum, theme)';
COMMENT ON FUNCTION search_all_entities_semantic IS 'Unified semantic search across multiple entity types with cross-entity result blending and ranking';
