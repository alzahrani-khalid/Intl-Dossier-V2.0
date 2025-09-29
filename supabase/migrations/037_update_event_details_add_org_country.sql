-- 037_update_event_details_add_org_country.sql
-- Extend event_details view with organizer and country derived from event_attendees

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
  CASE WHEN e.status::text = 'in_progress' THEN 'ongoing' ELSE e.status::text END AS status,
  org.org_id AS organizer_id,
  org.name_en AS organizer_name_en,
  org.name_ar AS organizer_name_ar,
  cn.country_id AS country_id,
  cn.country_name_en AS country_name_en,
  cn.country_name_ar AS country_name_ar,
  cn.country_code AS country_code
FROM public.events e
LEFT JOIN LATERAL (
  SELECT o.id AS org_id, o.name_en, o.name_ar
  FROM public.event_attendees ea
  JOIN public.organizations o ON o.id = ea.entity_id
  WHERE ea.event_id = e.id AND ea.type = 'organization'
  ORDER BY CASE WHEN ea.role = 'host' THEN 0 ELSE 1 END, ea.created_at
  LIMIT 1
) org ON true
LEFT JOIN LATERAL (
  SELECT c.id AS country_id, c.name_en AS country_name_en, c.name_ar AS country_name_ar, c.code AS country_code
  FROM public.event_attendees ea
  JOIN public.countries c ON c.id = ea.entity_id
  WHERE ea.event_id = e.id AND ea.type = 'country'
  ORDER BY CASE WHEN ea.role = 'host' THEN 0 ELSE 1 END, ea.created_at
  LIMIT 1
) cn ON true;

COMMENT ON VIEW public.event_details IS 'Events mapped to UI shape with optional organizer and country derived from event_attendees.';

GRANT SELECT ON public.event_details TO authenticated;
GRANT SELECT ON public.event_details TO anon;

COMMIT;

