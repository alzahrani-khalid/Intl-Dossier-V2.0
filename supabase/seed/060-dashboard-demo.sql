-- Seed: 060-dashboard-demo
-- Description: Dashboard handoff fixtures — populates WeekAhead, MyTasks,
--              and OverdueCommitments widgets for the test user
--              (kazahrani@stats.gov.sa) so /dashboard renders meaningful
--              content for design review of the IntelDossier handoff.
-- Date: 2026-04-30
-- Phase: 41 (handoff design port — Priority A)
--
-- Idempotency: All rows use the b00000xx-... UUID prefix. Re-running this
-- seed deletes any existing b00000xx rows first, then re-inserts.

DO $$
DECLARE
  v_user_id   UUID := 'de2734cf-f962-4e05-bf62-bc9e92efff96';   -- kazahrani@stats.gov.sa
  v_tenant_id UUID := 'b0000000-0000-0000-0000-00000000aaaa';   -- handoff-demo tenant

  -- Dossier UUIDs (deterministic so we can FK to them later)
  v_d_indonesia   UUID := 'b0000001-0000-0000-0000-000000000001';
  v_d_escwa       UUID := 'b0000001-0000-0000-0000-000000000002';
  v_d_g20         UUID := 'b0000001-0000-0000-0000-000000000003';
  v_d_china       UUID := 'b0000001-0000-0000-0000-000000000004';
  v_d_oecd        UUID := 'b0000001-0000-0000-0000-000000000005';
  v_d_gcc_stat    UUID := 'b0000001-0000-0000-0000-000000000006';
  v_d_vision_2030 UUID := 'b0000001-0000-0000-0000-000000000007';
  v_d_uae         UUID := 'b0000001-0000-0000-0000-000000000008';
  v_org_id UUID;
  v_country_indonesia UUID;
  v_p_indonesia_delegate UUID := 'b0000011-0000-0000-0000-000000000001';
BEGIN
  INSERT INTO dossiers (id, type, name_en, name_ar, status, sensitivity_level, tags, metadata, created_by)
  VALUES (
    v_tenant_id, 'organization', 'General Authority for Statistics',
    'الهيئة العامة للإحصاء', 'active', 2, ARRAY['handoff-demo', 'tenant-seed'],
    '{"handoff_demo":true,"tenant_seed":true}'::jsonb, v_user_id
  )
  ON CONFLICT (id) DO UPDATE SET
    type = EXCLUDED.type,
    name_en = EXCLUDED.name_en,
    name_ar = EXCLUDED.name_ar,
    status = EXCLUDED.status,
    sensitivity_level = EXCLUDED.sensitivity_level,
    tags = EXCLUDED.tags,
    metadata = dossiers.metadata || EXCLUDED.metadata,
    updated_at = NOW();

  INSERT INTO organizations (id, org_code, org_type, is_seed_data)
  VALUES (v_tenant_id, 'GASTAT', 'government', true)
  ON CONFLICT (id) DO UPDATE SET
    org_code = EXCLUDED.org_code,
    org_type = EXCLUDED.org_type,
    is_seed_data = EXCLUDED.is_seed_data;

  INSERT INTO organization_members (organization_id, user_id, role, joined_at, left_at)
  VALUES (v_tenant_id, v_user_id, 'admin', NOW(), NULL)
  ON CONFLICT (organization_id, user_id) DO UPDATE SET
    role = EXCLUDED.role,
    left_at = NULL;

  UPDATE users
  SET default_organization_id = v_tenant_id
  WHERE id = v_user_id
    AND default_organization_id IS NULL;

  INSERT INTO countries (id, iso_code_2, iso_code_3, capital_en, capital_ar, region, subregion, flag_url, is_seed_data)
  VALUES
    (v_d_indonesia, 'ID', 'IDN', 'Jakarta', 'جاكرتا', 'Asia', 'South-eastern Asia', '🇮🇩', true),
    (v_d_china, 'CN', 'CHN', 'Beijing', 'بكين', 'Asia', 'Eastern Asia', '🇨🇳', true)
  ON CONFLICT (id) DO UPDATE SET
    iso_code_2 = EXCLUDED.iso_code_2,
    iso_code_3 = EXCLUDED.iso_code_3,
    capital_en = EXCLUDED.capital_en,
    capital_ar = EXCLUDED.capital_ar,
    region = EXCLUDED.region,
    subregion = EXCLUDED.subregion,
    flag_url = EXCLUDED.flag_url,
    is_seed_data = EXCLUDED.is_seed_data;

  SELECT tenant_isolation.resolve_user_tenant(v_user_id) INTO v_org_id;
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Seed 060 requires an organization membership for user %', v_user_id;
  END IF;

  SELECT id INTO v_country_indonesia
  FROM countries
  WHERE iso_code_2 = 'ID'
  LIMIT 1;
  IF v_country_indonesia IS NULL THEN
    RAISE EXCEPTION 'Seed 060 requires countries.iso_code_2 = ID';
  END IF;

  -- ============================================================================
  -- 1. CLEAN — remove prior handoff-demo rows (idempotent reseed)
  -- ============================================================================
  DELETE FROM work_item_dossiers WHERE dossier_id::text LIKE 'b0000001-%';
  DELETE FROM aa_commitments     WHERE id::text         LIKE 'b0000003-%';
  DELETE FROM assignments        WHERE work_item_id::text LIKE 'b0000004-%';
  DELETE FROM tasks              WHERE id::text         LIKE 'b0000004-%';
  DELETE FROM activity_stream    WHERE id::text         LIKE 'b0000009-%';
  DELETE FROM intake_tickets     WHERE id::text         LIKE 'b0000007-%';
  DELETE FROM calendar_entries   WHERE id::text         LIKE 'b0000006-%';
  DELETE FROM engagements        WHERE id::text         LIKE 'b0000002-%';
  DELETE FROM activities         WHERE id::text         LIKE 'b0000002-%';
  -- engagement_dossiers + forums cascade from dossiers (ON DELETE CASCADE)
  DELETE FROM intelligence_digest WHERE id::text LIKE 'b0000010-%';
  DELETE FROM engagement_participants WHERE id::text LIKE 'b0000012-%' OR participant_dossier_id::text LIKE 'b0000011-%';
  DELETE FROM persons WHERE id::text LIKE 'b0000011-%';
  DELETE FROM dossiers WHERE id::text LIKE 'b0000011-%';
  DELETE FROM dossiers           WHERE id::text         LIKE 'b0000001-%' OR id::text LIKE 'b0000002-%' OR id::text LIKE 'b0000008-%';

  -- ============================================================================
  -- 2. DOSSIERS — 8 international partners (countries / orgs / forum / topic)
  -- ============================================================================
  INSERT INTO dossiers (id, type, name_en, name_ar, status, sensitivity_level, tags, metadata, created_by) VALUES
    (v_d_indonesia,   'country',      'Indonesia',                       'جمهورية إندونيسيا',                          'active', 2, ARRAY['handoff-demo'], '{"handoff_demo":true,"flag":"🇮🇩"}'::jsonb, v_user_id),
    (v_d_escwa,       'organization', 'UN ESCWA',                        'الإسكوا',                                    'active', 2, ARRAY['handoff-demo'], '{"handoff_demo":true,"flag":"🇺🇳"}'::jsonb, v_user_id),
    (v_d_g20,         'forum',        'G20 Data Gaps Initiative',        'مبادرة مجموعة العشرين لسد فجوات البيانات',   'active', 2, ARRAY['handoff-demo'], '{"handoff_demo":true,"flag":"🌐"}'::jsonb, v_user_id),
    (v_d_china,       'country',      'China',                           'جمهورية الصين الشعبية',                       'active', 3, ARRAY['handoff-demo'], '{"handoff_demo":true,"flag":"🇨🇳"}'::jsonb, v_user_id),
    (v_d_oecd,        'organization', 'OECD',                            'منظمة التعاون الاقتصادي والتنمية',           'active', 2, ARRAY['handoff-demo'], '{"handoff_demo":true,"flag":"🇺🇳"}'::jsonb, v_user_id),
    (v_d_gcc_stat,    'organization', 'GCC Statistical Centre',          'المركز الإحصائي لدول مجلس التعاون',          'active', 3, ARRAY['handoff-demo'], '{"handoff_demo":true,"flag":"🇦🇪"}'::jsonb, v_user_id),
    (v_d_vision_2030, 'topic',        'Vision 2030 Alignment',           'التوافق مع رؤية 2030',                       'active', 3, ARRAY['handoff-demo'], '{"handoff_demo":true,"flag":"🇸🇦"}'::jsonb, v_user_id),
    (v_d_uae,         'country',      'United Arab Emirates',            'الإمارات العربية المتحدة',                   'active', 2, ARRAY['handoff-demo'], '{"handoff_demo":true,"flag":"🇦🇪"}'::jsonb, v_user_id);

  -- ============================================================================
  -- 3. ENGAGEMENT-TYPED DOSSIERS (must precede engagements — trigger validate_dossier_type)
  --    Engagements share PK with a dossiers row of type='engagement' (1:1).
  -- ============================================================================
  INSERT INTO dossiers (id, type, name_en, name_ar, status, sensitivity_level, tags, metadata, created_by) VALUES
    ('b0000002-0000-0000-0000-000000000001'::uuid, 'engagement', 'Bilateral consultation — ESCWA',          'مشاورات ثنائية — الإسكوا',                'active', 2, ARRAY['handoff-demo'], '{"handoff_demo":true}'::jsonb, v_user_id),
    ('b0000002-0000-0000-0000-000000000002'::uuid, 'engagement', 'Prep session — G20 Data Gaps Initiative', 'جلسة تحضيرية — مبادرة فجوات البيانات',    'active', 2, ARRAY['handoff-demo'], '{"handoff_demo":true}'::jsonb, v_user_id),
    ('b0000002-0000-0000-0000-000000000003'::uuid, 'engagement', 'Delegation visit — Indonesia BPS',        'زيارة وفد — هيئة الإحصاء الإندونيسية',     'active', 2, ARRAY['handoff-demo'], '{"handoff_demo":true}'::jsonb, v_user_id);

  -- engagement_type values constrained to: meeting, consultation, coordination, workshop, conference, site_visit, ceremony
  -- engagement_category values constrained to: bilateral, multilateral, regional, internal
  INSERT INTO engagements (id, engagement_type, engagement_category, location_en, location_ar) VALUES
    ('b0000002-0000-0000-0000-000000000001'::uuid, 'consultation', 'bilateral',     'Riyadh · GASTAT HQ, Room 4C',  'الرياض · المقر الرئيسي للهيئة، غرفة 4C'),
    ('b0000002-0000-0000-0000-000000000002'::uuid, 'coordination', 'multilateral',  'Virtual · Webex',              'افتراضي · ويبكس'),
    ('b0000002-0000-0000-0000-000000000003'::uuid, 'site_visit',   'bilateral',     'Riyadh · Ritz-Carlton',         'الرياض · فندق ريتز كارلتون');

  -- ============================================================================
  -- 4. TASKS (My Tasks) — 6 tasks assigned to test user, due this week
  -- ============================================================================
  INSERT INTO tasks (id, title, type, source, assignment, timeline, status, priority,
                     created_by, last_modified_by, tenant_id, assignee_id, workflow_stage) VALUES
    ('b0000004-0000-0000-0000-000000000001'::uuid, 'Approve Indonesia delegation brief v3',     'action_item', '{"origin":"handoff-demo"}'::jsonb, '{"assignee_id":"de2734cf-f962-4e05-bf62-bc9e92efff96"}'::jsonb, '{"due":"today"}'::jsonb,    'pending',     'high',   v_user_id, v_user_id, v_tenant_id, v_user_id, 'todo'),
    ('b0000004-0000-0000-0000-000000000002'::uuid, 'Review ESCWA talking points',                'analysis',    '{"origin":"handoff-demo"}'::jsonb, '{"assignee_id":"de2734cf-f962-4e05-bf62-bc9e92efff96"}'::jsonb, '{"due":"today"}'::jsonb,    'pending',     'high',   v_user_id, v_user_id, v_tenant_id, v_user_id, 'todo'),
    ('b0000004-0000-0000-0000-000000000003'::uuid, 'Sign travel authorisation — Muscat',         'action_item', '{"origin":"handoff-demo"}'::jsonb, '{"assignee_id":"de2734cf-f962-4e05-bf62-bc9e92efff96"}'::jsonb, '{"due":"tomorrow"}'::jsonb, 'in_progress', 'medium', v_user_id, v_user_id, v_tenant_id, v_user_id, 'in_progress'),
    ('b0000004-0000-0000-0000-000000000004'::uuid, 'Draft after-action — G20 DGI call',          'preparation', '{"origin":"handoff-demo"}'::jsonb, '{"assignee_id":"de2734cf-f962-4e05-bf62-bc9e92efff96"}'::jsonb, '{"due":"Wed"}'::jsonb,      'in_progress', 'medium', v_user_id, v_user_id, v_tenant_id, v_user_id, 'in_progress'),
    ('b0000004-0000-0000-0000-000000000005'::uuid, 'Respond to OECD data request',               'follow_up',   '{"origin":"handoff-demo"}'::jsonb, '{"assignee_id":"de2734cf-f962-4e05-bf62-bc9e92efff96"}'::jsonb, '{"due":"Thu"}'::jsonb,      'pending',     'medium', v_user_id, v_user_id, v_tenant_id, v_user_id, 'todo'),
    ('b0000004-0000-0000-0000-000000000006'::uuid, 'Quarterly readout — minister',               'preparation', '{"origin":"handoff-demo"}'::jsonb, '{"assignee_id":"de2734cf-f962-4e05-bf62-bc9e92efff96"}'::jsonb, '{"due":"Fri"}'::jsonb,      'pending',     'high',   v_user_id, v_user_id, v_tenant_id, v_user_id, 'todo');

  -- Link tasks to dossiers (work_item_dossiers junction)
  INSERT INTO work_item_dossiers (work_item_type, work_item_id, dossier_id, inheritance_source, is_primary, created_by) VALUES
    ('task', 'b0000004-0000-0000-0000-000000000001'::uuid, v_d_indonesia,   'direct', true, v_user_id),
    ('task', 'b0000004-0000-0000-0000-000000000002'::uuid, v_d_escwa,       'direct', true, v_user_id),
    ('task', 'b0000004-0000-0000-0000-000000000003'::uuid, v_d_gcc_stat,    'direct', true, v_user_id),
    ('task', 'b0000004-0000-0000-0000-000000000004'::uuid, v_d_g20,         'direct', true, v_user_id),
    ('task', 'b0000004-0000-0000-0000-000000000005'::uuid, v_d_oecd,        'direct', true, v_user_id),
    ('task', 'b0000004-0000-0000-0000-000000000006'::uuid, v_d_vision_2030, 'direct', true, v_user_id);

  -- Assignments (mirrors tasks.assignee for the assignment-driven views)
  INSERT INTO assignments (id, work_item_id, work_item_type, assignee_id, sla_deadline, priority, status, workflow_stage) VALUES
    ('b0000005-0000-0000-0000-000000000001'::uuid, 'b0000004-0000-0000-0000-000000000001'::uuid, 'task', v_user_id, NOW() + INTERVAL '12 hours', 'high',   'assigned',    'todo'),
    ('b0000005-0000-0000-0000-000000000002'::uuid, 'b0000004-0000-0000-0000-000000000002'::uuid, 'task', v_user_id, NOW() + INTERVAL '18 hours', 'high',   'assigned',    'todo'),
    ('b0000005-0000-0000-0000-000000000003'::uuid, 'b0000004-0000-0000-0000-000000000003'::uuid, 'task', v_user_id, NOW() + INTERVAL '1 day',    'medium', 'in_progress', 'in_progress'),
    ('b0000005-0000-0000-0000-000000000004'::uuid, 'b0000004-0000-0000-0000-000000000004'::uuid, 'task', v_user_id, NOW() + INTERVAL '2 days',   'medium', 'in_progress', 'in_progress'),
    ('b0000005-0000-0000-0000-000000000005'::uuid, 'b0000004-0000-0000-0000-000000000005'::uuid, 'task', v_user_id, NOW() + INTERVAL '3 days',   'medium', 'assigned',    'todo'),
    ('b0000005-0000-0000-0000-000000000006'::uuid, 'b0000004-0000-0000-0000-000000000006'::uuid, 'task', v_user_id, NOW() + INTERVAL '4 days',   'high',   'assigned',    'todo');

  -- ============================================================================
  -- 5. AA_COMMITMENTS (Overdue) — 8 commitments owned by test user, all overdue
  -- ============================================================================
  INSERT INTO aa_commitments (id, dossier_id, title, description, priority, status, owner_type, owner_user_id, tracking_mode, due_date) VALUES
    ('b0000003-0000-0000-0000-000000000001'::uuid, v_d_china,       'Test commitment for China partnership',         'Initial test commitment for China partnership scoping.',          'high',   'pending',     'internal', v_user_id, 'automatic', CURRENT_DATE - 147),
    ('b0000003-0000-0000-0000-000000000002'::uuid, v_d_china,       'Review Belt and Road participation terms',      'Review participation terms for Belt and Road initiative.',        'high',   'in_progress', 'internal', v_user_id, 'automatic', CURRENT_DATE - 62),
    ('b0000003-0000-0000-0000-000000000003'::uuid, v_d_china,       'Re-engage on post-Belt-and-Road trade note',    'Follow up on trade note circulated post-Belt-and-Road.',          'medium', 'pending',     'internal', v_user_id, 'automatic', CURRENT_DATE - 12),
    ('b0000003-0000-0000-0000-000000000004'::uuid, v_d_g20,         'Finalize G20 cooperation agreement',            'Finalize cooperation framework for G20 DGI-3 phase.',             'high',   'in_progress', 'internal', v_user_id, 'automatic', CURRENT_DATE - 141),
    ('b0000003-0000-0000-0000-000000000005'::uuid, v_d_vision_2030, 'Coordinate Vision 2030 alignment readout',      'Coordinate quarterly readout of Vision 2030 alignment progress.', 'medium', 'in_progress', 'internal', v_user_id, 'automatic', CURRENT_DATE - 110),
    ('b0000003-0000-0000-0000-000000000006'::uuid, v_d_uae,         'Schedule next bilateral meeting',               'Schedule next UAE bilateral and confirm protocol.',               'medium', 'pending',     'internal', v_user_id, 'automatic', CURRENT_DATE - 125),
    ('b0000003-0000-0000-0000-000000000007'::uuid, v_d_oecd,        'Finalize defense-cooperation framework',        'Close out OECD defense-cooperation framework draft.',             'high',   'in_progress', 'internal', v_user_id, 'automatic', CURRENT_DATE - 73),
    ('b0000003-0000-0000-0000-000000000008'::uuid, v_d_uae,         'Send follow-up documentation',                  'Compile and send follow-up documentation to UAE counterpart.',    'high',   'pending',     'internal', v_user_id, 'automatic', CURRENT_DATE - 165);

  -- ============================================================================
  -- 6. ENGAGEMENT_DOSSIERS — what the dashboard RPCs actually read
  --    (legacy `engagements` table is NOT what get_dashboard_stats / get_upcoming_events query)
  --    engagement_type ∈ {bilateral_meeting, mission, delegation, summit, working_group,
  --                       roundtable, official_visit, consultation, forum_session, other}
  --    engagement_category ∈ {diplomatic, statistical, technical, economic, cultural,
  --                           educational, research, other}
  --    lifecycle_stage ∈ {intake, preparation, briefing, execution, follow_up, closed}
  -- ============================================================================
  INSERT INTO engagement_dossiers
    (id, engagement_type, engagement_category, start_date, end_date,
     lifecycle_stage, engagement_status, location_en, location_ar) VALUES
    ('b0000002-0000-0000-0000-000000000001'::uuid, 'consultation',  'diplomatic',
     date_trunc('hour', NOW()) + INTERVAL '2 hours',  date_trunc('hour', NOW()) + INTERVAL '4 hours',
     'execution',   'in_progress', 'Riyadh · GASTAT HQ, Room 4C',  'الرياض · المقر الرئيسي للهيئة، غرفة 4C'),
    ('b0000002-0000-0000-0000-000000000002'::uuid, 'working_group', 'statistical',
     date_trunc('day', NOW()) + INTERVAL '1 day 10 hours', date_trunc('day', NOW()) + INTERVAL '1 day 12 hours',
     'preparation', 'planned',     'Virtual · Webex',              'افتراضي · ويبكس'),
    ('b0000002-0000-0000-0000-000000000003'::uuid, 'official_visit','diplomatic',
     date_trunc('day', NOW()) + INTERVAL '2 days 14 hours', date_trunc('day', NOW()) + INTERVAL '4 days 16 hours',
     'briefing',    'confirmed',   'Riyadh · Ritz-Carlton',        'الرياض · فندق ريتز كارلتون');

  -- ============================================================================
  -- 6A. VIP PERSON PARTICIPANT — feeds VipVisits person ISO enrichment
  -- ============================================================================
  INSERT INTO dossiers (id, type, name_en, name_ar, status, sensitivity_level, tags, metadata, created_by)
  VALUES (
    v_p_indonesia_delegate, 'person', 'Dr. Sari Widodo', 'د. ساري ويدودو',
    'active', 2, ARRAY['handoff-demo', 'vip-visit'],
    '{"handoff_demo":true,"vip_seed":true}'::jsonb, v_user_id
  );

  INSERT INTO persons (id, title_en, title_ar, nationality_country_id)
  VALUES (
    v_p_indonesia_delegate,
    'Head of delegation',
    'رئيسة الوفد',
    v_country_indonesia
  );

  INSERT INTO engagement_participants
    (id, engagement_id, participant_type, participant_dossier_id, role, attendance_status, created_by)
  VALUES
    ('b0000012-0000-0000-0000-000000000001'::uuid,
     'b0000002-0000-0000-0000-000000000003'::uuid,
     'person',
     v_p_indonesia_delegate,
     'head_of_delegation',
     'confirmed',
     v_user_id);

  -- ============================================================================
  -- 7. CALENDAR_ENTRIES — feeds WeekAhead and dashboard upcoming events
  --    entry_type ∈ {internal_meeting, deadline, reminder, holiday, training, review, forum, other}
  -- ============================================================================
  INSERT INTO calendar_entries
    (id, title_en, title_ar, entry_type, event_date, event_time, duration_minutes,
     organizer_id, status, dossier_id) VALUES
    ('b0000006-0000-0000-0000-000000000001'::uuid, 'Standup — Indonesia delegation',  'وقفة فريق — وفد إندونيسيا',
     'internal_meeting', CURRENT_DATE,                  '09:00', 30, v_user_id, 'scheduled', v_d_indonesia),
    ('b0000006-0000-0000-0000-000000000002'::uuid, 'Brief minister — Vision 2030',     'إيجاز الوزير — رؤية 2030',
     'review',           CURRENT_DATE + 1,              '11:00', 60, v_user_id, 'scheduled', v_d_vision_2030),
    ('b0000006-0000-0000-0000-000000000003'::uuid, 'Submit OECD data response',        'تقديم رد بيانات OECD',
     'deadline',         CURRENT_DATE + 2,              '17:00', 15, v_user_id, 'scheduled', v_d_oecd),
    ('b0000006-0000-0000-0000-000000000004'::uuid, 'Training — new dossier workflow',  'تدريب — سير عمل الملف الجديد',
     'training',         CURRENT_DATE + 3,              '14:00', 90, v_user_id, 'scheduled', NULL),
    ('b0000006-0000-0000-0000-000000000005'::uuid, 'GCC sync — quarterly readout',     'مزامنة الخليج — التقرير الفصلي',
     'internal_meeting', CURRENT_DATE + 5,              '10:00', 45, v_user_id, 'scheduled', v_d_gcc_stat);

  -- ============================================================================
  -- 8. INTAKE_TICKETS — feeds SlaHealth (sla_at_risk = external_deadline within 48h)
  -- ============================================================================
  INSERT INTO intake_tickets
    (id, ticket_number, request_type, title, title_ar, description, description_ar,
     sensitivity, urgency, priority, status, source,
     assigned_to, dossier_id, external_deadline,
     created_by, updated_by) VALUES
    ('b0000007-0000-0000-0000-000000000001'::uuid, 'DEMO-INTAKE-001', 'engagement',
     'Coordinate Indonesia BPS delegation logistics', 'تنسيق لوجستيات وفد BPS الإندونيسي',
     'Hotel and protocol coordination for the incoming Indonesia BPS delegation visit.',
     'تنسيق الفنادق والبروتوكول لوفد BPS الإندونيسي القادم.',
     'internal', 'high', 'high', 'assigned', 'web',
     v_user_id, v_d_indonesia, NOW() + INTERVAL '36 hours',
     v_user_id, v_user_id),
    ('b0000007-0000-0000-0000-000000000002'::uuid, 'DEMO-INTAKE-002', 'mou_action',
     'Draft response — OECD data request',           'صياغة رد — طلب بيانات OECD',
     'Prepare formal data response to OECD secretariat per Q2 cooperation framework.',
     'إعداد رد رسمي على طلب البيانات لأمانة OECD وفق إطار التعاون للربع الثاني.',
     'internal', 'medium', 'normal', 'in_progress', 'email',
     v_user_id, v_d_oecd, NOW() + INTERVAL '5 days',
     v_user_id, v_user_id);

  -- ============================================================================
  -- 9. ADDITIONAL FORUM-TYPED DOSSIERS (3 more — feeds ForumsStrip widget)
  -- ============================================================================
  INSERT INTO dossiers (id, type, name_en, name_ar, status, sensitivity_level, tags, metadata, created_by) VALUES
    ('b0000008-0000-0000-0000-000000000001'::uuid, 'forum', 'UN Statistical Commission', 'اللجنة الإحصائية للأمم المتحدة', 'active', 2, ARRAY['handoff-demo'], '{"handoff_demo":true,"flag":"🇺🇳"}'::jsonb, v_user_id),
    ('b0000008-0000-0000-0000-000000000002'::uuid, 'forum', 'IAOS Biennial Conference',  'مؤتمر IAOS الثنائي',              'active', 2, ARRAY['handoff-demo'], '{"handoff_demo":true,"flag":"🌐"}'::jsonb, v_user_id),
    ('b0000008-0000-0000-0000-000000000003'::uuid, 'forum', 'Arab Statisticians Forum',  'منتدى الإحصائيين العرب',          'active', 2, ARRAY['handoff-demo'], '{"handoff_demo":true,"flag":"🇸🇦"}'::jsonb, v_user_id);

  -- ============================================================================
  -- 10. FORUMS — 1:1 with forum-typed dossiers (is_seed_data NOT NULL)
  -- ============================================================================
  INSERT INTO forums (id, number_of_sessions, is_seed_data) VALUES
    (v_d_g20,                                       4, true),
    ('b0000008-0000-0000-0000-000000000001'::uuid,  6, true),
    ('b0000008-0000-0000-0000-000000000002'::uuid,  2, true),
    ('b0000008-0000-0000-0000-000000000003'::uuid,  3, true);

  -- ============================================================================
  -- 11. ACTIVITY_STREAM — feeds Digest widget via activity-feed Edge Function
  --     CHECK constraints (verified in DB, not assumed):
  --       action_type ∈ {create, update, delete, comment, status_change, upload,
  --                      download, view, share, assign, mention, approval,
  --                      rejection, archive, restore}
  --       entity_type ∈ {country, organization, person, engagement, forum,
  --                      working_group, theme, mou, document, event, contact,
  --                      task, brief, commitment, deliverable, position,
  --                      relationship, intelligence, intake_ticket}
  --       visibility_scope ∈ {all, team, managers, private}
  -- ============================================================================
  INSERT INTO activity_stream
    (id, action_type, entity_type, entity_id, entity_name_en, entity_name_ar,
     actor_id, actor_name, description_en, description_ar, created_at, is_public, visibility_scope) VALUES
    ('b0000009-0000-0000-0000-000000000001'::uuid, 'create',        'country',       v_d_indonesia,
      'Indonesia', 'جمهورية إندونيسيا', v_user_id, 'Khalid Alzahrani',
      'New dossier created — Indonesia bilateral cooperation pipeline.',
      'تم إنشاء ملف جديد — مسار التعاون الثنائي مع إندونيسيا.', NOW() - INTERVAL '15 minutes', true, 'team'),
    ('b0000009-0000-0000-0000-000000000002'::uuid, 'status_change', 'engagement',    'b0000002-0000-0000-0000-000000000001'::uuid,
      'Bilateral consultation — ESCWA', 'مشاورات ثنائية — الإسكوا', v_user_id, 'Khalid Alzahrani',
      'Engagement moved to execution stage; agenda v2 attached.',
      'تم نقل المشاركة إلى مرحلة التنفيذ؛ مرفق جدول الأعمال v2.', NOW() - INTERVAL '1 hour', true, 'team'),
    ('b0000009-0000-0000-0000-000000000003'::uuid, 'create',        'commitment',    'b0000003-0000-0000-0000-000000000003'::uuid,
      'Re-engage on post-Belt-and-Road trade note', 'متابعة مذكرة التجارة بعد الحزام والطريق', v_user_id, 'Khalid Alzahrani',
      'New commitment logged after China bilateral readout.',
      'تم تسجيل التزام جديد بعد التقرير الثنائي مع الصين.', NOW() - INTERVAL '2 hours', true, 'team'),
    ('b0000009-0000-0000-0000-000000000004'::uuid, 'update',        'forum',         'b0000008-0000-0000-0000-000000000001'::uuid,
      'UN Statistical Commission', 'اللجنة الإحصائية للأمم المتحدة', v_user_id, 'Khalid Alzahrani',
      'Sponsorship list confirmed — 6 sessions scheduled for Q3.',
      'تم تأكيد قائمة الرعاة — 6 جلسات مجدولة للربع الثالث.', NOW() - INTERVAL '4 hours', true, 'team'),
    ('b0000009-0000-0000-0000-000000000005'::uuid, 'assign',        'task',          'b0000004-0000-0000-0000-000000000001'::uuid,
      'Approve Indonesia delegation brief v3', 'الموافقة على ملخص وفد إندونيسيا v3', v_user_id, 'Khalid Alzahrani',
      'High-priority task assigned for delegation brief approval.',
      'تم تعيين مهمة عالية الأولوية للموافقة على ملخص الوفد.', NOW() - INTERVAL '6 hours', true, 'team'),
    ('b0000009-0000-0000-0000-000000000006'::uuid, 'create',        'intake_ticket', 'b0000007-0000-0000-0000-000000000001'::uuid,
      'Coordinate Indonesia BPS delegation logistics', 'تنسيق لوجستيات وفد BPS الإندونيسي', v_user_id, 'Khalid Alzahrani',
      'Intake ticket DEMO-INTAKE-001 raised — SLA 48h.',
      'تم رفع تذكرة الاستقبال DEMO-INTAKE-001 — SLA 48 ساعة.', NOW() - INTERVAL '8 hours', true, 'team'),
    ('b0000009-0000-0000-0000-000000000007'::uuid, 'update',        'organization',  v_d_oecd,
      'OECD', 'منظمة التعاون الاقتصادي والتنمية', v_user_id, 'Khalid Alzahrani',
      'OECD framework draft revised — sections 3 and 7 redlined.',
      'تمت مراجعة مسودة إطار OECD — تم تعديل القسمين 3 و 7.', NOW() - INTERVAL '14 hours', true, 'team'),
    ('b0000009-0000-0000-0000-000000000008'::uuid, 'create',        'engagement',    'b0000002-0000-0000-0000-000000000003'::uuid,
      'Delegation visit — Indonesia BPS', 'زيارة وفد — هيئة الإحصاء الإندونيسية', v_user_id, 'Khalid Alzahrani',
      'Indonesia BPS delegation visit scheduled — confirmed by host.',
      'تم جدولة زيارة وفد BPS الإندونيسي — مؤكدة من المضيف.', NOW() - INTERVAL '20 hours', true, 'team');

  -- ============================================================================
  -- 12. INTELLIGENCE_DIGEST — feeds Digest widget with publication source labels
  -- ============================================================================
  INSERT INTO intelligence_digest
    (id, organization_id, headline_en, headline_ar, summary_en, summary_ar,
     source_publication, occurred_at, dossier_id, created_by, created_at)
  VALUES
    ('b0000010-0000-0000-0000-000000000001'::uuid, v_org_id,
     'Reuters flags China trade-data revisions', 'رويترز ترصد مراجعات بيانات التجارة الصينية',
     'Analysts should review the China readout before the next bilateral follow-up.',
     'ينبغي للمحللين مراجعة موجز الصين قبل المتابعة الثنائية القادمة.',
     'Reuters', NOW() - INTERVAL '25 minutes', v_d_china, v_user_id, NOW() - INTERVAL '25 minutes'),
    ('b0000010-0000-0000-0000-000000000002'::uuid, v_org_id,
     'Al Sharq covers GCC statistical data forum', 'الشرق تغطي منتدى البيانات الإحصائية الخليجي',
     'The item supports the GCC Statistical Centre dossier with a publication-named source.',
     'يدعم هذا البند ملف المركز الإحصائي الخليجي بمصدر يحمل اسم منشور.',
     'Al Sharq', NOW() - INTERVAL '2 hours', v_d_gcc_stat, v_user_id, NOW() - INTERVAL '2 hours'),
    ('b0000010-0000-0000-0000-000000000003'::uuid, v_org_id,
     'UN ESCWA publishes SDG data brief', 'الإسكوا تنشر موجز بيانات أهداف التنمية',
     'The digest row links the ESCWA dossier to a real publication label.',
     'يربط بند الموجز ملف الإسكوا بتسمية منشور حقيقية.',
     'UN ESCWA', NOW() - INTERVAL '4 hours', v_d_escwa, v_user_id, NOW() - INTERVAL '4 hours'),
    ('b0000010-0000-0000-0000-000000000004'::uuid, v_org_id,
     'OECD releases quarterly data-governance note', 'منظمة التعاون الاقتصادي تصدر مذكرة حوكمة بيانات ربع سنوية',
     'The item gives the dashboard a fourth seeded publication source.',
     'يمنح هذا البند لوحة التحكم مصدر منشور رابع مزروع.',
     'OECD Statistics Directorate', NOW() - INTERVAL '8 hours', v_d_oecd, v_user_id, NOW() - INTERVAL '8 hours');

  RAISE NOTICE 'Seed 060 complete: 8+3+3+1 dossiers, 1 VIP participant, 3 engagement_dossiers, 4 forums, 6 tasks, 6 assignments, 8 commitments, 5 calendar_entries, 2 intake_tickets, 8 activity_stream, 4 intelligence_digest.';
END $$;
