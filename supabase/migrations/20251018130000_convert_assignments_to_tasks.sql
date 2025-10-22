-- Migration: Convert direct dossier/position assignments to task-based assignments
-- Purpose: Fix conceptual issue where assignments point directly to dossiers
--          Instead, assignments should point to tasks, which then link to dossiers
-- Date: 2025-10-18

BEGIN;

-- ============================================================================
-- Step 1: Create Tasks from existing dossier assignments
-- ============================================================================

DO $$
DECLARE
  assignment_record RECORD;
  new_task_id UUID;
  task_title TEXT;
  task_description TEXT;
  source_json JSONB;
  item_name_en TEXT;
  item_name_ar TEXT;
BEGIN
  -- Process each assignment that currently points to a dossier or position
  FOR assignment_record IN
    SELECT
      a.id as assignment_id,
      a.work_item_id,
      a.work_item_type,
      a.priority,
      a.status,
      a.assignee_id,
      a.created_at,
      COALESCE(a.assigned_by, a.assignee_id) as creator_id
    FROM assignments a
    WHERE a.work_item_type IN ('dossier', 'position', 'ticket')
    ORDER BY a.created_at
  LOOP
    -- Fetch the work item name based on type
    IF assignment_record.work_item_type = 'dossier' THEN
      SELECT name_en, name_ar INTO item_name_en, item_name_ar
      FROM dossiers
      WHERE id = assignment_record.work_item_id;

      task_title := 'Review and process: ' || COALESCE(item_name_en, 'Dossier');
      task_description := 'Review and process the dossier "' || COALESCE(item_name_en, 'Unnamed') || '"';
      source_json := jsonb_build_object(
        'type', 'dossier',
        'dossier_ids', jsonb_build_array(assignment_record.work_item_id),
        'primary_dossier_id', assignment_record.work_item_id
      );

    ELSIF assignment_record.work_item_type = 'position' THEN
      SELECT title_en, title_ar INTO item_name_en, item_name_ar
      FROM positions
      WHERE id = assignment_record.work_item_id;

      task_title := 'Prepare position: ' || COALESCE(item_name_en, 'Position');
      task_description := 'Prepare and finalize the position paper "' || COALESCE(item_name_en, 'Unnamed') || '"';
      source_json := jsonb_build_object(
        'type', 'position',
        'position_ids', jsonb_build_array(assignment_record.work_item_id),
        'primary_position_id', assignment_record.work_item_id
      );

    ELSIF assignment_record.work_item_type = 'ticket' THEN
      SELECT title, title_ar INTO item_name_en, item_name_ar
      FROM intake_tickets
      WHERE id = assignment_record.work_item_id;

      task_title := 'Process ticket: ' || COALESCE(item_name_en, 'Ticket');
      task_description := 'Process and respond to intake ticket "' || COALESCE(item_name_en, 'Unnamed') || '"';
      source_json := jsonb_build_object(
        'type', 'ticket',
        'ticket_ids', jsonb_build_array(assignment_record.work_item_id),
        'primary_ticket_id', assignment_record.work_item_id
      );
    END IF;

    -- Generate new task ID
    new_task_id := gen_random_uuid();

    -- Create the task
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
      created_at,
      updated_at,
      created_by,
      last_modified_by,
      version,
      tenant_id,
      is_deleted
    ) VALUES (
      new_task_id,
      task_title,
      task_description,
      'action_item', -- Default task type
      source_json,
      jsonb_build_object(
        'assignee_id', assignment_record.assignee_id,
        'assigned_at', assignment_record.created_at
      ),
      jsonb_build_object(
        'created_at', assignment_record.created_at
      ),
      (CASE
        WHEN assignment_record.status = 'pending' THEN 'pending'
        WHEN assignment_record.status = 'assigned' THEN 'pending'
        WHEN assignment_record.status = 'in_progress' THEN 'in_progress'
        WHEN assignment_record.status = 'completed' THEN 'completed'
        ELSE 'pending'
      END)::task_status,
      assignment_record.priority::text::urgent_priority,
      assignment_record.created_at,
      assignment_record.created_at,
      assignment_record.creator_id,
      assignment_record.creator_id,
      1,
      '00000000-0000-0000-0000-000000000001'::uuid, -- Default tenant
      false
    );

    -- Update the assignment to point to the new task
    UPDATE assignments
    SET
      work_item_type = 'task',
      work_item_id = new_task_id
    WHERE id = assignment_record.assignment_id;

    RAISE NOTICE 'Created task % for assignment % (was % %)',
      new_task_id, assignment_record.assignment_id,
      assignment_record.work_item_type, assignment_record.work_item_id;
  END LOOP;
END $$;

-- ============================================================================
-- Step 2: Add index for task source lookups
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_tasks_source_dossiers
ON tasks USING GIN ((source->'dossier_ids'));

CREATE INDEX IF NOT EXISTS idx_tasks_source_positions
ON tasks USING GIN ((source->'position_ids'));

CREATE INDEX IF NOT EXISTS idx_tasks_source_tickets
ON tasks USING GIN ((source->'ticket_ids'));

COMMIT;

-- ============================================================================
-- Verification Query
-- ============================================================================
-- Run this after migration to verify the conversion:
--
-- SELECT
--   a.id as assignment_id,
--   a.work_item_type,
--   t.title as task_title,
--   t.source->'dossier_ids' as linked_dossiers,
--   t.source->'position_ids' as linked_positions,
--   t.source->'ticket_ids' as linked_tickets
-- FROM assignments a
-- JOIN tasks t ON a.work_item_id = t.id AND a.work_item_type = 'task'
-- LIMIT 10;
