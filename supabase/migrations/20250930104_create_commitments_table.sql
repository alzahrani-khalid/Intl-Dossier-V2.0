-- Migration: Create commitments table
-- Feature: 010-after-action-notes
-- Task: T005

CREATE TABLE IF NOT EXISTS commitments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  after_action_id UUID NOT NULL REFERENCES after_action_records(id) ON DELETE CASCADE,
  dossier_id UUID NOT NULL REFERENCES dossiers(id) ON DELETE CASCADE,
  description TEXT NOT NULL CHECK (char_length(description) BETWEEN 1 AND 2000),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'in_progress', 'completed', 'cancelled', 'overdue'
  )),
  owner_type TEXT NOT NULL CHECK (owner_type IN ('internal', 'external')),
  owner_user_id UUID REFERENCES auth.users(id),
  owner_contact_id UUID REFERENCES external_contacts(id),
  tracking_mode TEXT NOT NULL CHECK (tracking_mode IN ('automatic', 'manual')),
  due_date DATE NOT NULL,
  completed_at TIMESTAMPTZ,
  ai_confidence NUMERIC(3,2) CHECK (ai_confidence BETWEEN 0 AND 1),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_owner CHECK (
    (owner_type = 'internal' AND owner_user_id IS NOT NULL AND owner_contact_id IS NULL) OR
    (owner_type = 'external' AND owner_contact_id IS NOT NULL AND owner_user_id IS NULL)
  ),
  CONSTRAINT valid_tracking CHECK (
    (tracking_mode = 'automatic' AND owner_type = 'internal') OR
    (tracking_mode = 'manual' AND owner_type = 'external')
  )
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_commitments_after_action ON commitments(after_action_id);
CREATE INDEX IF NOT EXISTS idx_commitments_dossier ON commitments(dossier_id);
CREATE INDEX IF NOT EXISTS idx_commitments_owner_user ON commitments(owner_user_id) WHERE owner_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_commitments_owner_contact ON commitments(owner_contact_id) WHERE owner_contact_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_commitments_status ON commitments(status);
CREATE INDEX IF NOT EXISTS idx_commitments_due_date ON commitments(due_date);

-- Update timestamp trigger
CREATE TRIGGER update_commitments_updated_at
  BEFORE UPDATE ON commitments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
