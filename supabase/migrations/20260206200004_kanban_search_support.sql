-- Fix 8: Kanban Search Support
-- Adds p_search_query parameter to get_unified_work_kanban() RPC
-- Applies ILIKE filter on title/description in each UNION branch
-- Uses pg_trgm indexes from migration 20260206200003

CREATE OR REPLACE FUNCTION get_unified_work_kanban(
  p_context_type kanban_context_type,
  p_context_id UUID DEFAULT NULL,
  p_column_mode kanban_column_mode DEFAULT 'status',
  p_source_filter TEXT[] DEFAULT NULL,
  p_search_query TEXT DEFAULT NULL,
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
  v_search TEXT := NULLIF(TRIM(p_search_query), '');
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
        (p_context_type = 'personal' AND t.assignee_id = v_user_id)
        OR (p_context_type = 'engagement' AND t.engagement_id = p_context_id)
        OR (p_context_type = 'dossier' AND t.work_item_type = 'dossier' AND t.work_item_id = p_context_id)
      )
      AND (p_source_filter IS NULL OR 'task' = ANY(p_source_filter))
      AND (v_search IS NULL OR t.title ILIKE '%' || v_search || '%' OR t.description ILIKE '%' || v_search || '%')

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
        (p_context_type = 'personal' AND c.owner_id = v_user_id)
        OR (p_context_type = 'dossier' AND c.dossier_id = p_context_id)
      )
      AND (p_source_filter IS NULL OR 'commitment' = ANY(p_source_filter))
      AND (v_search IS NULL OR c.title ILIKE '%' || v_search || '%' OR c.description ILIKE '%' || v_search || '%' OR c.title_ar ILIKE '%' || v_search || '%')

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
            WHEN 'converted' THEN 'done'
            WHEN 'closed' THEN 'cancelled'
            WHEN 'merged' THEN 'cancelled'
            WHEN 'draft' THEN 'todo'
            WHEN 'submitted' THEN 'todo'
            WHEN 'triaged' THEN 'todo'
            WHEN 'assigned' THEN 'in_progress'
            WHEN 'in_progress' THEN 'in_progress'
            ELSE 'todo'
          END
        WHEN 'priority' THEN i.priority::TEXT
        WHEN 'tracking_type' THEN 'sla'
      END as column_key,
      'sla'::TEXT as tracking_type,
      i.submitted_at + INTERVAL '3 days' as deadline,
      (i.submitted_at + INTERVAL '3 days') < NOW()
        AND i.status NOT IN ('converted', 'closed', 'merged') as is_overdue,
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
    WHERE i.status NOT IN ('converted', 'closed', 'merged')
      AND (
        (p_context_type = 'personal' AND i.assigned_to = v_user_id)
        OR (p_context_type = 'dossier' AND i.dossier_id = p_context_id)
      )
      AND (p_source_filter IS NULL OR 'intake' = ANY(p_source_filter))
      AND (v_search IS NULL OR i.title ILIKE '%' || v_search || '%' OR i.description ILIKE '%' || v_search || '%' OR i.title_ar ILIKE '%' || v_search || '%')
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

COMMENT ON FUNCTION get_unified_work_kanban IS
'Returns unified work items for Kanban board display.
Supports search via p_search_query (ILIKE on title/description/title_ar).
Uses pg_trgm indexes for performance.';
