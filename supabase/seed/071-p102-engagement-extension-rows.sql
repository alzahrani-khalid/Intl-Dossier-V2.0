-- P102-05 (P52FIXTURE-01, 102-CONTEXT.md D-09): give the two extension-less engagement dossiers
-- their engagement_dossiers row, and rename the P52 dossier to diplomatic copy.
--
-- The P52 id (00000000-0000-0052-...-0001) is pinned by five specs and .env.test.example, so the id
-- stays and only the name changes. 7c0d830b is the ONS engagement - the only after_action_records
-- parent, which 102-13's PDF probe needs. Every other engagement_dossiers column takes its default.
--
-- Migration-free and idempotent: the IS DISTINCT FROM guards make a re-apply write nothing
-- (`INSERT 0 0` / `UPDATE 0`), so it neither bumps updated_at nor re-queues the name embedding.
--
-- Apply: psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f supabase/seed/071-p102-engagement-extension-rows.sql

BEGIN;

INSERT INTO public.engagement_dossiers (id, engagement_type, engagement_category, start_date, end_date)
VALUES
  ('00000000-0000-0052-0000-000000000001', 'bilateral_meeting', 'diplomatic',
   '2026-03-10 09:00+03', '2026-03-10 12:00+03'),
  ('7c0d830b-5dc7-4419-a0ad-ce550031712d', 'bilateral_meeting', 'diplomatic',
   '2026-05-19 10:00+03', '2026-05-19 15:00+03')
ON CONFLICT (id) DO UPDATE SET
  engagement_type = EXCLUDED.engagement_type,
  engagement_category = EXCLUDED.engagement_category,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date
WHERE (engagement_dossiers.engagement_type, engagement_dossiers.engagement_category,
       engagement_dossiers.start_date, engagement_dossiers.end_date)
  IS DISTINCT FROM
      (EXCLUDED.engagement_type, EXCLUDED.engagement_category,
       EXCLUDED.start_date, EXCLUDED.end_date);

UPDATE public.dossiers
SET name_en = 'Bilateral consultation — statistical cooperation framework',
    name_ar = 'مشاورات ثنائية — إطار التعاون الإحصائي'
WHERE id = '00000000-0000-0052-0000-000000000001'
  AND type = 'engagement'
  AND (name_en, name_ar) IS DISTINCT FROM
      ('Bilateral consultation — statistical cooperation framework',
       'مشاورات ثنائية — إطار التعاون الإحصائي');

COMMIT;
