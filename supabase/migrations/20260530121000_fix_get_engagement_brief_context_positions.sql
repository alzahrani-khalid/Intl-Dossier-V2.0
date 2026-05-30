-- Fix get_engagement_brief_context: the `positions` subquery referenced columns
-- that do not exist on public.positions, causing the engagement-briefs Context
-- tab (GET /engagement-briefs/:id/context) to 500 with:
--   42703: column p.dossier_id does not exist
--
-- public.positions has NO `dossier_id`, NO `position_type` (only
-- `position_type_id`), and NO `stance`. Positions link to dossiers via the
-- junction table public.position_dossier_links (position_id, dossier_id).
--
-- This rewrites ONLY the `positions` json key to traverse
--   positions -> position_dossier_links -> dossiers
-- scoped to dossiers that are participants of the engagement. All other keys are
-- preserved byte-for-byte. The JSON shape of each position is kept identical to
-- the original (id, title_en, title_ar, position_type, stance, dossier_id,
-- dossier_name_en, dossier_name_ar); `position_type` and `stance` are emitted as
-- NULL because those concepts do not exist on the positions table.
--
-- Also fixes the status filter: positions.status only allows
-- ('draft','under_review','approved','published') per its CHECK constraint, so
-- the original `p.status = 'active'` matched zero rows (a latent always-empty
-- filter). A pre-meeting brief surfaces finalized positions -> approved/published.

CREATE OR REPLACE FUNCTION public.get_engagement_brief_context(p_engagement_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
AS $function$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    -- Engagement details
    'engagement', (
      SELECT row_to_json(e)
      FROM (
        SELECT
          ed.id,
          d.name_en,
          d.name_ar,
          d.description_en,
          d.description_ar,
          ed.engagement_type,
          ed.engagement_category,
          ed.start_date,
          ed.end_date,
          ed.location_en,
          ed.location_ar,
          ed.objectives_en,
          ed.objectives_ar,
          ed.engagement_status
        FROM engagement_dossiers ed
        JOIN dossiers d ON d.id = ed.id
        WHERE ed.id = p_engagement_id
      ) e
    ),

    -- Participants with dossier info
    'participants', (
      SELECT json_agg(json_build_object(
        'id', ep.id,
        'role', ep.role,
        'participant_type', ep.participant_type,
        'name_en', COALESCE(pd.name_en, ep.external_name_en),
        'name_ar', COALESCE(pd.name_ar, ep.external_name_ar),
        'title_en', ep.external_title_en,
        'title_ar', ep.external_title_ar,
        'dossier_id', ep.participant_dossier_id,
        'dossier_type', pd.type
      ))
      FROM engagement_participants ep
      LEFT JOIN dossiers pd ON pd.id = ep.participant_dossier_id
      WHERE ep.engagement_id = p_engagement_id
    ),

    -- Agenda items
    'agenda', (
      SELECT json_agg(json_build_object(
        'id', ea.id,
        'order_number', ea.order_number,
        'title_en', ea.title_en,
        'title_ar', ea.title_ar,
        'description_en', ea.description_en,
        'description_ar', ea.description_ar,
        'item_status', ea.item_status
      ) ORDER BY ea.order_number)
      FROM engagement_agenda ea
      WHERE ea.engagement_id = p_engagement_id
    ),

    -- Host country info
    'host_country', (
      SELECT row_to_json(hc)
      FROM (
        SELECT d.id, d.name_en, d.name_ar, d.type
        FROM dossiers d
        JOIN engagement_dossiers ed ON d.id = ed.host_country_id
        WHERE ed.id = p_engagement_id
      ) hc
    ),

    -- Host organization info
    'host_organization', (
      SELECT row_to_json(ho)
      FROM (
        SELECT d.id, d.name_en, d.name_ar, d.type
        FROM dossiers d
        JOIN engagement_dossiers ed ON d.id = ed.host_organization_id
        WHERE ed.id = p_engagement_id
      ) ho
    ),

    -- Related positions (linked to participant dossiers via the
    -- position_dossier_links junction; positions has no dossier_id/position_type/stance).
    'positions', (
      SELECT json_agg(DISTINCT jsonb_build_object(
        'id', p.id,
        'title_en', p.title_en,
        'title_ar', p.title_ar,
        'position_type', NULL,
        'stance', NULL,
        'dossier_id', pdl.dossier_id,
        'dossier_name_en', d.name_en,
        'dossier_name_ar', d.name_ar
      ))
      FROM positions p
      JOIN position_dossier_links pdl ON pdl.position_id = p.id
      JOIN dossiers d ON d.id = pdl.dossier_id
      JOIN engagement_participants ep ON ep.participant_dossier_id = pdl.dossier_id
      WHERE ep.engagement_id = p_engagement_id
        AND p.status IN ('approved', 'published')
      LIMIT 20
    ),

    -- Previous briefs count
    'previous_briefs_count', (
      SELECT COUNT(*)::INTEGER
      FROM engagement_briefs eb
      WHERE eb.engagement_dossier_id = p_engagement_id
    )
  ) INTO result;

  RETURN result;
END;
$function$;
