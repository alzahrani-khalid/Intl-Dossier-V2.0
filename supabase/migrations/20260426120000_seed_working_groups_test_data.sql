-- Phase 40 Gap-Closure G6: seed working_group test dossiers
-- ----------------------------------------------------------------------------
-- Purpose: populate /dossiers/working_groups list page so visual baseline
-- reaches ~140 KB (parity with countries/organizations).
--
-- Schema notes (verified 2026-04-26 against staging):
--   dossiers.status   CHECK ∈ {active, inactive, archived, deleted}
--   dossiers.sensitivity_level  INT 1..4 (1=low)
--   dossiers   has NO last_touch column (uses updated_at instead)
--   working_groups.wg_status  CHECK ∈ {active, suspended, disbanded}
--   working_groups.wg_type    CHECK ∈ {committee, task_force, advisory_board,
--                                       technical_group, steering_committee}
--   List-page chip uses dossiers.status — page maps active→chip-ok and falls
--   through to chip-default for other values; the plan's "4 chip mappings"
--   target (active/completed/planned/cancelled) is unreachable without schema
--   changes, so we cover dossiers.status variety {active, inactive} only.
--
-- Idempotent via ON CONFLICT (id) DO NOTHING. Stable test UUIDs in the
-- a0000000-…-04xx range. Bilingual EN+AR fixtures, clearly fake.
-- ----------------------------------------------------------------------------

-- Step 1: insert dossier rows
INSERT INTO dossiers (
  id, type, name_en, name_ar, description_en, description_ar,
  status, sensitivity_level, tags, is_seed_data, created_at, updated_at
)
VALUES
  ('a0000000-0000-0000-0000-000000000401', 'working_group',
   'Test Working Group A — Climate Coordination',
   'مجموعة عمل اختبارية أ — تنسيق المناخ',
   'Cross-border climate cooperation fixtures (test data).',
   'بيانات اختبارية للتعاون المناخي عبر الحدود.',
   'active', 1, ARRAY['test', 'climate'], true,
   NOW() - INTERVAL '60 days', NOW() - INTERVAL '2 days'),

  ('a0000000-0000-0000-0000-000000000402', 'working_group',
   'Test Working Group B — Trade Policy Review',
   'مجموعة عمل اختبارية ب — مراجعة سياسة التجارة',
   'Bilateral trade-policy fixtures (test data).',
   'بيانات اختبارية لسياسة التجارة الثنائية.',
   'active', 1, ARRAY['test', 'trade'], true,
   NOW() - INTERVAL '90 days', NOW() - INTERVAL '5 days'),

  ('a0000000-0000-0000-0000-000000000403', 'working_group',
   'Test Working Group C — Digital Infrastructure',
   'مجموعة عمل اختبارية ج — البنية التحتية الرقمية',
   'Digital-infrastructure cooperation fixtures (test data).',
   'بيانات اختبارية لتعاون البنية التحتية الرقمية.',
   'active', 2, ARRAY['test', 'digital'], true,
   NOW() - INTERVAL '180 days', NOW() - INTERVAL '12 days'),

  ('a0000000-0000-0000-0000-000000000404', 'working_group',
   'Test Working Group D — Health Cooperation',
   'مجموعة عمل اختبارية د — التعاون الصحي',
   'Public-health cooperation fixtures (test data).',
   'بيانات اختبارية للتعاون في الصحة العامة.',
   'active', 1, ARRAY['test', 'health'], true,
   NOW() - INTERVAL '25 days', NOW() - INTERVAL '20 days'),

  ('a0000000-0000-0000-0000-000000000405', 'working_group',
   'Test Working Group E — Cultural Exchange',
   'مجموعة عمل اختبارية هـ — التبادل الثقافي',
   'Cultural-exchange cooperation fixtures (test data).',
   'بيانات اختبارية للتبادل الثقافي.',
   'inactive', 1, ARRAY['test', 'culture'], true,
   NOW() - INTERVAL '120 days', NOW() - INTERVAL '28 days'),

  ('a0000000-0000-0000-0000-000000000406', 'working_group',
   'Test Working Group F — Energy Transition',
   'مجموعة عمل اختبارية و — التحول في الطاقة',
   'Energy-transition cooperation fixtures (test data).',
   'بيانات اختبارية للتحول في الطاقة.',
   'active', 2, ARRAY['test', 'energy'], true,
   NOW() - INTERVAL '45 days', NOW() - INTERVAL '8 days')
ON CONFLICT (id) DO NOTHING;

-- Step 2: insert matching working_groups extension rows.
-- The RPC search_working_groups INNER-JOINs working_groups, so dossier-only
-- rows would not appear on the list page.
INSERT INTO working_groups (
  id, wg_type, wg_status, mandate_en, mandate_ar,
  established_date, meeting_frequency, is_seed_data
)
VALUES
  ('a0000000-0000-0000-0000-000000000401', 'committee',          'active',
   'Coordinate cross-border climate response (test).',
   'تنسيق الاستجابة المناخية عبر الحدود (اختبار).',
   (NOW() - INTERVAL '60 days')::date, 'monthly', true),

  ('a0000000-0000-0000-0000-000000000402', 'task_force',         'active',
   'Review bilateral trade frictions (test).',
   'مراجعة الاحتكاكات التجارية الثنائية (اختبار).',
   (NOW() - INTERVAL '90 days')::date, 'biweekly', true),

  ('a0000000-0000-0000-0000-000000000403', 'technical_group',    'suspended',
   'Standardise digital-infrastructure protocols (test).',
   'توحيد بروتوكولات البنية التحتية الرقمية (اختبار).',
   (NOW() - INTERVAL '180 days')::date, 'quarterly', true),

  ('a0000000-0000-0000-0000-000000000404', 'advisory_board',     'active',
   'Advise on regional public-health framework (test).',
   'تقديم المشورة بشأن إطار الصحة العامة الإقليمي (اختبار).',
   (NOW() - INTERVAL '25 days')::date, 'monthly', true),

  ('a0000000-0000-0000-0000-000000000405', 'committee',          'disbanded',
   'Promote cultural exchange (test).',
   'تعزيز التبادل الثقافي (اختبار).',
   (NOW() - INTERVAL '120 days')::date, 'as_needed', true),

  ('a0000000-0000-0000-0000-000000000406', 'steering_committee', 'active',
   'Steer regional energy-transition agenda (test).',
   'توجيه أجندة التحول في الطاقة الإقليمية (اختبار).',
   (NOW() - INTERVAL '45 days')::date, 'quarterly', true)
ON CONFLICT (id) DO NOTHING;
