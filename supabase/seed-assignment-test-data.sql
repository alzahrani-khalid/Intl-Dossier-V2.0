-- Assignment Engine Test Data Seeding Script
-- Purpose: Create sample data for testing the assignment system
-- Run this after deploying migrations to test the system

BEGIN;

-- ============================================================================
-- 1. CREATE ORGANIZATIONAL UNITS
-- ============================================================================

INSERT INTO organizational_units (id, name_ar, name_en, unit_wip_limit, parent_unit_id)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'الإدارة العامة', 'General Administration', 50, NULL),
  ('00000000-0000-0000-0000-000000000002', 'العلاقات الدولية', 'International Relations', 30, '00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000003', 'التعاون الفني', 'Technical Cooperation', 25, '00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000004', 'البحوث والتطوير', 'Research & Development', 20, '00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 2. CREATE SKILLS CATALOG
-- ============================================================================

INSERT INTO skills (id, name_ar, name_en, category)
VALUES
  ('00000000-0000-0000-0000-000000000101', 'اللغة الإنجليزية', 'English Language', 'language'),
  ('00000000-0000-0000-0000-000000000102', 'اللغة العربية', 'Arabic Language', 'language'),
  ('00000000-0000-0000-0000-000000000103', 'اللغة الفرنسية', 'French Language', 'language'),
  ('00000000-0000-0000-0000-000000000104', 'التحليل الإحصائي', 'Statistical Analysis', 'technical'),
  ('00000000-0000-0000-0000-000000000105', 'إدارة المشاريع', 'Project Management', 'management'),
  ('00000000-0000-0000-0000-000000000106', 'البحث العلمي', 'Scientific Research', 'research'),
  ('00000000-0000-0000-0000-000000000107', 'العلاقات الدبلوماسية', 'Diplomatic Relations', 'diplomatic'),
  ('00000000-0000-0000-0000-000000000108', 'الاقتصاد الدولي', 'International Economics', 'economic'),
  ('00000000-0000-0000-0000-000000000109', 'إعداد التقارير', 'Report Writing', 'documentation'),
  ('00000000-0000-0000-0000-000000000110', 'التفاوض الدولي', 'International Negotiation', 'diplomatic')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 3. CREATE STAFF PROFILES
-- ============================================================================
-- Note: Replace user_id with actual auth.users IDs from your system
-- For testing, we'll create placeholder profiles

INSERT INTO staff_profiles (
  id,
  user_id,
  hr_employee_id,
  full_name_ar,
  full_name_en,
  unit_id,
  role,
  skills,
  individual_wip_limit,
  availability_status,
  current_assignment_count,
  version
)
VALUES
  -- Admin user
  (
    '00000000-0000-0000-0000-000000000201',
    gen_random_uuid(), -- Replace with actual user_id
    'HR-001',
    'أحمد محمد',
    'Ahmed Mohammed',
    '00000000-0000-0000-0000-000000000001',
    'admin',
    ARRAY[
      '00000000-0000-0000-0000-000000000101',
      '00000000-0000-0000-0000-000000000102',
      '00000000-0000-0000-0000-000000000105'
    ]::uuid[],
    10,
    'available',
    0,
    1
  ),
  -- Supervisor - International Relations
  (
    '00000000-0000-0000-0000-000000000202',
    gen_random_uuid(),
    'HR-002',
    'فاطمة علي',
    'Fatima Ali',
    '00000000-0000-0000-0000-000000000002',
    'supervisor',
    ARRAY[
      '00000000-0000-0000-0000-000000000101',
      '00000000-0000-0000-0000-000000000102',
      '00000000-0000-0000-0000-000000000107',
      '00000000-0000-0000-0000-000000000110'
    ]::uuid[],
    8,
    'available',
    0,
    1
  ),
  -- Staff Member 1 - International Relations
  (
    '00000000-0000-0000-0000-000000000203',
    gen_random_uuid(),
    'HR-003',
    'خالد عبدالله',
    'Khalid Abdullah',
    '00000000-0000-0000-0000-000000000002',
    'staff',
    ARRAY[
      '00000000-0000-0000-0000-000000000101',
      '00000000-0000-0000-0000-000000000103',
      '00000000-0000-0000-0000-000000000107'
    ]::uuid[],
    5,
    'available',
    0,
    1
  ),
  -- Staff Member 2 - Technical Cooperation
  (
    '00000000-0000-0000-0000-000000000204',
    gen_random_uuid(),
    'HR-004',
    'سارة أحمد',
    'Sara Ahmed',
    '00000000-0000-0000-0000-000000000003',
    'staff',
    ARRAY[
      '00000000-0000-0000-0000-000000000101',
      '00000000-0000-0000-0000-000000000104',
      '00000000-0000-0000-0000-000000000105'
    ]::uuid[],
    5,
    'available',
    0,
    1
  ),
  -- Staff Member 3 - Research
  (
    '00000000-0000-0000-0000-000000000205',
    gen_random_uuid(),
    'HR-005',
    'محمد حسن',
    'Mohammed Hassan',
    '00000000-0000-0000-0000-000000000004',
    'staff',
    ARRAY[
      '00000000-0000-0000-0000-000000000101',
      '00000000-0000-0000-0000-000000000104',
      '00000000-0000-0000-0000-000000000106'
    ]::uuid[],
    5,
    'available',
    0,
    1
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 4. CREATE ASSIGNMENT RULES
-- ============================================================================

INSERT INTO assignment_rules (
  id,
  unit_id,
  work_item_type,
  priority,
  required_skills,
  priority_weight,
  capacity_check_enabled,
  is_active
)
VALUES
  -- Dossier rules
  (
    '00000000-0000-0000-0000-000000000301',
    '00000000-0000-0000-0000-000000000002',
    'dossier',
    'urgent',
    ARRAY['00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000107']::uuid[],
    100,
    true,
    true
  ),
  -- Position rules
  (
    '00000000-0000-0000-0000-000000000302',
    '00000000-0000-0000-0000-000000000002',
    'position',
    'high',
    ARRAY['00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000109']::uuid[],
    80,
    true,
    true
  ),
  -- Ticket rules
  (
    '00000000-0000-0000-0000-000000000303',
    '00000000-0000-0000-0000-000000000003',
    'ticket',
    'normal',
    ARRAY['00000000-0000-0000-0000-000000000101']::uuid[],
    50,
    true,
    true
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 5. VERIFY SAMPLE DATA
-- ============================================================================

-- Count created records
DO $$
DECLARE
  unit_count INTEGER;
  skill_count INTEGER;
  staff_count INTEGER;
  rule_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO unit_count FROM organizational_units;
  SELECT COUNT(*) INTO skill_count FROM skills;
  SELECT COUNT(*) INTO staff_count FROM staff_profiles;
  SELECT COUNT(*) INTO rule_count FROM assignment_rules;

  RAISE NOTICE 'Test Data Created Successfully:';
  RAISE NOTICE '  - Organizational Units: %', unit_count;
  RAISE NOTICE '  - Skills: %', skill_count;
  RAISE NOTICE '  - Staff Profiles: %', staff_count;
  RAISE NOTICE '  - Assignment Rules: %', rule_count;
END $$;

COMMIT;

-- ============================================================================
-- SAMPLE QUERIES FOR TESTING
-- ============================================================================

-- View all staff with their skills
-- SELECT
--   sp.full_name_en,
--   sp.role,
--   ou.name_en as unit,
--   sp.availability_status,
--   sp.current_assignment_count || '/' || sp.individual_wip_limit as capacity,
--   ARRAY(
--     SELECT s.name_en
--     FROM skills s
--     WHERE s.id = ANY(sp.skills)
--   ) as skill_names
-- FROM staff_profiles sp
-- JOIN organizational_units ou ON sp.unit_id = ou.id
-- ORDER BY sp.role, sp.full_name_en;

-- View assignment rules
-- SELECT
--   ou.name_en as unit,
--   ar.work_item_type,
--   ar.priority,
--   ARRAY(
--     SELECT s.name_en
--     FROM skills s
--     WHERE s.id = ANY(ar.required_skills)
--   ) as required_skills,
--   ar.is_active
-- FROM assignment_rules ar
-- JOIN organizational_units ou ON ar.unit_id = ou.id
-- ORDER BY ar.priority_weight DESC;
