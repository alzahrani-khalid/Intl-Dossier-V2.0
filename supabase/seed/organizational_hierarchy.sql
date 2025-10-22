-- Seed data for organizational hierarchy
-- Feature: Waiting Queue Actions (023-specs-waiting-queue)
-- Purpose: Sample organizational structure for development and testing

-- Note: This seed data assumes the existence of users in auth.users table
-- These user IDs are examples and should match actual users in your development environment

-- Sample organizational structure:
-- CEO (Level 5)
--   └── Division Director (Level 4)
--       └── Department Manager (Level 3)
--           └── Team Lead (Level 2)
--               └── Analyst (Level 1)

-- Insert sample organizational hierarchy
-- Replace these UUIDs with actual user IDs from your auth.users table in development

INSERT INTO organizational_hierarchy (user_id, reports_to_user_id, role, department, escalation_level)
VALUES
    -- Level 5: CEO (no manager - top of hierarchy)
    ('00000000-0000-0000-0000-000000000001'::uuid, NULL, 'Chief Executive Officer', 'Executive', 5),

    -- Level 4: Division Directors (report to CEO)
    ('00000000-0000-0000-0000-000000000002'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, 'Division Director - Statistics', 'Statistics Division', 4),
    ('00000000-0000-0000-0000-000000000003'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, 'Division Director - International Relations', 'International Relations', 4),

    -- Level 3: Department Managers (report to Division Directors)
    ('00000000-0000-0000-0000-000000000004'::uuid, '00000000-0000-0000-0000-000000000002'::uuid, 'Department Manager - Economic Statistics', 'Economic Statistics', 3),
    ('00000000-0000-0000-0000-000000000005'::uuid, '00000000-0000-0000-0000-000000000002'::uuid, 'Department Manager - Social Statistics', 'Social Statistics', 3),
    ('00000000-0000-0000-0000-000000000006'::uuid, '00000000-0000-0000-0000-000000000003'::uuid, 'Department Manager - Bilateral Relations', 'Bilateral Relations', 3),
    ('00000000-0000-0000-0000-000000000007'::uuid, '00000000-0000-0000-0000-000000000003'::uuid, 'Department Manager - Multilateral Relations', 'Multilateral Relations', 3),

    -- Level 2: Team Leads (report to Department Managers)
    ('00000000-0000-0000-0000-000000000008'::uuid, '00000000-0000-0000-0000-000000000004'::uuid, 'Team Lead - Economic Analysis', 'Economic Statistics', 2),
    ('00000000-0000-0000-0000-000000000009'::uuid, '00000000-0000-0000-0000-000000000005'::uuid, 'Team Lead - Social Analysis', 'Social Statistics', 2),
    ('00000000-0000-0000-0000-000000000010'::uuid, '00000000-0000-0000-0000-000000000006'::uuid, 'Team Lead - Country Relations', 'Bilateral Relations', 2),
    ('00000000-0000-0000-0000-000000000011'::uuid, '00000000-0000-0000-0000-000000000007'::uuid, 'Team Lead - International Organizations', 'Multilateral Relations', 2),

    -- Level 1: Analysts (report to Team Leads)
    ('00000000-0000-0000-0000-000000000012'::uuid, '00000000-0000-0000-0000-000000000008'::uuid, 'Senior Analyst - Economic Data', 'Economic Statistics', 1),
    ('00000000-0000-0000-0000-000000000013'::uuid, '00000000-0000-0000-0000-000000000008'::uuid, 'Analyst - Economic Data', 'Economic Statistics', 1),
    ('00000000-0000-0000-0000-000000000014'::uuid, '00000000-0000-0000-0000-000000000009'::uuid, 'Senior Analyst - Social Data', 'Social Statistics', 1),
    ('00000000-0000-0000-0000-000000000015'::uuid, '00000000-0000-0000-0000-000000000009'::uuid, 'Analyst - Social Data', 'Social Statistics', 1),
    ('00000000-0000-0000-0000-000000000016'::uuid, '00000000-0000-0000-0000-000000000010'::uuid, 'Country Analyst - Europe', 'Bilateral Relations', 1),
    ('00000000-0000-0000-0000-000000000017'::uuid, '00000000-0000-0000-0000-000000000010'::uuid, 'Country Analyst - Asia', 'Bilateral Relations', 1),
    ('00000000-0000-0000-0000-000000000018'::uuid, '00000000-0000-0000-0000-000000000011'::uuid, 'International Organization Specialist - UN', 'Multilateral Relations', 1),
    ('00000000-0000-0000-0000-000000000019'::uuid, '00000000-0000-0000-0000-000000000011'::uuid, 'International Organization Specialist - GCC', 'Multilateral Relations', 1)
ON CONFLICT (user_id) DO NOTHING;

-- Add comment
COMMENT ON TABLE organizational_hierarchy IS 'Sample organizational hierarchy for development - Update user_ids to match your auth.users table';

-- Verification query (uncomment to test)
-- SELECT
--     oh.user_id,
--     oh.role,
--     oh.department,
--     oh.escalation_level,
--     manager.role as manager_role
-- FROM organizational_hierarchy oh
-- LEFT JOIN organizational_hierarchy manager ON oh.reports_to_user_id = manager.user_id
-- ORDER BY oh.escalation_level DESC, oh.department, oh.role;
