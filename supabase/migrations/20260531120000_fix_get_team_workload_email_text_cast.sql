-- Fix get_team_workload 42804: auth.users.email is character varying(255) but the
-- function's RETURNS TABLE declares user_email as text. The bare `u.email` select
-- therefore failed at RETURN QUERY with:
--   42804: structure of query does not match function result type
--   DETAIL: Returned type character varying(255) does not match expected type text
--           in column 2.
-- This 500'd GET /functions/v1/unified-work-list?endpoint=team (the team-workload
-- widget) for team-manager users; sibling endpoints (summary/list) were unaffected.
-- Fix: cast u.email::text to match the declared return type. All other logic is
-- preserved byte-for-byte.

CREATE OR REPLACE FUNCTION public.get_team_workload(requesting_user_id uuid DEFAULT auth.uid())
 RETURNS TABLE(user_id uuid, user_email text, total_active bigint, overdue_count bigint, due_this_week bigint, high_priority_count bigint, commitment_count bigint, task_count bigint, intake_count bigint, on_time_rate_30d numeric, completed_count_30d bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  team_ids uuid[];
BEGIN
  -- Authorization check
  IF NOT is_team_manager(requesting_user_id) THEN
    RAISE EXCEPTION 'Unauthorized: User is not a team manager';
  END IF;

  -- Get team member IDs
  team_ids := get_team_member_ids(requesting_user_id);

  IF array_length(team_ids, 1) IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    ws.user_id,
    u.email::text AS user_email,
    ws.total_active,
    ws.overdue_count,
    ws.due_this_week,
    ws.high_priority_count,
    ws.commitment_count,
    ws.task_count,
    ws.intake_count,
    COALESCE(pm.on_time_rate_30d, 0) AS on_time_rate_30d,
    COALESCE(pm.completed_count_30d, 0) AS completed_count_30d
  FROM user_work_summary ws
  JOIN auth.users u ON ws.user_id = u.id
  LEFT JOIN user_productivity_metrics pm ON ws.user_id = pm.user_id
  WHERE ws.user_id = ANY(team_ids)
  ORDER BY ws.overdue_count DESC, ws.total_active DESC;
END;
$function$;
