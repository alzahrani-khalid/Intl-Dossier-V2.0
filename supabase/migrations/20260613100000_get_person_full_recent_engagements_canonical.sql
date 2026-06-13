-- PERENG-02: add recent_engagements (canonical plane) to get_person_full.
--
-- CRITICAL DRIFT (probed live on staging 2026-06-13, REST RPC): the deployed
-- get_person_full returns ONLY the three keys
--   ['active_committees', 'key_staff', 'person']
-- — there is NO recent_engagements key in the live body. This diverges from
-- repo migration 20260202000001 (same class as prior live-vs-repo drift
-- incidents). We therefore MUST NOT re-author the live key logic here.
--
-- Strategy: RENAME-AND-WRAP composition.
--   1. Guarded, idempotent ALTER FUNCTION ... RENAME TO get_person_full_base
--      preserves the drifted live body BYTE-FOR-BYTE (no need for its SQL text).
--   2. CREATE OR REPLACE get_person_full as a thin SECURITY DEFINER wrapper that
--      returns base(p_person_id)::jsonb || jsonb_build_object('recent_engagements', ...).
--      The jsonb || right-hand operand overrides any legacy recent_engagements
--      key that 20260202000001 would recreate on a fresh local replay, so the
--      composition is also correct off-staging.
--
-- recent_engagements is sourced ONLY from the CANONICAL participation plane:
--   engagement_participants ⋈ engagement_dossiers ⋈ dossiers
-- keyed on participant_dossier_id = p_person_id. The legacy participation plane
-- and the legacy engagements table are NEVER referenced (ENGPOS-01 fence).
-- The { link, engagement } shape matches what PersonDetailPage renders:
--   eng.link.role (rides inside to_jsonb(ep_row)),
--   eng.engagement.name_en/name_ar/engagement_type/engagement_category/location_*.
--
-- APPLY PATH: this file is AUTHORED here but APPLIED ONLY by the orchestrator
-- via Supabase MCP in 67-06 (64-01 split precedent — executors have no MCP).
-- The persons edge fn calls the RPC by name, so NO edge redeploy is needed.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'get_person_full_base' AND pronamespace = 'public'::regnamespace
  ) THEN
    ALTER FUNCTION public.get_person_full(uuid) RENAME TO get_person_full_base;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.get_person_full(p_person_id uuid)
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn$
  SELECT (
    public.get_person_full_base(p_person_id)::jsonb
    || jsonb_build_object(
      'recent_engagements',
      (
        SELECT json_agg(
          json_build_object(
            'link', to_jsonb(sub.ep_row),
            'engagement', json_build_object(
              'id', sub.dossier_id,
              'name_en', sub.name_en,
              'name_ar', sub.name_ar,
              'engagement_type', sub.engagement_type,
              'engagement_category', sub.engagement_category,
              'location_en', sub.location_en,
              'location_ar', sub.location_ar
            )
          )
        )
        FROM (
          SELECT ep AS ep_row,
                 d.id AS dossier_id,
                 d.name_en,
                 d.name_ar,
                 ed.engagement_type,
                 ed.engagement_category,
                 ed.location_en,
                 ed.location_ar
          FROM engagement_participants ep
          JOIN engagement_dossiers ed ON ed.id = ep.engagement_id
          JOIN dossiers d ON d.id = ed.id
          WHERE ep.participant_dossier_id = p_person_id
          ORDER BY ed.start_date DESC NULLS LAST
          LIMIT 10
        ) sub
      )
    )
  )::json
$fn$;

GRANT EXECUTE ON FUNCTION public.get_person_full(uuid) TO authenticated, anon, service_role;
