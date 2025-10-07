-- Migration: Create organizational_units table
-- Feature: Assignment Engine & SLA
-- Task: T002
-- Description: Table for organizational units with bilingual fields, unit_wip_limit, parent_unit_id

CREATE TABLE IF NOT EXISTS organizational_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar VARCHAR(255) NOT NULL,
  name_en VARCHAR(255) NOT NULL,
  unit_wip_limit INTEGER NOT NULL CHECK (unit_wip_limit >= 1 AND unit_wip_limit <= 100),
  parent_unit_id UUID REFERENCES organizational_units(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_org_units_parent ON organizational_units(parent_unit_id);

-- Unique constraint: name must be unique within same parent unit
CREATE UNIQUE INDEX idx_org_units_name_ar_parent ON organizational_units(name_ar, COALESCE(parent_unit_id, '00000000-0000-0000-0000-000000000000'::uuid));
CREATE UNIQUE INDEX idx_org_units_name_en_parent ON organizational_units(name_en, COALESCE(parent_unit_id, '00000000-0000-0000-0000-000000000000'::uuid));

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_organizational_units_timestamp
BEFORE UPDATE ON organizational_units
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE organizational_units IS 'Organizational hierarchy for assignment routing';
COMMENT ON COLUMN organizational_units.name_ar IS 'Arabic name of organizational unit';
COMMENT ON COLUMN organizational_units.name_en IS 'English name of organizational unit';
COMMENT ON COLUMN organizational_units.unit_wip_limit IS 'Maximum concurrent assignments for entire unit (1-100)';
COMMENT ON COLUMN organizational_units.parent_unit_id IS 'Parent unit for hierarchy (NULL if top-level)';
