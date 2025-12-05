-- Migration: Create Kanban RPC Function
-- Feature: 034-unified-kanban
-- Description: Creates RPC function for fetching unified work items
--              grouped by column key for the Kanban board

BEGIN;

-- ============================================
-- 1. Create custom types for Kanban
-- ============================================

-- Drop existing type if exists (for re-running migration)
DROP TYPE IF EXISTS kanban_context_type CASCADE;
DROP TYPE IF EXISTS kanban_column_mode CASCADE;

-- Context type enum
CREATE TYPE kanban_context_type AS ENUM ('personal', 'dossier', 'engagement');

-- Column mode enum
CREATE TYPE kanban_column_mode AS ENUM ('status', 'priority', 'tracking_type');

-- ============================================
-- 2. Create the Kanban RPC function
-- ============================================

CREATE OR REPLACE FUNCTION get_unified_work_kanban(
  p_context_type kanban_context_type,
  p_context_id UUID DEFAULT NULL,
  p_column_mode kanban_column_mode DEFAULT 'status',
  p_source_filter TEXT[] DEFAULT NULL,
  p_limit_per_column INT DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  source TEXT,
  title TEXT,
  title_ar TEXT,
  description TEXT,
  priority TEXT,
  status TEXT,
  workflow_stage TEXT,
  column_key TEXT,
  tracking_type TEXT,
  deadline TIMESTAMPTZ,
  is_overdue BOOLEAN,
  days_until_due INT,
  assignee_id UUID,
  assignee_name TEXT,
  assignee_avatar_url TEXT,
  dossier_id UUID,
  engagement_id UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  metadata JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID := auth.uid();
BEGIN
  -- Validate user is authenticated
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  RETURN QUERY
  WITH base_items AS (
    -- TASKS
    SELECT
      t.id,
      'task'::TEXT as source,
      t.title,
      NULL::TEXT as title_ar,
      t.description,
      t.priority::TEXT,
      t.status::TEXT,
      t.workflow_stage,
      -- Compute column_key based on mode
      CASE p_column_mode
        WHEN 'status' THEN COALESCE(t.workflow_stage, t.status::TEXT)
        WHEN 'priority' THEN t.priority::TEXT
        WHEN 'tracking_type' THEN
          CASE WHEN t.sla_deadline IS NOT NULL THEN 'sla' ELSE 'delivery' END
      END as column_key,
      CASE WHEN t.sla_deadline IS NOT NULL THEN 'sla' ELSE 'delivery' END as tracking_type,
      t.sla_deadline as deadline,
      t.sla_deadline < NOW() AND t.status NOT IN ('completed', 'cancelled') as is_overdue,
      CASE
        WHEN t.sla_deadline IS NULL THEN NULL
        ELSE EXTRACT(DAY FROM t.sla_deadline - NOW())::INT
      END as days_until_due,
      t.assignee_id,
      u.full_name as assignee_name,
      u.avatar_url as assignee_avatar_url,
      NULL::UUID as dossier_id,
      t.engagement_id,
      t.created_at,
      t.updated_at,
      jsonb_build_object(
        'type', t.type,
        'work_item_type', t.work_item_type,
        'work_item_id', t.work_item_id
      ) as metadata
    FROM tasks t
    LEFT JOIN users u ON t.assignee_id = u.id
    WHERE t.is_deleted = FALSE
      AND t.status NOT IN ('completed', 'cancelled')
      AND (
        -- Personal context: user is assignee
        (p_context_type = 'personal' AND t.assignee_id = v_user_id)
        -- Engagement context: match engagement_id
        OR (p_context_type = 'engagement' AND t.engagement_id = p_context_id)
        -- Dossier context: match work_item_type and work_item_id
        OR (p_context_type = 'dossier' AND t.work_item_type = 'dossier' AND t.work_item_id = p_context_id)
      )
      AND (p_source_filter IS NULL OR 'task' = ANY(p_source_filter))

    UNION ALL

    -- AA_COMMITMENTS
    SELECT
      c.id,
      'commitment'::TEXT as source,
      c.title,
      c.title_ar,
      c.description,
      c.priority,
      c.status,
      NULL::TEXT as workflow_stage,
      CASE p_column_mode
        WHEN 'status' THEN
          CASE c.status
            WHEN 'completed' THEN 'done'
            WHEN 'cancelled' THEN 'cancelled'
            ELSE c.status
          END
        WHEN 'priority' THEN c.priority
        WHEN 'tracking_type' THEN c.tracking_mode
      END as column_key,
      c.tracking_mode as tracking_type,
      c.deadline,
      c.is_overdue,
      CASE
        WHEN c.deadline IS NULL THEN NULL
        ELSE EXTRACT(DAY FROM c.deadline - NOW())::INT
      END as days_until_due,
      c.owner_id as assignee_id,
      u.full_name as assignee_name,
      u.avatar_url as assignee_avatar_url,
      c.dossier_id,
      NULL::UUID as engagement_id,
      c.created_at,
      c.updated_at,
      jsonb_build_object(
        'proof_required', c.proof_required,
        'proof_url', c.proof_url,
        'evidence_submitted_at', c.evidence_submitted_at,
        'tracking_mode', c.tracking_mode,
        'after_action_id', c.after_action_id
      ) as metadata
    FROM aa_commitments c
    LEFT JOIN users u ON c.owner_id = u.id
    WHERE c.is_deleted = FALSE
      AND c.status NOT IN ('completed', 'cancelled')
      AND (
        -- Personal context: user is owner
        (p_context_type = 'personal' AND c.owner_id = v_user_id)
        -- Dossier context: match dossier_id
        OR (p_context_type = 'dossier' AND c.dossier_id = p_context_id)
      )
      AND (p_source_filter IS NULL OR 'commitment' = ANY(p_source_filter))

    UNION ALL

    -- INTAKE_TICKETS
    SELECT
      i.id,
      'intake'::TEXT as source,
      i.title,
      i.title_ar,
      i.description,
      i.priority::TEXT,
      i.status::TEXT,
      NULL::TEXT as workflow_stage,
      CASE p_column_mode
        WHEN 'status' THEN
          CASE i.status::TEXT
            WHEN 'resolved' THEN 'done'
            WHEN 'closed' THEN 'cancelled'
            WHEN 'draft' THEN 'pending'
            WHEN 'submitted' THEN 'pending'
            WHEN 'triaged' THEN 'pending'
            WHEN 'assigned' THEN 'in_progress'
            ELSE i.status::TEXT
          END
        WHEN 'priority' THEN i.priority::TEXT
        WHEN 'tracking_type' THEN 'sla'
      END as column_key,
      'sla'::TEXT as tracking_type,
      i.submitted_at + INTERVAL '3 days' as deadline, -- SLA is 3 days from submission
      (i.submitted_at + INTERVAL '3 days') < NOW()
        AND i.status NOT IN ('resolved', 'closed') as is_overdue,
      CASE
        WHEN i.submitted_at IS NULL THEN NULL
        ELSE EXTRACT(DAY FROM (i.submitted_at + INTERVAL '3 days') - NOW())::INT
      END as days_until_due,
      i.assigned_to as assignee_id,
      u.full_name as assignee_name,
      u.avatar_url as assignee_avatar_url,
      i.dossier_id,
      NULL::UUID as engagement_id,
      i.created_at,
      i.updated_at,
      jsonb_build_object(
        'ticket_number', i.ticket_number,
        'request_type', i.request_type,
        'urgency', i.urgency,
        'sensitivity', i.sensitivity,
        'assigned_unit', i.assigned_unit
      ) as metadata
    FROM intake_tickets i
    LEFT JOIN users u ON i.assigned_to = u.id
    WHERE i.status NOT IN ('resolved', 'closed')
      AND (
        -- Personal context: user is assigned
        (p_context_type = 'personal' AND i.assigned_to = v_user_id)
        -- Dossier context: match dossier_id
        OR (p_context_type = 'dossier' AND i.dossier_id = p_context_id)
      )
      AND (p_source_filter IS NULL OR 'intake' = ANY(p_source_filter))
  ),
  ranked_items AS (
    SELECT
      bi.*,
      ROW_NUMBER() OVER (
        PARTITION BY bi.column_key
        ORDER BY
          bi.is_overdue DESC NULLS LAST,
          bi.deadline ASC NULLS LAST,
          bi.created_at ASC
      ) as rn
    FROM base_items bi
  )
  SELECT
    ri.id,
    ri.source,
    ri.title,
    ri.title_ar,
    ri.description,
    ri.priority,
    ri.status,
    ri.workflow_stage,
    ri.column_key,
    ri.tracking_type,
    ri.deadline,
    ri.is_overdue,
    ri.days_until_due,
    ri.assignee_id,
    ri.assignee_name,
    ri.assignee_avatar_url,
    ri.dossier_id,
    ri.engagement_id,
    ri.created_at,
    ri.updated_at,
    ri.metadata
  FROM ranked_items ri
  WHERE ri.rn <= p_limit_per_column
  ORDER BY
    ri.column_key,
    ri.is_overdue DESC NULLS LAST,
    ri.deadline ASC NULLS LAST;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_unified_work_kanban TO authenticated;

-- Add function comment
COMMENT ON FUNCTION get_unified_work_kanban IS
'Returns unified work items (tasks, commitments, intake tickets) grouped by column key for Kanban board display. Supports personal, dossier, and engagement contexts with status, priority, and tracking_type column modes.';

COMMIT;

-- ============================================
-- ROLLBACK INSTRUCTIONS (manual)
-- ============================================
-- To rollback this migration:
--
-- DROP FUNCTION IF EXISTS get_unified_work_kanban;
-- DROP TYPE IF EXISTS kanban_column_mode;
-- DROP TYPE IF EXISTS kanban_context_type;
