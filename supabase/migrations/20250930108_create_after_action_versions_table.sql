-- Migration: Create after_action_versions table
-- Feature: 010-after-action-notes
-- Task: T009

CREATE TABLE IF NOT EXISTS after_action_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  after_action_id UUID NOT NULL REFERENCES after_action_records(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  content JSONB NOT NULL,
  change_summary TEXT,
  changed_by UUID NOT NULL REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(after_action_id, version_number)
);

-- Index for version queries
CREATE INDEX IF NOT EXISTS idx_after_action_versions_record ON after_action_versions(after_action_id, version_number DESC);
