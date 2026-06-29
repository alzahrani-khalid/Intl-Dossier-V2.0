-- Fix: dossier creation blocked by embedding-enqueue trigger RLS denial
--
-- `embedding_update_queue` has RLS with only an authenticated SELECT policy (no
-- INSERT). The two AFTER-INSERT enqueue trigger functions on `dossiers` ran as
-- SECURITY INVOKER, so their queue INSERT executed as the calling user and was
-- denied (42501) — rolling back EVERY authenticated dossier create.
--
-- Recreate both enqueue functions as SECURITY DEFINER with a pinned search_path
-- so the trigger enqueues as the function owner (bypassing the queue RLS) while
-- the queue stays closed to direct user writes. Bodies are unchanged.
--
-- NOTE (follow-up, not fixed here): these two triggers are redundant — both
-- enqueue a 'dossiers' embedding row on the same INSERT/UPDATE. Consider
-- consolidating to one in a later cleanup.

CREATE OR REPLACE FUNCTION public.queue_dossier_embedding_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, pg_temp
AS $function$
BEGIN
  -- Only queue if content changed that affects embedding
  IF TG_OP = 'INSERT' OR
     OLD.name_en IS DISTINCT FROM NEW.name_en OR
     OLD.name_ar IS DISTINCT FROM NEW.name_ar OR
     OLD.description_en IS DISTINCT FROM NEW.description_en OR
     OLD.description_ar IS DISTINCT FROM NEW.description_ar THEN

    INSERT INTO embedding_update_queue (entity_type, entity_id, priority, created_at)
    VALUES ('dossiers', NEW.id,
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
$function$;

CREATE OR REPLACE FUNCTION public.trg_queue_dossier_embedding_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, pg_temp
AS $function$
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
$function$;
