-- P102-15 (CARRY-06, 102-CONTEXT.md D-20 option B): move the WeekAhead dashboard demo rows to dates
-- relative to today, so get_upcoming_events (server NOW()) and the visual spec's run-time browser
-- clock (today 12:00Z) look at the same days.
--
-- Rows: the three b0000002 engagement_dossiers and the five b0000006 calendar_entries that
-- 060-dashboard-demo.sql inserts. Offsets are copied from 060 (:205-216 engagements, :251-262
-- calendar): +2h/+4h from date_trunc('hour', NOW()); +1 day 10:00-12:00; +2 days 14:00 to +4 days
-- 16:00; CURRENT_DATE +0/+1/+2/+3/+5. Dates only: no row is inserted and no text column is written.
-- dashboard-widgets-visual.spec.ts applies the same eight updates in its beforeAll on every run.
--
-- Idempotent: the IS DISTINCT FROM guards make a re-apply in the same hour write nothing
-- (UPDATE 0), so updated_at is not bumped.
--
-- Apply: psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f <this file>

BEGIN;

UPDATE public.engagement_dossiers AS ed
SET start_date = v.start_date,
    end_date = v.end_date
FROM (VALUES
  ('b0000002-0000-0000-0000-000000000001'::uuid,
   date_trunc('hour', NOW()) + INTERVAL '2 hours',  date_trunc('hour', NOW()) + INTERVAL '4 hours'),
  ('b0000002-0000-0000-0000-000000000002'::uuid,
   date_trunc('day', NOW()) + INTERVAL '1 day 10 hours', date_trunc('day', NOW()) + INTERVAL '1 day 12 hours'),
  ('b0000002-0000-0000-0000-000000000003'::uuid,
   date_trunc('day', NOW()) + INTERVAL '2 days 14 hours', date_trunc('day', NOW()) + INTERVAL '4 days 16 hours')
) AS v (id, start_date, end_date)
WHERE ed.id = v.id
  AND (ed.start_date, ed.end_date) IS DISTINCT FROM (v.start_date, v.end_date);

UPDATE public.calendar_entries AS ce
SET event_date = v.event_date
FROM (VALUES
  ('b0000006-0000-0000-0000-000000000001'::uuid, CURRENT_DATE),
  ('b0000006-0000-0000-0000-000000000002'::uuid, CURRENT_DATE + 1),
  ('b0000006-0000-0000-0000-000000000003'::uuid, CURRENT_DATE + 2),
  ('b0000006-0000-0000-0000-000000000004'::uuid, CURRENT_DATE + 3),
  ('b0000006-0000-0000-0000-000000000005'::uuid, CURRENT_DATE + 5)
) AS v (id, event_date)
WHERE ce.id = v.id
  AND ce.event_date IS DISTINCT FROM v.event_date;

COMMIT;
