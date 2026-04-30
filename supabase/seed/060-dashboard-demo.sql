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
BEGIN
  -- ============================================================================
  -- 1. CLEAN — remove prior handoff-demo rows (idempotent reseed)
  -- ============================================================================
  DELETE FROM work_item_dossiers WHERE dossier_id::text LIKE 'b0000001-%';
  DELETE FROM aa_commitments     WHERE id::text         LIKE 'b0000003-%';
  DELETE FROM assignments        WHERE work_item_id::text LIKE 'b0000004-%';
  DELETE FROM tasks              WHERE id::text         LIKE 'b0000004-%';
  DELETE FROM engagements        WHERE id::text         LIKE 'b0000002-%';
  DELETE FROM activities         WHERE id::text         LIKE 'b0000002-%';
  DELETE FROM dossiers           WHERE id::text         LIKE 'b0000001-%';

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

  RAISE NOTICE 'Seed 060 complete: 8 dossiers, 3 engagements, 6 tasks, 6 assignments, 8 commitments.';
END $$;
