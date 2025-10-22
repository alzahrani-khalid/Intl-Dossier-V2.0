-- Migration: Create entity_embeddings table
-- Feature: 024-intake-entity-linking
-- Task: T012

CREATE TABLE IF NOT EXISTS entity_embeddings (
  -- Identity (composite primary key)
  entity_type TEXT NOT NULL CHECK (entity_type IN (
    'dossier', 'position', 'mou', 'engagement', 'assignment',
    'commitment', 'intelligence_signal', 'organization',
    'country', 'forum', 'working_group', 'topic'
  )),
  entity_id UUID NOT NULL,
  PRIMARY KEY (entity_type, entity_id),

  -- Vector data
  embedding vector(1536),

  -- Metadata for search ranking
  metadata JSONB NOT NULL, -- {name, description, classification_level, last_linked_at, org_id}

  -- Model tracking
  text_hash TEXT NOT NULL,
  model_version TEXT NOT NULL DEFAULT 'text-embedding-ada-002',

  -- Audit
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add comments
COMMENT ON TABLE entity_embeddings IS 'Vector embeddings for all entities to enable reverse semantic search (find entities relevant to an intake)';
COMMENT ON COLUMN entity_embeddings.embedding IS '1536-dimensional vector embedding';
COMMENT ON COLUMN entity_embeddings.metadata IS 'Cached entity metadata for ranking: {name, description, classification_level, last_linked_at, org_id}';
COMMENT ON COLUMN entity_embeddings.text_hash IS 'SHA256 hash for change detection';
