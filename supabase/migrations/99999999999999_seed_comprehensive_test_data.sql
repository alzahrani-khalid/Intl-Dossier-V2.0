-- ============================================================================
-- Comprehensive Test Data Seeding
-- Purpose: Create complete test scenarios for Dossier, Engagement, Task, Assignment, and Kanban
-- Date: 2025-10-18
-- ============================================================================

BEGIN;

-- ============================================================================
-- PART 1: CREATE TASKS WITH VARIOUS SOURCE TYPES
-- ============================================================================

-- Get a sample user ID for created_by
DO $$
DECLARE
    default_user_id UUID;
    default_tenant_id UUID := '00000000-0000-0000-0000-000000000001'::UUID;
BEGIN
    -- Try to get first auth user, or use placeholder
    SELECT id INTO default_user_id FROM auth.users LIMIT 1;
    IF default_user_id IS NULL THEN
        default_user_id := '11111111-1111-1111-1111-111111111111'::UUID;
    END IF;

    -- ========================================================================
    -- Tasks 1-3: Referencing Dossiers
    -- ========================================================================

    INSERT INTO tasks (
        id,
        title,
        description,
        type,
        source,
        assignment,
        timeline,
        status,
        priority,
        created_by,
        last_modified_by,
        tenant_id
    ) VALUES
    (
        '10000000-0000-0000-0000-000000000001'::UUID,
        'Review and process: Germany Trade Statistics Agreement',
        'Review and analyze the Germany Trade Statistics Agreement dossier to prepare briefing materials for upcoming bilateral meeting.',
        'action_item',
        '{"type": "dossier", "dossier_ids": ["00000000-0000-0000-0000-000000000001"], "primary_dossier_id": "00000000-0000-0000-0000-000000000001"}'::jsonb,
        '{}'::jsonb,
        '{"created_at": "2025-10-17T12:00:00Z"}'::jsonb,
        'pending',
        'medium',
        default_user_id,
        default_user_id,
        default_tenant_id
    ),
    (
        '10000000-0000-0000-0000-000000000002'::UUID,
        'Prepare briefing: UNDP Partnership Review',
        'Prepare comprehensive briefing materials for the UNDP annual partnership review meeting.',
        'preparation',
        '{"type": "dossier", "dossier_ids": ["00000000-0000-0000-0000-000000000002"], "primary_dossier_id": "00000000-0000-0000-0000-000000000002"}'::jsonb,
        '{}'::jsonb,
        '{"created_at": "2025-10-16T09:00:00Z"}'::jsonb,
        'pending',
        'high',
        default_user_id,
        default_user_id,
        default_tenant_id
    ),
    (
        '10000000-0000-0000-0000-000000000003'::UUID,
        'Research G20 positions: Digital Economy',
        'Research and analyze G20 member positions on digital economy framework for upcoming summit.',
        'analysis',
        '{"type": "dossier", "dossier_ids": ["00000000-0000-0000-0000-000000000003"], "primary_dossier_id": "00000000-0000-0000-0000-000000000003"}'::jsonb,
        '{}'::jsonb,
        '{"created_at": "2025-10-15T14:30:00Z"}'::jsonb,
        'in_progress',
        'urgent',
        default_user_id,
        default_user_id,
        default_tenant_id
    );

    -- ========================================================================
    -- Tasks 4-6: Referencing Multiple Entities
    -- ========================================================================

    INSERT INTO tasks (
        id,
        title,
        description,
        type,
        source,
        assignment,
        timeline,
        status,
        priority,
        created_by,
        last_modified_by,
        tenant_id
    ) VALUES
    (
        '10000000-0000-0000-0000-000000000004'::UUID,
        'Compile trade data for bilateral meeting',
        'Compile historical trade statistics from Germany and Saudi Arabia dossiers for ministerial presentation.',
        'action_item',
        '{"type": "multi", "dossier_ids": ["00000000-0000-0000-0000-000000000001"]}'::jsonb,
        '{}'::jsonb,
        '{"created_at": "2025-10-17T10:00:00Z"}'::jsonb,
        'pending',
        'high',
        default_user_id,
        default_user_id,
        default_tenant_id
    ),
    (
        '10000000-0000-0000-0000-000000000005'::UUID,
        'Draft position paper: SDG 7 collaboration',
        'Draft position paper outlining our stance on SDG 7 clean energy collaboration with UNDP.',
        'action_item',
        '{"type": "multi", "dossier_ids": ["00000000-0000-0000-0000-000000000002"]}'::jsonb,
        '{}'::jsonb,
        '{"created_at": "2025-10-16T15:00:00Z"}'::jsonb,
        'in_progress',
        'medium',
        default_user_id,
        default_user_id,
        default_tenant_id
    ),
    (
        '10000000-0000-0000-0000-000000000006'::UUID,
        'Coordinate G20 working group input',
        'Coordinate input from various departments for G20 digital economy working group submission.',
        'follow_up',
        '{"type": "multi", "dossier_ids": ["00000000-0000-0000-0000-000000000003"]}'::jsonb,
        '{}'::jsonb,
        '{"created_at": "2025-10-14T11:00:00Z"}'::jsonb,
        'completed',
        'high',
        default_user_id,
        default_user_id,
        default_tenant_id
    );

    -- ========================================================================
    -- Tasks 7-12: Generic action items for engagements
    -- ========================================================================

    INSERT INTO tasks (
        id,
        title,
        description,
        type,
        source,
        assignment,
        timeline,
        status,
        priority,
        created_by,
        last_modified_by,
        tenant_id
    ) VALUES
    (
        '10000000-0000-0000-0000-000000000007'::UUID,
        'Schedule follow-up meeting with German delegation',
        'Coordinate schedules and arrange follow-up meeting with German trade delegation for Q1 2026.',
        'follow_up',
        '{"type": "engagement", "engagement_ids": []}'::jsonb,
        '{}'::jsonb,
        '{"created_at": "2025-10-17T16:00:00Z"}'::jsonb,
        'pending',
        'low',
        default_user_id,
        default_user_id,
        default_tenant_id
    ),
    (
        '10000000-0000-0000-0000-000000000008'::UUID,
        'Prepare agenda for ministerial meeting',
        'Draft and circulate agenda for upcoming ministerial meeting on trade cooperation.',
        'preparation',
        '{"type": "engagement", "engagement_ids": []}'::jsonb,
        '{}'::jsonb,
        '{"created_at": "2025-10-17T08:00:00Z"}'::jsonb,
        'in_progress',
        'high',
        default_user_id,
        default_user_id,
        default_tenant_id
    ),
    (
        '10000000-0000-0000-0000-000000000009'::UUID,
        'Review meeting minutes',
        'Review and approve ministerial meeting minutes before distribution.',
        'action_item',
        '{"type": "engagement", "engagement_ids": []}'::jsonb,
        '{}'::jsonb,
        '{"created_at": "2025-10-17T13:00:00Z"}'::jsonb,
        'in_progress',
        'medium',
        default_user_id,
        default_user_id,
        default_tenant_id
    ),
    (
        '10000000-0000-0000-0000-000000000010'::UUID,
        'Finalize UNDP partnership agreement',
        'Complete final review of UNDP partnership agreement document before signing.',
        'action_item',
        '{"type": "engagement", "engagement_ids": []}'::jsonb,
        '{}'::jsonb,
        '{"created_at": "2025-10-16T10:00:00Z"}'::jsonb,
        'in_progress',
        'urgent',
        default_user_id,
        default_user_id,
        default_tenant_id
    ),
    (
        '10000000-0000-0000-0000-000000000011'::UUID,
        'Conduct stakeholder survey for UNDP review',
        'Survey internal stakeholders on UNDP partnership effectiveness for annual review.',
        'analysis',
        '{"type": "engagement", "engagement_ids": []}'::jsonb,
        '{}'::jsonb,
        '{"created_at": "2025-10-15T09:00:00Z"}'::jsonb,
        'pending',
        'medium',
        default_user_id,
        default_user_id,
        default_tenant_id
    ),
    (
        '10000000-0000-0000-0000-000000000012'::UUID,
        'Draft G20 position statement',
        'Draft official position statement for G20 digital economy working group.',
        'action_item',
        '{"type": "engagement", "engagement_ids": []}'::jsonb,
        '{}'::jsonb,
        '{"created_at": "2025-10-14T10:00:00Z"}'::jsonb,
        'pending',
        'high',
        default_user_id,
        default_user_id,
        default_tenant_id
    );

    -- ========================================================================
    -- Tasks 13-15: Standalone intake tasks
    -- ========================================================================

    INSERT INTO tasks (
        id,
        title,
        description,
        type,
        source,
        assignment,
        timeline,
        status,
        priority,
        created_by,
        last_modified_by,
        tenant_id
    ) VALUES
    (
        '10000000-0000-0000-0000-000000000013'::UUID,
        'Process intake: Economic Outlook Q4 2025',
        'Process intake ticket for Saudi Arabia Economic Outlook Q4 2025 position paper.',
        'action_item',
        '{"type": "intake", "ticket_ids": []}'::jsonb,
        '{}'::jsonb,
        '{"created_at": "2025-10-17T11:00:00Z"}'::jsonb,
        'pending',
        'medium',
        default_user_id,
        default_user_id,
        default_tenant_id
    ),
    (
        '10000000-0000-0000-0000-000000000014'::UUID,
        'Review MOU: Central Bank data sharing',
        'Review and update data sharing agreement MOU with Central Bank.',
        'action_item',
        '{"type": "intake", "ticket_ids": []}'::jsonb,
        '{}'::jsonb,
        '{"created_at": "2025-10-16T14:00:00Z"}'::jsonb,
        'in_progress',
        'high',
        default_user_id,
        default_user_id,
        default_tenant_id
    ),
    (
        '10000000-0000-0000-0000-000000000015'::UUID,
        'Analyze foresight: AI in statistical production',
        'Conduct foresight analysis on AI integration in statistical production by 2030.',
        'analysis',
        '{"type": "intake", "ticket_ids": []}'::jsonb,
        '{}'::jsonb,
        '{"created_at": "2025-10-15T10:00:00Z"}'::jsonb,
        'pending',
        'low',
        default_user_id,
        default_user_id,
        default_tenant_id
    );

    RAISE NOTICE 'Created 15 tasks successfully';

END $$;

-- ============================================================================
-- PART 2: CREATE STANDALONE ASSIGNMENTS (No Engagement Link)
-- ============================================================================

DO $$
DECLARE
    staff_1_id UUID := '00000000-0000-0000-0000-000000000203'::UUID; -- Khalid Abdullah
    staff_2_id UUID := '00000000-0000-0000-0000-000000000204'::UUID; -- Sara Ahmed
    staff_3_id UUID := '00000000-0000-0000-0000-000000000205'::UUID; -- Mohammed Hassan
BEGIN

    -- Standalone Assignment 1: Germany dossier review (pending, overdue)
    INSERT INTO assignments (
        id,
        work_item_id,
        work_item_type,
        assignee_id,
        assigned_at,
        sla_deadline,
        overall_sla_deadline,
        current_stage_sla_deadline,
        priority,
        status,
        workflow_stage,
        engagement_id
    ) VALUES (
        '20000000-0000-0000-0000-000000000001'::UUID,
        '10000000-0000-0000-0000-000000000001'::UUID,
        'task',
        staff_1_id,
        NOW() - INTERVAL '48 hours',
        NOW() - INTERVAL '2 hours', -- Overdue
        NOW() - INTERVAL '2 hours',
        NOW() - INTERVAL '2 hours',
        'medium',
        'assigned',
        'todo',
        NULL  -- Standalone (no engagement)
    );

    -- Standalone Assignment 2: Economic outlook (assigned, normal SLA)
    INSERT INTO assignments (
        id,
        work_item_id,
        work_item_type,
        assignee_id,
        assigned_at,
        sla_deadline,
        overall_sla_deadline,
        current_stage_sla_deadline,
        priority,
        status,
        workflow_stage,
        engagement_id
    ) VALUES (
        '20000000-0000-0000-0000-000000000002'::UUID,
        '10000000-0000-0000-0000-000000000013'::UUID,
        'task',
        staff_2_id,
        NOW() - INTERVAL '12 hours',
        NOW() + INTERVAL '36 hours', -- Normal
        NOW() + INTERVAL '36 hours',
        NOW() + INTERVAL '36 hours',
        'medium',
        'assigned',
        'todo',
        NULL
    );

    -- Standalone Assignment 3: MOU review (in progress, urgent)
    INSERT INTO assignments (
        id,
        work_item_id,
        work_item_type,
        assignee_id,
        assigned_at,
        sla_deadline,
        overall_sla_deadline,
        current_stage_sla_deadline,
        priority,
        status,
        workflow_stage,
        engagement_id
    ) VALUES (
        '20000000-0000-0000-0000-000000000003'::UUID,
        '10000000-0000-0000-0000-000000000014'::UUID,
        'task',
        staff_1_id,
        NOW() - INTERVAL '18 hours',
        NOW() + INTERVAL '2 hours', -- Urgent
        NOW() + INTERVAL '2 hours',
        NOW() + INTERVAL '2 hours',
        'high',
        'in_progress',
        'in_progress',
        NULL
    );

    -- Standalone Assignment 4: AI foresight (pending, warning)
    INSERT INTO assignments (
        id,
        work_item_id,
        work_item_type,
        assignee_id,
        assigned_at,
        sla_deadline,
        overall_sla_deadline,
        current_stage_sla_deadline,
        priority,
        status,
        workflow_stage,
        engagement_id
    ) VALUES (
        '20000000-0000-0000-0000-000000000004'::UUID,
        '10000000-0000-0000-0000-000000000015'::UUID,
        'task',
        staff_3_id,
        NOW() - INTERVAL '6 hours',
        NOW() + INTERVAL '18 hours', -- Warning
        NOW() + INTERVAL '18 hours',
        NOW() + INTERVAL '18 hours',
        'low',
        'assigned',
        'todo',
        NULL
    );

    -- Standalone Assignment 5: UNDP briefing (assigned, normal)
    INSERT INTO assignments (
        id,
        work_item_id,
        work_item_type,
        assignee_id,
        assigned_at,
        sla_deadline,
        overall_sla_deadline,
        current_stage_sla_deadline,
        priority,
        status,
        workflow_stage,
        engagement_id
    ) VALUES (
        '20000000-0000-0000-0000-000000000005'::UUID,
        '10000000-0000-0000-0000-000000000002'::UUID,
        'task',
        staff_2_id,
        NOW() - INTERVAL '8 hours',
        NOW() + INTERVAL '40 hours', -- Normal
        NOW() + INTERVAL '40 hours',
        NOW() + INTERVAL '40 hours',
        'high',
        'assigned',
        'todo',
        NULL
    );

    RAISE NOTICE 'Created 5 standalone assignments successfully';

END $$;

-- ============================================================================
-- PART 3: CREATE ENGAGEMENT-LINKED ASSIGNMENTS (For Kanban Boards)
-- ============================================================================

DO $$
DECLARE
    staff_1_id UUID := '00000000-0000-0000-0000-000000000203'::UUID;
    staff_2_id UUID := '00000000-0000-0000-0000-000000000204'::UUID;
    staff_3_id UUID := '00000000-0000-0000-0000-000000000205'::UUID;
    engagement_1_id UUID; -- Ministerial Meeting on Trade
    engagement_2_id UUID; -- UNDP Partnership Review
    engagement_3_id UUID; -- G20 Sherpas Meeting
BEGIN

    -- Get engagement IDs from existing seed data
    SELECT id INTO engagement_1_id FROM engagements
    WHERE title ILIKE '%Ministerial Meeting%' OR title ILIKE '%Trade%'
    LIMIT 1;

    SELECT id INTO engagement_2_id FROM engagements
    WHERE title ILIKE '%UNDP%' OR title ILIKE '%Partnership%'
    LIMIT 1;

    SELECT id INTO engagement_3_id FROM engagements
    WHERE title ILIKE '%G20%' OR title ILIKE '%Sherpa%'
    LIMIT 1;

    IF engagement_1_id IS NULL OR engagement_2_id IS NULL OR engagement_3_id IS NULL THEN
        RAISE EXCEPTION 'Required engagements not found in database. Please run seed_test_data.sql first.';
    END IF;

    -- ========================================================================
    -- Engagement 1: Ministerial Meeting (7 assignments across 4 stages)
    -- ========================================================================

    -- TODO Stage (3 assignments)
    INSERT INTO assignments VALUES
    (
        '20000000-0000-0000-0000-000000000101'::UUID,
        '10000000-0000-0000-0000-000000000007'::UUID, -- Schedule follow-up
        'task',
        staff_3_id,
        NOW() - INTERVAL '4 hours',
        NOW() + INTERVAL '44 hours',
        NOW() + INTERVAL '44 hours',
        NOW() + INTERVAL '44 hours',
        NULL, NULL, NULL,
        'low',
        'assigned',
        NOW(), NOW(),
        engagement_1_id,
        'todo'
    ),
    (
        '20000000-0000-0000-0000-000000000102'::UUID,
        '10000000-0000-0000-0000-000000000004'::UUID, -- Compile trade data
        'task',
        staff_1_id,
        NOW() - INTERVAL '2 hours',
        NOW() + INTERVAL '22 hours',
        NOW() + INTERVAL '22 hours',
        NOW() + INTERVAL '22 hours',
        NULL, NULL, NULL,
        'high',
        'assigned',
        NOW(), NOW(),
        engagement_1_id,
        'todo'
    ),
    (
        '20000000-0000-0000-0000-000000000103'::UUID,
        '10000000-0000-0000-0000-000000000001'::UUID, -- Review Germany dossier
        'task',
        staff_2_id,
        NOW() - INTERVAL '6 hours',
        NOW() + INTERVAL '18 hours',
        NOW() + INTERVAL '18 hours',
        NOW() + INTERVAL '18 hours',
        NULL, NULL, NULL,
        'medium',
        'assigned',
        NOW(), NOW(),
        engagement_1_id,
        'todo'
    );

    -- IN PROGRESS Stage (2 assignments)
    INSERT INTO assignments VALUES
    (
        '20000000-0000-0000-0000-000000000104'::UUID,
        '10000000-0000-0000-0000-000000000008'::UUID, -- Prepare agenda
        'task',
        staff_1_id,
        NOW() - INTERVAL '20 hours',
        NOW() + INTERVAL '4 hours',
        NOW() + INTERVAL '28 hours',
        NOW() + INTERVAL '4 hours',
        NULL, NULL, NULL,
        'high',
        'in_progress',
        NOW(), NOW(),
        engagement_1_id,
        'in_progress'
    ),
    (
        '20000000-0000-0000-0000-000000000105'::UUID,
        '10000000-0000-0000-0000-000000000009'::UUID, -- Review minutes
        'task',
        staff_2_id,
        NOW() - INTERVAL '15 hours',
        NOW() + INTERVAL '9 hours',
        NOW() + INTERVAL '33 hours',
        NOW() + INTERVAL '9 hours',
        NULL, NULL, NULL,
        'medium',
        'in_progress',
        NOW(), NOW(),
        engagement_1_id,
        'in_progress'
    );

    -- REVIEW Stage (1 assignment)
    INSERT INTO assignments VALUES
    (
        '20000000-0000-0000-0000-000000000106'::UUID,
        '10000000-0000-0000-0000-000000000003'::UUID, -- G20 research
        'task',
        staff_3_id,
        NOW() - INTERVAL '30 hours',
        NOW() + INTERVAL '14 hours',
        NOW() + INTERVAL '18 hours',
        NOW() + INTERVAL '14 hours',
        NULL, NULL, NULL,
        'urgent',
        'in_progress', -- Status still in_progress, but workflow_stage is review
        NOW(), NOW(),
        engagement_1_id,
        'review'
    );

    -- DONE Stage (1 assignment)
    INSERT INTO assignments VALUES
    (
        '20000000-0000-0000-0000-000000000107'::UUID,
        '10000000-0000-0000-0000-000000000006'::UUID, -- Coordinate G20 input
        'task',
        staff_1_id,
        NOW() - INTERVAL '72 hours',
        NOW() - INTERVAL '24 hours',
        NOW() - INTERVAL '24 hours',
        NULL, -- No stage SLA for done items
        NOW() - INTERVAL '2 hours', NULL, NULL,
        'high',
        'completed',
        NOW(), NOW(),
        engagement_1_id,
        'done'
    );

    -- ========================================================================
    -- Engagement 2: UNDP Partnership Review (5 assignments across 3 stages)
    -- ========================================================================

    -- TODO Stage (2 assignments)
    INSERT INTO assignments VALUES
    (
        '20000000-0000-0000-0000-000000000201'::UUID,
        '10000000-0000-0000-0000-000000000011'::UUID, -- Stakeholder survey
        'task',
        staff_2_id,
        NOW() - INTERVAL '5 hours',
        NOW() + INTERVAL '43 hours',
        NOW() + INTERVAL '43 hours',
        NOW() + INTERVAL '43 hours',
        NULL, NULL, NULL,
        'medium',
        'assigned',
        NOW(), NOW(),
        engagement_2_id,
        'todo'
    ),
    (
        '20000000-0000-0000-0000-000000000202'::UUID,
        '10000000-0000-0000-0000-000000000002'::UUID, -- UNDP briefing
        'task',
        staff_3_id,
        NOW() - INTERVAL '3 hours',
        NOW() + INTERVAL '21 hours',
        NOW() + INTERVAL '21 hours',
        NOW() + INTERVAL '21 hours',
        NULL, NULL, NULL,
        'high',
        'assigned',
        NOW(), NOW(),
        engagement_2_id,
        'todo'
    );

    -- IN PROGRESS Stage (1 assignment)
    INSERT INTO assignments VALUES
    (
        '20000000-0000-0000-0000-000000000203'::UUID,
        '10000000-0000-0000-0000-000000000010'::UUID, -- Finalize partnership agreement
        'task',
        staff_1_id,
        NOW() - INTERVAL '16 hours',
        NOW() + INTERVAL '8 hours',
        NOW() + INTERVAL '32 hours',
        NOW() + INTERVAL '8 hours',
        NULL, NULL, NULL,
        'urgent',
        'in_progress',
        NOW(), NOW(),
        engagement_2_id,
        'in_progress'
    );

    -- REVIEW Stage (2 assignments)
    INSERT INTO assignments VALUES
    (
        '20000000-0000-0000-0000-000000000204'::UUID,
        '10000000-0000-0000-0000-000000000005'::UUID, -- Draft position paper
        'task',
        staff_2_id,
        NOW() - INTERVAL '26 hours',
        NOW() + INTERVAL '22 hours',
        NOW() + INTERVAL '22 hours',
        NOW() + INTERVAL '22 hours',
        NULL, NULL, NULL,
        'medium',
        'in_progress',
        NOW(), NOW(),
        engagement_2_id,
        'review'
    ),
    (
        '20000000-0000-0000-0000-000000000205'::UUID,
        '10000000-0000-0000-0000-000000000012'::UUID, -- Draft G20 statement
        'task',
        staff_3_id,
        NOW() - INTERVAL '36 hours',
        NOW() + INTERVAL '12 hours',
        NOW() + INTERVAL '12 hours',
        NOW() + INTERVAL '12 hours',
        NULL, NULL, NULL,
        'high',
        'in_progress',
        NOW(), NOW(),
        engagement_2_id,
        'review'
    );

    -- ========================================================================
    -- Engagement 3: G20 Sherpas Meeting (5 assignments across 2 stages)
    -- ========================================================================

    -- TODO Stage (4 assignments - lots of prep work)
    INSERT INTO assignments VALUES
    (
        '20000000-0000-0000-0000-000000000301'::UUID,
        '10000000-0000-0000-0000-000000000003'::UUID, -- Research G20 positions
        'task',
        staff_1_id,
        NOW() - INTERVAL '10 hours',
        NOW() + INTERVAL '14 hours',
        NOW() + INTERVAL '14 hours',
        NOW() + INTERVAL '14 hours',
        NULL, NULL, NULL,
        'urgent',
        'assigned',
        NOW(), NOW(),
        engagement_3_id,
        'todo'
    ),
    (
        '20000000-0000-0000-0000-000000000302'::UUID,
        '10000000-0000-0000-0000-000000000012'::UUID, -- Draft statement
        'task',
        staff_2_id,
        NOW() - INTERVAL '8 hours',
        NOW() + INTERVAL '16 hours',
        NOW() + INTERVAL '16 hours',
        NOW() + INTERVAL '16 hours',
        NULL, NULL, NULL,
        'high',
        'assigned',
        NOW(), NOW(),
        engagement_3_id,
        'todo'
    ),
    (
        '20000000-0000-0000-0000-000000000303'::UUID,
        '10000000-0000-0000-0000-000000000006'::UUID, -- Coordinate input
        'task',
        staff_3_id,
        NOW() - INTERVAL '12 hours',
        NOW() + INTERVAL '36 hours',
        NOW() + INTERVAL '36 hours',
        NOW() + INTERVAL '36 hours',
        NULL, NULL, NULL,
        'high',
        'assigned',
        NOW(), NOW(),
        engagement_3_id,
        'todo'
    ),
    (
        '20000000-0000-0000-0000-000000000304'::UUID,
        '10000000-0000-0000-0000-000000000007'::UUID, -- Schedule follow-up
        'task',
        staff_1_id,
        NOW() - INTERVAL '4 hours',
        NOW() + INTERVAL '68 hours',
        NOW() + INTERVAL '68 hours',
        NOW() + INTERVAL '68 hours',
        NULL, NULL, NULL,
        'low',
        'assigned',
        NOW(), NOW(),
        engagement_3_id,
        'todo'
    );

    -- DONE Stage (1 assignment)
    INSERT INTO assignments VALUES
    (
        '20000000-0000-0000-0000-000000000305'::UUID,
        '10000000-0000-0000-0000-000000000006'::UUID, -- Completed coordination
        'task',
        staff_2_id,
        NOW() - INTERVAL '96 hours',
        NOW() - INTERVAL '48 hours',
        NOW() - INTERVAL '48 hours',
        NULL,
        NOW() - INTERVAL '4 hours', NULL, NULL,
        'high',
        'completed',
        NOW(), NOW(),
        engagement_3_id,
        'done'
    );

    RAISE NOTICE 'Created 17 engagement-linked assignments successfully';
    RAISE NOTICE 'Engagement 1 (Ministerial): 7 assignments (3 todo, 2 in_progress, 1 review, 1 done)';
    RAISE NOTICE 'Engagement 2 (UNDP): 5 assignments (2 todo, 1 in_progress, 2 review, 0 done)';
    RAISE NOTICE 'Engagement 3 (G20): 5 assignments (4 todo, 0 in_progress, 0 review, 1 done)';

END $$;

COMMIT;

-- ============================================================================
-- PART 4: VALIDATION QUERIES
-- ============================================================================

-- Summary of created data
DO $$
DECLARE
    task_count INTEGER;
    standalone_count INTEGER;
    engagement_linked_count INTEGER;
    total_assignments INTEGER;
BEGIN
    SELECT COUNT(*) INTO task_count FROM tasks WHERE id::TEXT LIKE '10000000%';
    SELECT COUNT(*) INTO standalone_count FROM assignments WHERE engagement_id IS NULL AND id::TEXT LIKE '20000000%';
    SELECT COUNT(*) INTO engagement_linked_count FROM assignments WHERE engagement_id IS NOT NULL AND id::TEXT LIKE '20000000%';
    total_assignments := standalone_count + engagement_linked_count;

    RAISE NOTICE '========================================';
    RAISE NOTICE 'Seed Data Summary:';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Tasks Created: %', task_count;
    RAISE NOTICE 'Standalone Assignments: %', standalone_count;
    RAISE NOTICE 'Engagement-Linked Assignments: %', engagement_linked_count;
    RAISE NOTICE 'Total Assignments: %', total_assignments;
    RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- VERIFICATION QUERIES (Commented for reference)
-- ============================================================================

-- View all kanban boards
-- SELECT
--     e.title as engagement,
--     a.workflow_stage,
--     COUNT(*) as card_count
-- FROM assignments a
-- JOIN engagements e ON a.engagement_id = e.id
-- WHERE a.id::TEXT LIKE '20000000%'
-- GROUP BY e.title, a.workflow_stage
-- ORDER BY e.title, a.workflow_stage;

-- View standalone assignments
-- SELECT
--     a.id,
--     t.title as task_title,
--     a.status,
--     a.priority,
--     a.overall_sla_deadline,
--     CASE
--         WHEN a.overall_sla_deadline < NOW() THEN 'overdue'
--         WHEN a.overall_sla_deadline < NOW() + INTERVAL '4 hours' THEN 'urgent'
--         WHEN a.overall_sla_deadline < NOW() + INTERVAL '24 hours' THEN 'warning'
--         ELSE 'normal'
--     END as sla_status
-- FROM assignments a
-- JOIN tasks t ON a.work_item_id = t.id
-- WHERE a.engagement_id IS NULL
-- AND a.id::TEXT LIKE '20000000%'
-- ORDER BY a.overall_sla_deadline;

-- SLA distribution
-- SELECT
--     CASE
--         WHEN overall_sla_deadline < NOW() THEN 'overdue'
--         WHEN overall_sla_deadline < NOW() + INTERVAL '4 hours' THEN 'urgent'
--         WHEN overall_sla_deadline < NOW() + INTERVAL '24 hours' THEN 'warning'
--         ELSE 'normal'
--     END as sla_status,
--     COUNT(*)
-- FROM assignments
-- WHERE id::TEXT LIKE '20000000%'
-- GROUP BY sla_status
-- ORDER BY
--     CASE
--         WHEN overall_sla_deadline < NOW() THEN 1
--         WHEN overall_sla_deadline < NOW() + INTERVAL '4 hours' THEN 2
--         WHEN overall_sla_deadline < NOW() + INTERVAL '24 hours' THEN 3
--         ELSE 4
--     END;

-- View specific engagement kanban
-- SELECT
--     a.workflow_stage,
--     t.title as task_title,
--     a.priority,
--     a.status,
--     CASE
--         WHEN a.current_stage_sla_deadline IS NULL THEN 'N/A'
--         WHEN a.current_stage_sla_deadline < NOW() THEN 'overdue'
--         WHEN a.current_stage_sla_deadline < NOW() + INTERVAL '4 hours' THEN 'urgent'
--         WHEN a.current_stage_sla_deadline < NOW() + INTERVAL '24 hours' THEN 'warning'
--         ELSE 'normal'
--     END as sla_status
-- FROM assignments a
-- JOIN tasks t ON a.work_item_id = t.id
-- JOIN engagements e ON a.engagement_id = e.id
-- WHERE e.title ILIKE '%Ministerial%'
-- AND a.id::TEXT LIKE '20000000%'
-- ORDER BY
--     CASE a.workflow_stage
--         WHEN 'todo' THEN 1
--         WHEN 'in_progress' THEN 2
--         WHEN 'review' THEN 3
--         WHEN 'done' THEN 4
--     END,
--     a.current_stage_sla_deadline NULLS LAST;
