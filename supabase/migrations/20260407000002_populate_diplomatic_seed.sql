-- Phase 17 Plan 02: GASTAT diplomatic seed RPC (D-06, D-07, D-13, D-14)
--
-- Amended per 17-SCHEMA-RECONCILIATION.md §10 (2026-04-07):
--   (a) Typed-dossier 1:1 PK inheritance: countries/organizations/forums/engagements/
--       topics/persons/working_groups have id = dossiers.id. Bilingual names come from
--       dossiers.name_en/name_ar. Typed tables hold only type-specific metadata.
--   (b) No users.tenant_id column; tenant_id is a denormalized constant. This RPC
--       hardcodes the default tenant '00000000-0000-0000-0000-000000000001'.
--
-- Constraint reconciliation pass (2026-04-07 UAT):
--   (1) search_path includes `extensions` so uuid_generate_v5 resolves under
--       Supabase's standard extensions schema.
--   (2) organizations.org_type ∈ {government, ngo, private, international, academic}
--       — 'regional' is NOT a valid value, AITRS / ISI mapped to 'academic'.
--   (3) topics.theme_category ∈ {policy, technical, strategic, operational}
--       — 'methodology' / 'innovation' are NOT valid; mapped to technical/strategic.
--   (4) engagements.engagement_type ∈ {meeting, consultation, coordination, workshop,
--       conference, site_visit, ceremony} — bilateral_visit/joint_committee/mou_signing
--       /forum_attendance are NOT valid; remapped to site_visit/meeting/ceremony/conference.
--   (5) engagements.engagement_category ∈ {bilateral, multilateral, regional, internal}
--       — diplomatic/technical are NOT valid; remapped to bilateral/regional/multilateral.
--   (6) tasks.work_item_type ∈ {dossier, position, ticket, generic} — 'task' is NOT valid;
--       seed tasks set work_item_type=NULL because they're standalone, not parented.
--   (7) work_item_dossiers.work_item_type ∈ {task, commitment, intake} — uses 'task'.
--   (8) work_item_dossiers `valid_inheritance_metadata`: when inheritance_source != 'direct',
--       both inherited_from_type and inherited_from_id MUST be set. Secondary org link
--       carries inheritance_source='engagement' + inherited_from_type='engagement' +
--       inherited_from_id pointing at the corresponding seeded engagement dossier.
--   (9) persons.office_type for elected_official rows must be one of the allowed enum
--       values (cabinet_minister / legislature_upper / etc) — 'legislative' is NOT valid.
--
-- Bilingual rule: native *_en/*_ar where they exist (dossiers, countries.capital_*,
-- organizations.address_*, engagements.location_*, persons.title_*, working_groups
-- mandate_*/description_*). tasks have no bilingual columns: title=EN, description=AR.
-- Idempotent-on-empty via EXISTS (... WHERE is_seed_data=true).
-- Deterministic UUIDs via uuid_generate_v5 with fixed namespace.
-- Admin gate matches check_first_run (role IN admin/super_admin, is_active, not expired).

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE OR REPLACE FUNCTION public.populate_diplomatic_seed()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_caller       UUID := auth.uid();
  v_is_admin     BOOLEAN;
  v_already      BOOLEAN;
  v_tenant_id    CONSTANT UUID := '00000000-0000-0000-0000-000000000001';
  v_ns           CONSTANT UUID := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a17';
  v_counts       jsonb;
  v_countries    jsonb;
  v_orgs         jsonb;
  v_forums       jsonb;
  v_topics       jsonb;
  v_wgs          jsonb;
  v_persons      jsonb;
  v_engagements  jsonb;
  v_statuses     text[] := ARRAY['pending','in_progress','review','completed','cancelled'];
  v_priorities   text[] := ARRAY['low','medium','high','urgent'];
  v_types        text[] := ARRAY['action_item','follow_up','preparation','analysis','other'];
  v_stages       text[] := ARRAY['todo','in_progress','review','done','cancelled'];
  v_source_kinds text[] := ARRAY['task','commitment','intake'];
  v_i            INT;
  v_task_id      UUID;
  v_country_ids  UUID[];
  v_org_ids      UUID[];
  v_eng_ids      UUID[];
  v_country_keys text[] := ARRAY['sa','ae','bh','kw','qa','om','eg','jo','id','pk'];
  v_org_keys     text[] := ARRAY['unsd','gcc_stat','oecd','imf','wb','escwa','aitrs','isi','eurostat','fao_stat'];
  v_eng_keys     text[] := ARRAY['e01','e02','e03','e04','e05','e06','e07','e08','e09','e10'];
BEGIN
  IF v_caller IS NULL THEN
    RETURN jsonb_build_object('status','forbidden','reason','unauthenticated');
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = v_caller
      AND role IN ('admin','super_admin')
      AND COALESCE(is_active, true)
      AND (expires_at IS NULL OR expires_at > now())
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    RETURN jsonb_build_object('status','forbidden','reason','not_admin');
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM dossiers WHERE is_seed_data = true
    UNION ALL SELECT 1 FROM countries WHERE is_seed_data = true
    UNION ALL SELECT 1 FROM tasks WHERE is_seed_data = true
  ) INTO v_already;

  IF v_already THEN
    RETURN jsonb_build_object('status','already_seeded');
  END IF;

  ----------------------------------------------------------------------------
  -- COUNTRIES (10)
  ----------------------------------------------------------------------------
  v_countries := '[
    {"key":"sa","en":"Saudi Arabia","ar":"المملكة العربية السعودية","iso2":"SA","iso3":"SAU","cap_en":"Riyadh","cap_ar":"الرياض","region":"Asia","sub":"Western Asia"},
    {"key":"ae","en":"United Arab Emirates","ar":"الإمارات العربية المتحدة","iso2":"AE","iso3":"ARE","cap_en":"Abu Dhabi","cap_ar":"أبو ظبي","region":"Asia","sub":"Western Asia"},
    {"key":"bh","en":"Bahrain","ar":"مملكة البحرين","iso2":"BH","iso3":"BHR","cap_en":"Manama","cap_ar":"المنامة","region":"Asia","sub":"Western Asia"},
    {"key":"kw","en":"Kuwait","ar":"دولة الكويت","iso2":"KW","iso3":"KWT","cap_en":"Kuwait City","cap_ar":"مدينة الكويت","region":"Asia","sub":"Western Asia"},
    {"key":"qa","en":"Qatar","ar":"دولة قطر","iso2":"QA","iso3":"QAT","cap_en":"Doha","cap_ar":"الدوحة","region":"Asia","sub":"Western Asia"},
    {"key":"om","en":"Oman","ar":"سلطنة عمان","iso2":"OM","iso3":"OMN","cap_en":"Muscat","cap_ar":"مسقط","region":"Asia","sub":"Western Asia"},
    {"key":"eg","en":"Egypt","ar":"جمهورية مصر العربية","iso2":"EG","iso3":"EGY","cap_en":"Cairo","cap_ar":"القاهرة","region":"Africa","sub":"Northern Africa"},
    {"key":"jo","en":"Jordan","ar":"المملكة الأردنية الهاشمية","iso2":"JO","iso3":"JOR","cap_en":"Amman","cap_ar":"عمّان","region":"Asia","sub":"Western Asia"},
    {"key":"id","en":"Indonesia","ar":"جمهورية إندونيسيا","iso2":"ID","iso3":"IDN","cap_en":"Jakarta","cap_ar":"جاكرتا","region":"Asia","sub":"South-Eastern Asia"},
    {"key":"pk","en":"Pakistan","ar":"جمهورية باكستان الإسلامية","iso2":"PK","iso3":"PAK","cap_en":"Islamabad","cap_ar":"إسلام آباد","region":"Asia","sub":"Southern Asia"}
  ]'::jsonb;

  INSERT INTO dossiers (id, type, name_en, name_ar, description_en, description_ar, status, sensitivity_level, is_active, is_seed_data, created_by, updated_by, tags)
  SELECT uuid_generate_v5(v_ns, 'country.'||(c->>'key')), 'country', c->>'en', c->>'ar',
    (c->>'en')||' - bilateral diplomatic dossier (Phase 17 seed).',
    'ملف دبلوماسي ثنائي: '||(c->>'ar')||' (بذرة المرحلة 17).',
    'active', 2, true, true, v_caller, v_caller, ARRAY['seed','phase-17','country']
  FROM jsonb_array_elements(v_countries) AS c
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO countries (id, iso_code_2, iso_code_3, capital_en, capital_ar, region, subregion, is_seed_data)
  SELECT uuid_generate_v5(v_ns, 'country.'||(c->>'key')), c->>'iso2', c->>'iso3', c->>'cap_en', c->>'cap_ar', c->>'region', c->>'sub', true
  FROM jsonb_array_elements(v_countries) AS c
  ON CONFLICT (id) DO NOTHING;

  SELECT array_agg(uuid_generate_v5(v_ns, 'country.'||k)) INTO v_country_ids
  FROM unnest(v_country_keys) AS k;

  ----------------------------------------------------------------------------
  -- ORGANIZATIONS (10)
  ----------------------------------------------------------------------------
  v_orgs := '[
    {"key":"unsd","en":"UN Statistics Division","ar":"شعبة الإحصاءات بالأمم المتحدة","code":"UNSD","type":"international","addr_en":"New York, USA","addr_ar":"نيويورك، الولايات المتحدة"},
    {"key":"gcc_stat","en":"GCC Statistical Centre","ar":"المركز الإحصائي لدول مجلس التعاون","code":"GCC-STAT","type":"international","addr_en":"Muscat, Oman","addr_ar":"مسقط، عمان"},
    {"key":"oecd","en":"OECD","ar":"منظمة التعاون الاقتصادي والتنمية","code":"OECD","type":"international","addr_en":"Paris, France","addr_ar":"باريس، فرنسا"},
    {"key":"imf","en":"International Monetary Fund","ar":"صندوق النقد الدولي","code":"IMF","type":"international","addr_en":"Washington, DC","addr_ar":"واشنطن العاصمة"},
    {"key":"wb","en":"World Bank Group","ar":"مجموعة البنك الدولي","code":"WBG","type":"international","addr_en":"Washington, DC","addr_ar":"واشنطن العاصمة"},
    {"key":"escwa","en":"UN ESCWA","ar":"الإسكوا","code":"ESCWA","type":"international","addr_en":"Beirut, Lebanon","addr_ar":"بيروت، لبنان"},
    {"key":"aitrs","en":"Arab Institute for Training and Research in Statistics","ar":"المعهد العربي للتدريب والبحوث الإحصائية","code":"AITRS","type":"academic","addr_en":"Amman, Jordan","addr_ar":"عمّان، الأردن"},
    {"key":"isi","en":"International Statistical Institute","ar":"المعهد الإحصائي الدولي","code":"ISI","type":"academic","addr_en":"The Hague, Netherlands","addr_ar":"لاهاي، هولندا"},
    {"key":"eurostat","en":"Eurostat","ar":"يوروستات","code":"ESTAT","type":"international","addr_en":"Luxembourg","addr_ar":"لوكسمبورغ"},
    {"key":"fao_stat","en":"FAO Statistics Division","ar":"شعبة الإحصاءات بمنظمة الأغذية والزراعة","code":"FAOSTAT","type":"international","addr_en":"Rome, Italy","addr_ar":"روما، إيطاليا"}
  ]'::jsonb;

  INSERT INTO dossiers (id, type, name_en, name_ar, description_en, description_ar, abbreviation, status, sensitivity_level, is_active, is_seed_data, created_by, updated_by, tags)
  SELECT uuid_generate_v5(v_ns, 'org.'||(o->>'key')), 'organization', o->>'en', o->>'ar',
    'Relationship dossier for '||(o->>'en')||' (Phase 17 seed).',
    'ملف علاقة مع '||(o->>'ar')||' (بذرة المرحلة 17).',
    o->>'code', 'active', 2, true, true, v_caller, v_caller, ARRAY['seed','phase-17','organization']
  FROM jsonb_array_elements(v_orgs) AS o
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO organizations (id, org_code, org_type, address_en, address_ar, is_seed_data)
  SELECT uuid_generate_v5(v_ns, 'org.'||(o->>'key')), o->>'code', o->>'type', o->>'addr_en', o->>'addr_ar', true
  FROM jsonb_array_elements(v_orgs) AS o
  ON CONFLICT (id) DO NOTHING;

  SELECT array_agg(uuid_generate_v5(v_ns, 'org.'||k)) INTO v_org_ids
  FROM unnest(v_org_keys) AS k;

  ----------------------------------------------------------------------------
  -- FORUMS (10)
  ----------------------------------------------------------------------------
  v_forums := '[
    {"key":"unsc","en":"UN Statistical Commission","ar":"اللجنة الإحصائية للأمم المتحدة","sessions":55},
    {"key":"wdf","en":"UN World Data Forum","ar":"منتدى الأمم المتحدة للبيانات العالمي","sessions":4},
    {"key":"iaos","en":"IAOS Conference","ar":"مؤتمر الرابطة الدولية للإحصائيين الرسميين","sessions":18},
    {"key":"gcc_am","en":"GCC-Stat Annual Meeting","ar":"الاجتماع السنوي لمركز الإحصاء الخليجي","sessions":10},
    {"key":"oecd_wf","en":"OECD World Forum on Statistics","ar":"منتدى OECD العالمي للإحصاء","sessions":7},
    {"key":"escwa_sc","en":"ESCWA Statistical Committee","ar":"اللجنة الإحصائية للإسكوا","sessions":15},
    {"key":"isi_wsc","en":"ISI World Statistics Congress","ar":"المؤتمر العالمي للإحصاء","sessions":63},
    {"key":"asf","en":"Arab Statistical Forum","ar":"المنتدى الإحصائي العربي","sessions":9},
    {"key":"imf_sf","en":"IMF Statistical Forum","ar":"منتدى صندوق النقد الإحصائي","sessions":11},
    {"key":"g20_dgi","en":"G20 Data Gaps Initiative","ar":"مبادرة مجموعة العشرين لسد الفجوات","sessions":3}
  ]'::jsonb;

  INSERT INTO dossiers (id, type, name_en, name_ar, description_en, description_ar, status, sensitivity_level, is_active, is_seed_data, created_by, updated_by, tags)
  SELECT uuid_generate_v5(v_ns, 'forum.'||(f->>'key')), 'forum', f->>'en', f->>'ar',
    (f->>'en')||' participation dossier (Phase 17 seed).',
    'ملف مشاركة: '||(f->>'ar')||' (بذرة المرحلة 17).',
    'active', 2, true, true, v_caller, v_caller, ARRAY['seed','phase-17','forum']
  FROM jsonb_array_elements(v_forums) AS f
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO forums (id, number_of_sessions, is_seed_data)
  SELECT uuid_generate_v5(v_ns, 'forum.'||(f->>'key')), (f->>'sessions')::int, true
  FROM jsonb_array_elements(v_forums) AS f
  ON CONFLICT (id) DO NOTHING;

  ----------------------------------------------------------------------------
  -- TOPICS (6) — theme_category ∈ {policy, technical, strategic, operational}
  ----------------------------------------------------------------------------
  v_topics := '[
    {"key":"sdg","en":"SDG Indicators","ar":"مؤشرات أهداف التنمية المستدامة","cat":"policy"},
    {"key":"census2030","en":"Census 2030","ar":"التعداد 2030","cat":"technical"},
    {"key":"nat_accts","en":"National Accounts Modernization","ar":"تحديث الحسابات القومية","cat":"technical"},
    {"key":"big_data","en":"Big Data for Official Statistics","ar":"البيانات الضخمة للإحصاء الرسمي","cat":"strategic"},
    {"key":"gender","en":"Gender Statistics","ar":"إحصاءات النوع الاجتماعي","cat":"policy"},
    {"key":"climate","en":"Climate Statistics","ar":"إحصاءات المناخ","cat":"policy"}
  ]'::jsonb;

  INSERT INTO dossiers (id, type, name_en, name_ar, description_en, description_ar, status, sensitivity_level, is_active, is_seed_data, created_by, updated_by, tags)
  SELECT uuid_generate_v5(v_ns, 'topic.'||(t->>'key')), 'topic', t->>'en', t->>'ar',
    'Strategic topic: '||(t->>'en')||' (Phase 17 seed).',
    'موضوع استراتيجي: '||(t->>'ar')||' (بذرة المرحلة 17).',
    'active', 1, true, true, v_caller, v_caller, ARRAY['seed','phase-17','topic']
  FROM jsonb_array_elements(v_topics) AS t
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO topics (id, theme_category, is_seed_data)
  SELECT uuid_generate_v5(v_ns, 'topic.'||(t->>'key')), t->>'cat', true
  FROM jsonb_array_elements(v_topics) AS t
  ON CONFLICT (id) DO NOTHING;

  ----------------------------------------------------------------------------
  -- WORKING GROUPS (4)
  ----------------------------------------------------------------------------
  v_wgs := '[
    {"key":"sdg_wg","en":"SDG Working Group","ar":"الفريق العامل لأهداف التنمية","mandate_en":"Coordinate SDG indicator production","mandate_ar":"تنسيق إنتاج مؤشرات أهداف التنمية"},
    {"key":"census_wg","en":"Census 2030 Working Group","ar":"فريق عمل التعداد 2030","mandate_en":"Plan the 2030 round of population censuses","mandate_ar":"التخطيط لجولة التعداد السكاني 2030"},
    {"key":"dq_wg","en":"Data Quality Working Group","ar":"فريق جودة البيانات","mandate_en":"Establish shared data quality frameworks","mandate_ar":"وضع أطر جودة بيانات مشتركة"},
    {"key":"innov_wg","en":"Innovation Working Group","ar":"فريق الابتكار الإحصائي","mandate_en":"Pilot new data sources and methods","mandate_ar":"اختبار مصادر وأساليب جديدة للبيانات"}
  ]'::jsonb;

  INSERT INTO dossiers (id, type, name_en, name_ar, description_en, description_ar, status, sensitivity_level, is_active, is_seed_data, created_by, updated_by, tags)
  SELECT uuid_generate_v5(v_ns, 'wg.'||(w->>'key')), 'working_group', w->>'en', w->>'ar',
    w->>'mandate_en', w->>'mandate_ar', 'active', 2, true, true, v_caller, v_caller, ARRAY['seed','phase-17','working_group']
  FROM jsonb_array_elements(v_wgs) AS w
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO working_groups (id, mandate_en, mandate_ar, description_en, description_ar, wg_status, wg_type, is_seed_data)
  SELECT uuid_generate_v5(v_ns, 'wg.'||(w->>'key')), w->>'mandate_en', w->>'mandate_ar', w->>'mandate_en', w->>'mandate_ar', 'active', 'committee', true
  FROM jsonb_array_elements(v_wgs) AS w
  ON CONFLICT (id) DO NOTHING;

  ----------------------------------------------------------------------------
  -- PERSONS (12 — including 3 elected_official via person_subtype)
  -- office_type ∈ {head_of_state, head_of_government, cabinet_minister,
  --                legislature_upper, legislature_lower, ...}
  ----------------------------------------------------------------------------
  v_persons := '[
    {"key":"p01","en":"Dr. Fahad Al-Dosari","ar":"د. فهد الدوسري","title_en":"President, GASTAT","title_ar":"رئيس الهيئة العامة للإحصاء","subtype":"standard","office_type":null},
    {"key":"p02","en":"Maha Al-Otaibi","ar":"مها العتيبي","title_en":"Director of International Cooperation","title_ar":"مديرة التعاون الدولي","subtype":"standard","office_type":null},
    {"key":"p03","en":"Stefan Schweinfest","ar":"ستيفان شفاينفست","title_en":"Former Director, UNSD","title_ar":"المدير السابق لشعبة الإحصاءات","subtype":"standard","office_type":null},
    {"key":"p04","en":"Dr. Sabah Al-Sayed","ar":"د. صباح السيد","title_en":"OECD Chief Statistician","title_ar":"كبير الإحصائيين بمنظمة OECD","subtype":"standard","office_type":null},
    {"key":"p05","en":"Dr. Nadia Hariri","ar":"د. نادية حريري","title_en":"ESCWA Statistics Director","title_ar":"مديرة إحصاءات الإسكوا","subtype":"standard","office_type":null},
    {"key":"p06","en":"Hana Al-Marri","ar":"هناء المري","title_en":"GCC-Stat Director","title_ar":"مديرة المركز الإحصائي الخليجي","subtype":"standard","office_type":null},
    {"key":"p07","en":"Ahmed Bin Saleh","ar":"أحمد بن صالح","title_en":"Senior Advisor, Data Policy","title_ar":"مستشار أول لسياسات البيانات","subtype":"standard","office_type":null},
    {"key":"p08","en":"Layla Mansour","ar":"ليلى منصور","title_en":"Census Program Lead","title_ar":"قائدة برنامج التعداد","subtype":"standard","office_type":null},
    {"key":"p09","en":"Prof. Kenji Tanaka","ar":"أ. كنجي تاناكا","title_en":"ISI Vice President","title_ar":"نائب رئيس المعهد الإحصائي الدولي","subtype":"standard","office_type":null},
    {"key":"p10","en":"HE Abdullah Al-Hakim","ar":"معالي عبدالله الحكيم","title_en":"Minister of Economy and Planning","title_ar":"وزير الاقتصاد والتخطيط","subtype":"elected_official","office_type":"cabinet_minister"},
    {"key":"p11","en":"HE Dr. Sarah Al-Tamimi","ar":"معالي د. سارة التميمي","title_en":"Shura Council Member, Finance Committee","title_ar":"عضو مجلس الشورى، لجنة المالية","subtype":"elected_official","office_type":"legislature_upper"},
    {"key":"p12","en":"HE Khaled Al-Faisal","ar":"معالي خالد الفيصل","title_en":"Deputy Minister, Statistics Affairs","title_ar":"نائب وزير شؤون الإحصاء","subtype":"elected_official","office_type":"cabinet_minister"}
  ]'::jsonb;

  INSERT INTO dossiers (id, type, name_en, name_ar, description_en, description_ar, status, sensitivity_level, is_active, is_seed_data, created_by, updated_by, tags)
  SELECT uuid_generate_v5(v_ns, 'person.'||(p->>'key')), 'person', p->>'en', p->>'ar',
    (p->>'en')||' - '||(p->>'title_en')||' (Phase 17 seed).',
    (p->>'ar')||' - '||(p->>'title_ar')||' (بذرة المرحلة 17).',
    'active', 2, true, true, v_caller, v_caller, ARRAY['seed','phase-17','person', p->>'subtype']
  FROM jsonb_array_elements(v_persons) AS p
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO persons (id, title_en, title_ar, person_subtype, office_name_en, office_name_ar, office_type, term_start, term_end, is_current_term, term_number, importance_level, is_seed_data)
  SELECT uuid_generate_v5(v_ns, 'person.'||(p->>'key')), p->>'title_en', p->>'title_ar', COALESCE(p->>'subtype','standard'),
    CASE WHEN p->>'subtype'='elected_official' THEN p->>'title_en' END,
    CASE WHEN p->>'subtype'='elected_official' THEN p->>'title_ar' END,
    p->>'office_type',
    CASE WHEN p->>'subtype'='elected_official' THEN DATE '2024-01-01' END,
    CASE WHEN p->>'subtype'='elected_official' THEN DATE '2028-12-31' END,
    CASE WHEN p->>'subtype'='elected_official' THEN true END,
    CASE WHEN p->>'subtype'='elected_official' THEN 1 END,
    3, true
  FROM jsonb_array_elements(v_persons) AS p
  ON CONFLICT (id) DO NOTHING;

  ----------------------------------------------------------------------------
  -- ENGAGEMENTS (10)
  -- engagement_type ∈ {meeting, consultation, coordination, workshop, conference,
  --                    site_visit, ceremony}
  -- engagement_category ∈ {bilateral, multilateral, regional, internal}
  ----------------------------------------------------------------------------
  v_engagements := '[
    {"key":"e01","en":"Saudi-UN Bilateral Statistical Dialogue","ar":"حوار إحصائي سعودي-أممي ثنائي","type":"site_visit","cat":"bilateral","loc_en":"Riyadh","loc_ar":"الرياض"},
    {"key":"e02","en":"GCC-Stat Technical Committee","ar":"اللجنة الفنية لمركز الإحصاء الخليجي","type":"meeting","cat":"regional","loc_en":"Muscat","loc_ar":"مسقط"},
    {"key":"e03","en":"MoU Signing with Eurostat","ar":"توقيع مذكرة تفاهم مع يوروستات","type":"ceremony","cat":"bilateral","loc_en":"Luxembourg","loc_ar":"لوكسمبورغ"},
    {"key":"e04","en":"UNSD Training Workshop on Big Data","ar":"ورشة تدريب على البيانات الضخمة","type":"workshop","cat":"multilateral","loc_en":"New York","loc_ar":"نيويورك"},
    {"key":"e05","en":"OECD Country Review Mission","ar":"بعثة مراجعة قُطرية من OECD","type":"site_visit","cat":"bilateral","loc_en":"Paris","loc_ar":"باريس"},
    {"key":"e06","en":"ESCWA Regional Consultation","ar":"مشاورات إقليمية للإسكوا","type":"consultation","cat":"regional","loc_en":"Beirut","loc_ar":"بيروت"},
    {"key":"e07","en":"IMF Data Standards Review","ar":"مراجعة معايير بيانات صندوق النقد","type":"coordination","cat":"multilateral","loc_en":"Washington","loc_ar":"واشنطن"},
    {"key":"e08","en":"Arab Statistical Forum 2026","ar":"المنتدى الإحصائي العربي 2026","type":"conference","cat":"regional","loc_en":"Amman","loc_ar":"عمّان"},
    {"key":"e09","en":"AITRS Capacity Building Mission","ar":"بعثة بناء قدرات من المعهد العربي","type":"workshop","cat":"regional","loc_en":"Amman","loc_ar":"عمّان"},
    {"key":"e10","en":"G20 DGI Coordination Meeting","ar":"اجتماع تنسيق مبادرة G20","type":"coordination","cat":"multilateral","loc_en":"Jakarta","loc_ar":"جاكرتا"}
  ]'::jsonb;

  INSERT INTO dossiers (id, type, name_en, name_ar, description_en, description_ar, status, sensitivity_level, is_active, is_seed_data, created_by, updated_by, tags)
  SELECT uuid_generate_v5(v_ns, 'engagement.'||(e->>'key')), 'engagement', e->>'en', e->>'ar',
    'Diplomatic engagement: '||(e->>'en')||' (Phase 17 seed).',
    'مشاركة دبلوماسية: '||(e->>'ar')||' (بذرة المرحلة 17).',
    'active', 2, true, true, v_caller, v_caller, ARRAY['seed','phase-17','engagement']
  FROM jsonb_array_elements(v_engagements) AS e
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO engagements (id, engagement_type, engagement_category, location_en, location_ar, is_seed_data)
  SELECT uuid_generate_v5(v_ns, 'engagement.'||(e->>'key')), e->>'type', e->>'cat', e->>'loc_en', e->>'loc_ar', true
  FROM jsonb_array_elements(v_engagements) AS e
  ON CONFLICT (id) DO NOTHING;

  SELECT array_agg(uuid_generate_v5(v_ns, 'engagement.'||k)) INTO v_eng_ids
  FROM unnest(v_eng_keys) AS k;

  ----------------------------------------------------------------------------
  -- TASKS (50 — full enum coverage)
  -- tasks.work_item_type ∈ {dossier, position, ticket, generic} OR null. Use NULL
  -- (seed tasks are standalone, not parented to a dossier as a "type").
  ----------------------------------------------------------------------------
  FOR v_i IN 1..50 LOOP
    v_task_id := uuid_generate_v5(v_ns, 'task.'||v_i::text);
    INSERT INTO tasks (
      id, tenant_id, title, description, type, status, priority,
      workflow_stage, assignee_id, created_by, last_modified_by,
      source, assignment, timeline, sla_deadline,
      work_item_type, work_item_id, is_seed_data
    ) VALUES (
      v_task_id, v_tenant_id,
      'Seed Task #'||lpad(v_i::text,2,'0')||' - '||v_types[((v_i-1) % 5) + 1],
      'مهمة بذرة رقم '||v_i::text||': سيناريو GASTAT الدبلوماسي (بذرة المرحلة 17).',
      (v_types[((v_i-1) % 5) + 1])::task_type,
      (v_statuses[((v_i-1) % 5) + 1])::task_status,
      (v_priorities[((v_i-1) % 4) + 1])::urgent_priority,
      v_stages[((v_i-1) % 5) + 1],
      v_caller, v_caller, v_caller,
      CASE v_source_kinds[((v_i-1) % 3) + 1]
        WHEN 'task'       THEN jsonb_build_object('kind','task')
        WHEN 'commitment' THEN jsonb_build_object('kind','commitment','commitment_id',uuid_generate_v5(v_ns,'commitment.'||v_i)::text)
        ELSE                   jsonb_build_object('kind','intake','ticket_id',uuid_generate_v5(v_ns,'intake.'||v_i)::text)
      END,
      jsonb_build_object('seed', true, 'index', v_i),
      jsonb_build_object('start_date', (now() - (v_i || ' days')::interval)::text, 'due_date', (now() + ((30 - v_i) || ' days')::interval)::text),
      CASE WHEN v_i % 7 = 0 THEN now() - interval '3 days'
           WHEN v_i % 7 = 1 THEN now() + interval '0 days'
           ELSE now() + ((v_i * 2) || ' hours')::interval END,
      NULL, NULL, true
    )
    ON CONFLICT (id) DO NOTHING;

    -- Primary link: direct (must NOT carry inherited_from_*)
    INSERT INTO work_item_dossiers (
      work_item_id, work_item_type, dossier_id, inheritance_source,
      is_primary, display_order, created_by, is_seed_data
    ) VALUES (
      v_task_id, 'task', v_country_ids[((v_i-1) % 10) + 1],
      'direct', true, 0, v_caller, true
    )
    ON CONFLICT DO NOTHING;

    -- Secondary link for ~33% of tasks: inheritance via engagement
    -- (carries inherited_from_type + inherited_from_id per valid_inheritance_metadata)
    IF v_i % 3 = 0 THEN
      INSERT INTO work_item_dossiers (
        work_item_id, work_item_type, dossier_id, inheritance_source,
        inherited_from_type, inherited_from_id,
        is_primary, display_order, created_by, is_seed_data
      ) VALUES (
        v_task_id, 'task', v_org_ids[((v_i-1) % 10) + 1],
        'engagement', 'engagement', v_eng_ids[((v_i-1) % 10) + 1],
        false, 1, v_caller, true
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;

  ----------------------------------------------------------------------------
  -- COUNTS
  ----------------------------------------------------------------------------
  v_counts := jsonb_build_object(
    'countries',      (SELECT count(*) FROM countries      WHERE is_seed_data),
    'organizations',  (SELECT count(*) FROM organizations  WHERE is_seed_data),
    'forums',         (SELECT count(*) FROM forums         WHERE is_seed_data),
    'engagements',    (SELECT count(*) FROM engagements    WHERE is_seed_data),
    'topics',         (SELECT count(*) FROM topics         WHERE is_seed_data),
    'working_groups', (SELECT count(*) FROM working_groups WHERE is_seed_data),
    'persons',        (SELECT count(*) FROM persons        WHERE is_seed_data),
    'dossiers',       (SELECT count(*) FROM dossiers       WHERE is_seed_data),
    'tasks',          (SELECT count(*) FROM tasks          WHERE is_seed_data),
    'work_item_dossiers', (SELECT count(*) FROM work_item_dossiers WHERE is_seed_data)
  );

  RETURN jsonb_build_object('status','seeded','counts',v_counts);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.populate_diplomatic_seed() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.populate_diplomatic_seed() TO authenticated;

COMMENT ON FUNCTION public.populate_diplomatic_seed() IS
  'Phase 17 GASTAT diplomatic seed RPC. Admin-only, idempotent on empty, deterministic UUIDs. Uses typed-dossier 1:1 PK inheritance (dossiers holds bilingual name, typed tables hold metadata). Hardcodes default tenant 00000000-0000-0000-0000-000000000001. UAT-validated 2026-04-07 against staging zkrcjzdemdmwhearhfgg. See 17-SCHEMA-RECONCILIATION.md section 10.';
