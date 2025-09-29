-- 038_seed_event_attendees_demo.sql
-- Seed minimal organizer and country attendees for recent events (idempotent)

BEGIN;

WITH ev AS (
  SELECT id FROM public.events ORDER BY COALESCE(start_time, created_at) DESC NULLS LAST LIMIT 3
),
org AS (
  SELECT id FROM public.organizations ORDER BY created_at DESC NULLS LAST LIMIT 1
)
INSERT INTO public.event_attendees (event_id, type, entity_id, role, confirmed, added_by)
SELECT ev.id, 'organization', org.id, 'host', true, NULL
FROM ev, org
WHERE NOT EXISTS (
  SELECT 1 FROM public.event_attendees ea WHERE ea.event_id = ev.id AND ea.type = 'organization' AND ea.entity_id = org.id
);

WITH ev AS (
  SELECT id FROM public.events ORDER BY COALESCE(start_time, created_at) DESC NULLS LAST LIMIT 3
),
cty AS (
  SELECT id FROM public.countries ORDER BY created_at DESC NULLS LAST LIMIT 1
)
INSERT INTO public.event_attendees (event_id, type, entity_id, role, confirmed, added_by)
SELECT ev.id, 'country', cty.id, 'participant', true, NULL
FROM ev, cty
WHERE NOT EXISTS (
  SELECT 1 FROM public.event_attendees ea WHERE ea.event_id = ev.id AND ea.type = 'country' AND ea.entity_id = cty.id
);

COMMIT;

