-- Migration: Create database functions for assignment detail
-- Feature: 014-full-assignment-detail
-- Task: T010

-- Function: Calculate checklist progress percentage
CREATE OR REPLACE FUNCTION get_assignment_progress(p_assignment_id UUID)
RETURNS INTEGER
LANGUAGE SQL
STABLE
AS $$
  SELECT CASE
    WHEN COUNT(*) = 0 THEN 0
    ELSE ROUND((COUNT(*) FILTER (WHERE completed = TRUE)::DECIMAL / COUNT(*)::DECIMAL) * 100)
  END::INTEGER
  FROM assignment_checklist_items
  WHERE assignment_id = p_assignment_id;
$$;

COMMENT ON FUNCTION get_assignment_progress IS
  'Calculate checklist completion percentage for an assignment';

-- Function: Calculate engagement progress across all assignments
CREATE OR REPLACE FUNCTION get_engagement_progress(p_engagement_id UUID)
RETURNS TABLE(
  total_assignments INTEGER,
  completed_assignments INTEGER,
  in_progress_assignments INTEGER,
  todo_assignments INTEGER,
  progress_percentage INTEGER,
  kanban_stats JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER as total_assignments,
    COUNT(*) FILTER (WHERE workflow_stage = 'done')::INTEGER as completed_assignments,
    COUNT(*) FILTER (WHERE workflow_stage = 'in_progress')::INTEGER as in_progress_assignments,
    COUNT(*) FILTER (WHERE workflow_stage = 'todo')::INTEGER as todo_assignments,
    ROUND((COUNT(*) FILTER (WHERE workflow_stage = 'done')::DECIMAL / NULLIF(COUNT(*), 0)::DECIMAL) * 100)::INTEGER as progress_percentage,
    jsonb_build_object(
      'todo', COUNT(*) FILTER (WHERE workflow_stage = 'todo'),
      'in_progress', COUNT(*) FILTER (WHERE workflow_stage = 'in_progress'),
      'review', COUNT(*) FILTER (WHERE workflow_stage = 'review'),
      'done', COUNT(*) FILTER (WHERE workflow_stage = 'done')
    ) as kanban_stats
  FROM assignments
  WHERE engagement_id = p_engagement_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_engagement_progress IS
  'Calculate engagement progress statistics including kanban column counts';

-- Function: Get reaction summary for a comment
CREATE OR REPLACE FUNCTION get_comment_reactions(p_comment_id UUID)
RETURNS TABLE(emoji TEXT, count BIGINT, users TEXT[])
LANGUAGE SQL
STABLE
AS $$
  SELECT
    r.emoji,
    COUNT(*) as count,
    ARRAY_AGG(
      COALESCE(up.full_name, u.email)
      ORDER BY r.created_at
    ) as users
  FROM comment_reactions r
  JOIN auth.users u ON u.id = r.user_id
  LEFT JOIN user_profiles up ON up.user_id = r.user_id
  WHERE r.comment_id = p_comment_id
  GROUP BY r.emoji
  ORDER BY count DESC;
$$;

COMMENT ON FUNCTION get_comment_reactions IS
  'Get aggregated reaction counts and user names for a comment';

-- Function: Get sibling assignments (same engagement or dossier)
CREATE OR REPLACE FUNCTION get_sibling_assignments(
  p_assignment_id UUID,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE(
  id UUID,
  work_item_type TEXT,
  work_item_id UUID,
  title TEXT,
  assignee_id UUID,
  status TEXT,
  workflow_stage engagement_workflow_stage,
  priority TEXT,
  created_at TIMESTAMPTZ
) AS $$
DECLARE
  v_engagement_id UUID;
  v_work_item_id UUID;
  v_work_item_type TEXT;
BEGIN
  -- Get engagement_id and work_item details from the assignment
  SELECT a.engagement_id, a.work_item_id, a.work_item_type
  INTO v_engagement_id, v_work_item_id, v_work_item_type
  FROM assignments a
  WHERE a.id = p_assignment_id;

  -- Return sibling assignments
  RETURN QUERY
  SELECT
    a.id,
    a.work_item_type,
    a.work_item_id,
    COALESCE(d.title_en, t.title, 'Untitled') as title,
    a.assignee_id,
    a.status,
    a.workflow_stage,
    a.priority,
    a.created_at
  FROM assignments a
  LEFT JOIN dossiers d ON a.work_item_type = 'dossier' AND a.work_item_id = d.id
  LEFT JOIN intake_tickets t ON a.work_item_type = 'ticket' AND a.work_item_id::TEXT = t.id::TEXT
  WHERE
    a.id != p_assignment_id AND
    (
      -- Same engagement (if engagement-linked)
      (v_engagement_id IS NOT NULL AND a.engagement_id = v_engagement_id) OR
      -- Same work item (if standalone)
      (v_engagement_id IS NULL AND a.work_item_id = v_work_item_id AND a.work_item_type = v_work_item_type)
    )
  ORDER BY a.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_sibling_assignments IS
  'Get related assignments (siblings) by engagement or work item';
