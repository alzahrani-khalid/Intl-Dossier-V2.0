-- Migration: Create decisions table
-- Feature: 010-after-action-notes
-- Task: T004

CREATE TABLE IF NOT EXISTS decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  after_action_id UUID NOT NULL REFERENCES after_action_records(id) ON DELETE CASCADE,
  description TEXT NOT NULL CHECK (char_length(description) BETWEEN 1 AND 2000),
  rationale TEXT,
  decision_maker TEXT NOT NULL CHECK (char_length(decision_maker) BETWEEN 1 AND 200),
  decision_date TIMESTAMPTZ NOT NULL,
  ai_confidence NUMERIC(3,2) CHECK (ai_confidence BETWEEN 0 AND 1),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for after_action lookups
CREATE INDEX IF NOT EXISTS idx_decisions_after_action ON decisions(after_action_id);

-- Update timestamp trigger
CREATE TRIGGER update_decisions_updated_at
  BEFORE UPDATE ON decisions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
