-- T079a: Performance Test Seed Data
-- Creates large dataset for testing auto-assignment and SLA monitoring performance
-- Target: 500 staff, 200 skills, 10,000 assignments, 1,000 queued items

-- ============================================================================
-- PART 1: ORGANIZATIONAL UNITS (20 units)
-- ============================================================================

DO $$
DECLARE
  unit_count INT := 20;
  unit_id UUID;
  unit_name_en TEXT;
  unit_name_ar TEXT;
BEGIN
  FOR i IN 1..unit_count LOOP
    unit_id := gen_random_uuid();
    unit_name_en := 'Test Unit ' || i;
    unit_name_ar := 'وحدة الاختبار ' || i;

    INSERT INTO organizational_units (id, name_en, name_ar, unit_wip_limit, parent_unit_id, created_at)
    VALUES (
      unit_id,
      unit_name_en,
      unit_name_ar,
      CASE
        WHEN i <= 5 THEN 50  -- Large units
        WHEN i <= 15 THEN 30 -- Medium units
        ELSE 20              -- Small units
      END,
      NULL, -- No parent for test data
      NOW() - (random() * INTERVAL '180 days')
    );
  END LOOP;

  RAISE NOTICE 'Created % organizational units', unit_count;
END $$;

-- ============================================================================
-- PART 2: SKILLS (200 skills)
-- ============================================================================

DO $$
DECLARE
  skill_count INT := 200;
  skill_id UUID;
  skill_name_en TEXT;
  skill_name_ar TEXT;
  skill_category TEXT;
  categories TEXT[] := ARRAY['languages', 'technical', 'domain', 'soft_skills', 'certifications'];
BEGIN
  FOR i IN 1..skill_count LOOP
    skill_id := gen_random_uuid();
    skill_name_en := 'Test Skill ' || i;
    skill_name_ar := 'مهارة الاختبار ' || i;
    skill_category := categories[(i % array_length(categories, 1)) + 1];

    INSERT INTO skills (id, name_en, name_ar, category, created_at)
    VALUES (
      skill_id,
      skill_name_en,
      skill_name_ar,
      skill_category,
      NOW() - (random() * INTERVAL '180 days')
    );
  END LOOP;

  RAISE NOTICE 'Created % skills', skill_count;
END $$;

-- ============================================================================
-- PART 3: STAFF PROFILES (500 staff)
-- ============================================================================

DO $$
DECLARE
  staff_count INT := 500;
  staff_id UUID;
  user_id UUID;
  unit_id UUID;
  staff_skills UUID[];
  skill_count INT;
  individual_wip_limit INT;
  current_count INT;
  availability availability_status;
  staff_role TEXT;
BEGIN
  FOR i IN 1..staff_count LOOP
    -- Generate IDs
    staff_id := gen_random_uuid();
    user_id := gen_random_uuid();

    -- Random unit
    SELECT id INTO unit_id FROM organizational_units ORDER BY random() LIMIT 1;

    -- Random 3-7 skills per staff member
    skill_count := 3 + (random() * 4)::INT;
    SELECT array_agg(id) INTO staff_skills
    FROM (SELECT id FROM skills ORDER BY random() LIMIT skill_count) s;

    -- WIP limit (3-8)
    individual_wip_limit := 3 + (random() * 5)::INT;

    -- Current assignment count (0 to limit-1 for most, some over limit for testing)
    current_count := CASE
      WHEN random() < 0.8 THEN (random() * (individual_wip_limit - 1))::INT
      ELSE individual_wip_limit + (random() * 2)::INT -- 20% over limit
    END;

    -- Availability (90% available, 5% on leave, 5% unavailable)
    availability := CASE
      WHEN random() < 0.90 THEN 'available'::availability_status
      WHEN random() < 0.95 THEN 'on_leave'::availability_status
      ELSE 'unavailable'::availability_status
    END;

    -- Role (80% staff, 15% supervisor, 5% admin)
    staff_role := CASE
      WHEN random() < 0.80 THEN 'staff'
      WHEN random() < 0.95 THEN 'supervisor'
      ELSE 'admin'
    END;

    INSERT INTO staff_profiles (
      id,
      user_id,
      unit_id,
      skills,
      individual_wip_limit,
      current_assignment_count,
      availability_status,
      unavailable_until,
      unavailable_reason,
      escalation_chain_id,
      hr_employee_id,
      role,
      version,
      created_at,
      updated_at
    ) VALUES (
      staff_id,
      user_id,
      unit_id,
      staff_skills,
      individual_wip_limit,
      current_count,
      availability,
      CASE WHEN availability != 'available'::availability_status
        THEN NOW() + (random() * INTERVAL '30 days')
        ELSE NULL
      END,
      CASE WHEN availability != 'available'::availability_status
        THEN 'Test unavailability reason'
        ELSE NULL
      END,
      NULL, -- No escalation chain for test data
      'HR-' || LPAD(i::TEXT, 6, '0'),
      staff_role,
      0,
      NOW() - (random() * INTERVAL '365 days'),
      NOW() - (random() * INTERVAL '30 days')
    );
  END LOOP;

  RAISE NOTICE 'Created % staff profiles', staff_count;
END $$;

-- ============================================================================
-- PART 4: ASSIGNMENTS (10,000 active assignments)
-- ============================================================================

DO $$
DECLARE
  assignment_count INT := 10000;
  assignment_id UUID;
  work_item_id TEXT;
  work_item_type work_item_type;
  assignee_id UUID;
  assigned_at TIMESTAMPTZ;
  sla_deadline TIMESTAMPTZ;
  priority priority_level;
  status assignment_status;
  warning_sent BOOLEAN;
  escalated BOOLEAN;
  elapsed_pct FLOAT;
  work_types work_item_type[] := ARRAY['dossier'::work_item_type, 'ticket'::work_item_type, 'position'::work_item_type, 'task'::work_item_type];
  priorities priority_level[] := ARRAY['urgent'::priority_level, 'high'::priority_level, 'normal'::priority_level, 'low'::priority_level];
  statuses assignment_status[] := ARRAY['assigned'::assignment_status, 'in_progress'::assignment_status];
BEGIN
  FOR i IN 1..assignment_count LOOP
    assignment_id := gen_random_uuid();
    work_item_id := 'perf-test-' || i;
    work_item_type := work_types[(random() * 3)::INT + 1];
    priority := priorities[(random() * 3)::INT + 1];
    status := statuses[(random() * 1)::INT + 1];

    -- Random assignee (only available staff)
    SELECT user_id INTO assignee_id
    FROM staff_profiles
    WHERE availability_status = 'available'::availability_status
    ORDER BY random()
    LIMIT 1;

    -- Assigned time (last 7 days)
    assigned_at := NOW() - (random() * INTERVAL '7 days');

    -- Calculate SLA deadline based on work type and priority
    sla_deadline := assigned_at + (
      CASE work_item_type
        WHEN 'dossier'::work_item_type THEN
          CASE priority
            WHEN 'urgent'::priority_level THEN INTERVAL '8 hours'
            WHEN 'high'::priority_level THEN INTERVAL '24 hours'
            WHEN 'normal'::priority_level THEN INTERVAL '48 hours'
            ELSE INTERVAL '120 hours'
          END
        WHEN 'ticket'::work_item_type THEN
          CASE priority
            WHEN 'urgent'::priority_level THEN INTERVAL '2 hours'
            WHEN 'high'::priority_level THEN INTERVAL '24 hours'
            WHEN 'normal'::priority_level THEN INTERVAL '48 hours'
            ELSE INTERVAL '120 hours'
          END
        WHEN 'position'::work_item_type THEN
          CASE priority
            WHEN 'urgent'::priority_level THEN INTERVAL '4 hours'
            WHEN 'high'::priority_level THEN INTERVAL '24 hours'
            WHEN 'normal'::priority_level THEN INTERVAL '48 hours'
            ELSE INTERVAL '120 hours'
          END
        ELSE -- task
          CASE priority
            WHEN 'urgent'::priority_level THEN INTERVAL '4 hours'
            WHEN 'high'::priority_level THEN INTERVAL '24 hours'
            WHEN 'normal'::priority_level THEN INTERVAL '48 hours'
            ELSE INTERVAL '120 hours'
          END
      END
    );

    -- Calculate elapsed percentage
    elapsed_pct := EXTRACT(EPOCH FROM (NOW() - assigned_at)) / EXTRACT(EPOCH FROM (sla_deadline - assigned_at));

    -- Distribute assignments across SLA thresholds: 50% ok, 30% warning, 20% breached
    IF random() < 0.50 THEN
      -- OK status (<75% elapsed)
      sla_deadline := NOW() + (random() * INTERVAL '48 hours'); -- Future deadline
      warning_sent := FALSE;
      escalated := FALSE;
    ELSIF random() < 0.80 THEN
      -- Warning status (75-100% elapsed)
      sla_deadline := NOW() + (random() * INTERVAL '6 hours'); -- Soon deadline
      warning_sent := TRUE;
      escalated := FALSE;
    ELSE
      -- Breached status (>100% elapsed)
      sla_deadline := NOW() - (random() * INTERVAL '12 hours'); -- Past deadline
      warning_sent := TRUE;
      escalated := random() < 0.5; -- 50% of breached are escalated
    END IF;

    INSERT INTO assignments (
      id,
      work_item_id,
      work_item_type,
      assignee_id,
      assigned_at,
      assigned_by,
      sla_deadline,
      priority,
      status,
      warning_sent_at,
      escalated_at,
      escalation_recipient_id,
      completed_at,
      created_at,
      updated_at
    ) VALUES (
      assignment_id,
      work_item_id,
      work_item_type,
      assignee_id,
      assigned_at,
      NULL, -- Auto-assigned
      sla_deadline,
      priority,
      status,
      CASE WHEN warning_sent THEN NOW() - (random() * INTERVAL '2 hours') ELSE NULL END,
      CASE WHEN escalated THEN NOW() - (random() * INTERVAL '1 hour') ELSE NULL END,
      CASE WHEN escalated THEN (SELECT user_id FROM staff_profiles WHERE role IN ('supervisor', 'admin') ORDER BY random() LIMIT 1) ELSE NULL END,
      NULL,
      assigned_at,
      NOW() - (random() * INTERVAL '24 hours')
    );

    -- Progress indicator
    IF i % 1000 = 0 THEN
      RAISE NOTICE 'Created % assignments...', i;
    END IF;
  END LOOP;

  RAISE NOTICE 'Created % assignments', assignment_count;
END $$;

-- ============================================================================
-- PART 5: ASSIGNMENT QUEUE (1,000 queued items)
-- ============================================================================

DO $$
DECLARE
  queue_count INT := 1000;
  queue_id UUID;
  work_item_id TEXT;
  work_item_type work_item_type;
  required_skills UUID[];
  target_unit_id UUID;
  priority priority_level;
  skill_count INT;
  attempts INT;
  work_types work_item_type[] := ARRAY['dossier'::work_item_type, 'ticket'::work_item_type, 'position'::work_item_type, 'task'::work_item_type];
  priorities priority_level[] := ARRAY['urgent'::priority_level, 'high'::priority_level, 'normal'::priority_level, 'low'::priority_level];
BEGIN
  FOR i IN 1..queue_count LOOP
    queue_id := gen_random_uuid();
    work_item_id := 'queued-perf-test-' || i;
    work_item_type := work_types[(random() * 3)::INT + 1];
    priority := priorities[(random() * 3)::INT + 1];

    -- Random 1-3 required skills
    skill_count := 1 + (random() * 2)::INT;
    SELECT array_agg(id) INTO required_skills
    FROM (SELECT id FROM skills ORDER BY random() LIMIT skill_count) s;

    -- Random target unit (50% have target unit, 50% are NULL)
    IF random() < 0.5 THEN
      SELECT id INTO target_unit_id FROM organizational_units ORDER BY random() LIMIT 1;
    ELSE
      target_unit_id := NULL;
    END IF;

    -- Random attempts (0-5, most have 0-2)
    attempts := (random() * 5)::INT;

    INSERT INTO assignment_queue (
      id,
      work_item_id,
      work_item_type,
      required_skills,
      target_unit_id,
      priority,
      created_at,
      attempts,
      last_attempt_at,
      notes
    ) VALUES (
      queue_id,
      work_item_id,
      work_item_type,
      required_skills,
      target_unit_id,
      priority,
      NOW() - (random() * INTERVAL '24 hours'),
      attempts,
      CASE WHEN attempts > 0 THEN NOW() - (random() * INTERVAL '2 hours') ELSE NULL END,
      'Performance test queue item'
    );

    -- Progress indicator
    IF i % 200 = 0 THEN
      RAISE NOTICE 'Created % queue entries...', i;
    END IF;
  END LOOP;

  RAISE NOTICE 'Created % queue entries', queue_count;
END $$;

-- ============================================================================
-- PART 6: ESCALATION EVENTS (create for escalated assignments)
-- ============================================================================

DO $$
DECLARE
  escalation_record RECORD;
  escalation_id UUID;
  escalation_reasons escalation_reason[] := ARRAY['sla_breach'::escalation_reason, 'manual'::escalation_reason, 'capacity_exhaustion'::escalation_reason];
BEGIN
  FOR escalation_record IN
    SELECT
      id as assignment_id,
      assignee_id,
      escalation_recipient_id,
      escalated_at
    FROM assignments
    WHERE escalated_at IS NOT NULL
  LOOP
    escalation_id := gen_random_uuid();

    INSERT INTO escalation_events (
      id,
      assignment_id,
      escalated_from_id,
      escalated_to_id,
      reason,
      escalated_at,
      acknowledged_at,
      resolved_at,
      notes,
      created_at
    ) VALUES (
      escalation_id,
      escalation_record.assignment_id,
      escalation_record.assignee_id,
      escalation_record.escalation_recipient_id,
      escalation_reasons[(random() * 2)::INT + 1],
      escalation_record.escalated_at,
      CASE WHEN random() < 0.7 THEN escalation_record.escalated_at + (random() * INTERVAL '2 hours') ELSE NULL END,
      CASE WHEN random() < 0.5 THEN escalation_record.escalated_at + (random() * INTERVAL '6 hours') ELSE NULL END,
      'Performance test escalation event',
      escalation_record.escalated_at
    );
  END LOOP;

  RAISE NOTICE 'Created escalation events for all escalated assignments';
END $$;

-- ============================================================================
-- PART 7: CAPACITY SNAPSHOTS (30 days of historical data)
-- ============================================================================

DO $$
DECLARE
  days INT := 30;
  snapshot_date DATE;
  unit_record RECORD;
  total_staff INT;
  total_capacity INT;
  active_assignments INT;
  utilization_pct DECIMAL(5,2);
BEGIN
  FOR day IN 0..days-1 LOOP
    snapshot_date := CURRENT_DATE - day;

    FOR unit_record IN SELECT id as unit_id, name_en FROM organizational_units LOOP
      -- Count staff in this unit
      SELECT COUNT(*) INTO total_staff
      FROM staff_profiles
      WHERE unit_id = unit_record.unit_id
        AND availability_status = 'available'::availability_status;

      -- Sum of WIP limits
      SELECT COALESCE(SUM(individual_wip_limit), 0) INTO total_capacity
      FROM staff_profiles
      WHERE unit_id = unit_record.unit_id
        AND availability_status = 'available'::availability_status;

      -- Random active assignments (simulate historical data)
      active_assignments := (random() * total_capacity)::INT;

      -- Calculate utilization
      IF total_capacity > 0 THEN
        utilization_pct := (active_assignments::DECIMAL / total_capacity) * 100;
      ELSE
        utilization_pct := 0;
      END IF;

      INSERT INTO capacity_snapshots (
        id,
        snapshot_date,
        unit_id,
        total_staff,
        total_capacity,
        active_assignments,
        utilization_pct,
        created_at
      ) VALUES (
        gen_random_uuid(),
        snapshot_date,
        unit_record.unit_id,
        total_staff,
        total_capacity,
        active_assignments,
        utilization_pct,
        snapshot_date::TIMESTAMPTZ
      );
    END LOOP;
  END LOOP;

  RAISE NOTICE 'Created % days of capacity snapshots for all units', days;
END $$;

-- ============================================================================
-- VERIFICATION & SUMMARY
-- ============================================================================

DO $$
DECLARE
  unit_count INT;
  skill_count INT;
  staff_count INT;
  assignment_count INT;
  queue_count INT;
  escalation_count INT;
  snapshot_count INT;
BEGIN
  SELECT COUNT(*) INTO unit_count FROM organizational_units WHERE name_en LIKE 'Test Unit%';
  SELECT COUNT(*) INTO skill_count FROM skills WHERE name_en LIKE 'Test Skill%';
  SELECT COUNT(*) INTO staff_count FROM staff_profiles WHERE hr_employee_id LIKE 'HR-%';
  SELECT COUNT(*) INTO assignment_count FROM assignments WHERE work_item_id LIKE 'perf-test-%';
  SELECT COUNT(*) INTO queue_count FROM assignment_queue WHERE work_item_id LIKE 'queued-perf-test-%';
  SELECT COUNT(*) INTO escalation_count FROM escalation_events WHERE notes = 'Performance test escalation event';
  SELECT COUNT(*) INTO snapshot_count FROM capacity_snapshots;

  RAISE NOTICE '';
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'PERFORMANCE TEST DATA SEED SUMMARY';
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Organizational Units: %', unit_count;
  RAISE NOTICE 'Skills: %', skill_count;
  RAISE NOTICE 'Staff Profiles: %', staff_count;
  RAISE NOTICE 'Active Assignments: %', assignment_count;
  RAISE NOTICE 'Queue Entries: %', queue_count;
  RAISE NOTICE 'Escalation Events: %', escalation_count;
  RAISE NOTICE 'Capacity Snapshots: %', snapshot_count;
  RAISE NOTICE '===========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Performance test data seeded successfully!';
  RAISE NOTICE 'You can now run performance tests (T080, T081)';
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- CLEANUP SCRIPT (for removing test data after performance tests)
-- ============================================================================

-- Uncomment and run to remove all performance test data:
--
-- DELETE FROM escalation_events WHERE notes = 'Performance test escalation event';
-- DELETE FROM capacity_snapshots;
-- DELETE FROM assignment_queue WHERE work_item_id LIKE 'queued-perf-test-%';
-- DELETE FROM assignments WHERE work_item_id LIKE 'perf-test-%';
-- DELETE FROM staff_profiles WHERE hr_employee_id LIKE 'HR-%';
-- DELETE FROM skills WHERE name_en LIKE 'Test Skill%';
-- DELETE FROM organizational_units WHERE name_en LIKE 'Test Unit%';
--
-- VACUUM ANALYZE;
