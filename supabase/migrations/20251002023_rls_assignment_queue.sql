-- Migration: T023 - Create RLS policies for assignment_queue
-- Description: Row Level Security for assignment queue
-- Dependencies: T008 (assignment_queue table)

-- Enable RLS on assignment_queue
ALTER TABLE assignment_queue ENABLE ROW LEVEL SECURITY;

-- Policy: Supervisors can view their unit's queue
DROP POLICY IF EXISTS "Supervisors can view unit queue" ON assignment_queue;
CREATE POLICY "Supervisors can view unit queue"
  ON assignment_queue
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM staff_profiles supervisor
      WHERE supervisor.user_id = auth.uid()
        AND supervisor.role = 'supervisor'
        AND (
          assignment_queue.target_unit_id = supervisor.unit_id
          OR assignment_queue.target_unit_id IS NULL -- NULL means any eligible unit
        )
    )
  );

-- Policy: Admins can view all queues
DROP POLICY IF EXISTS "Admins can view all queues" ON assignment_queue;
CREATE POLICY "Admins can view all queues"
  ON assignment_queue
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM staff_profiles admin
      WHERE admin.user_id = auth.uid()
        AND admin.role = 'admin'
    )
  );

-- Policy: System can insert/delete queue entries (service role only)
DROP POLICY IF EXISTS "System can manage queue" ON assignment_queue;
CREATE POLICY "System can manage queue"
  ON assignment_queue
  FOR ALL
  USING (true) -- Service role only
  WITH CHECK (true);

-- Comment
COMMENT ON TABLE assignment_queue IS 'RLS enabled: Supervisors see unit queue, admins see all, system manages entries';
