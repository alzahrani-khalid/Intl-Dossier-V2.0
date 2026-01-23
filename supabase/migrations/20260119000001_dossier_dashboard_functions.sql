-- Migration: Dossier Dashboard RPC Functions
-- Feature: Dossier-Centric Dashboard Redesign
-- Date: 2026-01-19
-- Description: Creates RPC functions for the dossier-centric dashboard

-- ============================================================================
-- get_dossier_dashboard_summary
-- Returns overall dashboard statistics for the current user
-- ============================================================================

CREATE OR REPLACE FUNCTION get_dossier_dashboard_summary(
  p_user_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID := COALESCE(p_user_id, auth.uid());
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_dossiers', COALESCE(total_dossiers, 0),
    'owned_dossiers', COALESCE(owned_dossiers, 0),
    'active_dossiers', COALESCE(active_dossiers, 0),
    'total_pending_work', COALESCE(total_pending_work, 0),
    'due_today', COALESCE(due_today, 0),
    'attention_needed', COALESCE(attention_needed, 0),
    'total_overdue', COALESCE(total_overdue, 0),
    'recent_activity_count', COALESCE(recent_activity_count, 0)
  )
  INTO v_result
  FROM (
    SELECT
      -- Total dossiers user has access to via roles
      (SELECT COUNT(DISTINCT dossier_id) FROM dossier_members WHERE user_id = v_user_id AND deleted_at IS NULL) as total_dossiers,

      -- Dossiers where user is owner
      (SELECT COUNT(*) FROM dossier_members WHERE user_id = v_user_id AND role = 'owner' AND deleted_at IS NULL) as owned_dossiers,

      -- Dossiers with activity in last 7 days
      (SELECT COUNT(DISTINCT wid.dossier_id)
       FROM work_item_dossiers wid
       JOIN dossier_members dm ON dm.dossier_id = wid.dossier_id AND dm.user_id = v_user_id AND dm.deleted_at IS NULL
       WHERE wid.deleted_at IS NULL AND wid.updated_at > NOW() - INTERVAL '7 days'
      ) as active_dossiers,

      -- Total pending work items across user's dossiers
      (SELECT COUNT(*)
       FROM work_item_dossiers wid
       JOIN dossier_members dm ON dm.dossier_id = wid.dossier_id AND dm.user_id = v_user_id AND dm.deleted_at IS NULL
       LEFT JOIN tasks t ON wid.work_item_type = 'task' AND t.id = wid.work_item_id AND t.is_deleted = false AND t.status NOT IN ('done', 'cancelled')
       LEFT JOIN commitments c ON wid.work_item_type = 'commitment' AND c.id = wid.work_item_id AND c.status NOT IN ('completed', 'cancelled')
       LEFT JOIN intake_tickets it ON wid.work_item_type = 'intake' AND it.id = wid.work_item_id AND it.status NOT IN ('closed', 'cancelled')
       WHERE wid.deleted_at IS NULL
         AND (t.id IS NOT NULL OR c.id IS NOT NULL OR it.id IS NOT NULL)
      ) as total_pending_work,

      -- Work items due today
      (SELECT COUNT(*)
       FROM work_item_dossiers wid
       JOIN dossier_members dm ON dm.dossier_id = wid.dossier_id AND dm.user_id = v_user_id AND dm.deleted_at IS NULL
       LEFT JOIN tasks t ON wid.work_item_type = 'task' AND t.id = wid.work_item_id AND t.is_deleted = false AND t.status NOT IN ('done', 'cancelled')
       LEFT JOIN commitments c ON wid.work_item_type = 'commitment' AND c.id = wid.work_item_id AND c.status NOT IN ('completed', 'cancelled')
       LEFT JOIN intake_tickets it ON wid.work_item_type = 'intake' AND it.id = wid.work_item_id AND it.status NOT IN ('closed', 'cancelled')
       WHERE wid.deleted_at IS NULL
         AND (
           (t.id IS NOT NULL AND t.due_date::date = CURRENT_DATE) OR
           (c.id IS NOT NULL AND c.due_date::date = CURRENT_DATE) OR
           (it.id IS NOT NULL AND it.sla_deadline::date = CURRENT_DATE)
         )
      ) as due_today,

      -- Attention needed (overdue + high priority pending)
      (SELECT COUNT(*)
       FROM work_item_dossiers wid
       JOIN dossier_members dm ON dm.dossier_id = wid.dossier_id AND dm.user_id = v_user_id AND dm.deleted_at IS NULL
       LEFT JOIN tasks t ON wid.work_item_type = 'task' AND t.id = wid.work_item_id AND t.is_deleted = false AND t.status NOT IN ('done', 'cancelled')
       LEFT JOIN commitments c ON wid.work_item_type = 'commitment' AND c.id = wid.work_item_id AND c.status NOT IN ('completed', 'cancelled')
       LEFT JOIN intake_tickets it ON wid.work_item_type = 'intake' AND it.id = wid.work_item_id AND it.status NOT IN ('closed', 'cancelled')
       WHERE wid.deleted_at IS NULL
         AND (
           -- Overdue
           (t.id IS NOT NULL AND t.due_date < CURRENT_TIMESTAMP) OR
           (c.id IS NOT NULL AND c.due_date < CURRENT_TIMESTAMP) OR
           (it.id IS NOT NULL AND it.sla_deadline < CURRENT_TIMESTAMP) OR
           -- High/Urgent priority
           (t.id IS NOT NULL AND t.priority IN ('high', 'urgent')) OR
           (c.id IS NOT NULL AND c.priority IN ('high', 'urgent')) OR
           (it.id IS NOT NULL AND it.priority IN ('high', 'urgent'))
         )
      ) as attention_needed,

      -- Total overdue
      (SELECT COUNT(*)
       FROM work_item_dossiers wid
       JOIN dossier_members dm ON dm.dossier_id = wid.dossier_id AND dm.user_id = v_user_id AND dm.deleted_at IS NULL
       LEFT JOIN tasks t ON wid.work_item_type = 'task' AND t.id = wid.work_item_id AND t.is_deleted = false AND t.status NOT IN ('done', 'cancelled')
       LEFT JOIN commitments c ON wid.work_item_type = 'commitment' AND c.id = wid.work_item_id AND c.status NOT IN ('completed', 'cancelled')
       LEFT JOIN intake_tickets it ON wid.work_item_type = 'intake' AND it.id = wid.work_item_id AND it.status NOT IN ('closed', 'cancelled')
       WHERE wid.deleted_at IS NULL
         AND (
           (t.id IS NOT NULL AND t.due_date < CURRENT_TIMESTAMP) OR
           (c.id IS NOT NULL AND c.due_date < CURRENT_TIMESTAMP) OR
           (it.id IS NOT NULL AND it.sla_deadline < CURRENT_TIMESTAMP)
         )
      ) as total_overdue,

      -- Recent activity count (last 7 days)
      (SELECT COUNT(*)
       FROM work_item_dossiers wid
       JOIN dossier_members dm ON dm.dossier_id = wid.dossier_id AND dm.user_id = v_user_id AND dm.deleted_at IS NULL
       WHERE wid.deleted_at IS NULL AND wid.updated_at > NOW() - INTERVAL '7 days'
      ) as recent_activity_count
  ) stats;

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION get_dossier_dashboard_summary IS
  'Returns overall dashboard statistics for the dossier-centric dashboard';

-- ============================================================================
-- get_my_dossiers_with_stats
-- Returns dossiers the user owns/contributes to with quick stats
-- ============================================================================

CREATE OR REPLACE FUNCTION get_my_dossiers_with_stats(
  p_user_id UUID DEFAULT NULL,
  p_relation_type TEXT[] DEFAULT NULL,
  p_dossier_type TEXT[] DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_has_pending_work BOOLEAN DEFAULT NULL,
  p_has_overdue BOOLEAN DEFAULT NULL,
  p_search TEXT DEFAULT NULL,
  p_sort_by TEXT DEFAULT 'last_activity',
  p_sort_order TEXT DEFAULT 'desc',
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID := COALESCE(p_user_id, auth.uid());
  v_result JSONB;
  v_dossiers JSONB;
  v_total_count INTEGER;
  v_counts_by_relation JSONB;
  v_counts_by_type JSONB;
BEGIN
  -- Get total counts by relation type
  SELECT jsonb_build_object(
    'owner', COALESCE(SUM(CASE WHEN dm.role = 'owner' THEN 1 ELSE 0 END), 0),
    'contributor', COALESCE(SUM(CASE WHEN dm.role = 'contributor' THEN 1 ELSE 0 END), 0),
    'reviewer', COALESCE(SUM(CASE WHEN dm.role = 'reviewer' THEN 1 ELSE 0 END), 0),
    'member', COALESCE(SUM(CASE WHEN dm.role = 'member' THEN 1 ELSE 0 END), 0)
  )
  INTO v_counts_by_relation
  FROM dossier_members dm
  WHERE dm.user_id = v_user_id AND dm.deleted_at IS NULL;

  -- Get counts by dossier type
  SELECT jsonb_object_agg(type, type_count)
  INTO v_counts_by_type
  FROM (
    SELECT d.type, COUNT(*) as type_count
    FROM dossier_members dm
    JOIN dossiers d ON d.id = dm.dossier_id
    WHERE dm.user_id = v_user_id AND dm.deleted_at IS NULL
      AND d.status != 'deleted'
    GROUP BY d.type
  ) type_counts;

  -- Get dossiers with stats
  WITH dossier_stats AS (
    SELECT
      dm.dossier_id,
      dm.role as relation_type,
      d.id,
      d.name_en,
      d.name_ar,
      d.type,
      d.status,
      -- Quick stats
      (SELECT COUNT(*) FROM work_item_dossiers wid
       LEFT JOIN tasks t ON wid.work_item_type = 'task' AND t.id = wid.work_item_id AND t.is_deleted = false AND t.status NOT IN ('done', 'cancelled')
       LEFT JOIN commitments c ON wid.work_item_type = 'commitment' AND c.id = wid.work_item_id AND c.status NOT IN ('completed', 'cancelled')
       LEFT JOIN intake_tickets it ON wid.work_item_type = 'intake' AND it.id = wid.work_item_id AND it.status NOT IN ('closed', 'cancelled')
       WHERE wid.dossier_id = dm.dossier_id AND wid.deleted_at IS NULL
         AND (t.id IS NOT NULL OR c.id IS NOT NULL OR it.id IS NOT NULL)
      ) as total_pending,

      (SELECT COUNT(*) FROM work_item_dossiers wid
       WHERE wid.dossier_id = dm.dossier_id AND wid.deleted_at IS NULL
         AND wid.created_at > NOW() - INTERVAL '7 days'
      ) as new_items_7d,

      (SELECT COUNT(*) FROM work_item_dossiers wid
       LEFT JOIN tasks t ON wid.work_item_type = 'task' AND t.id = wid.work_item_id AND t.is_deleted = false AND t.status NOT IN ('done', 'cancelled') AND t.due_date < CURRENT_TIMESTAMP
       LEFT JOIN commitments c ON wid.work_item_type = 'commitment' AND c.id = wid.work_item_id AND c.status NOT IN ('completed', 'cancelled') AND c.due_date < CURRENT_TIMESTAMP
       LEFT JOIN intake_tickets it ON wid.work_item_type = 'intake' AND it.id = wid.work_item_id AND it.status NOT IN ('closed', 'cancelled') AND it.sla_deadline < CURRENT_TIMESTAMP
       WHERE wid.dossier_id = dm.dossier_id AND wid.deleted_at IS NULL
         AND (t.id IS NOT NULL OR c.id IS NOT NULL OR it.id IS NOT NULL)
      ) as overdue_count,

      (SELECT COUNT(*) FROM work_item_dossiers wid
       JOIN tasks t ON wid.work_item_type = 'task' AND t.id = wid.work_item_id AND t.is_deleted = false AND t.status NOT IN ('done', 'cancelled')
       WHERE wid.dossier_id = dm.dossier_id AND wid.deleted_at IS NULL
      ) as tasks_count,

      (SELECT COUNT(*) FROM work_item_dossiers wid
       JOIN commitments c ON wid.work_item_type = 'commitment' AND c.id = wid.work_item_id AND c.status NOT IN ('completed', 'cancelled')
       WHERE wid.dossier_id = dm.dossier_id AND wid.deleted_at IS NULL
      ) as commitments_count,

      (SELECT COUNT(*) FROM work_item_dossiers wid
       JOIN intake_tickets it ON wid.work_item_type = 'intake' AND it.id = wid.work_item_id AND it.status NOT IN ('closed', 'cancelled')
       WHERE wid.dossier_id = dm.dossier_id AND wid.deleted_at IS NULL
      ) as intakes_count,

      -- Last activity timestamp
      (SELECT MAX(wid.updated_at) FROM work_item_dossiers wid
       WHERE wid.dossier_id = dm.dossier_id AND wid.deleted_at IS NULL
      ) as last_activity

    FROM dossier_members dm
    JOIN dossiers d ON d.id = dm.dossier_id
    WHERE dm.user_id = v_user_id
      AND dm.deleted_at IS NULL
      AND d.status != 'deleted'
      -- Optional filters
      AND (p_relation_type IS NULL OR dm.role = ANY(p_relation_type))
      AND (p_dossier_type IS NULL OR d.type = ANY(p_dossier_type))
      AND (p_status IS NULL OR d.status = p_status)
      AND (p_search IS NULL OR (d.name_en ILIKE '%' || p_search || '%' OR d.name_ar ILIKE '%' || p_search || '%'))
  ),
  filtered_dossiers AS (
    SELECT *
    FROM dossier_stats ds
    WHERE (p_has_pending_work IS NULL OR (p_has_pending_work = true AND ds.total_pending > 0) OR (p_has_pending_work = false AND ds.total_pending = 0))
      AND (p_has_overdue IS NULL OR (p_has_overdue = true AND ds.overdue_count > 0) OR (p_has_overdue = false AND ds.overdue_count = 0))
  )
  SELECT
    COUNT(*) OVER () as total,
    jsonb_agg(
      jsonb_build_object(
        'dossier', jsonb_build_object(
          'id', id,
          'name_en', name_en,
          'name_ar', name_ar,
          'type', type,
          'status', status
        ),
        'relation_type', relation_type,
        'stats', jsonb_build_object(
          'total_pending', total_pending,
          'new_items_7d', new_items_7d,
          'overdue_count', overdue_count,
          'tasks_count', tasks_count,
          'commitments_count', commitments_count,
          'intakes_count', intakes_count
        ),
        'last_activity', last_activity
      )
      ORDER BY
        CASE WHEN p_sort_by = 'last_activity' AND p_sort_order = 'desc' THEN last_activity END DESC NULLS LAST,
        CASE WHEN p_sort_by = 'last_activity' AND p_sort_order = 'asc' THEN last_activity END ASC NULLS LAST,
        CASE WHEN p_sort_by = 'name' AND p_sort_order = 'desc' THEN name_en END DESC,
        CASE WHEN p_sort_by = 'name' AND p_sort_order = 'asc' THEN name_en END ASC,
        CASE WHEN p_sort_by = 'pending_count' AND p_sort_order = 'desc' THEN total_pending END DESC,
        CASE WHEN p_sort_by = 'pending_count' AND p_sort_order = 'asc' THEN total_pending END ASC,
        CASE WHEN p_sort_by = 'overdue_count' AND p_sort_order = 'desc' THEN overdue_count END DESC,
        CASE WHEN p_sort_by = 'overdue_count' AND p_sort_order = 'asc' THEN overdue_count END ASC
    )
  INTO v_total_count, v_dossiers
  FROM (
    SELECT * FROM filtered_dossiers
    LIMIT p_limit OFFSET p_offset
  ) paginated;

  -- Build result
  v_result := jsonb_build_object(
    'dossiers', COALESCE(v_dossiers, '[]'::jsonb),
    'total_count', COALESCE(v_total_count, 0),
    'counts_by_relation', COALESCE(v_counts_by_relation, '{"owner":0,"contributor":0,"reviewer":0,"member":0}'::jsonb),
    'counts_by_type', COALESCE(v_counts_by_type, '{}'::jsonb)
  );

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION get_my_dossiers_with_stats IS
  'Returns dossiers the user owns/contributes to with quick statistics';

-- ============================================================================
-- get_recent_dossier_activity
-- Returns timeline of activity across user's dossiers
-- ============================================================================

CREATE OR REPLACE FUNCTION get_recent_dossier_activity(
  p_user_id UUID DEFAULT NULL,
  p_work_item_types TEXT[] DEFAULT NULL,
  p_dossier_ids UUID[] DEFAULT NULL,
  p_dossier_types TEXT[] DEFAULT NULL,
  p_overdue_only BOOLEAN DEFAULT false,
  p_since TIMESTAMPTZ DEFAULT NULL,
  p_cursor TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 20
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID := COALESCE(p_user_id, auth.uid());
  v_result JSONB;
  v_activities JSONB;
  v_next_cursor TEXT;
  v_has_more BOOLEAN;
  v_total_count INTEGER;
  v_cursor_ts TIMESTAMPTZ;
  v_cursor_id UUID;
BEGIN
  -- Parse cursor (format: timestamp::uuid)
  IF p_cursor IS NOT NULL THEN
    v_cursor_ts := SPLIT_PART(p_cursor, '::', 1)::TIMESTAMPTZ;
    v_cursor_id := SPLIT_PART(p_cursor, '::', 2)::UUID;
  END IF;

  WITH activity_items AS (
    SELECT
      wid.id as link_id,
      wid.work_item_id,
      wid.work_item_type,
      wid.dossier_id,
      wid.inheritance_source,
      GREATEST(wid.updated_at, COALESCE(t.updated_at, c.updated_at, it.updated_at)) as activity_timestamp,
      d.id as d_id,
      d.name_en as d_name_en,
      d.name_ar as d_name_ar,
      d.type as d_type,
      d.status as d_status,
      COALESCE(t.title, c.title, it.title) as item_title,
      CASE wid.work_item_type
        WHEN 'task' THEN t.status::TEXT
        WHEN 'commitment' THEN c.status::TEXT
        WHEN 'intake' THEN it.status::TEXT
      END as item_status,
      CASE wid.work_item_type
        WHEN 'task' THEN t.priority::TEXT
        WHEN 'commitment' THEN c.priority::TEXT
        WHEN 'intake' THEN it.priority::TEXT
      END as item_priority,
      CASE wid.work_item_type
        WHEN 'task' THEN t.due_date
        WHEN 'commitment' THEN c.due_date
        WHEN 'intake' THEN it.sla_deadline
      END as item_deadline,
      CASE
        WHEN wid.work_item_type = 'task' AND t.due_date < CURRENT_TIMESTAMP AND t.status NOT IN ('done', 'cancelled') THEN true
        WHEN wid.work_item_type = 'commitment' AND c.due_date < CURRENT_TIMESTAMP AND c.status NOT IN ('completed', 'cancelled') THEN true
        WHEN wid.work_item_type = 'intake' AND it.sla_deadline < CURRENT_TIMESTAMP AND it.status NOT IN ('closed', 'cancelled') THEN true
        ELSE false
      END as is_overdue,
      COALESCE(t.created_at, c.created_at, it.created_at) as created_at,
      COALESCE(t.updated_at, c.updated_at, it.updated_at) as updated_at,
      -- Determine action type
      CASE
        WHEN COALESCE(t.status, c.status::TEXT, it.status) IN ('done', 'completed', 'closed') THEN 'completed'
        WHEN wid.work_item_type = 'task' AND t.due_date < CURRENT_TIMESTAMP AND t.status NOT IN ('done', 'cancelled') THEN 'overdue'
        WHEN wid.work_item_type = 'commitment' AND c.due_date < CURRENT_TIMESTAMP AND c.status NOT IN ('completed', 'cancelled') THEN 'overdue'
        WHEN wid.work_item_type = 'intake' AND it.sla_deadline < CURRENT_TIMESTAMP AND it.status NOT IN ('closed', 'cancelled') THEN 'overdue'
        WHEN wid.created_at > NOW() - INTERVAL '1 day' THEN 'created'
        ELSE 'updated'
      END as action_type
    FROM work_item_dossiers wid
    JOIN dossier_members dm ON dm.dossier_id = wid.dossier_id AND dm.user_id = v_user_id AND dm.deleted_at IS NULL
    JOIN dossiers d ON d.id = wid.dossier_id AND d.status != 'deleted'
    LEFT JOIN tasks t ON wid.work_item_type = 'task' AND t.id = wid.work_item_id AND t.is_deleted = false
    LEFT JOIN commitments c ON wid.work_item_type = 'commitment' AND c.id = wid.work_item_id
    LEFT JOIN intake_tickets it ON wid.work_item_type = 'intake' AND it.id = wid.work_item_id
    WHERE wid.deleted_at IS NULL
      AND (t.id IS NOT NULL OR c.id IS NOT NULL OR it.id IS NOT NULL)
      -- Optional filters
      AND (p_work_item_types IS NULL OR wid.work_item_type = ANY(p_work_item_types))
      AND (p_dossier_ids IS NULL OR wid.dossier_id = ANY(p_dossier_ids))
      AND (p_dossier_types IS NULL OR d.type = ANY(p_dossier_types))
      AND (p_since IS NULL OR wid.updated_at > p_since)
      -- Cursor pagination
      AND (
        v_cursor_ts IS NULL
        OR (wid.updated_at, wid.id) < (v_cursor_ts, v_cursor_id)
      )
  ),
  filtered_activities AS (
    SELECT *
    FROM activity_items
    WHERE (p_overdue_only = false OR is_overdue = true)
    ORDER BY activity_timestamp DESC, link_id DESC
    LIMIT p_limit + 1
  )
  SELECT
    jsonb_agg(
      jsonb_build_object(
        'id', work_item_id,
        'title', item_title,
        'work_item_type', work_item_type,
        'status', item_status,
        'priority', item_priority,
        'deadline', item_deadline,
        'is_overdue', is_overdue,
        'created_at', created_at,
        'updated_at', updated_at,
        'action_type', action_type,
        'inheritance_source', inheritance_source,
        'dossier', jsonb_build_object(
          'id', d_id,
          'name_en', d_name_en,
          'name_ar', d_name_ar,
          'type', d_type,
          'status', d_status
        )
      )
    ),
    COUNT(*) > p_limit
  INTO v_activities, v_has_more
  FROM (
    SELECT * FROM filtered_activities LIMIT p_limit
  ) limited;

  -- Get total count
  SELECT COUNT(*)
  INTO v_total_count
  FROM work_item_dossiers wid
  JOIN dossier_members dm ON dm.dossier_id = wid.dossier_id AND dm.user_id = v_user_id AND dm.deleted_at IS NULL
  WHERE wid.deleted_at IS NULL;

  -- Get next cursor if there are more results
  IF v_has_more AND v_activities IS NOT NULL AND jsonb_array_length(v_activities) > 0 THEN
    SELECT
      (v_activities->-1->>'updated_at') || '::' || (v_activities->-1->>'id')
    INTO v_next_cursor;
  END IF;

  -- Build result
  v_result := jsonb_build_object(
    'activities', COALESCE(v_activities, '[]'::jsonb),
    'next_cursor', v_next_cursor,
    'has_more', COALESCE(v_has_more, false),
    'total_count', COALESCE(v_total_count, 0)
  );

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION get_recent_dossier_activity IS
  'Returns timeline of recent activity across user dossiers with cursor pagination';

-- ============================================================================
-- get_pending_work_by_dossier
-- Returns pending work grouped by dossier
-- ============================================================================

CREATE OR REPLACE FUNCTION get_pending_work_by_dossier(
  p_user_id UUID DEFAULT NULL,
  p_dossier_types TEXT[] DEFAULT NULL,
  p_work_sources TEXT[] DEFAULT NULL,
  p_tracking_types TEXT[] DEFAULT NULL,
  p_overdue_only BOOLEAN DEFAULT false,
  p_sort_by TEXT DEFAULT 'overdue_count',
  p_sort_order TEXT DEFAULT 'desc',
  p_limit INTEGER DEFAULT 10
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID := COALESCE(p_user_id, auth.uid());
  v_result JSONB;
  v_items JSONB;
  v_total_pending INTEGER := 0;
  v_dossiers_with_overdue INTEGER := 0;
  v_total_overdue INTEGER := 0;
BEGIN
  WITH dossier_work AS (
    SELECT
      d.id as dossier_id,
      d.name_en,
      d.name_ar,
      d.type,
      d.status,
      -- Summary stats
      COUNT(*) FILTER (WHERE t.id IS NOT NULL OR c.id IS NOT NULL OR it.id IS NOT NULL) as total_pending,
      COUNT(*) FILTER (WHERE
        (t.id IS NOT NULL AND t.due_date < CURRENT_TIMESTAMP) OR
        (c.id IS NOT NULL AND c.due_date < CURRENT_TIMESTAMP) OR
        (it.id IS NOT NULL AND it.sla_deadline < CURRENT_TIMESTAMP)
      ) as overdue_count,
      COUNT(*) FILTER (WHERE
        (t.id IS NOT NULL AND t.due_date::date = CURRENT_DATE) OR
        (c.id IS NOT NULL AND c.due_date::date = CURRENT_DATE) OR
        (it.id IS NOT NULL AND it.sla_deadline::date = CURRENT_DATE)
      ) as due_today_count,
      COUNT(*) FILTER (WHERE wid.work_item_type = 'task' AND t.id IS NOT NULL) as tasks_count,
      COUNT(*) FILTER (WHERE wid.work_item_type = 'commitment' AND c.id IS NOT NULL) as commitments_count,
      COUNT(*) FILTER (WHERE wid.work_item_type = 'intake' AND it.id IS NOT NULL) as intakes_count
    FROM dossier_members dm
    JOIN dossiers d ON d.id = dm.dossier_id AND d.status != 'deleted'
    JOIN work_item_dossiers wid ON wid.dossier_id = d.id AND wid.deleted_at IS NULL
    LEFT JOIN tasks t ON wid.work_item_type = 'task' AND t.id = wid.work_item_id AND t.is_deleted = false AND t.status NOT IN ('done', 'cancelled')
    LEFT JOIN commitments c ON wid.work_item_type = 'commitment' AND c.id = wid.work_item_id AND c.status NOT IN ('completed', 'cancelled')
    LEFT JOIN intake_tickets it ON wid.work_item_type = 'intake' AND it.id = wid.work_item_id AND it.status NOT IN ('closed', 'cancelled')
    WHERE dm.user_id = v_user_id
      AND dm.deleted_at IS NULL
      AND (t.id IS NOT NULL OR c.id IS NOT NULL OR it.id IS NOT NULL)
      -- Optional filters
      AND (p_dossier_types IS NULL OR d.type = ANY(p_dossier_types))
      AND (p_work_sources IS NULL OR wid.work_item_type = ANY(p_work_sources))
    GROUP BY d.id, d.name_en, d.name_ar, d.type, d.status
    HAVING COUNT(*) FILTER (WHERE t.id IS NOT NULL OR c.id IS NOT NULL OR it.id IS NOT NULL) > 0
  ),
  filtered_dossiers AS (
    SELECT *
    FROM dossier_work
    WHERE (p_overdue_only = false OR overdue_count > 0)
    ORDER BY
      CASE WHEN p_sort_by = 'overdue_count' AND p_sort_order = 'desc' THEN overdue_count END DESC,
      CASE WHEN p_sort_by = 'overdue_count' AND p_sort_order = 'asc' THEN overdue_count END ASC,
      CASE WHEN p_sort_by = 'pending_count' AND p_sort_order = 'desc' THEN total_pending END DESC,
      CASE WHEN p_sort_by = 'pending_count' AND p_sort_order = 'asc' THEN total_pending END ASC,
      CASE WHEN p_sort_by = 'name' AND p_sort_order = 'desc' THEN name_en END DESC,
      CASE WHEN p_sort_by = 'name' AND p_sort_order = 'asc' THEN name_en END ASC
    LIMIT p_limit
  ),
  dossier_with_urgent AS (
    SELECT
      fd.*,
      -- Get top 3 urgent items for this dossier
      (
        SELECT jsonb_agg(urgent_item)
        FROM (
          SELECT jsonb_build_object(
            'id', wid.work_item_id,
            'title', COALESCE(t.title, c.title, it.title),
            'work_item_type', wid.work_item_type,
            'status', COALESCE(t.status::TEXT, c.status::TEXT, it.status),
            'priority', COALESCE(t.priority::TEXT, c.priority::TEXT, it.priority::TEXT),
            'deadline', COALESCE(t.due_date, c.due_date, it.sla_deadline),
            'is_overdue', CASE
              WHEN t.id IS NOT NULL AND t.due_date < CURRENT_TIMESTAMP THEN true
              WHEN c.id IS NOT NULL AND c.due_date < CURRENT_TIMESTAMP THEN true
              WHEN it.id IS NOT NULL AND it.sla_deadline < CURRENT_TIMESTAMP THEN true
              ELSE false
            END
          ) as urgent_item
          FROM work_item_dossiers wid
          LEFT JOIN tasks t ON wid.work_item_type = 'task' AND t.id = wid.work_item_id AND t.is_deleted = false AND t.status NOT IN ('done', 'cancelled')
          LEFT JOIN commitments c ON wid.work_item_type = 'commitment' AND c.id = wid.work_item_id AND c.status NOT IN ('completed', 'cancelled')
          LEFT JOIN intake_tickets it ON wid.work_item_type = 'intake' AND it.id = wid.work_item_id AND it.status NOT IN ('closed', 'cancelled')
          WHERE wid.dossier_id = fd.dossier_id
            AND wid.deleted_at IS NULL
            AND (t.id IS NOT NULL OR c.id IS NOT NULL OR it.id IS NOT NULL)
          ORDER BY
            -- Overdue first, then by deadline
            CASE
              WHEN t.id IS NOT NULL AND t.due_date < CURRENT_TIMESTAMP THEN 0
              WHEN c.id IS NOT NULL AND c.due_date < CURRENT_TIMESTAMP THEN 0
              WHEN it.id IS NOT NULL AND it.sla_deadline < CURRENT_TIMESTAMP THEN 0
              ELSE 1
            END,
            COALESCE(t.due_date, c.due_date, it.sla_deadline) ASC NULLS LAST
          LIMIT 3
        ) urgent_items
      ) as urgent_items
    FROM filtered_dossiers fd
  )
  SELECT
    jsonb_agg(
      jsonb_build_object(
        'dossier', jsonb_build_object(
          'id', dossier_id,
          'name_en', name_en,
          'name_ar', name_ar,
          'type', type,
          'status', status
        ),
        'summary', jsonb_build_object(
          'total_pending', total_pending,
          'overdue_count', overdue_count,
          'due_today_count', due_today_count,
          'by_source', jsonb_build_object(
            'tasks', tasks_count,
            'commitments', commitments_count,
            'intakes', intakes_count
          )
        ),
        'urgent_items', COALESCE(urgent_items, '[]'::jsonb)
      )
    ),
    SUM(total_pending),
    COUNT(*) FILTER (WHERE overdue_count > 0),
    SUM(overdue_count)
  INTO v_items, v_total_pending, v_dossiers_with_overdue, v_total_overdue
  FROM dossier_with_urgent;

  -- Build result
  v_result := jsonb_build_object(
    'items', COALESCE(v_items, '[]'::jsonb),
    'total_pending', COALESCE(v_total_pending, 0),
    'dossiers_with_overdue', COALESCE(v_dossiers_with_overdue, 0),
    'total_overdue', COALESCE(v_total_overdue, 0)
  );

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION get_pending_work_by_dossier IS
  'Returns pending work items grouped by dossier with summary stats and urgent items';

-- ============================================================================
-- Grant permissions
-- ============================================================================

GRANT EXECUTE ON FUNCTION get_dossier_dashboard_summary TO authenticated;
GRANT EXECUTE ON FUNCTION get_my_dossiers_with_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_recent_dossier_activity TO authenticated;
GRANT EXECUTE ON FUNCTION get_pending_work_by_dossier TO authenticated;
