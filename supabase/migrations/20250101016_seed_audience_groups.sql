-- Migration: Seed audience groups
-- Feature: 011-positions-talking-points
-- Task: T016

-- Insert "All Staff" audience group
INSERT INTO audience_groups (name_en, name_ar, description)
VALUES (
  'All Staff',
  'جميع الموظفين',
  'All employees in the organization'
)
ON CONFLICT (name_en) DO NOTHING;

-- Insert "Management" audience group
INSERT INTO audience_groups (name_en, name_ar, description)
VALUES (
  'Management',
  'الإدارة',
  'Management and executive team members'
)
ON CONFLICT (name_en) DO NOTHING;

-- Insert "Policy Officers" audience group
INSERT INTO audience_groups (name_en, name_ar, description)
VALUES (
  'Policy Officers',
  'موظفو السياسات',
  'Policy analysis and development officers'
)
ON CONFLICT (name_en) DO NOTHING;

-- Insert "External Relations" audience group
INSERT INTO audience_groups (name_en, name_ar, description)
VALUES (
  'External Relations',
  'العلاقات الخارجية',
  'External communications and public relations team'
)
ON CONFLICT (name_en) DO NOTHING;

-- Verify insertion
SELECT id, name_en, name_ar, description
FROM audience_groups
ORDER BY name_en;
