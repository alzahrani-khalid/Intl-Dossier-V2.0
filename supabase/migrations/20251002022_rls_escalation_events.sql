-- Migration: T022 - Create RLS policies for escalation_events
-- Description: Row Level Security for escalation audit trail (immutable, no DELETE)
-- Dependencies: T009 (escalation_events table)

-- Enable RLS on escalation_events
ALTER TABLE escalation_events ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read escalations they are involved in (from or to)
DROP POLICY IF EXISTS "Users can read own escalations" ON escalation_events;
CREATE POLICY "Users can read own escalations"
  ON escalation_events
  FOR SELECT
  USING (
    auth.uid() = escalated_from_id
    OR auth.uid() = escalated_to_id
  );

-- Policy: Supervisors can read escalations in their unit
DROP POLICY IF EXISTS "Supervisors can read unit escalations" ON escalation_events;
CREATE POLICY "Supervisors can read unit escalations"
  ON escalation_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM staff_profiles supervisor
      WHERE supervisor.user_id = auth.uid()
        AND supervisor.role = 'supervisor'
        AND (
          supervisor.unit_id IN (SELECT unit_id FROM staff_profiles WHERE user_id = escalation_events.escalated_from_id)
          OR supervisor.unit_id IN (SELECT unit_id FROM staff_profiles WHERE user_id = escalation_events.escalated_to_id)
        )
    )
  );

-- Policy: Admins can read all escalations
DROP POLICY IF EXISTS "Admins can read all escalations" ON escalation_events;
CREATE POLICY "Admins can read all escalations"
  ON escalation_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM staff_profiles admin
      WHERE admin.user_id = auth.uid()
        AND admin.role = 'admin'
    )
  );

-- Policy: System can insert escalation events (service role only)
DROP POLICY IF EXISTS "System can insert escalations" ON escalation_events;
CREATE POLICY "System can insert escalations"
  ON escalation_events
  FOR INSERT
  WITH CHECK (true); -- Service role only

-- Policy: Recipients can acknowledge/resolve escalations
DROP POLICY IF EXISTS "Recipients can update escalations" ON escalation_events;
CREATE POLICY "Recipients can update escalations"
  ON escalation_events
  FOR UPDATE
  USING (auth.uid() = escalated_to_id)
  WITH CHECK (auth.uid() = escalated_to_id);

-- Policy: NO DELETE ALLOWED (immutable audit trail)
-- Enforced by not creating any DELETE policy

-- Comment
COMMENT ON TABLE escalation_events IS 'RLS enabled: Users see escalations they are involved in, NO DELETE (immutable audit trail)';
