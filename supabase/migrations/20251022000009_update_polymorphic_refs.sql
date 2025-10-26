-- Migration: Update polymorphic document references to use dossiers.id
-- Feature: 026-unified-dossier-architecture
-- Task: T113, T114
-- Description: Updates position_dossier_links and MOU signatories to reference dossiers.id

-- =============================================================================
-- Part 1: Create position_dossier_links table (T113)
-- =============================================================================

-- Create position_dossier_links table for linking positions to any dossier type
CREATE TABLE IF NOT EXISTS position_dossier_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Link to position
  position_id UUID NOT NULL REFERENCES positions(id) ON DELETE CASCADE,

  -- Link to dossier (can be country, organization, forum, engagement, theme, working_group, or person)
  dossier_id UUID NOT NULL REFERENCES dossiers(id) ON DELETE CASCADE,

  -- Link metadata
  link_type TEXT NOT NULL CHECK (link_type IN (
    'applies_to',      -- Position applies to this dossier
    'related_to',      -- Position is related to this dossier
    'endorsed_by',     -- Position is endorsed by this dossier (org/person)
    'opposed_by'       -- Position is opposed by this dossier (org/person/country)
  )),

  -- Optional notes
  notes TEXT,

  -- Audit trail
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),

  -- Unique constraint: one link per position-dossier-type combination
  CONSTRAINT unique_position_dossier_link UNIQUE (position_id, dossier_id, link_type)
);

-- Create indexes for position_dossier_links
CREATE INDEX idx_position_dossier_links_position
  ON position_dossier_links(position_id);

CREATE INDEX idx_position_dossier_links_dossier
  ON position_dossier_links(dossier_id);

CREATE INDEX idx_position_dossier_links_type
  ON position_dossier_links(link_type);

-- Add comments
COMMENT ON TABLE position_dossier_links IS 'Links positions to any dossier type (country, organization, forum, engagement, theme, working_group, person)';
COMMENT ON COLUMN position_dossier_links.dossier_id IS 'References dossiers.id - can be any dossier type';
COMMENT ON COLUMN position_dossier_links.link_type IS 'Type of relationship between position and dossier';

-- =============================================================================
-- Part 2: Update MOUs table to use dossier references (T114)
-- =============================================================================

-- Add new columns for dossier references (nullable during migration)
ALTER TABLE mous
ADD COLUMN IF NOT EXISTS signatory_1_dossier_id UUID REFERENCES dossiers(id),
ADD COLUMN IF NOT EXISTS signatory_2_dossier_id UUID REFERENCES dossiers(id);

-- NOTE: Data migration from old organization_id/country_id to new signatory_*_dossier_id
-- will be handled separately via a data migration script after the old countries/organizations
-- data has been migrated to the unified dossiers table. For now, both old and new columns coexist.

-- Create indexes for new dossier references
CREATE INDEX IF NOT EXISTS idx_mous_signatory_1_dossier
  ON mous(signatory_1_dossier_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_mous_signatory_2_dossier
  ON mous(signatory_2_dossier_id) WHERE deleted_at IS NULL;

-- Add comments
COMMENT ON COLUMN mous.signatory_1_dossier_id IS 'First signatory - references dossiers.id (can be country or organization)';
COMMENT ON COLUMN mous.signatory_2_dossier_id IS 'Second signatory - references dossiers.id (can be country or organization)';

-- Keep old columns for backward compatibility during transition phase
-- They will be dropped in a future migration after all code is updated
COMMENT ON COLUMN mous.organization_id IS 'DEPRECATED: Use signatory_1_dossier_id instead. Will be removed in future migration.';
COMMENT ON COLUMN mous.country_id IS 'DEPRECATED: Use signatory_2_dossier_id instead. Will be removed in future migration.';

-- =============================================================================
-- Part 3: RLS Policies for position_dossier_links
-- =============================================================================

ALTER TABLE position_dossier_links ENABLE ROW LEVEL SECURITY;

-- Users can view position-dossier links if they can view the position AND the dossier
CREATE POLICY "Users can view position links within clearance"
ON position_dossier_links FOR SELECT
USING (
  -- Check position access
  EXISTS (
    SELECT 1 FROM positions WHERE id = position_id
  )
  AND
  -- Check dossier access
  EXISTS (
    SELECT 1 FROM dossiers
    WHERE id = dossier_id
      AND sensitivity_level <= (SELECT clearance_level FROM profiles WHERE id = auth.uid())
  )
);

-- Users can create position-dossier links if they can access both entities
CREATE POLICY "Users can create position links within clearance"
ON position_dossier_links FOR INSERT
WITH CHECK (
  -- Check position access
  EXISTS (
    SELECT 1 FROM positions WHERE id = position_id
  )
  AND
  -- Check dossier access
  EXISTS (
    SELECT 1 FROM dossiers
    WHERE id = dossier_id
      AND sensitivity_level <= (SELECT clearance_level FROM profiles WHERE id = auth.uid())
  )
);

-- Users can delete position-dossier links if they created them or have appropriate permissions
CREATE POLICY "Users can delete their position links"
ON position_dossier_links FOR DELETE
USING (
  created_by = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND clearance_level >= 3  -- Confidential clearance or higher
  )
);

-- =============================================================================
-- Part 4: Verification Queries (Run manually to verify migration)
-- =============================================================================

-- Verify all MOUs have been migrated
-- SELECT COUNT(*) FROM mous WHERE organization_id IS NOT NULL AND signatory_1_dossier_id IS NULL;
-- Expected result: 0

-- SELECT COUNT(*) FROM mous WHERE country_id IS NOT NULL AND signatory_2_dossier_id IS NULL;
-- Expected result: 0

-- Verify all dossier references are valid
-- SELECT COUNT(*) FROM mous WHERE signatory_1_dossier_id IS NOT NULL
--   AND NOT EXISTS (SELECT 1 FROM dossiers WHERE id = signatory_1_dossier_id);
-- Expected result: 0

-- SELECT COUNT(*) FROM mous WHERE signatory_2_dossier_id IS NOT NULL
--   AND NOT EXISTS (SELECT 1 FROM dossiers WHERE id = signatory_2_dossier_id);
-- Expected result: 0
