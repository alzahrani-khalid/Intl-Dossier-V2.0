-- Migration: Create Embedding Queue Triggers
-- Feature: 015-search-retrieval-spec
-- Task: T016
-- Description: Create triggers to automatically queue entities for embedding updates

-- Trigger function to queue embedding updates
CREATE OR REPLACE FUNCTION trg_queue_embedding_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Only queue if title/description changed or new record
  IF (TG_OP = 'INSERT') OR
     (OLD.title_en IS DISTINCT FROM NEW.title_en) OR
     (OLD.title_ar IS DISTINCT FROM NEW.title_ar) OR
     (OLD.description_en IS DISTINCT FROM NEW.description_en) OR
     (OLD.description_ar IS DISTINCT FROM NEW.description_ar) OR
     (TG_TABLE_NAME = 'positions' AND (
       OLD.key_messages_en IS DISTINCT FROM NEW.key_messages_en OR
       OLD.key_messages_ar IS DISTINCT FROM NEW.key_messages_ar
     )) OR
     (TG_TABLE_NAME = 'attachments' AND (
       OLD.file_name IS DISTINCT FROM NEW.file_name
     )) THEN

    -- Insert into queue with conflict handling
    INSERT INTO embedding_update_queue (entity_type, entity_id, priority, created_at, retry_count)
    VALUES (TG_TABLE_NAME, NEW.id, 5, now(), 0)
    ON CONFLICT (entity_type, entity_id) WHERE processed_at IS NULL
    DO UPDATE SET
      created_at = now(),
      retry_count = 0,
      error_message = NULL;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to positions table
DROP TRIGGER IF EXISTS trg_positions_embedding_update ON positions;
CREATE TRIGGER trg_positions_embedding_update
AFTER INSERT OR UPDATE OF title_en, title_ar, description_en, description_ar, key_messages_en, key_messages_ar
ON positions
FOR EACH ROW
EXECUTE FUNCTION trg_queue_embedding_update();

-- Apply trigger to attachments table
DROP TRIGGER IF EXISTS trg_attachments_embedding_update ON attachments;
CREATE TRIGGER trg_attachments_embedding_update
AFTER INSERT OR UPDATE OF file_name, description_en, description_ar
ON attachments
FOR EACH ROW
EXECUTE FUNCTION trg_queue_embedding_update();

-- Apply trigger to briefs table
DROP TRIGGER IF EXISTS trg_briefs_embedding_update ON briefs;
CREATE TRIGGER trg_briefs_embedding_update
AFTER INSERT OR UPDATE OF title_en, title_ar, description_en, description_ar
ON briefs
FOR EACH ROW
EXECUTE FUNCTION trg_queue_embedding_update();

-- Add comment
COMMENT ON FUNCTION trg_queue_embedding_update IS 'Automatically queue entities for vector embedding generation when content changes';
