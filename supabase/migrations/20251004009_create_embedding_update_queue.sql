-- Migration: Create Embedding Update Queue
-- Feature: 015-search-retrieval-spec
-- Task: T013
-- Description: Create queue table to track entities needing embedding generation

CREATE TABLE IF NOT EXISTS embedding_update_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL CHECK (entity_type IN ('positions', 'attachments', 'briefs')),
  entity_id uuid NOT NULL,
  priority integer DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz,
  error_message text,
  retry_count integer DEFAULT 0 CHECK (retry_count >= 0)
);

-- Create index on unprocessed items ordered by created_at for queue processing
CREATE INDEX IF NOT EXISTS idx_embedding_queue_processing
  ON embedding_update_queue (created_at)
  WHERE processed_at IS NULL;

-- Create index on entity_type and entity_id for conflict checks
CREATE INDEX IF NOT EXISTS idx_embedding_queue_entity
  ON embedding_update_queue (entity_type, entity_id)
  WHERE processed_at IS NULL;

-- Create index on priority for prioritized processing
CREATE INDEX IF NOT EXISTS idx_embedding_queue_priority
  ON embedding_update_queue (priority DESC, created_at ASC)
  WHERE processed_at IS NULL;

-- Create unique constraint to prevent duplicate unprocessed queue entries
CREATE UNIQUE INDEX IF NOT EXISTS idx_embedding_queue_unique_unprocessed
  ON embedding_update_queue (entity_type, entity_id)
  WHERE processed_at IS NULL;

-- Add comment to table
COMMENT ON TABLE embedding_update_queue IS 'Queue for tracking entities that need vector embedding generation or updates';
COMMENT ON COLUMN embedding_update_queue.entity_type IS 'Table name: positions, attachments, or briefs';
COMMENT ON COLUMN embedding_update_queue.entity_id IS 'UUID of the entity record';
COMMENT ON COLUMN embedding_update_queue.priority IS 'Processing priority: 1=highest, 10=lowest';
COMMENT ON COLUMN embedding_update_queue.processed_at IS 'Timestamp when embedding was successfully generated';
COMMENT ON COLUMN embedding_update_queue.retry_count IS 'Number of retry attempts after failures';
