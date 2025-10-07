-- Migration: Create engagements table
-- Feature: 010-after-action-notes
-- Task: T001

CREATE TABLE IF NOT EXISTS engagements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dossier_id UUID NOT NULL REFERENCES dossiers(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 500),
  engagement_type TEXT NOT NULL CHECK (engagement_type IN (
    'meeting', 'consultation', 'coordination', 'workshop',
    'conference', 'site_visit', 'other'
  )),
  engagement_date TIMESTAMPTZ NOT NULL,
  location TEXT CHECK (char_length(location) <= 500),
  description TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_engagements_dossier_id ON engagements(dossier_id);
CREATE INDEX IF NOT EXISTS idx_engagements_date ON engagements(engagement_date DESC);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_engagements_updated_at
  BEFORE UPDATE ON engagements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
