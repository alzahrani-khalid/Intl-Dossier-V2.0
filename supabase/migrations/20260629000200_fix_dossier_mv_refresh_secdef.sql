-- Fix (part 2): dossier creation also blocked by the synchronous MV-refresh trigger
--
-- `queue_dossier_list_mv_refresh` runs `REFRESH MATERIALIZED VIEW CONCURRENTLY
-- dossier_list_mv` on every dossiers INSERT/UPDATE as SECURITY INVOKER. REFRESH
-- requires ownership of the MV, so it raises 42501 for a normal authenticated
-- user — the second link in the create-flow trigger chain (after the embedding
-- enqueue fixed in 20260629000100).
--
-- Recreate as SECURITY DEFINER with a pinned search_path so the refresh runs as
-- the MV owner. Body unchanged.
--
-- NOTE (follow-up, not fixed here): refreshing the whole MV CONCURRENTLY inside a
-- per-row insert trigger is expensive (the function's own comment says it "should
-- be queued to a background job"), and dossiers-create already calls
-- refresh_dossier_list_mv asynchronously. Consider dropping this trigger in favor
-- of the async path, especially before bulk imports.

CREATE OR REPLACE FUNCTION public.queue_dossier_list_mv_refresh()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, pg_temp
AS $function$
BEGIN
  -- Refresh the materialized view concurrently
  -- In production, this should be queued to a background job
  REFRESH MATERIALIZED VIEW CONCURRENTLY dossier_list_mv;
  RETURN NULL;
END;
$function$;
