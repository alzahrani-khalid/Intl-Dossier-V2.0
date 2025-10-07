-- Migration: Create skills table
-- Feature: Assignment Engine & SLA
-- Task: T003
-- Description: Table for skills with bilingual fields and category

CREATE TABLE IF NOT EXISTS skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar VARCHAR(255) NOT NULL UNIQUE,
  name_en VARCHAR(255) NOT NULL UNIQUE,
  category VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_skills_category ON skills(category);

-- Check constraints for non-empty names
ALTER TABLE skills ADD CONSTRAINT chk_skills_name_ar_not_empty
  CHECK (length(trim(name_ar)) > 0);
ALTER TABLE skills ADD CONSTRAINT chk_skills_name_en_not_empty
  CHECK (length(trim(name_en)) > 0);

-- Comments
COMMENT ON TABLE skills IS 'Skills/competencies for assignment matching';
COMMENT ON COLUMN skills.name_ar IS 'Arabic name of skill (must be unique)';
COMMENT ON COLUMN skills.name_en IS 'English name of skill (must be unique)';
COMMENT ON COLUMN skills.category IS 'Skill grouping (e.g., languages, technical, domain)';
