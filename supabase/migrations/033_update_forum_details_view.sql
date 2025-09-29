-- 033_update_forum_details_view.sql
-- Align forum_details view to UI shape for current production schema
-- Uses forums(event_id, organizing_body) + events(start_time/end_time/location/status) + organizations(name_*)

BEGIN;

CREATE OR REPLACE VIEW public.forum_details AS
SELECT
  f.id,
  COALESCE(e.title, f.name_en) AS title_en,
  COALESCE(f.name_ar, e.title) AS title_ar,
  e.start_time AS start_datetime,
  e.end_time AS end_datetime,
  e.location AS location_en,
  e.location AS location_ar,
  e.location AS venue_en,
  e.location AS venue_ar,
  (e.virtual_link IS NOT NULL) AS is_virtual,
  CASE WHEN e.status::text = 'in_progress' THEN 'ongoing' ELSE e.status::text END AS status,
  f.capacity AS max_participants,
  1::int AS number_of_sessions,
  jsonb_build_object('name_en', org.name_en, 'name_ar', org.name_ar) AS organizer
FROM public.forums f
LEFT JOIN public.events e ON f.event_id = e.id
LEFT JOIN public.organizations org ON f.organizing_body = org.id;

COMMENT ON VIEW public.forum_details IS 'Forums aligned to UI shape; derives fields from forums + events + organizations for current production schema.';

GRANT SELECT ON public.forum_details TO authenticated;

COMMIT;

