-- ============================================================================
-- Migration: Enhanced Unified Dossier Architecture
-- Date: 2025-10-26
-- Description: Remove cd_* tables and create universal dossier feature tables
-- ============================================================================

-- ============================================================================
-- PART 1: Create Universal Feature Tables
-- ============================================================================

-- Table: dossier_tags
-- Purpose: Universal tagging system for ALL dossier types
-- ============================================================================
CREATE TABLE IF NOT EXISTS dossier_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dossier_id UUID NOT NULL REFERENCES dossiers(id) ON DELETE CASCADE,
  tag_name TEXT NOT NULL,
  color TEXT DEFAULT '#3B82F6', -- Default blue color
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT tag_name_not_empty CHECK (length(trim(tag_name)) > 0),
  CONSTRAINT valid_color CHECK (color ~ '^#[0-9A-Fa-f]{6}$')
);

-- Indexes for dossier_tags
CREATE INDEX idx_dossier_tags_dossier_id ON dossier_tags(dossier_id);
CREATE INDEX idx_dossier_tags_tag_name ON dossier_tags(tag_name);
CREATE INDEX idx_dossier_tags_created_at ON dossier_tags(created_at DESC);

-- RLS Policies for dossier_tags
ALTER TABLE dossier_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tags for accessible dossiers"
  ON dossier_tags FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM dossiers d
      WHERE d.id = dossier_tags.dossier_id
      AND (d.created_by = auth.uid() OR d.status != 'archived')
    )
  );

CREATE POLICY "Users can create tags for dossiers"
  ON dossier_tags FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM dossiers d
      WHERE d.id = dossier_tags.dossier_id
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "Users can delete own tags"
  ON dossier_tags FOR DELETE
  USING (created_by = auth.uid());

-- ============================================================================
-- Table: dossier_interactions
-- Purpose: Track meetings, calls, emails with ANY dossier entity
-- ============================================================================
CREATE TABLE IF NOT EXISTS dossier_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dossier_id UUID NOT NULL REFERENCES dossiers(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('meeting', 'call', 'email', 'conference', 'other')),
  interaction_date DATE NOT NULL,
  details TEXT,
  attendee_dossier_ids UUID[] DEFAULT '{}', -- Array of dossier IDs (persons, orgs, etc.)
  attachments JSONB DEFAULT '[]', -- [{filename, url, size, type}]
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT details_length CHECK (length(details) <= 10000),
  CONSTRAINT interaction_date_not_future CHECK (interaction_date <= CURRENT_DATE)
);

-- Indexes for dossier_interactions
CREATE INDEX idx_dossier_interactions_dossier_id ON dossier_interactions(dossier_id);
CREATE INDEX idx_dossier_interactions_date ON dossier_interactions(interaction_date DESC);
CREATE INDEX idx_dossier_interactions_type ON dossier_interactions(interaction_type);
CREATE INDEX idx_dossier_interactions_created_at ON dossier_interactions(created_at DESC);
CREATE INDEX idx_dossier_interactions_attendees ON dossier_interactions USING GIN(attendee_dossier_ids);

-- RLS Policies for dossier_interactions
ALTER TABLE dossier_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view interactions for accessible dossiers"
  ON dossier_interactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM dossiers d
      WHERE d.id = dossier_interactions.dossier_id
      AND (d.created_by = auth.uid() OR d.status != 'archived')
    )
  );

CREATE POLICY "Users can create interactions"
  ON dossier_interactions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM dossiers d
      WHERE d.id = dossier_interactions.dossier_id
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "Users can update own interactions"
  ON dossier_interactions FOR UPDATE
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can delete own interactions"
  ON dossier_interactions FOR DELETE
  USING (created_by = auth.uid());

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_dossier_interactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_dossier_interactions_updated_at
  BEFORE UPDATE ON dossier_interactions
  FOR EACH ROW
  EXECUTE FUNCTION update_dossier_interactions_updated_at();

-- ============================================================================
-- PART 2: Drop Contact Directory Tables
-- ============================================================================

-- Drop tables in correct order (respecting foreign key dependencies)
DROP TABLE IF EXISTS cd_interaction_notes CASCADE;
DROP TABLE IF EXISTS cd_contact_relationships CASCADE;
DROP TABLE IF EXISTS cd_documents CASCADE;
DROP TABLE IF EXISTS cd_tags CASCADE;
DROP TABLE IF EXISTS cd_contacts CASCADE;
DROP TABLE IF EXISTS cd_organizations CASCADE;

-- ============================================================================
-- PART 3: Enhance Dossiers Table with Indexes for Person Queries
-- ============================================================================

-- Add index for efficient person queries
CREATE INDEX IF NOT EXISTS idx_dossiers_type_status ON dossiers(type, status);

-- Add GIN index for metadata JSONB queries (for email, phone searches)
CREATE INDEX IF NOT EXISTS idx_dossiers_metadata ON dossiers USING GIN(metadata);

-- ============================================================================
-- PART 4: Helper Functions
-- ============================================================================

-- Function: Get all tags for a dossier
CREATE OR REPLACE FUNCTION get_dossier_tags(p_dossier_id UUID)
RETURNS TABLE (
  tag_name TEXT,
  color TEXT,
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    dt.tag_name,
    dt.color,
    COUNT(*)::BIGINT as count
  FROM dossier_tags dt
  WHERE dt.dossier_id = p_dossier_id
  GROUP BY dt.tag_name, dt.color
  ORDER BY dt.tag_name;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Get interaction timeline for a dossier
CREATE OR REPLACE FUNCTION get_dossier_timeline(
  p_dossier_id UUID,
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  interaction_type TEXT,
  interaction_date DATE,
  details TEXT,
  attendee_count INT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    di.id,
    di.interaction_type,
    di.interaction_date,
    di.details,
    COALESCE(array_length(di.attendee_dossier_ids, 1), 0) as attendee_count,
    di.created_at
  FROM dossier_interactions di
  WHERE di.dossier_id = p_dossier_id
  ORDER BY di.interaction_date DESC, di.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Search dossiers by metadata fields (for persons)
CREATE OR REPLACE FUNCTION search_persons(
  p_search_term TEXT,
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0
)
RETURNS SETOF dossiers AS $$
BEGIN
  RETURN QUERY
  SELECT d.*
  FROM dossiers d
  WHERE d.type = 'person'
    AND d.status != 'archived'
    AND (
      d.name_en ILIKE '%' || p_search_term || '%'
      OR d.name_ar ILIKE '%' || p_search_term || '%'
      OR d.metadata->>'title_en' ILIKE '%' || p_search_term || '%'
      OR d.metadata->>'title_ar' ILIKE '%' || p_search_term || '%'
      OR EXISTS (
        SELECT 1 FROM jsonb_array_elements_text(d.metadata->'email') AS email
        WHERE email ILIKE '%' || p_search_term || '%'
      )
    )
  ORDER BY d.name_en
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- PART 5: Comments for Documentation
-- ============================================================================

COMMENT ON TABLE dossier_tags IS 'Universal tagging system for all dossier types (persons, organizations, countries, etc.)';
COMMENT ON TABLE dossier_interactions IS 'Track meetings, calls, emails, and other interactions with any dossier entity';
COMMENT ON FUNCTION get_dossier_tags(UUID) IS 'Get all tags for a specific dossier with counts';
COMMENT ON FUNCTION get_dossier_timeline(UUID, INT, INT) IS 'Get interaction timeline for a dossier with pagination';
COMMENT ON FUNCTION search_persons(TEXT, INT, INT) IS 'Full-text search across person dossiers including name, email, and title fields in metadata';

-- ============================================================================
-- Migration Complete
-- ============================================================================
