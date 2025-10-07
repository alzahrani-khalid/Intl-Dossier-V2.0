-- Migration: Create assignment_checklist_templates table
-- Feature: 014-full-assignment-detail
-- Task: T006

CREATE TABLE IF NOT EXISTS assignment_checklist_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en TEXT NOT NULL CHECK (char_length(name_en) > 0),
  name_ar TEXT NOT NULL CHECK (char_length(name_ar) > 0),
  description_en TEXT,
  description_ar TEXT,
  applicable_work_types TEXT[] NOT NULL CHECK (array_length(applicable_work_types, 1) > 0),
  items_json JSONB NOT NULL CHECK (jsonb_array_length(items_json) > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for querying templates by work type
CREATE INDEX IF NOT EXISTS idx_templates_work_type
ON assignment_checklist_templates USING GIN(applicable_work_types);

-- Enable RLS
ALTER TABLE assignment_checklist_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policy: All authenticated users can read templates
CREATE POLICY templates_select ON assignment_checklist_templates
FOR SELECT
USING (auth.role() = 'authenticated');

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_checklist_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS checklist_templates_updated_at ON assignment_checklist_templates;
CREATE TRIGGER checklist_templates_updated_at
  BEFORE UPDATE ON assignment_checklist_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_checklist_templates_updated_at();

-- Comment on table
COMMENT ON TABLE assignment_checklist_templates IS
  'Predefined bilingual checklist templates for common work item types';

-- Comment on columns
COMMENT ON COLUMN assignment_checklist_templates.items_json IS
  'Array of objects with text_en, text_ar, sequence fields: [{"text_en": "...", "text_ar": "...", "sequence": 1}, ...]';
