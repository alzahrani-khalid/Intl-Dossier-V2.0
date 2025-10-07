-- Migration: Create assignment_events table
-- Feature: 014-full-assignment-detail
-- Task: T008

-- Create enum for event types
CREATE TYPE assignment_event_type AS ENUM (
  'created',
  'status_changed',
  'escalated',
  'completed',
  'commented',
  'checklist_updated',
  'observer_added',
  'reassigned',
  'workflow_stage_changed'
);

CREATE TABLE IF NOT EXISTS assignment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  event_type assignment_event_type NOT NULL,
  actor_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  event_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_events_assignment
ON assignment_events(assignment_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_events_type
ON assignment_events(event_type);

-- Enable RLS
ALTER TABLE assignment_events ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users with view permission can read events
CREATE POLICY events_select ON assignment_events
FOR SELECT
USING (
  assignment_id IN (
    SELECT id FROM assignments WHERE
      assignee_id = auth.uid() OR
      id IN (SELECT assignment_id FROM assignment_observers WHERE user_id = auth.uid())
  )
);

-- RLS Policy: Events can be inserted by authenticated users (typically via Edge Functions)
CREATE POLICY events_insert ON assignment_events
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND
  assignment_id IN (
    SELECT id FROM assignments WHERE
      assignee_id = auth.uid() OR
      id IN (SELECT assignment_id FROM assignment_observers WHERE user_id = auth.uid())
  )
);

-- Comment on table
COMMENT ON TABLE assignment_events IS
  'Audit trail and timeline of all actions taken on assignments';

-- Comment on column
COMMENT ON COLUMN assignment_events.event_data IS
  'JSONB containing event-specific details (e.g., old/new status, escalation reason, etc.)';
