-- Create assignment_stage_history table for dual SLA tracking
-- This table tracks every workflow stage transition

CREATE TABLE assignment_stage_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  from_stage workflow_stage_enum NOT NULL,
  to_stage workflow_stage_enum NOT NULL,
  transitioned_by uuid NOT NULL REFERENCES staff_profiles(id),
  transitioned_at timestamptz NOT NULL DEFAULT now(),
  stage_duration_seconds int,
  stage_sla_met boolean
);

-- Create indexes for efficient queries
CREATE INDEX idx_stage_history_assignment ON assignment_stage_history(assignment_id);
CREATE INDEX idx_stage_history_transitioned_at ON assignment_stage_history(transitioned_at);
CREATE INDEX idx_stage_history_assignment_time ON assignment_stage_history(assignment_id, transitioned_at DESC);

-- Create trigger function to calculate stage duration and SLA status
CREATE OR REPLACE FUNCTION calculate_stage_duration()
RETURNS TRIGGER AS $$
BEGIN
  -- Find previous transition to this stage
  SELECT EXTRACT(EPOCH FROM (NEW.transitioned_at - prev.transitioned_at))::int
  INTO NEW.stage_duration_seconds
  FROM assignment_stage_history prev
  WHERE prev.assignment_id = NEW.assignment_id
    AND prev.to_stage = NEW.from_stage
  ORDER BY prev.transitioned_at DESC
  LIMIT 1;

  -- If no previous transition, duration = time since assignment creation
  IF NEW.stage_duration_seconds IS NULL THEN
    SELECT EXTRACT(EPOCH FROM (NEW.transitioned_at - a.created_at))::int
    INTO NEW.stage_duration_seconds
    FROM assignments a
    WHERE a.id = NEW.assignment_id;
  END IF;

  -- Check if stage SLA was met
  SELECT (NEW.transitioned_at <= a.current_stage_sla_deadline)
  INTO NEW.stage_sla_met
  FROM assignments a
  WHERE a.id = NEW.assignment_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER calculate_stage_duration_trigger
BEFORE INSERT ON assignment_stage_history
FOR EACH ROW
EXECUTE FUNCTION calculate_stage_duration();

-- Enable Row Level Security
ALTER TABLE assignment_stage_history ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view stage history for accessible assignments
CREATE POLICY "Users can view stage history for accessible assignments"
ON assignment_stage_history FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM assignments a
    WHERE a.id = assignment_stage_history.assignment_id
  )
);

-- RLS Policy: Only Edge Functions (service_role) can insert stage history
CREATE POLICY "Only Edge Functions can insert stage history"
ON assignment_stage_history FOR INSERT
WITH CHECK (auth.jwt() ->> 'role' = 'service_role');
