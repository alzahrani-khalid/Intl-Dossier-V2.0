-- Phase 40 Gap-Closure G9: seed person test dossiers
-- ----------------------------------------------------------------------------
-- Purpose: populate /dossiers/persons list page so the D-04 card aesthetic
-- (44px avatar + bilingual name + role · org meta + VIP chip) is visually
-- verifiable. The existing populate_diplomatic_seed RPC short-circuits on
-- v_already=true (other tables already carry is_seed_data rows), so a
-- direct INSERT is required here.
--
-- Schema notes (verified against migrations 20251022000002 + 20260110000003):
--   dossiers.status            CHECK ∈ {active, inactive, archived, deleted}
--   dossiers.sensitivity_level INT 1..4 (page filters out archived)
--   dossiers   carries is_seed_data; persons does NOT
--   persons.importance_level   INT 1..5
--                              1=Regular  2=Important  3=Key  4=VIP  5=Critical
--   PersonsListPage VIP rule:  is_vip = importance_level >= 4
--
-- VIP coverage in this seed: rows 0501 (level 5) + 0502 (level 4) → 2 rows ≥ 4.
-- All names are clearly fictional ("Test Person …" / "شخص اختباري …").
-- Email domain uses RFC 2606 reserved .test TLD (no real domains).
-- Idempotent via the conflict clause on each INSERT.
--
-- Verification SQL after apply:
--   SELECT count(*)::int AS person_count,
--          count(*) FILTER (WHERE p.importance_level >= 4)::int AS vip_count
--   FROM dossiers d INNER JOIN persons p ON p.id = d.id
--   WHERE d.type = 'person' AND d.is_seed_data = true;
--   -- Expected: person_count >= 10 AND vip_count >= 2
-- ----------------------------------------------------------------------------

-- Step 1: insert person dossier rows
INSERT INTO dossiers (
  id, type, name_en, name_ar, description_en, description_ar,
  status, sensitivity_level, tags, is_seed_data, created_at, updated_at
)
VALUES
  ('a0000000-0000-0000-0000-000000000501', 'person',
   'Test Person A — Senior Diplomat',
   'شخص اختباري أ — دبلوماسي رفيع',
   'Test fixture for Phase 40 persons list page (G9 gap-closure).',
   'بيانات اختبارية للمرحلة 40 - صفحة الأشخاص (سد الثغرة G9).',
   'active', 1, ARRAY['test', 'person'], true,
   NOW() - INTERVAL '180 days', NOW() - INTERVAL '1 day'),

  ('a0000000-0000-0000-0000-000000000502', 'person',
   'Test Person B — Trade Envoy',
   'شخص اختباري ب — مبعوث تجاري',
   'Test fixture for Phase 40 persons list page (G9 gap-closure).',
   'بيانات اختبارية للمرحلة 40 - صفحة الأشخاص (سد الثغرة G9).',
   'active', 1, ARRAY['test', 'person'], true,
   NOW() - INTERVAL '120 days', NOW() - INTERVAL '5 days'),

  ('a0000000-0000-0000-0000-000000000503', 'person',
   'Test Person C — Policy Advisor',
   'شخص اختباري ج — مستشار سياسات',
   'Test fixture for Phase 40 persons list page (G9 gap-closure).',
   'بيانات اختبارية للمرحلة 40 - صفحة الأشخاص (سد الثغرة G9).',
   'active', 2, ARRAY['test', 'person'], true,
   NOW() - INTERVAL '90 days', NOW() - INTERVAL '12 days'),

  ('a0000000-0000-0000-0000-000000000504', 'person',
   'Test Person D — Regional Coordinator',
   'شخص اختباري د — منسق إقليمي',
   'Test fixture for Phase 40 persons list page (G9 gap-closure).',
   'بيانات اختبارية للمرحلة 40 - صفحة الأشخاص (سد الثغرة G9).',
   'active', 1, ARRAY['test', 'person'], true,
   NOW() - INTERVAL '75 days', NOW() - INTERVAL '20 days'),

  ('a0000000-0000-0000-0000-000000000505', 'person',
   'Test Person E — Technical Attaché',
   'شخص اختباري هـ — ملحق تقني',
   'Test fixture for Phase 40 persons list page (G9 gap-closure).',
   'بيانات اختبارية للمرحلة 40 - صفحة الأشخاص (سد الثغرة G9).',
   'active', 1, ARRAY['test', 'person'], true,
   NOW() - INTERVAL '60 days', NOW() - INTERVAL '30 days'),

  ('a0000000-0000-0000-0000-000000000506', 'person',
   'Test Person F — Cultural Liaison',
   'شخص اختباري و — منسق ثقافي',
   'Test fixture for Phase 40 persons list page (G9 gap-closure).',
   'بيانات اختبارية للمرحلة 40 - صفحة الأشخاص (سد الثغرة G9).',
   'active', 1, ARRAY['test', 'person'], true,
   NOW() - INTERVAL '50 days', NOW() - INTERVAL '40 days'),

  ('a0000000-0000-0000-0000-000000000507', 'person',
   'Test Person G — Economics Analyst',
   'شخص اختباري ز — محلل اقتصادي',
   'Test fixture for Phase 40 persons list page (G9 gap-closure).',
   'بيانات اختبارية للمرحلة 40 - صفحة الأشخاص (سد الثغرة G9).',
   'active', 2, ARRAY['test', 'person'], true,
   NOW() - INTERVAL '40 days', NOW() - INTERVAL '60 days'),

  ('a0000000-0000-0000-0000-000000000508', 'person',
   'Test Person H — Climate Specialist',
   'شخص اختباري ح — أخصائي مناخ',
   'Test fixture for Phase 40 persons list page (G9 gap-closure).',
   'بيانات اختبارية للمرحلة 40 - صفحة الأشخاص (سد الثغرة G9).',
   'active', 1, ARRAY['test', 'person'], true,
   NOW() - INTERVAL '30 days', NOW() - INTERVAL '80 days'),

  ('a0000000-0000-0000-0000-000000000509', 'person',
   'Test Person I — Health Coordinator',
   'شخص اختباري ط — منسق صحي',
   'Test fixture for Phase 40 persons list page (G9 gap-closure).',
   'بيانات اختبارية للمرحلة 40 - صفحة الأشخاص (سد الثغرة G9).',
   'active', 1, ARRAY['test', 'person'], true,
   NOW() - INTERVAL '20 days', NOW() - INTERVAL '100 days'),

  ('a0000000-0000-0000-0000-000000000510', 'person',
   'Test Person J — Digital Affairs Officer',
   'شخص اختباري ي — مسؤول الشؤون الرقمية',
   'Test fixture for Phase 40 persons list page (G9 gap-closure).',
   'بيانات اختبارية للمرحلة 40 - صفحة الأشخاص (سد الثغرة G9).',
   'active', 1, ARRAY['test', 'person'], true,
   NOW() - INTERVAL '10 days', NOW() - INTERVAL '120 days')
ON CONFLICT (id) DO NOTHING;

-- Step 2: insert matching persons extension rows.
-- The PersonsListPage VIP rule reads importance_level; rows 0501 (5)
-- and 0502 (4) cover ≥ 2 VIP-tier seeds.
INSERT INTO persons (
  id, title_en, title_ar, importance_level, email,
  biography_en, biography_ar
)
VALUES
  -- importance_level=5 → VIP (Critical)
  ('a0000000-0000-0000-0000-000000000501',
   'Senior Diplomat',           'دبلوماسي رفيع',
   5,
   'testpersona@example.test',
   'Test biography for Phase 40 persons list (G9 gap-closure).',
   'سيرة اختبارية لصفحة الأشخاص في المرحلة 40 (سد الثغرة G9).'),

  -- importance_level=4 → VIP
  ('a0000000-0000-0000-0000-000000000502',
   'Trade Envoy',               'مبعوث تجاري',
   4,
   'testpersonb@example.test',
   'Test biography for Phase 40 persons list (G9 gap-closure).',
   'سيرة اختبارية لصفحة الأشخاص في المرحلة 40 (سد الثغرة G9).'),

  -- importance_level=3 → Key
  ('a0000000-0000-0000-0000-000000000503',
   'Policy Advisor',            'مستشار سياسات',
   3,
   'testpersonc@example.test',
   'Test biography for Phase 40 persons list (G9 gap-closure).',
   'سيرة اختبارية لصفحة الأشخاص في المرحلة 40 (سد الثغرة G9).'),

  -- importance_level=3 → Key
  ('a0000000-0000-0000-0000-000000000504',
   'Regional Coordinator',      'منسق إقليمي',
   3,
   'testpersond@example.test',
   'Test biography for Phase 40 persons list (G9 gap-closure).',
   'سيرة اختبارية لصفحة الأشخاص في المرحلة 40 (سد الثغرة G9).'),

  -- importance_level=2 → Important
  ('a0000000-0000-0000-0000-000000000505',
   'Technical Attaché',         'ملحق تقني',
   2,
   'testpersone@example.test',
   'Test biography for Phase 40 persons list (G9 gap-closure).',
   'سيرة اختبارية لصفحة الأشخاص في المرحلة 40 (سد الثغرة G9).'),

  -- importance_level=2 → Important
  ('a0000000-0000-0000-0000-000000000506',
   'Cultural Liaison',          'منسق ثقافي',
   2,
   'testpersonf@example.test',
   'Test biography for Phase 40 persons list (G9 gap-closure).',
   'سيرة اختبارية لصفحة الأشخاص في المرحلة 40 (سد الثغرة G9).'),

  -- importance_level=1 → Regular
  ('a0000000-0000-0000-0000-000000000507',
   'Economics Analyst',         'محلل اقتصادي',
   1,
   'testpersong@example.test',
   'Test biography for Phase 40 persons list (G9 gap-closure).',
   'سيرة اختبارية لصفحة الأشخاص في المرحلة 40 (سد الثغرة G9).'),

  -- importance_level=1 → Regular
  ('a0000000-0000-0000-0000-000000000508',
   'Climate Specialist',        'أخصائي مناخ',
   1,
   'testpersonh@example.test',
   'Test biography for Phase 40 persons list (G9 gap-closure).',
   'سيرة اختبارية لصفحة الأشخاص في المرحلة 40 (سد الثغرة G9).'),

  -- importance_level=1 → Regular
  ('a0000000-0000-0000-0000-000000000509',
   'Health Coordinator',        'منسق صحي',
   1,
   'testpersoni@example.test',
   'Test biography for Phase 40 persons list (G9 gap-closure).',
   'سيرة اختبارية لصفحة الأشخاص في المرحلة 40 (سد الثغرة G9).'),

  -- importance_level=1 → Regular
  ('a0000000-0000-0000-0000-000000000510',
   'Digital Affairs Officer',   'مسؤول الشؤون الرقمية',
   1,
   'testpersonj@example.test',
   'Test biography for Phase 40 persons list (G9 gap-closure).',
   'سيرة اختبارية لصفحة الأشخاص في المرحلة 40 (سد الثغرة G9).')
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- Verification: SELECT count(*) FROM dossiers WHERE type='person'
--   AND is_seed_data=true   should return >= 10 after apply.
-- ----------------------------------------------------------------------------
