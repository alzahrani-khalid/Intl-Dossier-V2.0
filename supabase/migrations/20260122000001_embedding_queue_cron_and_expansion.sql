-- Migration: Embedding Queue Cron Job and Entity Type Expansion
-- Feature: ai-features-reenablement
-- Description: Setup pg_cron to call Edge Function for async embedding processing
--              and expand queue to support additional entity types

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Expand entity_type constraint to support more entities
ALTER TABLE embedding_update_queue
DROP CONSTRAINT IF EXISTS embedding_update_queue_entity_type_check;

ALTER TABLE embedding_update_queue
ADD CONSTRAINT embedding_update_queue_entity_type_check
CHECK (entity_type IN (
  'positions',
  'attachments',
  'briefs',
  'dossiers',
  'staff_profiles',
  'engagements',
  'external_contacts'
));

-- Add embedding_updated_at column to tables that don't have it
-- (Using DO block for safe ALTER)
DO $$
BEGIN
  -- dossiers
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'dossiers' AND column_name = 'embedding_updated_at'
  ) THEN
    ALTER TABLE dossiers ADD COLUMN embedding_updated_at timestamptz;
  END IF;

  -- staff_profiles
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'staff_profiles' AND column_name = 'embedding_updated_at'
  ) THEN
    ALTER TABLE staff_profiles ADD COLUMN embedding_updated_at timestamptz;
  END IF;

  -- engagements
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'engagements' AND column_name = 'embedding_updated_at'
  ) THEN
    ALTER TABLE engagements ADD COLUMN embedding_updated_at timestamptz;
  END IF;

  -- external_contacts
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'external_contacts' AND column_name = 'embedding_updated_at'
  ) THEN
    ALTER TABLE external_contacts ADD COLUMN embedding_updated_at timestamptz;
  END IF;
END $$;

-- Create function to invoke the embedding edge function
CREATE OR REPLACE FUNCTION process_embedding_queue()
RETURNS void AS $$
DECLARE
  edge_function_url text;
  service_role_key text;
  response_status int;
BEGIN
  -- Get Supabase configuration from vault or environment
  -- Note: In production, use vault secrets or environment variables
  edge_function_url := current_setting('app.supabase_url', true) || '/functions/v1/embeddings-generate/batch';
  service_role_key := current_setting('app.supabase_service_role_key', true);

  -- Skip if not configured
  IF edge_function_url IS NULL OR service_role_key IS NULL THEN
    RAISE NOTICE 'Embedding queue processor: Supabase configuration not found';
    RETURN;
  END IF;

  -- Call the edge function using http extension
  -- Note: pg_http extension must be enabled
  BEGIN
    SELECT status INTO response_status
    FROM http((
      'POST',
      edge_function_url,
      ARRAY[http_header('Authorization', 'Bearer ' || service_role_key)],
      'application/json',
      '{"limit": 50}'
    )::http_request);

    IF response_status >= 400 THEN
      RAISE WARNING 'Embedding queue processor returned status: %', response_status;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- Log error but don't fail the cron job
    RAISE WARNING 'Embedding queue processor error: %', SQLERRM;
  END;
END;
$$ LANGUAGE plpgsql;

-- Create alternative trigger-based notification approach
-- This notifies connected clients when queue items are added
CREATE OR REPLACE FUNCTION notify_embedding_queue_change()
RETURNS trigger AS $$
BEGIN
  -- Notify any listening clients
  PERFORM pg_notify(
    'embedding_queue_update',
    json_build_object(
      'operation', TG_OP,
      'entity_type', COALESCE(NEW.entity_type, OLD.entity_type),
      'entity_id', COALESCE(NEW.entity_id, OLD.entity_id)
    )::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_embedding_queue_notify ON embedding_update_queue;
CREATE TRIGGER trg_embedding_queue_notify
AFTER INSERT ON embedding_update_queue
FOR EACH ROW
EXECUTE FUNCTION notify_embedding_queue_change();

-- Create additional triggers for new entity types

-- Dossiers trigger
CREATE OR REPLACE FUNCTION trg_queue_dossier_embedding_update()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') OR
     (OLD.name_en IS DISTINCT FROM NEW.name_en) OR
     (OLD.name_ar IS DISTINCT FROM NEW.name_ar) OR
     (OLD.description_en IS DISTINCT FROM NEW.description_en) OR
     (OLD.description_ar IS DISTINCT FROM NEW.description_ar) THEN

    INSERT INTO embedding_update_queue (entity_type, entity_id, priority, created_at, retry_count)
    VALUES ('dossiers', NEW.id, 3, now(), 0)
    ON CONFLICT (entity_type, entity_id) WHERE processed_at IS NULL
    DO UPDATE SET
      created_at = now(),
      retry_count = 0,
      error_message = NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_dossiers_embedding_update ON dossiers;
CREATE TRIGGER trg_dossiers_embedding_update
AFTER INSERT OR UPDATE OF name_en, name_ar, description_en, description_ar
ON dossiers
FOR EACH ROW
EXECUTE FUNCTION trg_queue_dossier_embedding_update();

-- Staff profiles trigger
CREATE OR REPLACE FUNCTION trg_queue_staff_profile_embedding_update()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') OR
     (OLD.full_name_en IS DISTINCT FROM NEW.full_name_en) OR
     (OLD.full_name_ar IS DISTINCT FROM NEW.full_name_ar) OR
     (OLD.bio_en IS DISTINCT FROM NEW.bio_en) OR
     (OLD.bio_ar IS DISTINCT FROM NEW.bio_ar) THEN

    INSERT INTO embedding_update_queue (entity_type, entity_id, priority, created_at, retry_count)
    VALUES ('staff_profiles', NEW.id, 5, now(), 0)
    ON CONFLICT (entity_type, entity_id) WHERE processed_at IS NULL
    DO UPDATE SET
      created_at = now(),
      retry_count = 0,
      error_message = NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_staff_profiles_embedding_update ON staff_profiles;
CREATE TRIGGER trg_staff_profiles_embedding_update
AFTER INSERT OR UPDATE OF full_name_en, full_name_ar, bio_en, bio_ar
ON staff_profiles
FOR EACH ROW
EXECUTE FUNCTION trg_queue_staff_profile_embedding_update();

-- Engagements trigger
CREATE OR REPLACE FUNCTION trg_queue_engagement_embedding_update()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') OR
     (OLD.title_en IS DISTINCT FROM NEW.title_en) OR
     (OLD.title_ar IS DISTINCT FROM NEW.title_ar) OR
     (OLD.description_en IS DISTINCT FROM NEW.description_en) OR
     (OLD.description_ar IS DISTINCT FROM NEW.description_ar) THEN

    INSERT INTO embedding_update_queue (entity_type, entity_id, priority, created_at, retry_count)
    VALUES ('engagements', NEW.id, 4, now(), 0)
    ON CONFLICT (entity_type, entity_id) WHERE processed_at IS NULL
    DO UPDATE SET
      created_at = now(),
      retry_count = 0,
      error_message = NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_engagements_embedding_update ON engagements;
CREATE TRIGGER trg_engagements_embedding_update
AFTER INSERT OR UPDATE OF title_en, title_ar, description_en, description_ar
ON engagements
FOR EACH ROW
EXECUTE FUNCTION trg_queue_engagement_embedding_update();

-- Add comments
COMMENT ON FUNCTION process_embedding_queue IS 'Invokes the embeddings-generate Edge Function to process the embedding queue';
COMMENT ON FUNCTION notify_embedding_queue_change IS 'Notifies clients when embedding queue changes via pg_notify';

-- Create a view for monitoring the embedding queue
CREATE OR REPLACE VIEW embedding_queue_stats AS
SELECT
  entity_type,
  COUNT(*) FILTER (WHERE processed_at IS NULL) as pending,
  COUNT(*) FILTER (WHERE processed_at IS NOT NULL) as processed,
  COUNT(*) FILTER (WHERE retry_count >= 3 AND processed_at IS NULL) as failed,
  AVG(retry_count) FILTER (WHERE processed_at IS NULL) as avg_retry_count,
  MAX(created_at) FILTER (WHERE processed_at IS NULL) as oldest_pending,
  MAX(created_at) FILTER (WHERE processed_at IS NOT NULL) as last_processed
FROM embedding_update_queue
GROUP BY entity_type;

COMMENT ON VIEW embedding_queue_stats IS 'Statistics view for monitoring the embedding update queue';
