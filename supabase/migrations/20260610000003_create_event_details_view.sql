-- 20260610000003_create_event_details_view.sql
-- event_details view (events #4): the view was MISSING live — neither 035 nor 037
-- had been applied (EventsPage.tsx does `.from('event_details').select('*')` at line
-- ~265, so the page was querying a nonexistent relation → 404/400).
--
-- 035 shape is appliable as-is, but it lacks the organizer/country columns the page
-- renders. 037 attempted to add them but is UNAPPLIABLE against live: it joins
-- organizations.name_en / countries.name_en / countries.code — columns that do NOT
-- exist. Live `organizations` and `countries` are dossier-EXTENSION tables (their id
-- FKs dossiers.id); the display names live on `dossiers` (name_en/name_ar) and the
-- country code is `countries.iso_code_2` (there is no `countries.code`).
--
-- Fix: ship the 035 column shape + organizer/country columns sourced from
-- event_attendees -> dossiers (names) and dossiers -> countries (iso_code_2 as code).
-- Names ALWAYS come from dossiers, never from the extension tables.
--
-- Verified live (information_schema, project zkrcjzdemdmwhearhfgg, 2026-06-10):
--   events cols: id, title, type, start_time, end_time, location, virtual_link, status
--     (no bilingual title/location, no venue, no max_participants columns) -> bilingual
--     aliases reuse the single live column (035 convention); max_participants is a
--     NULL::int placeholder (no live source column).
--   event_attendees cols: event_id, entity_id (uuid), type (text), role (text),
--     created_at -> join entity_id -> dossiers.id.
--   dossiers: id, name_en, name_ar. countries.id FK dossiers.id; countries.iso_code_2.
--
-- Grant: authenticated ONLY. The old 035 granted anon too; that is dropped here —
-- EventsPage is behind _protected, anon must not read the view.
-- Applied 2026-06-10 via Supabase MCP apply_migration.

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
  org.organizer_id AS organizer_id,
  org.organizer_name_en AS organizer_name_en,
  org.organizer_name_ar AS organizer_name_ar,
  cn.country_id AS country_id,
  cn.country_name_en AS country_name_en,
  cn.country_name_ar AS country_name_ar,
  cn.country_code AS country_code
FROM public.events e
LEFT JOIN LATERAL (
  SELECT
    d.id AS organizer_id,
    d.name_en AS organizer_name_en,
    d.name_ar AS organizer_name_ar
  FROM public.event_attendees ea
  JOIN public.dossiers d ON d.id = ea.entity_id
  WHERE ea.event_id = e.id AND ea.type = 'organization'
  ORDER BY CASE WHEN ea.role = 'host' THEN 0 ELSE 1 END, ea.created_at
  LIMIT 1
) org ON true
LEFT JOIN LATERAL (
  SELECT
    d.id AS country_id,
    d.name_en AS country_name_en,
    d.name_ar AS country_name_ar,
    c.iso_code_2 AS country_code
  FROM public.event_attendees ea
  JOIN public.dossiers d ON d.id = ea.entity_id
  LEFT JOIN public.countries c ON c.id = d.id
  WHERE ea.event_id = e.id AND ea.type = 'country'
  ORDER BY CASE WHEN ea.role = 'host' THEN 0 ELSE 1 END, ea.created_at
  LIMIT 1
) cn ON true;

COMMENT ON VIEW public.event_details IS 'Events mapped to UI shape (start_datetime, venue_*, bilingual title/location fallbacks) with organizer + country derived from event_attendees -> dossiers (country_code via countries.iso_code_2). Authenticated-only.';

-- This staging DB has a public-schema DEFAULT PRIVILEGE (pg_default_acl, postgres
-- owner) that auto-grants ALL privileges to anon on every new relation. A bare
-- "GRANT ... TO authenticated" therefore leaves an inherited anon SELECT in place.
-- Explicitly REVOKE from anon so the live grant matches the authenticated-only intent
-- (T-60-03-I: EventsPage is behind _protected; anon must not read this view).
REVOKE ALL ON public.event_details FROM anon;
GRANT SELECT ON public.event_details TO authenticated;

COMMIT;
