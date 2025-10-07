-- Migration: T008 - Create assignment_queue table
-- Description: Priority queue for work items awaiting staff capacity
-- Dependencies: T001 (enums)

-- Create assignment_queue table
CREATE TABLE IF NOT EXISTS assignment_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_item_id UUID NOT NULL,
  work_item_type work_item_type NOT NULL,
  required_skills UUID[] NOT NULL,
  target_unit_id UUID REFERENCES organizational_units(id),
  priority priority_level NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0 AND attempts < 10),
  last_attempt_at TIMESTAMPTZ,
  notes TEXT,

  -- Prevent duplicate queue entries
  CONSTRAINT unique_queued_item UNIQUE (work_item_id, work_item_type)
);

-- Indexes
CREATE INDEX idx_queue_priority_created ON assignment_queue(priority DESC, created_at ASC);
CREATE INDEX idx_queue_skills ON assignment_queue USING GIN(required_skills);
CREATE INDEX idx_queue_attempts ON assignment_queue(attempts);

-- Comments
COMMENT ON TABLE assignment_queue IS 'Priority queue for work items waiting for staff capacity (FIFO within priority)';
COMMENT ON COLUMN assignment_queue.attempts IS 'Number of failed assignment attempts (max 10 before flagging for manual review)';
COMMENT ON COLUMN assignment_queue.notes IS 'Reason for queueing (e.g., "All staff at WIP limit")';
