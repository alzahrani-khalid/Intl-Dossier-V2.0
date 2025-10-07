-- Migration: T009 - Create escalation_events table
-- Description: Immutable audit trail of SLA breaches and escalations
-- Dependencies: T007 (assignments)

-- Create escalation_events table
CREATE TABLE IF NOT EXISTS escalation_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  escalated_from_id UUID NOT NULL REFERENCES auth.users(id),
  escalated_to_id UUID NOT NULL REFERENCES auth.users(id),
  reason escalation_reason NOT NULL,
  escalated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  acknowledged_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Constraints
  CHECK (acknowledged_at IS NULL OR acknowledged_at >= escalated_at),
  CHECK (resolved_at IS NULL OR resolved_at >= escalated_at)
);

-- Indexes
CREATE INDEX idx_escalation_assignment ON escalation_events(assignment_id);
CREATE INDEX idx_escalation_recipient ON escalation_events(escalated_to_id);
CREATE INDEX idx_escalation_date ON escalation_events(escalated_at DESC);
CREATE INDEX idx_escalation_reason ON escalation_events(reason);

-- Index for cleanup job (T019a)
CREATE INDEX idx_escalation_cleanup ON escalation_events(resolved_at, reason)
  WHERE resolved_at IS NOT NULL;

-- Comments
COMMENT ON TABLE escalation_events IS 'Immutable audit trail of escalations (never DELETE, UPDATE only for acknowledgment/resolution)';
COMMENT ON COLUMN escalation_events.reason IS 'sla_breach: Automatic escalation at 100%, manual: User-triggered, capacity_exhaustion: No staff available';
