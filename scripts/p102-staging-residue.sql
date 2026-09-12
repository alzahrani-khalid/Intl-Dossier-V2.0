\set ON_ERROR_STOP on

-- P102-06: remove unreferenced staging residue and give id-pinned records
-- diplomatic names. The destructive population is exported before this script runs.
BEGIN;

-- Derived copies and extension rows must go before their source records.
DELETE FROM public.rag_chunks
WHERE content ILIKE '%Phase 70 staging verification digest%'
   OR content ILIKE '%Phase 52 Kanban Fixture Engagement%'
   OR content LIKE 'Test Person %Test fixture for Phase 40 persons list page%'
   OR content LIKE 'Phase 63 graph verification topic.%'
   OR content LIKE 'Phase 63 second-degree verification forum.%'
   OR content LIKE 'Round-11 UAT seed:%';

DELETE FROM public.mou_notification_queue
WHERE mou_id IN (
  SELECT id FROM public.mous WHERE title LIKE 'E2E MoU %'
);

DELETE FROM public.persons
WHERE id IN (
  SELECT id
  FROM public.dossiers
  WHERE name_en LIKE 'e2e-97-01-elected-official-%'
);

-- Unreferenced source records: prefix scopes absorb residue from repeated runs;
-- singleton populations use the ids enumerated in 102-RESEARCH.md section 2.
DELETE FROM public.dossiers
WHERE name_en LIKE 'e2e-97-01-elected-official-%';

-- Rewrite all seven graph notes before the two obsolete endpoint dossiers cascade.
UPDATE public.dossier_relationships
SET notes_en = 'Diplomatic relationship graph reference.'
WHERE notes_en IN (
  'Phase 63 graph verification seed',
  'Phase 63 second-degree graph verification seed'
);

DELETE FROM public.dossiers
WHERE id IN (
  'f63d0900-0000-0000-0000-000000000001'::uuid,
  'f63d0900-0000-0000-0000-000000000002'::uuid
);

DELETE FROM public.intelligence_digest
WHERE id = '2e08895a-626a-4ea1-bb89-6164e4852890'::uuid;

DELETE FROM public.aa_commitments
WHERE id = '18ecff8e-ee08-4b5e-9284-353c51373b86'::uuid;

DELETE FROM public.tasks
WHERE title IN ('API E2E task post-fix', 'E2E UAE task 133333');

DELETE FROM public.positions
WHERE title_en = 'Audience Test Position';

-- The unit's four gastat.test staff profiles are residue from the same WIP run.
-- staff_profiles.unit_id is NOT NULL and NO ACTION, so these exported children
-- must be removed before their parent unit.
DELETE FROM public.staff_profiles
WHERE unit_id IN (
  SELECT id FROM public.organizational_units WHERE name_en = 'Test WIP Unit'
);

DELETE FROM public.capacity_snapshots
WHERE unit_id IN (
  SELECT id FROM public.organizational_units WHERE name_en = 'Test WIP Unit'
);

DELETE FROM public.organizational_units
WHERE name_en = 'Test WIP Unit';

DELETE FROM public.mous
WHERE title LIKE 'E2E MoU %';

-- Six working groups. IDs are stable test contracts; their display names are not.
UPDATE public.dossiers AS d
SET name_en = v.name_en,
    name_ar = v.name_ar
FROM (VALUES
  ('a0000000-0000-0000-0000-000000000401'::uuid, 'Regional Climate Coordination Working Group', 'مجموعة العمل الإقليمية لتنسيق المناخ'),
  ('a0000000-0000-0000-0000-000000000402'::uuid, 'Bilateral Trade Policy Working Group', 'مجموعة العمل للسياسات التجارية الثنائية'),
  ('a0000000-0000-0000-0000-000000000403'::uuid, 'Digital Infrastructure Cooperation Working Group', 'مجموعة العمل للتعاون في البنية التحتية الرقمية'),
  ('a0000000-0000-0000-0000-000000000404'::uuid, 'Public Health Cooperation Working Group', 'مجموعة العمل للتعاون في الصحة العامة'),
  ('a0000000-0000-0000-0000-000000000405'::uuid, 'Cultural Exchange Working Group', 'مجموعة العمل للتبادل الثقافي'),
  ('a0000000-0000-0000-0000-000000000406'::uuid, 'Energy Transition Working Group', 'مجموعة العمل للتحول في الطاقة')
) AS v(id, name_en, name_ar)
WHERE d.id = v.id
  AND (d.name_en, d.name_ar) IS DISTINCT FROM (v.name_en, v.name_ar);

-- Ten people retain the role suffix used by the seeded data contract.
UPDATE public.dossiers AS d
SET name_en = v.name_en,
    name_ar = v.name_ar,
    description_en = v.description_en
FROM (VALUES
  ('a0000000-0000-0000-0000-000000000501'::uuid, 'Dr Lamia Al-Harbi — Senior Diplomat', 'د. لمياء الحربي — دبلوماسية رفيعة', 'Senior diplomat supporting bilateral statistical cooperation.'),
  ('a0000000-0000-0000-0000-000000000502'::uuid, 'Faisal Al-Qahtani — Trade Envoy', 'فيصل القحطاني — مبعوث تجاري', 'Trade envoy coordinating regional economic partnerships.'),
  ('a0000000-0000-0000-0000-000000000503'::uuid, 'Noura Al-Mutairi — Policy Advisor', 'نورة المطيري — مستشارة سياسات', 'Policy advisor focused on international cooperation frameworks.'),
  ('a0000000-0000-0000-0000-000000000504'::uuid, 'Omar Al-Dossari — Regional Coordinator', 'عمر الدوسري — منسق إقليمي', 'Regional coordinator for multilateral programmes.'),
  ('a0000000-0000-0000-0000-000000000505'::uuid, 'Dr Sara Al-Anazi — Technical Attaché', 'د. سارة العنزي — ملحقة تقنية', 'Technical attaché for official data exchange initiatives.'),
  ('a0000000-0000-0000-0000-000000000506'::uuid, 'Khalid Al-Shammari — Cultural Liaison', 'خالد الشمري — مسؤول اتصال ثقافي', 'Cultural liaison advancing institutional exchange programmes.'),
  ('a0000000-0000-0000-0000-000000000507'::uuid, 'Reem Al-Otaibi — Economics Analyst', 'ريم العتيبي — محللة اقتصادية', 'Economics analyst covering bilateral trade and investment.'),
  ('a0000000-0000-0000-0000-000000000508'::uuid, 'Yousef Al-Ghamdi — Climate Specialist', 'يوسف الغامدي — أخصائي مناخ', 'Climate specialist advising on regional sustainability cooperation.'),
  ('a0000000-0000-0000-0000-000000000509'::uuid, 'Maha Al-Rashid — Health Coordinator', 'مها الرشيد — منسقة صحية', 'Health coordinator supporting cross-border public health cooperation.'),
  ('a0000000-0000-0000-0000-000000000510'::uuid, 'Abdullah Al-Shehri — Digital Affairs Officer', 'عبدالله الشهري — مسؤول الشؤون الرقمية', 'Digital affairs officer coordinating government data partnerships.')
) AS v(id, name_en, name_ar, description_en)
WHERE d.id = v.id
  AND (d.name_en, d.name_ar, d.description_en)
      IS DISTINCT FROM (v.name_en, v.name_ar, v.description_en);

UPDATE public.persons AS p
SET biography_en = v.biography_en
FROM (VALUES
  ('a0000000-0000-0000-0000-000000000501'::uuid, 'Career diplomat specialising in bilateral statistical cooperation.'),
  ('a0000000-0000-0000-0000-000000000502'::uuid, 'Trade envoy with experience in regional economic partnerships.'),
  ('a0000000-0000-0000-0000-000000000503'::uuid, 'Policy advisor on international cooperation frameworks.'),
  ('a0000000-0000-0000-0000-000000000504'::uuid, 'Regional coordinator for multilateral programmes.'),
  ('a0000000-0000-0000-0000-000000000505'::uuid, 'Technical attaché specialising in official data exchange.'),
  ('a0000000-0000-0000-0000-000000000506'::uuid, 'Cultural liaison for institutional exchange programmes.'),
  ('a0000000-0000-0000-0000-000000000507'::uuid, 'Economics analyst covering trade and investment policy.'),
  ('a0000000-0000-0000-0000-000000000508'::uuid, 'Climate specialist advising regional sustainability initiatives.'),
  ('a0000000-0000-0000-0000-000000000509'::uuid, 'Health coordinator supporting international public health cooperation.'),
  ('a0000000-0000-0000-0000-000000000510'::uuid, 'Digital affairs officer coordinating government data partnerships.')
) AS v(id, biography_en)
WHERE p.id = v.id
  AND p.biography_en IS DISTINCT FROM v.biography_en;

-- Text-column residue outside display-name columns.
UPDATE public.dossiers
SET description_en = 'Bilateral engagement supporting the statistical cooperation framework.',
    description_ar = 'مشاركة ثنائية لدعم إطار التعاون الإحصائي.'
WHERE id = '00000000-0000-0052-0000-000000000001'::uuid
  AND (description_en, description_ar) IS DISTINCT FROM (
    'Bilateral engagement supporting the statistical cooperation framework.',
    'مشاركة ثنائية لدعم إطار التعاون الإحصائي.'
  );

UPDATE public.positions
SET content_en = regexp_replace(content_en, 'rendered-oracle fixture', 'rendered-oracle record', 'gi')
WHERE content_en LIKE 'Deterministic rendered-oracle fixture for %';

UPDATE public.engagements
SET location_en = 'Riyadh Statistical Cooperation Centre'
WHERE id = '00000000-0000-0052-0000-000000000001'::uuid
  AND location_en = 'Phase 52 Fixture Location';

UPDATE public.calendar_entries
SET description_en = 'Delegation follow-up linked to the bilateral calendar.'
WHERE id = '3f465d9e-3cb0-45cb-98ea-3d618d911a27'::uuid
  AND description_en IS DISTINCT FROM 'Delegation follow-up linked to the bilateral calendar.';

UPDATE public.users AS u
SET full_name = v.full_name
FROM (VALUES
  ('admin@e2e.test', 'Platform Administrator'),
  ('analyst@e2e.test', 'International Affairs Analyst'),
  ('intake@e2e.test', 'Diplomatic Intake Coordinator')
) AS v(email, full_name)
WHERE u.email = v.email
  AND u.full_name IS DISTINCT FROM v.full_name;

-- The calendar IDs remain stable for the RTL scenario; only their diplomatic copy changes.
UPDATE public.calendar_entries AS c
SET title_en = v.title_en,
    title_ar = v.title_ar
FROM (VALUES
  ('007b1ee4-4f9a-40bc-ab42-6138564820a8'::uuid, 'Bilateral Statistical Cooperation Session', 'جلسة التعاون الإحصائي الثنائي'),
  ('5180e1a2-a535-4a5c-b8e0-7eee858b8adf'::uuid, 'Regional Data Coordination Meeting', 'اجتماع تنسيق البيانات الإقليمية'),
  ('ff18f280-aa53-41fc-9b53-36e53db7235a'::uuid, 'Technical Exchange Consultations', 'مشاورات التبادل التقني')
) AS v(id, title_en, title_ar)
WHERE c.id = v.id
  AND (c.title_en, c.title_ar) IS DISTINCT FROM (v.title_en, v.title_ar);

UPDATE public.aa_commitments
SET title = 'Advance China Statistical Partnership',
    title_ar = 'تعزيز الشراكة الإحصائية مع الصين'
WHERE id = 'b0000003-0000-0000-0000-000000000001'::uuid
  AND (title, title_ar) IS DISTINCT FROM (
    'Advance China Statistical Partnership',
    'تعزيز الشراكة الإحصائية مع الصين'
  );

COMMIT;
