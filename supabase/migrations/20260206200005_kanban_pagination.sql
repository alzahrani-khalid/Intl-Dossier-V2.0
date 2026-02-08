-- Fix 9: Kanban Pagination Support
-- New RPC: get_kanban_column_counts() returning (column_key, total_count)
-- Uses same logic as get_unified_work_kanban for consistency

CREATE OR REPLACE FUNCTION get_kanban_column_counts(
  p_context_type kanban_context_type,
  p_context_id UUID DEFAULT NULL,
  p_column_mode kanban_column_mode DEFAULT 'status',
  p_source_filter TEXT[] DEFAULT NULL,
  p_search_query TEXT DEFAULT NULL
)
RETURNS TABLE (
  column_key TEXT,
  total_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_search TEXT := NULLIF(TRIM(p_search_query), '');
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  RETURN QUERY
  WITH base_items AS (
    -- TASKS
    SELECT
      CASE p_column_mode
        WHEN 'status' THEN COALESCE(t.workflow_stage, t.status::TEXT)
        WHEN 'priority' THEN t.priority::TEXT
        WHEN 'tracking_type' THEN
          CASE WHEN t.sla_deadline IS NOT NULL THEN 'sla' ELSE 'delivery' END
      END as col_key
    FROM tasks t
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
      CASE p_column_mode
        WHEN 'status' THEN
          CASE c.status
            WHEN 'completed' THEN 'done'
            WHEN 'cancelled' THEN 'cancelled'
            ELSE c.status
          END
        WHEN 'priority' THEN c.priority
        WHEN 'tracking_type' THEN c.tracking_mode
      END as col_key
    FROM aa_commitments c
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
      END as col_key
    FROM intake_tickets i
    WHERE i.status NOT IN ('converted', 'closed', 'merged')
      AND (
        (p_context_type = 'personal' AND i.assigned_to = v_user_id)
        OR (p_context_type = 'dossier' AND i.dossier_id = p_context_id)
      )
      AND (p_source_filter IS NULL OR 'intake' = ANY(p_source_filter))
      AND (v_search IS NULL OR i.title ILIKE '%' || v_search || '%' OR i.description ILIKE '%' || v_search || '%' OR i.title_ar ILIKE '%' || v_search || '%')
  )
  SELECT bi.col_key as column_key, COUNT(*) as total_count
  FROM base_items bi
  GROUP BY bi.col_key;
END;
$$;

GRANT EXECUTE ON FUNCTION get_kanban_column_counts TO authenticated;

COMMENT ON FUNCTION get_kanban_column_counts IS
'Returns total item counts per column key for Kanban pagination.
Uses same filtering logic as get_unified_work_kanban.';
