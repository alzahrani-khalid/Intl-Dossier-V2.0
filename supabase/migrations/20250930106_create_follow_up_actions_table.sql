-- Migration: Create follow_up_actions table
-- Feature: 010-after-action-notes
-- Task: T007

CREATE TABLE IF NOT EXISTS follow_up_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  after_action_id UUID NOT NULL REFERENCES after_action_records(id) ON DELETE CASCADE,
  description TEXT NOT NULL CHECK (char_length(description) BETWEEN 1 AND 2000),
  assigned_to TEXT CHECK (char_length(assigned_to) <= 200),
  target_date DATE,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_follow_ups_after_action ON follow_up_actions(after_action_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_completed ON follow_up_actions(completed);

-- Update timestamp trigger
CREATE TRIGGER update_follow_up_actions_updated_at
  BEFORE UPDATE ON follow_up_actions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
