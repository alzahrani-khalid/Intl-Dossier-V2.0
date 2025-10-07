-- T066: Supabase Realtime RLS Policies
-- Enable realtime for assignments, assignment_queue, escalation_events tables
-- Users can listen to own assignments
-- Supervisors can listen to their unit's assignments and queue

-- Enable Realtime for relevant tables
ALTER PUBLICATION supabase_realtime ADD TABLE assignments;
ALTER PUBLICATION supabase_realtime ADD TABLE assignment_queue;
ALTER PUBLICATION supabase_realtime ADD TABLE escalation_events;

-- Enable RLS on the tables (if not already enabled)
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE escalation_events ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- REALTIME POLICIES FOR ASSIGNMENTS
-- ============================================================================

-- Policy: Users can listen to their own assignments
CREATE POLICY "realtime_select_own_assignments"
ON assignments
FOR SELECT
USING (
  auth.uid() = assignee_id
);

-- Policy: Supervisors can listen to their unit's assignments
CREATE POLICY "realtime_select_unit_assignments"
ON assignments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM staff_profiles sp
    WHERE sp.user_id = auth.uid()
      AND sp.role IN ('supervisor', 'admin')
      AND sp.unit_id = (
        SELECT unit_id FROM staff_profiles
        WHERE user_id = assignments.assignee_id
      )
  )
);

-- Policy: Admins can listen to all assignments
CREATE POLICY "realtime_select_all_assignments_admin"
ON assignments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM staff_profiles
    WHERE user_id = auth.uid()
      AND role = 'admin'
  )
);

-- ============================================================================
-- REALTIME POLICIES FOR ASSIGNMENT QUEUE
-- ============================================================================

-- Policy: Supervisors can listen to their unit's queue
CREATE POLICY "realtime_select_unit_queue"
ON assignment_queue
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM staff_profiles sp
    WHERE sp.user_id = auth.uid()
      AND sp.role IN ('supervisor', 'admin')
      AND (
        sp.unit_id = assignment_queue.target_unit_id
        OR assignment_queue.target_unit_id IS NULL
      )
  )
);

-- Policy: Admins can listen to all queue entries
CREATE POLICY "realtime_select_all_queue_admin"
ON assignment_queue
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM staff_profiles
    WHERE user_id = auth.uid()
      AND role = 'admin'
  )
);

-- ============================================================================
-- REALTIME POLICIES FOR ESCALATION EVENTS
-- ============================================================================

-- Policy: Users can listen to escalations they're involved in
CREATE POLICY "realtime_select_own_escalations"
ON escalation_events
FOR SELECT
USING (
  auth.uid() = escalated_from_id
  OR auth.uid() = escalated_to_id
);

-- Policy: Supervisors can listen to their unit's escalations
CREATE POLICY "realtime_select_unit_escalations"
ON escalation_events
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM staff_profiles sp
    WHERE sp.user_id = auth.uid()
      AND sp.role IN ('supervisor', 'admin')
      AND (
        sp.unit_id = (SELECT unit_id FROM staff_profiles WHERE user_id = escalation_events.escalated_from_id)
        OR sp.unit_id = (SELECT unit_id FROM staff_profiles WHERE user_id = escalation_events.escalated_to_id)
      )
  )
);

-- Policy: Admins can listen to all escalation events
CREATE POLICY "realtime_select_all_escalations_admin"
ON escalation_events
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM staff_profiles
    WHERE user_id = auth.uid()
      AND role = 'admin'
  )
);

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON POLICY "realtime_select_own_assignments" ON assignments IS
'Users receive real-time updates for assignments where they are the assignee';

COMMENT ON POLICY "realtime_select_unit_assignments" ON assignments IS
'Supervisors receive real-time updates for all assignments in their unit';

COMMENT ON POLICY "realtime_select_all_assignments_admin" ON assignments IS
'Admins receive real-time updates for all assignments system-wide';

COMMENT ON POLICY "realtime_select_unit_queue" ON assignment_queue IS
'Supervisors receive real-time updates for queue items targeting their unit';

COMMENT ON POLICY "realtime_select_all_queue_admin" ON assignment_queue IS
'Admins receive real-time updates for all queue items system-wide';

COMMENT ON POLICY "realtime_select_own_escalations" ON escalation_events IS
'Users receive real-time updates for escalations they initiated or received';

COMMENT ON POLICY "realtime_select_unit_escalations" ON escalation_events IS
'Supervisors receive real-time updates for escalations involving their unit members';

COMMENT ON POLICY "realtime_select_all_escalations_admin" ON escalation_events IS
'Admins receive real-time updates for all escalation events system-wide';
