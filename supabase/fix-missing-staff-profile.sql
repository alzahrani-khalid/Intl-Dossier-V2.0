-- Fix: Add staff_profile for existing user kazahrani@stats.gov.sa
-- This script creates a staff profile for the authenticated user who doesn't have one yet

-- First, ensure we have the organizational units
INSERT INTO organizational_units (id, name_ar, name_en, unit_wip_limit, parent_unit_id)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'الإدارة العامة', 'General Administration', 50, NULL),
  ('00000000-0000-0000-0000-000000000002', 'العلاقات الدولية', 'International Relations', 30, '00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- Ensure we have some basic skills
INSERT INTO skills (id, name_ar, name_en, category)
VALUES
  ('00000000-0000-0000-0000-000000000101', 'اللغة الإنجليزية', 'English Language', 'language'),
  ('00000000-0000-0000-0000-000000000102', 'اللغة العربية', 'Arabic Language', 'language'),
  ('00000000-0000-0000-0000-000000000105', 'إدارة المشاريع', 'Project Management', 'management')
ON CONFLICT (id) DO NOTHING;

-- Create staff_profile for the user kazahrani@stats.gov.sa
-- User ID: de2734cf-f962-4e05-bf62-bc9e92efff96
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
VALUES (
  gen_random_uuid(),
  'de2734cf-f962-4e05-bf62-bc9e92efff96'::uuid,
  'HR-KHALID-001',
  'خالد الزهراني',
  'Khalid Alzahrani',
  '00000000-0000-0000-0000-000000000002'::uuid, -- International Relations unit
  'admin', -- Give admin role for testing
  ARRAY[
    '00000000-0000-0000-0000-000000000101',
    '00000000-0000-0000-0000-000000000102',
    '00000000-0000-0000-0000-000000000105'
  ]::uuid[],
  10,
  'available',
  0,
  1
)
ON CONFLICT (user_id) DO UPDATE SET
  role = EXCLUDED.role,
  unit_id = EXCLUDED.unit_id,
  skills = EXCLUDED.skills,
  updated_at = now();

