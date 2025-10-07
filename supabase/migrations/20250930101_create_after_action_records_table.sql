-- Migration: Create after_action_records table
-- Feature: 010-after-action-notes
-- Task: T002

CREATE TABLE IF NOT EXISTS after_action_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL UNIQUE REFERENCES engagements(id) ON DELETE CASCADE,
  dossier_id UUID NOT NULL REFERENCES dossiers(id) ON DELETE CASCADE,
  publication_status TEXT NOT NULL DEFAULT 'draft' CHECK (publication_status IN (
    'draft', 'published', 'edit_requested', 'edit_approved', 'edit_rejected'
  )),
  is_confidential BOOLEAN NOT NULL DEFAULT false,
  attendees TEXT[] DEFAULT '{}',
  notes TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_by UUID REFERENCES auth.users(id),
  published_at TIMESTAMPTZ,
  edit_requested_by UUID REFERENCES auth.users(id),
  edit_requested_at TIMESTAMPTZ,
  edit_request_reason TEXT,
  edit_approved_by UUID REFERENCES auth.users(id),
  edit_approved_at TIMESTAMPTZ,
  edit_rejection_reason TEXT,
  version INTEGER NOT NULL DEFAULT 1
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_after_actions_engagement ON after_action_records(engagement_id);
CREATE INDEX IF NOT EXISTS idx_after_actions_dossier ON after_action_records(dossier_id);
CREATE INDEX IF NOT EXISTS idx_after_actions_status ON after_action_records(publication_status);
CREATE INDEX IF NOT EXISTS idx_after_actions_confidential ON after_action_records(is_confidential);

-- Update timestamp trigger
CREATE TRIGGER update_after_action_records_updated_at
  BEFORE UPDATE ON after_action_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
