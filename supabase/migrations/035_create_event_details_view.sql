-- 035_create_event_details_view.sql
-- Events mapped to UI shape for current production schema

BEGIN;

CREATE OR REPLACE VIEW public.event_details AS
SELECT
  e.id,
  e.title AS title_en,
  e.title AS title_ar,
  e.type::text AS type,
  e.start_time AS start_datetime,
  e.end_time AS end_datetime,
  e.location AS location_en,
  e.location AS location_ar,
  e.location AS venue_en,
  e.location AS venue_ar,
  (e.virtual_link IS NOT NULL) AS is_virtual,
  e.virtual_link,
  NULL::int AS max_participants,
  CASE WHEN e.status::text = 'in_progress' THEN 'ongoing' ELSE e.status::text END AS status
FROM public.events e;

COMMENT ON VIEW public.event_details IS 'Events mapped to UI shape expected by UI (start_datetime, venue_*, bilingual title/location fallbacks).';

GRANT SELECT ON public.event_details TO authenticated;
GRANT SELECT ON public.event_details TO anon;

COMMIT;

