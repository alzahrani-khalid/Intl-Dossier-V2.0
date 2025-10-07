-- Migration: Create risks table
-- Feature: 010-after-action-notes
-- Task: T006

CREATE TABLE IF NOT EXISTS risks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  after_action_id UUID NOT NULL REFERENCES after_action_records(id) ON DELETE CASCADE,
  description TEXT NOT NULL CHECK (char_length(description) BETWEEN 1 AND 2000),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  likelihood TEXT NOT NULL CHECK (likelihood IN ('unlikely', 'possible', 'likely', 'certain')),
  mitigation_strategy TEXT,
  owner TEXT CHECK (char_length(owner) <= 200),
  ai_confidence NUMERIC(3,2) CHECK (ai_confidence BETWEEN 0 AND 1),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_risks_after_action ON risks(after_action_id);
CREATE INDEX IF NOT EXISTS idx_risks_severity ON risks(severity);

-- Update timestamp trigger
CREATE TRIGGER update_risks_updated_at
  BEFORE UPDATE ON risks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
