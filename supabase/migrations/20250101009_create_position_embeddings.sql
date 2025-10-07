-- Migration: Create position_embeddings table
-- Feature: 011-positions-talking-points
-- Task: T009

-- Create position_embeddings table
CREATE TABLE IF NOT EXISTS position_embeddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  position_id uuid NOT NULL REFERENCES positions(id) ON DELETE CASCADE,

  -- Vector embeddings (1536 dimensions for OpenAI/AnythingLLM)
  content_en_embedding vector(1536),
  content_ar_embedding vector(1536),

  -- Audit
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- Ensure one embedding per position
  CONSTRAINT unique_position_embedding UNIQUE (position_id)
);

-- Add comments
COMMENT ON TABLE position_embeddings IS 'Vector embeddings for semantic similarity search in consistency checking';
COMMENT ON COLUMN position_embeddings.content_en_embedding IS 'pgvector(1536) for English content';
COMMENT ON COLUMN position_embeddings.content_ar_embedding IS 'pgvector(1536) for Arabic content';
COMMENT ON COLUMN position_embeddings.updated_at IS 'Last embedding generation timestamp';

-- Create ivfflat indexes for vector similarity search
-- Using cosine distance for semantic similarity
CREATE INDEX idx_position_embeddings_en_vector
  ON position_embeddings
  USING ivfflat (content_en_embedding vector_cosine_ops)
  WITH (lists = 100);

CREATE INDEX idx_position_embeddings_ar_vector
  ON position_embeddings
  USING ivfflat (content_ar_embedding vector_cosine_ops)
  WITH (lists = 100);

-- Create standard index on position_id for lookups
CREATE INDEX idx_position_embeddings_position_id ON position_embeddings(position_id);

-- Create trigger to update updated_at on embedding changes
CREATE OR REPLACE FUNCTION update_embedding_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_position_embeddings_timestamp
  BEFORE UPDATE ON position_embeddings
  FOR EACH ROW
  EXECUTE FUNCTION update_embedding_timestamp();
