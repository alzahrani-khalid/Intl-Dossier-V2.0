-- 039_seed_sample_events.sql
-- Seed a few demo events in current window and attach organizer/country attendees

BEGIN;

WITH org AS (
  SELECT id FROM public.organizations ORDER BY created_at LIMIT 1
), cty AS (
  SELECT id FROM public.countries ORDER BY created_at LIMIT 1
)
INSERT INTO public.events (title, description, type, start_time, end_time, location, virtual_link, status)
SELECT 'GASTAT Coordination Meeting', 'Monthly coordination with partners', 'meeting', now() + interval '2 days', now() + interval '2 days 2 hours', 'Riyadh', NULL, 'scheduled'
WHERE NOT EXISTS (
  SELECT 1 FROM public.events e WHERE e.title = 'GASTAT Coordination Meeting'
);

INSERT INTO public.events (title, description, type, start_time, end_time, location, virtual_link, status)
SELECT 'Data Quality Workshop', 'Hands-on data quality practices', 'workshop', now() - interval '5 days', now() - interval '5 days' + interval '3 hours', 'Virtual', 'https://zoom.example.com/demo', 'completed'
WHERE NOT EXISTS (
  SELECT 1 FROM public.events e WHERE e.title = 'Data Quality Workshop'
);

INSERT INTO public.events (title, description, type, start_time, end_time, location, virtual_link, status)
SELECT 'International Statistics Conference', 'Annual statistics forum', 'conference', now() + interval '10 days', now() + interval '10 days' + interval '8 hours', 'UN HQ, New York', NULL, 'scheduled'
WHERE NOT EXISTS (
  SELECT 1 FROM public.events e WHERE e.title = 'International Statistics Conference'
);

WITH org AS (
  SELECT id FROM public.organizations ORDER BY created_at LIMIT 1
)
INSERT INTO public.event_attendees (event_id, type, entity_id, role, confirmed, added_by)
SELECT e.id, 'organization', org.id, 'host', true, NULL
FROM public.events e, org
WHERE e.title IN ('GASTAT Coordination Meeting','Data Quality Workshop','International Statistics Conference')
  AND NOT EXISTS (
    SELECT 1 FROM public.event_attendees ea WHERE ea.event_id = e.id AND ea.type = 'organization' AND ea.entity_id = org.id
  );

WITH cty AS (
  SELECT id FROM public.countries ORDER BY created_at LIMIT 1
)
INSERT INTO public.event_attendees (event_id, type, entity_id, role, confirmed, added_by)
SELECT e.id, 'country', cty.id, 'participant', true, NULL
FROM public.events e, cty
WHERE e.title IN ('GASTAT Coordination Meeting','Data Quality Workshop','International Statistics Conference')
  AND NOT EXISTS (
    SELECT 1 FROM public.event_attendees ea WHERE ea.event_id = e.id AND ea.type = 'country' AND ea.entity_id = cty.id
  );

COMMIT;

